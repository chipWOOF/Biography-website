import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Bbsolver } from "@/components/Blockblastsolver";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Bbsolver />
    </div>
  );
};

export default Index;
