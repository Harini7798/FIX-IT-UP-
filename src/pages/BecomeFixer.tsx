import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const skillSuggestions = [
  'Electronics Repair', 'Smartphone Repair', 'Laptop Repair', 'Clothing Alterations',
  'Sewing', 'Furniture Restoration', 'Bike Repair', 'Appliance Repair',
  'Watch Repair', 'Jewelry Repair', 'Shoe Repair', 'Sports Equipment Repair'
];

export default function BecomeFixer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skills: '',
    bio: '',
    experience: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      // Update profile skills and bio
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          skills: skillsArray.length > 0 ? skillsArray : null,
          bio: formData.bio || null
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Add fixer role to user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'fixer'
        });

      // Ignore conflict if user already has the role
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      

      toast({
        title: "Welcome to the fixer community!",
        description: "Your profile has been updated. You can now start accepting repair requests.",
      });

      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Error updating profile",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (skill: string) => {
    const currentSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    if (!currentSkills.includes(skill)) {
      const newSkills = [...currentSkills, skill].join(', ');
      setFormData({ ...formData, skills: newSkills });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to become a fixer</h1>
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Become a Campus Fixer</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our community of skilled fixers and start earning money by helping fellow students repair their items.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-8 h-8 text-green-500 mx-auto mb-2 text-2xl">₹</div>
              <h3 className="font-semibold mb-1">Earn Money</h3>
              <p className="text-sm text-muted-foreground">Set your own prices and work on your schedule</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Build Reputation</h3>
              <p className="text-sm text-muted-foreground">Get rated by customers and grow your profile</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Flexible Schedule</h3>
              <p className="text-sm text-muted-foreground">Work when you want, where you want</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tell us about your skills</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="skills">Your Skills *</Label>
                <Input
                  id="skills"
                  required
                  placeholder="e.g., Electronics repair, Sewing, Furniture restoration"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Separate multiple skills with commas
                </p>
                
                {/* Skill Suggestions */}
                <div className="mt-3">
                  <Label className="text-sm font-medium">Popular Skills (click to add):</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillSuggestions.map((skill) => (
                      <Button
                        key={skill}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSkill(skill)}
                        className="text-xs"
                      >
                        + {skill}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">About You *</Label>
                <Textarea
                  id="bio"
                  required
                  placeholder="Tell students about your experience, what you're passionate about fixing, and why they should choose you..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="experience">Experience (optional)</Label>
                <Textarea
                  id="experience"
                  placeholder="Describe any relevant experience, certifications, or training you have..."
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Getting Started as a Fixer:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Browse repair requests from students on campus</li>
                  <li>• Send proposals with your estimated price and timeline</li>
                  <li>• Complete repairs and build your reputation</li>
                  <li>• Get paid securely through our platform</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Setting up your profile...' : 'Become a Fixer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}