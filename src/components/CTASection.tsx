import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import kettlebellBadge from "@/assets/kettlebell-badge.png";
const CTASection = () => {
  return <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="container px-4 relative">
        <div className="glass rounded-3xl p-8 md:p-16 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="w-full max-w-md mx-auto mb-8 animate-float">
            <img alt="Double Eagle Challenge Badge" className="w-full h-auto object-contain drop-shadow-2xl" src={kettlebellBadge} />
          </div>

          {/* Content */}
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Begin Your <span className="text-gradient">Mission?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of warriors who have already transformed themselves. 
            Your path to elite fitness starts with a single step.
          </p>

          {/* CTA */}
          <Button variant="hero" size="lg" asChild>
            <Link to="/register">
              Enlist Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground uppercase tracking-wide">
            <span>✓ Free to participate</span>
            <span>✓ Open to all Army Reserve Soldiers</span>
            <span>✓ 11 Jan – 21 Mar 2027</span>
          </div>
        </div>
      </div>
    </section>;
};
export default CTASection;