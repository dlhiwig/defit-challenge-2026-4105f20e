import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ChallengeCard from "./ChallengeCard";

const challenges = [
  {
    title: "30-Day Tactical HIIT",
    description: "High-intensity interval training designed for combat readiness. Build endurance and mental toughness.",
    duration: "30 days",
    participants: 12453,
    difficulty: "Intermediate" as const,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    category: "Cardio",
  },
  {
    title: "Strength Foundation",
    description: "Build foundational strength with progressive overload. Essential for every warrior.",
    duration: "8 weeks",
    participants: 8921,
    difficulty: "Beginner" as const,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    category: "Strength",
  },
  {
    title: "Ruck March Elite",
    description: "Prepare for long-distance ruck marches with structured programs and recovery protocols.",
    duration: "16 weeks",
    participants: 3247,
    difficulty: "Advanced" as const,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    category: "Endurance",
  },
  {
    title: "Core Conditioning",
    description: "Strengthen your core for stability under load. Build functional strength.",
    duration: "21 days",
    participants: 15678,
    difficulty: "Beginner" as const,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    category: "Core",
  },
  {
    title: "Mobility Protocol",
    description: "Improve mobility and prevent injuries with tactical stretching routines.",
    duration: "14 days",
    participants: 9832,
    difficulty: "Beginner" as const,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    category: "Recovery",
  },
  {
    title: "Beast Mode",
    description: "Extreme fitness challenge for hardened warriors. Push beyond your limits.",
    duration: "12 weeks",
    participants: 2156,
    difficulty: "Advanced" as const,
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
    category: "Extreme",
  },
];

const MISSION_END = new Date("2026-03-22T23:59:59");

const ChallengesSection = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, MISSION_END.getTime() - now.getTime());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="challenges" className="py-24 relative">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Active <span className="text-gradient">Missions</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose from hundreds of missions designed by elite trainers. 
            Begin your training and earn your badge.
          </p>

          {/* Countdown Clock */}
          <div className="mt-8 inline-flex items-center gap-1 sm:gap-3 glass rounded-2xl px-6 py-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2 hidden sm:inline">Mission Ends In</span>
            {([
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hrs" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Sec" },
            ] as const).map((unit, i) => (
              <div key={unit.label} className="flex items-center gap-1 sm:gap-3">
                {i > 0 && <span className="text-primary font-bold text-xl">:</span>}
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-heading font-bold text-gradient tabular-nums">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{unit.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.title} {...challenge} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/missions" className="text-primary font-heading font-semibold hover:underline underline-offset-4 transition-all uppercase tracking-wider">
            View All Missions →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ChallengesSection;
