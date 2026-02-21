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
            <img alt="Double Eagle Challenge Badge" className="w-full h-auto object-contain drop-shadow-2xl" src={`${import.meta.env.BASE_URL}lovable-uploads/ea5fb597-0bc6-44fc-b3a1-9564dd8b720a.png`} />
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
            <Link to="/auth">
              Enlist Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground uppercase tracking-wide">
            <span>✓ No credit card required</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 7-day trial</span>
          </div>
        </div>
      </div>
    </section>;
};
export default CTASection;