import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Star, Check, MessageSquare } from 'lucide-react';
import formatINR from '@/lib/formatCurrency';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';

interface ShopItem {
  id: string;
  title: string;
  description: string;
  category: string;
  sale_price: number;
  created_at: string;
  images: string[] | null;
  user_id: string;
  profiles: {
    display_name: string | null;
    rating: number;
    user_id: string;
  } | null;
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' },
  { value: 'bikes', label: 'Bikes' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'sports', label: 'Sports Equipment' },
  { value: 'other', label: 'Other' }
];

export default function Shop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        let query = supabase
          .from('items')
          .select(`
            *,
            profiles (
              user_id,
              display_name,
              rating
            )
          `)
          .eq('is_for_sale', true)
          .eq('status', 'completed')
          .not('sale_price', 'is', null);

        // Apply sorting
        if (sortBy === 'price_low') {
          query = query.order('sale_price', { ascending: true });
        } else if (sortBy === 'price_high') {
          query = query.order('sale_price', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;
        if (mounted) setItems(data || []);
      } catch (error) {
        console.error('Error fetching shop items:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sortBy]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading shop items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shop Repaired Items</h1>
          <p className="text-muted-foreground">
            Discover quality refurbished items at student-friendly prices.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSortBy('newest');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No items available</h3>
            <p className="text-muted-foreground">
              Check back later for new refurbished items from our campus fixers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ShopItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopItemCard({ item }: { item: ShopItem }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showContactDialog, setShowContactDialog] = useState(false);

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to contact the seller',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    setShowContactDialog(true);
  };

  const handleContactSeller = async () => {
    // Create a message thread or show contact info
    toast({
      title: 'Contact seller',
      description: `You can now message ${item.profiles?.display_name || 'the seller'} about this item`,
    });
    setShowContactDialog(false);
    // Navigate to messages could be implemented here
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      {item.images && item.images.length > 0 && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
          <Badge className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Repaired
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{item.category}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-primary">
            {formatINR(item.sale_price)}
          </div>
          {item.profiles?.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{item.profiles.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Link
            to={`/fixer/${item.user_id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            Repaired by {item.profiles?.display_name || 'Anonymous'}
          </Link>
          <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleBuyNow}>
                Buy Now
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact Seller</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Item: <span className="font-medium text-foreground">{item.title}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Price: <span className="font-medium text-foreground">{formatINR(item.sale_price)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seller: <span className="font-medium text-foreground">{item.profiles?.display_name || 'Anonymous'}</span>
                  </p>
                </div>
                <Button onClick={handleContactSeller} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}