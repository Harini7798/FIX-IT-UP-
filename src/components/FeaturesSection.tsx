import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, MessageCircle, CreditCard, MapPin, Award, Leaf } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Smart Matching",
      description: "AI-powered matching connects your broken items with the right fixers in your area.",
      gradient: "bg-primary"
    },
    {
      icon: MessageCircle,
      title: "Built-in Chat",
      description: "Communicate directly with fixers, negotiate prices, and track progress in real-time.",
      gradient: "bg-blue-500"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Safe and secure payment system with UPI integration and buyer protection.",
      gradient: "bg-purple-500"
    },
    {
      icon: MapPin,
      title: "Campus Network",
      description: "Connect with students in your hostel, block, or campus for easy pickup and delivery.",
      gradient: "bg-accent"
    },
    {
      icon: Award,
      title: "Skill Verification",
      description: "Verified fixer profiles with ratings, reviews, and skill badges for trust and quality.",
      gradient: "bg-red-500"
    },
    {
      icon: Leaf,
      title: "Environmental Impact",
      description: "Track your carbon footprint reduction and contribute to campus sustainability goals.",
      gradient: "bg-green-600"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need for a Sustainable Campus
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From smart matching to secure payments, we've built every feature with students and sustainability in mind.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-soft transition-all duration-300 border-0 bg-card-gradient">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className={`w-16 h-16 ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;