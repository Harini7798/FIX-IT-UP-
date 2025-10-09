import { Button } from "@/components/ui/button";
import { Recycle, Wrench, ShoppingBag, Users } from "lucide-react";
import heroImage from "@/assets/hero-campus-marketplace.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-hero-gradient overflow-hidden">
      {/* Navigation (brand only on hero to avoid duplicate auth controls) */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Recycle className="w-8 h-8" />
            <span className="text-2xl font-bold">FixItUp</span>
          </div>
          <div />
        </div>
      </nav>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="block">Fix It.</span>
                <span className="block text-yellow-300">Reuse It.</span>
                <span className="block">Share It.</span>
              </h1>
              <p className="text-xl text-white/90 max-w-lg">
                The campus marketplace where broken items get second chances and students build sustainable communities.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div className="text-center">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Recycle className="w-6 h-6" />
                  <span className="text-2xl font-bold">2.5k+</span>
                </div>
                <p className="text-sm text-white/80">Items Rescued</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Users className="w-6 h-6" />
                  <span className="text-2xl font-bold">800+</span>
                </div>
                <p className="text-sm text-white/80">Active Students</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Wrench className="w-6 h-6" />
                  <span className="text-2xl font-bold">95%</span>
                </div>
                <p className="text-sm text-white/80">Success Rate</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="accent" className="text-lg px-8 py-4">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Fixing
              </Button>
              <Button size="lg" variant="glass" className="text-lg px-8 py-4">
                <Wrench className="w-5 h-5 mr-2" />
                Become a Fixer
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Students fixing and sharing items on campus"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">50 kg CO₂ Saved</p>
                  <p className="text-sm text-gray-600">This month</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">24 Repairs</p>
                  <p className="text-sm text-gray-600">Completed today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;