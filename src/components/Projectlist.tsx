import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const about = [
  {
    name: "First Place 🥇, Mechatronics Buildathon",
    content: "My team and I placed first place overall and won the first year award for the Buildathon Competition 2024! We were tasked with creating a robot that could bring benefit to society. To do this, we created a robot designed to help combat the dangerous bushfires in Australia. Our robot is capable of providing real-time updates on its surrounding environment, uses GPS for precise location tracking, Solar powered, and comes with a built-in speaker to warn locals of incoming hazards.",
    img: "https://media.licdn.com/dms/image/v2/D4D2DAQEJsfxWMB8FEw/profile-treasury-image-shrink_800_800/B4DZUmaREBHAAY-/0/1740106177554?e=1758520800&v=beta&t=LG-wopjKUu4P5DjkK1vgUiMo8JsTXuo7koLs_51avjM",
    link: "https://www.linkedin.com/in/minh-bui-aa533b2b9/details/honors/1740106190570/single-media-viewer/?profileId=ACoAAExm910By-GPWB2vl-SMWSZgVBk13F5Itcc",
  },
  {
    name: "CSESOC 2025 Hackathon Finalist 🏆🎖️",
    content: "I was part of a team that made it to the finals of the CSESOC 2025 Hackathon! We created a website called Ping. Ping allowed students to connect with each other based on the subjects they were studying. Users would simply upload a location and the subjects they were studying, and Ping would match them with other students studying the same subject in the same location. This allowed students to easily find study partners and form study groups.", 
    link: "https://ping-mauve.vercel.app/",
    img: "https://ping-mauve.vercel.app/ping-logo.png",
  },
  {
    name: "AI Security Simulation 🛡️",
    content: "An interactive simulation demonstrating game theory in cybersecurity. Multiple AI agents with different personalities compete as red team (attackers) and blue team (defenders) to optimize security strategies. Watch as different attack and defense tactics evolve through simulated battles, leading to more robust security solutions.",
    link: "/security-simulation",
    img: "https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=AI+Security+Sim",
  }
];

export const Projectlist = () => {
    return (
        <section id="Introduction" className="py-24 relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="gradient-text"> My projects </span>
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
                            <nav className="flex flex-col gap-4 justify-center items-center mb-12">
                                <Link to={about.link} className="text-primary underline">
                                    <Button variant="hero" size="lg" className="group">
                                        Click here to see
                                    </Button>
                                </Link>
                            </nav> 
                            <img src={about.img} alt={about.name} className="w-full h-auto rounded-lg mt-4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            </div>
        </section>
    );
}