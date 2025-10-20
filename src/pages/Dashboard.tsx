import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Package, Star, MessageSquare, TrendingUp } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

interface DashboardStats {
  myItems: number;
  activeRequests: number;
  completedRepairs: number;
  averageRating: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    myItems: 0,
    activeRequests: 0,
    completedRepairs: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    (async () => {
      try {
        // Fetch user's items
        const { data: items } = await supabase
          .from('items')
          .select('*')
          .eq('user_id', user?.id);

        // Fetch repair requests for user's items
        const { data: requests } = await supabase
          .from('repair_requests')
          .select('*, items!inner(*)')
          .eq('items.user_id', user?.id)
          .in('status', ['open', 'assigned', 'in_progress']);

        // Fetch completed repairs
        const { data: completed } = await supabase
          .from('repair_requests')
          .select('*, items!inner(*)')
          .eq('items.user_id', user?.id)
          .eq('status', 'completed');

        // Get user's profile for rating
        const { data: profile } = await supabase
          .from('profiles')
          .select('rating, total_reviews')
          .eq('user_id', user?.id)
          .single();

        if (!mounted) return;

        setStats({
          myItems: items?.length || 0,
          activeRequests: requests?.length || 0,
          completedRepairs: completed?.length || 0,
          averageRating: profile?.rating || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Here's what's happening with your items and repairs.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="My Items"
            value={stats.myItems}
            icon={Package}
            loading={loading}
            color="blue"
          />
          <StatCard
            title="Active Requests"
            value={stats.activeRequests}
            icon={MessageSquare}
            loading={loading}
            color="orange"
          />
          <StatCard
            title="Completed Repairs"
            value={stats.completedRepairs}
            icon={TrendingUp}
            loading={loading}
            color="green"
          />
          <StatCard
            title="Average Rating"
            value={stats.averageRating}
            icon={Star}
            loading={loading}
            color="yellow"
            isRating
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Post New Item"
            description="Upload a broken item that needs repair"
            icon={Plus}
            href="/post"
            color="primary"
          />
          <QuickActionCard
            title="Browse Requests"
            description="Find items to repair and earn money"
            icon={Package}
            href="/browse"
            color="secondary"
          />
          <QuickActionCard
            title="Shop Repaired Items"
            description="Buy quality refurbished items"
            icon={Package}
            href="/shop"
            color="accent"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
  color: string;
  isRating?: boolean;
}

function StatCard({ title, value, icon: Icon, loading, color, isRating }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? '...' : isRating ? value.toFixed(1) : value}
          {isRating && !loading && <span className="text-sm text-muted-foreground ml-1">/5</span>}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <Link to={href}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg bg-${color}/10`}>
              <Icon className={`h-6 w-6 text-${color}`} />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Link>
    </Card>
  );
}