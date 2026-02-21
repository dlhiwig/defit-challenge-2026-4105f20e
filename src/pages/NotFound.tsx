import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-16 min-h-[70vh] flex items-center">
        <div className="container px-4 max-w-2xl mx-auto text-center">
          <div className="glass rounded-2xl p-8 md:p-12">
            <h1 className="text-6xl md:text-8xl font-heading font-bold text-gradient mb-4">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Page Not Found
            </h2>
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/about">
                  <Search className="w-4 h-4 mr-2" />
                  Learn About DEFIT
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/auth" className="text-primary hover:underline text-sm">Sign In</Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/leaderboard" className="text-primary hover:underline text-sm">Leaderboard</Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/rules" className="text-primary hover:underline text-sm">Rules</Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/faq" className="text-primary hover:underline text-sm">FAQ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
