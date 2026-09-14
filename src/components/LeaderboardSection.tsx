import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase, isDemoMode } from "@/integrations/supabase/client";

interface BoardEntry {
  rank: number;
  name: string;
  overallCompletion: number;
  unit: string | null;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-primary" />;
    case 2:
      return <Medal className="w-5 h-5 text-[hsl(40,30%,60%)]" />;
    case 3:
      return <Award className="w-5 h-5 text-[hsl(30,40%,45%)]" />;
    default:
      return <span className="text-muted-foreground font-heading font-bold">{rank}</span>;
  }
};

const LeaderboardSection = () => {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isDemoMode) {
        setLoaded(true);
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("get-leaderboard");
        if (error) throw error;
        const rows = Array.isArray(data?.data) ? data.data : [];
        if (!cancelled) {
          setEntries(
            rows.slice(0, 5).map((entry: BoardEntry) => ({
              rank: entry.rank,
              name: entry.name || "Anonymous Soldier",
              overallCompletion: Number(entry.overallCompletion) || 0,
              unit: entry.unit ?? null,
            })),
          );
        }
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="leaderboard" className="py-24 relative">
      <div className="absolute inset-0 bg-hero-gradient opacity-30" />

      <div className="container px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Compete with the <span className="text-gradient">Force</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Standings come from verified workout logs in this challenge cycle.
              Rankings stay provisional until USARC validation.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl">
                <div className="text-3xl font-heading font-bold text-gradient mb-2">10</div>
                <div className="text-muted-foreground text-sm uppercase tracking-wide">Week Season</div>
              </div>
              <div className="glass p-6 rounded-2xl">
                <div className="text-3xl font-heading font-bold text-gradient mb-2">4</div>
                <div className="text-muted-foreground text-sm uppercase tracking-wide">Event Types</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Current Standings</h3>
              <span className="text-sm text-muted-foreground uppercase tracking-wide">Verified logs</span>
            </div>

            {!loaded ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No scored participants yet. Standings appear here when verified
                cardio, strength, HIIT, or TMAR-M logs are posted.
              </p>
            ) : (
              <div className="space-y-4">
                {entries.map((user, index) => (
                  <div
                    key={`${user.rank}-${user.name}`}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-secondary/50 ${
                      index === 0 ? "bg-primary/10 border border-primary/20" : ""
                    }`}
                  >
                    <div className="w-8 flex justify-center">{getRankIcon(user.rank)}</div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm ${
                        index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.unit || "Unit not listed"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-foreground">
                        {user.overallCompletion.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">complete</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/leaderboard"
              className="block w-full mt-6 text-center text-primary font-heading font-semibold hover:underline underline-offset-4 transition-all uppercase tracking-wider"
            >
              View Full Leaderboard →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
