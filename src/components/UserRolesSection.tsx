import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wrench, ShoppingCart } from "lucide-react";

const UserRolesSection = () => {
  const roles = [
    {
      icon: AlertTriangle,
      title: "Requesters",
      subtitle: "Got something broken?",
      description: "Post your damaged items and get them fixed by skilled students in your campus community.",
      features: [
        "Upload photos & descriptions",
        "Set your budget & timeline", 
        "Choose local fixers",
        "Track repair progress"
      ],
      buttonText: "Post an Item",
      buttonVariant: "hero" as const,
      gradient: "bg-gradient-to-br from-red-50 to-red-100",
      iconBg: "bg-red-500"
    },
    {
      icon: Wrench,
      title: "Fixers",
      subtitle: "Share your skills & earn",
      description: "Use your repair skills to help fellow students while earning money and building your reputation.",
      features: [
        "Browse repair requests",
        "Set competitive prices",
        "Build your profile & ratings",
        "Earn while helping others"
      ],
      buttonText: "Become a Fixer",
      buttonVariant: "eco" as const,
      gradient: "bg-gradient-to-br from-primary/10 to-primary/20",
      iconBg: "bg-primary"
    },
    {
      icon: ShoppingCart,
      title: "Buyers",
      subtitle: "Find great deals on refurbished items",
      description: "Browse repaired and refurbished items at student-friendly prices with quality guarantees.",
      features: [
        "Browse fixed items",
        "Verified quality checks",
        "Student-friendly prices",
        "Campus pickup available"
      ],
      buttonText: "Shop Now",
      buttonVariant: "accent" as const,
      gradient: "bg-gradient-to-br from-accent/10 to-accent/20",
      iconBg: "bg-accent"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Role in the Circular Economy
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you need repairs, offer skills, or want great deals - there's a place for everyone in our sustainable campus community.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <Card key={index} className={`group hover:shadow-eco transition-all duration-500 border-0 ${role.gradient} hover:scale-105`}>
              <CardContent className="p-8 text-center">
                <div className="space-y-6">
                  {/* Icon */}
                  <div className={`w-20 h-20 ${role.iconBg} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <role.icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">{role.title}</h3>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{role.subtitle}</p>
                    <p className="text-muted-foreground leading-relaxed">{role.description}</p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 text-left">
                    {role.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button variant={role.buttonVariant} size="lg" className="w-full">
                    {role.buttonText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserRolesSection;