import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, User, Wrench, CheckCircle, MessageSquare } from 'lucide-react';

interface Profile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  skills: string[] | null;
  rating: number;
  total_reviews: number;
  avatar_url: string | null;
  user_roles?: { role: string }[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_profile: {
    display_name: string | null;
  } | null;
}

interface CompletedRepair {
  id: string;
  created_at: string;
  item: {
    title: string;
    category: string;
  } | null;
}

export default function FixerProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedRepairs, setCompletedRepairs] = useState<CompletedRepair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    (async () => {
      try {
        // Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (mounted) {
          // Fetch user roles separately
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId);

          setProfile({
            ...profileData,
            user_roles: rolesData || []
          });
        }

        // Reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            reviewer_profile:profiles!reviews_reviewer_id_fkey(display_name)
          `)
          .eq('reviewed_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else if (mounted) {
          setReviews(reviewsData || []);
        }

        // Completed repairs
        const { data: repairsData, error: repairsError } = await supabase
          .from('repair_requests')
          .select(`
            id,
            created_at,
            item:items(title, category)
          `)
          .eq('fixer_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);

        if (repairsError) {
          console.error('Error fetching repairs:', repairsError);
        } else if (mounted) {
          setCompletedRepairs(repairsData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading fixer profile data:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
            <Link to="/browse">
              <Button>Browse Repairs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {profile.display_name || 'Anonymous Fixer'}
                  </h1>
                  {profile.user_roles && profile.user_roles.length > 0 && (
                    <Badge variant="outline">{profile.user_roles[0].role}</Badge>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}

                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({profile.total_reviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{completedRepairs.length} completed repairs</span>
                  </div>
                </div>

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          <Wrench className="w-3 h-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Completed Repairs */}
        {completedRepairs.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recent Completed Repairs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedRepairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{repair.item?.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{repair.item?.category}</Badge>
                        <span>
                          {new Date(repair.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        by {review.reviewer_profile?.display_name || 'Anonymous'}
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
