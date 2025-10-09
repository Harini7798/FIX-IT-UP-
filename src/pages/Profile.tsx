import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, User, Settings, Package, Wrench, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Profile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  skills: string[] | null;
  rating: number;
  total_reviews: number;
  user_roles?: { role: string }[];
}

interface ActivityItem {
  id: string;
  type: 'item_posted' | 'repair_request' | 'repair_completed' | 'review';
  title: string;
  description: string;
  status?: string;
  created_at: string;
  link?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  profiles: {
    display_name: string | null;
  } | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    skills: ''
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [reviewsReceived, setReviewsReceived] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActivities();
      fetchReviewsReceived();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user roles separately
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      setProfile({
        ...profileData,
        user_roles: rolesData || []
      });

      setFormData({
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        skills: profileData.skills?.join(', ') || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          skills: skillsArray.length > 0 ? skillsArray : null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });

      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchReviewsReceived = async () => {
    if (!user) return;
    
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer_id,
          profiles!reviews_reviewer_id_fkey(display_name)
        `)
        .eq('reviewed_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviewsReceived(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchActivities = async () => {
    if (!user) return;
    
    setLoadingActivities(true);
    try {
      const activities: ActivityItem[] = [];

      // Fetch items posted by user
      const { data: items } = await supabase
        .from('items')
        .select('id, title, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      items?.forEach(item => {
        activities.push({
          id: item.id,
          type: 'item_posted',
          title: 'Posted Item',
          description: item.title,
          status: item.status,
          created_at: item.created_at,
          link: `/item/${item.id}`
        });
      });

      // Fetch repair requests (as fixer)
      const { data: fixerRequests } = await supabase
        .from('repair_requests')
        .select(`
          id,
          status,
          created_at,
          item:items(title)
        `)
        .eq('fixer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      fixerRequests?.forEach(request => {
        activities.push({
          id: request.id,
          type: request.status === 'completed' ? 'repair_completed' : 'repair_request',
          title: request.status === 'completed' ? 'Completed Repair' : 'Repair Request',
          description: request.item?.title || 'Unknown item',
          status: request.status,
          created_at: request.created_at,
          link: `/item/${request.id}`
        });
      });

      // Fetch reviews given by user
      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          created_at,
          reviewed_profile:profiles!reviews_reviewed_id_fkey(display_name)
        `)
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      reviews?.forEach(review => {
        activities.push({
          id: review.id,
          type: 'review',
          title: 'Left Review',
          description: `Rated ${review.reviewed_profile?.display_name || 'Unknown'} - ${review.rating} stars`,
          created_at: review.created_at
        });
      });

      // Sort all activities by date
      activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and view your activity.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Display Name</Label>
                    <p className="text-lg">{profile?.display_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile?.user_roles && profile.user_roles.length > 0 ? (
                        profile.user_roles.map((ur, i) => (
                          <Badge key={i} variant="outline">
                            {ur.role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">requester</Badge>
                      )}
                    </div>
                  </div>
                  {profile?.bio && (
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <p className="text-sm text-muted-foreground">{profile.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Reputation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{profile?.rating?.toFixed(1) || '0.0'}</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{profile?.total_reviews || 0}</div>
                      <div className="text-sm text-muted-foreground">Reviews</div>
                    </div>
                  </div>
                  
                  {profile?.skills && profile.skills.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Skills</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!profile?.skills || profile.skills.length === 0) && 
                   profile?.user_roles?.some(ur => ur.role === 'fixer' || ur.role === 'both') && (
                    <div className="text-center py-4">
                      <Wrench className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Add your skills to attract more repair requests
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews Received</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : reviewsReceived.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                    <p className="text-muted-foreground">
                      Complete repairs to start receiving reviews from other users.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewsReceived.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-semibold">{review.rating}/5</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: {review.profiles?.display_name || 'Anonymous'}
                        </p>
                        {review.comment && (
                          <p className="text-sm">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="e.g., Electronics repair, Sewing, Furniture restoration"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Add skills to show your expertise and attract more repair requests
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={fetchProfile}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading activity...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                    <p className="text-muted-foreground">
                      Your repair history and transactions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="mt-1">
                          {activity.type === 'item_posted' && <Package className="w-5 h-5 text-primary" />}
                          {activity.type === 'repair_request' && <Wrench className="w-5 h-5 text-blue-500" />}
                          {activity.type === 'repair_completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {activity.type === 'review' && <Star className="w-5 h-5 text-yellow-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{activity.title}</p>
                            {activity.status && (
                              <Badge variant="outline" className="text-xs">
                                {activity.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        {activity.link && (
                          <Link to={activity.link}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}