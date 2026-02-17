import { Clock, Users, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ChallengeCardProps {
  title: string;
  description: string;
  duration: string;
  participants: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  image: string;
  category: string;
}

const difficultyColors = {
  Beginner: "text-primary",
  Intermediate: "text-[hsl(40,60%,55%)]",
  Advanced: "text-destructive",
};

const ChallengeCard = ({
  title,
  description,
  duration,
  participants,
  difficulty,
  image,
  category,
}: ChallengeCardProps) => {
  return (
    <div className="glass rounded-2xl overflow-hidden card-hover group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="glass px-3 py-1 rounded-full text-xs font-heading font-semibold text-foreground uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Flame className={`w-4 h-4 ${difficultyColors[difficulty]}`} />
          <span className={`text-sm font-medium uppercase tracking-wide ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-gradient transition-all duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{participants.toLocaleString()}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full font-heading uppercase tracking-wider" asChild>
          <Link to="/missions">Join Mission</Link>
        </Button>
      </div>
    </div>
  );
};

export default ChallengeCard;
