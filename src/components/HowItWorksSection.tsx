import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Search, Wrench, RefreshCw } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "Post Your Item",
      description: "Upload photos and details of your damaged item. Mark it as 'Need Repair', 'For Sale', or 'Free Pickup'.",
      color: "text-primary"
    },
    {
      step: "02", 
      icon: Search,
      title: "Get Matched",
      description: "Our smart algorithm connects you with skilled fixers in your campus area who can help.",
      color: "text-blue-500"
    },
    {
      step: "03",
      icon: Wrench,
      title: "Fix & Pay",
      description: "Chat with fixers, agree on price and timeline. Secure payment ensures safe transactions.",
      color: "text-accent"
    },
    {
      step: "04",
      icon: RefreshCw,
      title: "Reuse & Review",
      description: "Get your item back fixed and working! Leave reviews to help build our campus community.",
      color: "text-green-600"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            How FixItUp Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From broken to beautiful in four simple steps. Join thousands of students creating a more sustainable campus.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="text-center hover:shadow-soft transition-all duration-300 border-0 bg-white">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Step Number */}
                    <div className="relative">
                      <div className={`w-16 h-16 ${step.color.replace('text-', 'bg-')}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <step.icon className={`w-8 h-8 ${step.color}`} />
                      </div>
                      <div className={`absolute -top-2 -right-2 w-8 h-8 ${step.color.replace('text-', 'bg-')} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                        {step.step}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-primary/30 relative">
                    <div className="absolute -right-1 -top-1 w-3 h-3 border-r-2 border-b-2 border-primary/30 transform rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="hero" className="text-lg px-8 py-4">
            Start Your First Fix
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;