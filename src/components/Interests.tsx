import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

const about = [
  {
    name: "Movies",
    icon: Sparkles,
    description: "My top 5 movie recommendations :)",
    features: [
      "Interstellar (2014) - Christopher Nolan classic",
      "The Social Network (2010) - my inspiration to coding wow",
      "The Pursuit of Happyness (2006) - Literally the sadest movie ever",
      "The Glass Castle (2017) - My second favourite sad movie",
      "Transformers (2007) - who doesn't love explosions"
    ],
    popular: false
  },
  {
    name: "Games",
    icon: Zap,
    description: "A list of my favourite games hehe",
    features: [
      "Arma 3 - best military sim",
      "Age of Empires 3 - favourite strategy game",
      "Valorant....",
      "Truck Simulator - I love trucks",
      "drunk driver sumulator - accurate and realistic"
    ],
    popular: false
  },
  {
    name: "Music",
    icon: Crown,
    description: "My favourite artists to listen to",
    features: [
      "Baedeedoodeebee - love to listen with a matcha",
      "The Weeknd",
      "Olivia Rodrigo - go to careoke",
      "HOW TO TRAIN YOUR DRAGONS DO I HAVE TO SAY MORE??????",
      "The neighbourhood - cmon who doesn't love Sweater Weather"
    ],
    popular: false
  }
];

export const AboutME = () => {
  return (
      <section id="About Me" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              All about Minh Bao Bui
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Get to know all about me and my interests!
            </p>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {about.map((about, index) => (
              <Card 
                key={index}
                className={`relative glass-card border-border/50 hover:-translate-y-2 transition-all duration-300 ${
                  about.popular 
                    ? 'border-primary/50 glow-effect scale-105' 
                    : 'hover:border-primary/30'
                }`}
              >
                {about.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      We will really get along if you match with this
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="p-4 rounded-xl w-fit mx-auto mb-4">
                  </div>
                  <CardTitle className="text-2xl font-bold">{about.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {about.description}
                  </CardDescription>
                </CardHeader>
  
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {about.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-primary/20">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            If you pick me I promise to give even better recommedations!
          </p>
        </div>
      </div>
    </section>
  );
}