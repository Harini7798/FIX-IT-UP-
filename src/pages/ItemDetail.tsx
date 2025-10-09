import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ReviewForm } from '@/components/ReviewForm';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Send,
  Calendar,
  AlertCircle,
  Wrench,
  Star,
  CheckCircle
} from 'lucide-react';

interface ItemDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  estimated_price: number | null;
  max_price: number | null;
  urgency: string;
  created_at: string;
  images: string[] | null;
  profiles: {
    display_name: string | null;
    user_id: string;
  } | null;
}

interface RepairRequest {
  id: string;
  proposed_price: number;
  estimated_completion: string | null;
  message: string | null;
  status: string;
  fixer_id: string;
  profiles: {
    display_name: string | null;
    rating: number;
  } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  repair_request_id: string;
  profiles: {
    display_name: string | null;
  } | null;
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null);
  
  const [proposalData, setProposalData] = useState({
    proposed_price: '',
    estimated_completion: '',
    message: ''
  });

  useEffect(() => {
    if (id) {
      fetchItemDetail();
      if (user) {
        fetchRepairRequests();
        fetchUserProfile();
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (repairRequests.length > 0) {
      fetchReviews();
    }
  }, [repairRequests]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserRoles(data?.map(r => r.role) || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const fetchItemDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles (
            display_name,
            user_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const fetchRepairRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          profiles (
            display_name,
            rating
          )
        `)
        .eq('item_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepairRequests(data || []);
    } catch (error) {
      console.error('Error fetching repair requests:', error);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('repair_requests')
        .insert({
          item_id: item.id,
          fixer_id: user.id,
          proposed_price: parseFloat(proposalData.proposed_price),
          estimated_completion: proposalData.estimated_completion || null,
          message: proposalData.message || null
        });

      if (error) throw error;

      toast({
        title: "Proposal submitted!",
        description: "The item owner will be notified of your repair proposal.",
      });

      setShowProposalForm(false);
      setProposalData({ proposed_price: '', estimated_completion: '', message: '' });
      fetchRepairRequests();
    } catch (error: any) {
      toast({
        title: "Error submitting proposal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptProposal = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('repair_requests')
        .update({ status: 'assigned' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Proposal accepted!",
        description: "You can now message the fixer to coordinate the repair.",
      });

      fetchRepairRequests();
    } catch (error: any) {
      toast({
        title: "Error accepting proposal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMessageFixer = (requestId: string) => {
    navigate(`/messages?request=${requestId}`);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: 'in_progress' | 'awaiting_confirmation' | 'completed') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('repair_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      const statusMessages = {
        'in_progress': 'Repair work has started',
        'awaiting_confirmation': 'Work submitted for owner review',
        'completed': 'Repair confirmed as complete'
      };

      toast({
        title: "Status updated!",
        description: statusMessages[newStatus],
      });

      fetchRepairRequests();
      
      if (newStatus === 'completed') {
        setShowReviewForm(requestId);
      }
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-destructive text-destructive-foreground';
      case 'in_progress':
        return 'bg-yellow-500 text-white';
      case 'awaiting_confirmation':
        return 'bg-orange-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const fetchReviews = async () => {
    if (!id || repairRequests.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviewer_id (
            display_name
          )
        `)
        .in('repair_request_id', 
          repairRequests.map(r => r.id)
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading item details...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Item not found</h1>
            <Button onClick={() => navigate('/browse')}>
              Browse Other Items
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.profiles?.user_id;
  const isFixer = userRoles.includes('fixer') || userRoles.includes('both');
  const canPropose = user && !isOwner && isFixer;
  const hasUserProposed = repairRequests.some(req => req.profiles && user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Item Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {item.images && item.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {item.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${item.title} ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <CardTitle className="text-2xl">{item.title}</CardTitle>
                  <Badge className={urgencyColors[item.urgency as keyof typeof urgencyColors]}>
                    {item.urgency} priority
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Posted {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  {item.estimated_price && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span>Estimated: ${item.estimated_price}</span>
                    </div>
                  )}
                  {item.max_price && (
                    <div className="flex items-center gap-2">
                      <span>Max Budget: ${item.max_price}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Posted by {item.profiles?.display_name || 'Anonymous'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Repair Proposals */}
            {(isOwner || repairRequests.length > 0) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>
                    Repair Proposals ({repairRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {repairRequests.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No repair proposals yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {repairRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">
                                {request.profiles?.display_name || 'Anonymous Fixer'}
                              </h4>
                              {request.profiles?.rating && (
                                <div className="text-sm text-muted-foreground">
                                  Rating: {request.profiles.rating.toFixed(1)}/5
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">${request.proposed_price}</div>
                              <Badge className={getStatusBadgeColor(request.status)}>
                                {request.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          {request.estimated_completion && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <Calendar className="h-4 w-4" />
                              <span>Estimated completion: {new Date(request.estimated_completion).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {request.message && (
                            <p className="text-sm text-muted-foreground">
                              {request.message}
                            </p>
                          )}

                          {isOwner && (
                            <div className="flex gap-2 mt-3">
                              {request.status === 'open' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAcceptProposal(request.id)}
                                >
                                  Accept Proposal
                                </Button>
                              )}
                              {request.status === 'awaiting_confirmation' && (
                                <Button 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStatusUpdate(request.id, 'completed')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm Completion
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMessageFixer(request.id)}
                              >
                                Message Fixer
                              </Button>
                            </div>
                          )}

                          {!isOwner && user && request.fixer_id === user.id && (
                            <div className="flex gap-2 mt-3">
                              {request.status === 'assigned' && (
                                <Button 
                                  size="sm"
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Start Repair
                                </Button>
                              )}
                              {request.status === 'in_progress' && (
                                <Button 
                                  size="sm"
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                  onClick={() => handleStatusUpdate(request.id, 'awaiting_confirmation')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Submit for Review
                                </Button>
                              )}
                              {request.status === 'awaiting_confirmation' && (
                                <Button 
                                  size="sm"
                                  className="bg-orange-500"
                                  disabled
                                >
                                  Awaiting Owner Approval
                                </Button>
                              )}
                              {request.status === 'completed' && (
                                <Badge className="bg-green-600 text-white">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMessageFixer(request.id)}
                              >
                                Message Owner
                              </Button>
                            </div>
                          )}

                          {/* Reviews for this repair */}
                          {reviews.filter(r => r.repair_request_id === request.id).map(review => (
                            <Card key={review.id} className="mt-3 bg-muted/30">
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    by {review.profiles?.display_name || 'Anonymous'}
                                  </span>
                                </div>
                                {review.comment && (
                                  <p className="text-sm">{review.comment}</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}

                          {/* Review Section - Allow both owner and fixer to leave reviews */}
                          {request.status === 'completed' && user && (
                            (() => {
                              const userIsOwner = user.id === item.profiles?.user_id;
                              const userIsFixer = user.id === request.fixer_id;
                              const canLeaveReview = userIsOwner || userIsFixer;
                              
                              if (!canLeaveReview) return null;
                              
                              // Determine who is being reviewed
                              const reviewedId = userIsOwner ? request.fixer_id : item.profiles?.user_id || '';
                              
                              // Check if user already reviewed
                              const hasReviewed = reviews.some(
                                r => r.repair_request_id === request.id && r.reviewer_id === user.id
                              );
                              
                              if (hasReviewed) {
                                return null; // User already left a review
                              }
                              
                              // Show review button or form
                              return (
                                <div className="mt-3">
                                  {showReviewForm === request.id ? (
                                    <ReviewForm
                                      repairRequestId={request.id}
                                      reviewedId={reviewedId}
                                      onReviewSubmitted={() => {
                                        setShowReviewForm(null);
                                        fetchReviews();
                                      }}
                                    />
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => setShowReviewForm(request.id)}
                                    >
                                      <Star className="h-4 w-4 mr-1" />
                                      Leave a Review
                                    </Button>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            {canPropose && !hasUserProposed && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Repair Proposal</CardTitle>
                </CardHeader>
                <CardContent>
                  {!showProposalForm ? (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Think you can fix this? Submit your proposal!
                      </p>
                      <Button onClick={() => setShowProposalForm(true)} className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        Make Proposal
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitProposal} className="space-y-4">
                      <div>
                        <Label htmlFor="price">Your Price ($)*</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          required
                          value={proposalData.proposed_price}
                          onChange={(e) => setProposalData({ 
                            ...proposalData, 
                            proposed_price: e.target.value 
                          })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="completion">Estimated Completion</Label>
                        <Input
                          id="completion"
                          type="date"
                          value={proposalData.estimated_completion}
                          onChange={(e) => setProposalData({ 
                            ...proposalData, 
                            estimated_completion: e.target.value 
                          })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Message (optional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Explain your approach, experience with similar repairs, etc."
                          value={proposalData.message}
                          onChange={(e) => setProposalData({ 
                            ...proposalData, 
                            message: e.target.value 
                          })}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting} className="flex-1">
                          {submitting ? 'Submitting...' : 'Submit'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowProposalForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {hasUserProposed && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Proposal Submitted</h3>
                  <p className="text-sm text-muted-foreground">
                    You've already submitted a proposal for this item.
                  </p>
                </CardContent>
              </Card>
            )}

            {!user && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Want to Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to submit a repair proposal.
                  </p>
                  <Button asChild className="w-full">
                    <a href="/auth">Sign In</a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {user && !isOwner && !isFixer && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Become a Fixer</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to be a fixer to submit repair proposals.
                  </p>
                  <Button asChild className="w-full">
                    <a href="/become-fixer">Become a Fixer</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}