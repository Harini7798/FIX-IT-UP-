import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const AuthButton = () => {
  const { user, signOut, loading } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDisplayName();
    } else {
      setDisplayName(null);
    }
  }, [user]);

  const fetchDisplayName = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setDisplayName(data?.display_name);
    } catch (error) {
      console.error('Error fetching display name:', error);
      setDisplayName(null);
    }
  };

  if (loading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          to="/profile"
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <User className="w-4 h-4" />
          <span>
            {displayName || user.email?.split('@')[0] || 'User'}
          </span>
        </Link>
        <Button 
          variant="outline" 
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Link to="/auth">
      <Button className="flex items-center gap-2">
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>
    </Link>
  );
};