import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Search } from 'lucide-react';
import formatINR from '@/lib/formatCurrency';
import { Link } from 'react-router-dom';

interface Item {
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
  user_id: string;
  profiles: {
    display_name: string | null;
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

const urgencyColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export default function Browse() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
  const query = supabase
        .from('items')
        .select(`
          *,
          profiles (
            display_name
          )
        `)
        .eq('status', 'posted')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'all' || item.urgency === selectedUrgency;
    
    let matchesPrice = true;
    if (priceRange !== 'all' && item.max_price) {
      if (priceRange === 'low') matchesPrice = item.max_price < 50;
      else if (priceRange === 'medium') matchesPrice = item.max_price >= 50 && item.max_price < 150;
      else if (priceRange === 'high') matchesPrice = item.max_price >= 150;
    }
    
    return matchesSearch && matchesCategory && matchesUrgency && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Repair Requests</h1>
          <p className="text-muted-foreground">
            Find items that need your repair skills and start earning money.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={(v: 'all' | 'low' | 'medium' | 'high') => setPriceRange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">Under ₹50</SelectItem>
                <SelectItem value="medium">₹50 - ₹150</SelectItem>
                <SelectItem value="high">Over ₹150</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedUrgency('all');
                setPriceRange('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new repair requests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  const urgencyClass = urgencyColors[item.urgency as keyof typeof urgencyColors] || urgencyColors.medium;
  
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
          <Badge className={urgencyClass}>
            {item.urgency}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{item.category}</Badge>
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{item.location}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm">
            {item.estimated_price && (
              <div className="flex items-center gap-1">
                <span className="text-sm">₹</span>
                <span>Est. {formatINR(item.estimated_price)}</span>
              </div>
            )}
            {item.max_price && (
              <div className="flex items-center gap-1">
                <span>Max: {formatINR(item.max_price)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Posted by{' '}
            <Link
              to={`/fixer/${item.profiles?.display_name ? item.user_id : ''}`}
              className="hover:underline"
            >
              {item.profiles?.display_name || 'Anonymous'}
            </Link>
          </span>
          <Link to={`/item/${item.id}`}>
            <Button size="sm">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}