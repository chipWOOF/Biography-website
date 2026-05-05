import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


const about = [
  {
    name: "What Gets Me Up In The Morning?",
    content: "I am a person rooted in the love and dedication to my family, my friends and those around me. It is others that inspire me to do the things I do, work as hard as I do. I want to show the genuine kindness to others that has been shown to me throughout my life. I want to be a person that others can rely on, and someone who makes a positive impact in the lives of those around me. I want to be able to look back on my life and know that I have made a difference, no matter how small, in the lives of those I have encountered.",
  },
  {
    name: "What do I want to achieve in the next 5 years?",
    content: "One thing I want to achieve in the next 5 years is: get an internship and a job"
  },
  {
    name: "My dreams",
    content: "I have no dreams because you should never let dreams be dreams."
  }

];

export const Dreams = () => {
    return (
        <section id="Introduction" className="py-24 relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="gradient-text"> My Dreams </span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                    </p>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {about.map((about, index) => (
                    <Card key={index} className= "relative glass-card border-border/50 hover:-translate-y-2 transition-all duration-300">
                        <CardHeader className="text-center pb-6">
                            <CardTitle className="text-2xl font-bold">{about.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-12">
                            <div className="space-y-6">
                                <span className="text-sm font-semibold">{about.content}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="text-center mt-12">
                <p className="text-muted-foreground mb-4">
                    Click the button below to see something funny!
                </p>
            </div>
            </div>

            <div className="container mx-auto px-6">
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    <a
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                    <Button variant="glass" size="sm">
                        DO NOT CLICK THIS BUTTON (it will literally nuke the entire site and destroy my hard work)
                    </Button>
                    </a>
                </div>
            </div>
            <div className="text-center mt-12">
                <p className="text-muted-foreground mb-4">
                    In all seriousness, thank you for takng the time to go through my website, I hope you now know a little bit more about me!
                </p>
            </div>
            <div className="container mx-auto px-6">
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    <a
                        href="https://youtu.be/RTDYMs5-htU?si=OdGHoAPXu2ziOuOE"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                    <Button variant="glass" size="sm">
                        Click here to watch 10 year old me discover my musical prowess
                    </Button>
                    </a>
                </div>
            </div>
        </section>
    );
}