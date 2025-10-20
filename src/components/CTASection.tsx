import { Button } from "@/components/ui/button";
import { Leaf, Users, ArrowRight, Smartphone } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-eco-gradient text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Content */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">
              Ready to Make Your Campus More Sustainable?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of students who are already building a circular economy on campus. 
              Every repair, every reuse, every connection makes a difference.
            </p>
          </div>

          {/* Impact Stats */}
          <div className="grid md:grid-cols-3 gap-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Leaf className="w-8 h-8 text-yellow-300" />
                <span className="text-4xl font-bold text-yellow-300">2.5T</span>
              </div>
              <p className="text-white/80">CO₂ Saved Annually</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-8 h-8 text-yellow-300" />
                <span className="text-4xl font-bold text-yellow-300">50+</span>
              </div>
              <p className="text-white/80">Partner Campuses</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ArrowRight className="w-8 h-8 text-yellow-300" />
                <span className="text-4xl font-bold text-yellow-300">98%</span>
              </div>
              <p className="text-white/80">Student Satisfaction</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="accent" className="text-lg px-8 py-4 shadow-lg">
              <Smartphone className="w-5 h-5 mr-2" />
              Download App
            </Button>
            <Button size="lg" variant="glass" className="text-lg px-8 py-4">
              Join Your Campus
            </Button>
          </div>

          {/* Additional Info */}
          <div className="pt-8 border-t border-white/20">
            <p className="text-white/70 text-sm">
              Made by Akshat | Powered by Sustainable Tech | © 2024 CampusFixers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;