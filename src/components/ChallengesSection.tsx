import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ChallengeCard from "./ChallengeCard";
import { useMissions } from "@/hooks/useMissions";
import { CHALLENGE_END } from "@/lib/challenge";

const FALLBACK_MISSIONS = [
  {
    title: "30-Day Tactical HIIT",
    description: "High-intensity interval training designed for combat readiness. Build endurance and mental toughness.",
    duration: "30 days",
    difficulty: "Intermediate" as const,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    category: "Cardio",
  },
  {
    title: "Strength Foundation",
    description: "Build foundational strength with progressive overload. Essential for every warrior.",
    duration: "8 weeks",
    difficulty: "Beginner" as const,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    category: "Strength",
  },
  {
    title: "Ruck March Elite",
    description: "Prepare for long-distance ruck marches with structured programs and recovery protocols.",
    duration: "16 weeks",
    difficulty: "Advanced" as const,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    category: "Endurance",
  },
  {
    title: "Core Conditioning",
    description: "Strengthen your core for stability under load. Build functional strength.",
    duration: "21 days",
    difficulty: "Beginner" as const,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    category: "Core",
  },
  {
    title: "Mobility Protocol",
    description: "Improve mobility and prevent injuries with tactical stretching routines.",
    duration: "14 days",
    difficulty: "Beginner" as const,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    category: "Recovery",
  },
  {
    title: "Beast Mode",
    description: "Extreme fitness challenge for hardened warriors. Push beyond your limits.",
    duration: "12 weeks",
    difficulty: "Advanced" as const,
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
    category: "Extreme",
  },
];

const capitalize = (value: string) =>
  (value.charAt(0).toUpperCase() + value.slice(1)) as "Beginner" | "Intermediate" | "Advanced";

const ChallengesSection = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { data: missions } = useMissions({
    search: "",
    difficulty: "",
    focus: "",
    duration: "",
    sort: "newest",
  });

  const cards = useMemo(() => {
    if (missions && missions.length > 0) {
      return missions.slice(0, 6).map((mission) => ({
        title: mission.title,
        description: mission.short_description,
        duration: mission.duration_weeks
          ? `${mission.duration_weeks} week${mission.duration_weeks === 1 ? "" : "s"}`
          : `${mission.duration_days} day${mission.duration_days === 1 ? "" : "s"}`,
        difficulty: capitalize(mission.difficulty),
        image:
          mission.cover_image_url ||
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
        category: mission.focus,
      }));
    }
    return FALLBACK_MISSIONS;
  }, [missions]);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, CHALLENGE_END.getTime() - Date.now());
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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Active <span className="text-gradient">Missions</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Structured training tracks for cardio, strength, HIIT, and TMAR-M.
            Join a mission and log verified work toward the seasonal challenge.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 sm:gap-3 glass rounded-2xl px-6 py-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2 hidden sm:inline">Season Ends In</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((challenge) => (
            <ChallengeCard key={challenge.title} {...challenge} />
          ))}
        </div>

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
