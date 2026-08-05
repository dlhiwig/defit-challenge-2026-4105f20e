import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-military-training.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100dvh] sm:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Military soldiers training at dawn, rucking and group PT"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              11 Jan – 21 Mar 2027
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight tracking-wider">
            Reserve Ready.
            <br />
            <span className="text-gradient">Unit Strong.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            The DEFIT 2027 Double Eagle Fitness Challenge — a 10-week H2F program
            building physical and spiritual readiness across the Army Reserve.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="w-full sm:w-auto font-heading" asChild>
              <Link to="/auth">
                Register Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="lg" className="w-full sm:w-auto font-heading" asChild>
              <Link to="/about">
                Learn More
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            {[
              { value: "10", label: "Week Challenge" },
              { value: "4", label: "Fitness Pillars" },
              { value: "H2F", label: "Focused" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-heading font-bold text-gradient">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
