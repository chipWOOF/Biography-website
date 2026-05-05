import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa";

const about = [
  {
    name: "Who am I?",

    content: "Hello! I am Minh Bui, I'm a second year student studying Commerce/Computer Science. Ethnically, I am Vietnamese, my pronouns are He/Him/His.",
  },
  {
    name: "My Website",
    content: "Simply click the next button to continue exploring my biography"
  }
];

export const Intro = () => {
    return (
        <section id="Introduction" className="py-24 relative">
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
                    Enjoy this photo of my dog and some links to my socials!
                </p>
            </div>
            </div>

            <div className="container mx-auto px-6">
                <img
                    src="/IMG_4593.JPG"
                    alt="IMG_4593"
                    className="mx-auto mb-8 rounded-full w-40 h-40 object-cover shadow-lg"
                />
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    <a
                        href="https://www.instagram.com/minhbooey/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 glass-card px-4 py-2"
                    >
                        <FaInstagram className="w-4 h-4 text-primary" />
                        <span className="text-sm">Instagram</span>
                    </a>
                    <a
                        href="https://www.youtube.com/@minhyboi157"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 glass-card px-4 py-2"
                    >
                        <FaYoutube className="w-4 h-4 text-primary" />
                        <span className="text-sm">Youtube</span>
                    </a>
                    <a
                        href="https://www.linkedin.com/in/minh-bui-aa533b2b9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 glass-card px-4 py-2"
                    >
                        <FaLinkedin className="w-4 h-4 text-primary" />
                        <span className="text-sm">LinkedIn</span>
                    </a>
                </div>
            </div>
        </section>
    );
}