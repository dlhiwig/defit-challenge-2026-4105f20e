import { Navigate } from 'react-router-dom';
import { useChallengeSeason } from '@/hooks/useChallengeSeason';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton';

/** /challenge — sends visitors to whichever season is live, next, or most recent. */
const ChallengeIndex = () => {
  const { season, loading } = useChallengeSeason();

  if (loading) {
    return (
      <main className="min-h-screen bg-background texture-canvas">
        <Navbar />
        <div className="container px-4 pt-32">
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!season) return <Navigate to="/" replace />;

  return <Navigate to={`/challenge/${season.year}`} replace />;
};

export default ChallengeIndex;
