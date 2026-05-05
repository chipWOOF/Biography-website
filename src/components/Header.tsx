import { Button } from "@/components/ui/button";
import { Sparkles, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="fixed top-0 w-full z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold ">MinhDaRooler</span>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
              My Projects
            </Link>
          </div>
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};