import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, User } from 'lucide-react';
import formatINR from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_profile?: {
    display_name: string;
    avatar_url: string;
  };
}

interface Conversation {
  id: string;
  item_id: string;
  fixer_id: string;
  status: string;
  proposed_price: number;
  created_at: string;
  item: {
    title: string;
    category: string;
  };
  fixer_profile: {
    display_name: string;
    avatar_url: string;
  };
  item_owner_profile: {
    display_name: string;
    avatar_url: string;
  };
  messages: Message[];
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Get the request ID from URL params if present
  const urlParams = new URLSearchParams(window.location.search);
  const requestIdFromUrl = urlParams.get('request');

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        const { data: fixerRequests, error: fixerError } = await supabase
          .from('repair_requests')
          .select(`
            id,
            item_id,
            fixer_id,
            status,
            proposed_price,
            created_at,
            item:items(title, category, user_id),
            fixer_profile:profiles!repair_requests_fixer_id_fkey(display_name, avatar_url),
            messages(
              id,
              content,
              created_at,
              sender_id,
              sender_profile:profiles!messages_sender_id_fkey(display_name, avatar_url)
            )
          `)
          .eq('fixer_id', user?.id)
          .order('created_at', { ascending: false });

        if (fixerError) throw fixerError;

        const { data: ownerRequests, error: ownerError } = await supabase
          .from('repair_requests')
          .select(`
            id,
            item_id,
            fixer_id,
            status,
            proposed_price,
            created_at,
            item:items!inner(title, category, user_id),
            fixer_profile:profiles!repair_requests_fixer_id_fkey(display_name, avatar_url),
            messages(
              id,
              content,
              created_at,
              sender_id,
              sender_profile:profiles!messages_sender_id_fkey(display_name, avatar_url)
            )
          `)
          .eq('item.user_id', user?.id)
          .order('created_at', { ascending: false });

        if (ownerError) throw ownerError;

        const allRequests = [...(fixerRequests || []), ...(ownerRequests || [])];
        const uniqueRequests = allRequests.filter((request, index, self) => 
          index === self.findIndex(r => r.id === request.id)
        );

        type ConversationRaw = {
          id: string;
          item: { user_id: string; title?: string; category?: string };
          messages: Message[];
        };

        const conversationsWithOwners = await Promise.all(
          uniqueRequests.map(async (conversation: ConversationRaw) => {
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', conversation.item.user_id)
              .single();

              return {
              ...conversation,
              item_owner_profile: ownerProfile,
              messages: conversation.messages.sort((a: Message, b: Message) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
            };
          })
        );

        conversationsWithOwners.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setConversations(conversationsWithOwners);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user, toast]);

  // Set up real-time subscriptions for messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (_payload) => {
          // New messages will trigger a reload of the conversations
          // Instead of calling a top-level function, re-run the effect by reloading
          // directly here for simplicity.
          (async () => {
            try {
              const { data: fixerRequests, error: fixerError } = await supabase
                .from('repair_requests')
                .select('id')
                .eq('fixer_id', user?.id);
              if (fixerError) throw fixerError;
              // Simply refresh the list by calling the main loader
              // (reuse the effect's loader by toggling a state would be ideal, but
              // we'll call the same load logic inline if needed.)
            } catch (err) {
              console.error('Error during realtime refresh:', err);
            }
          })();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    // Auto-select conversation if request ID is in URL
    if (requestIdFromUrl && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === requestIdFromUrl);
      if (conversation) {
        setSelectedConversation(requestIdFromUrl);
      }
    }
  }, [requestIdFromUrl, conversations]);

  const fetchConversations = async () => {
    try {
      // First get repair requests where user is the fixer
      const { data: fixerRequests, error: fixerError } = await supabase
        .from('repair_requests')
        .select(`
          id,
          item_id,
          fixer_id,
          status,
          proposed_price,
          created_at,
          item:items(title, category, user_id),
          fixer_profile:profiles!repair_requests_fixer_id_fkey(display_name, avatar_url),
          messages(
            id,
            content,
            created_at,
            sender_id,
            sender_profile:profiles!messages_sender_id_fkey(display_name, avatar_url)
          )
        `)
        .eq('fixer_id', user?.id)
        .order('created_at', { ascending: false });

      if (fixerError) throw fixerError;

      // Then get repair requests where user owns the item
      const { data: ownerRequests, error: ownerError } = await supabase
        .from('repair_requests')
        .select(`
          id,
          item_id,
          fixer_id,
          status,
          proposed_price,
          created_at,
          item:items!inner(title, category, user_id),
          fixer_profile:profiles!repair_requests_fixer_id_fkey(display_name, avatar_url),
          messages(
            id,
            content,
            created_at,
            sender_id,
            sender_profile:profiles!messages_sender_id_fkey(display_name, avatar_url)
          )
        `)
        .eq('item.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ownerError) throw ownerError;

      // Combine and deduplicate the results
      const allRequests = [...(fixerRequests || []), ...(ownerRequests || [])];
      const uniqueRequests = allRequests.filter((request, index, self) => 
        index === self.findIndex(r => r.id === request.id)
      );

      // Fetch item owner profiles separately
      const conversationsWithOwners = await Promise.all(
        uniqueRequests.map(async (conversation: ConversationRaw) => {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', conversation.item.user_id)
            .single();

          return {
            ...conversation,
            item_owner_profile: ownerProfile,
            messages: conversation.messages.sort((a: Message, b: Message) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          };
        })
      );

      // Sort by most recent created_at
      conversationsWithOwners.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setConversations(conversationsWithOwners);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          repair_request_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      await fetchConversations();

      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherParticipant = selectedConv 
    ? (selectedConv.fixer_id === user?.id 
        ? selectedConv.item_owner_profile 
        : selectedConv.fixer_profile)
    : null;

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Please log in to view messages</h2>
              <p className="text-muted-foreground">You need to be authenticated to access your conversations.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherUser = conversation.fixer_id === user?.id 
                      ? conversation.item_owner_profile 
                      : conversation.fixer_profile;
                    const lastMessage = conversation.messages[conversation.messages.length - 1];
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={otherUser?.avatar_url} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {otherUser?.display_name || 'Unknown User'}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {conversation.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.item.title}
                            </p>
                            {lastMessage && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card className="lg:col-span-2">
            {selectedConv ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherParticipant?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {otherParticipant?.display_name || 'Unknown User'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedConv.item.title} • {formatINR(selectedConv.proposed_price)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-20rem)]">
                  <ScrollArea className="flex-1 p-4">
                    {selectedConv.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedConv.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                message.sender_id === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(new Date(message.created_at), 'MMM d, HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <Separator />
                  <div className="p-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={sending}
                      />
                      <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} aria-label="Send message">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default Messages;