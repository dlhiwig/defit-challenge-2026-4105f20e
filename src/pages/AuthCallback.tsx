import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * OAuth landing route. The Supabase client hydrates the session from the URL,
 * then we forward the participant to their dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const finish = (hasSession: boolean) => {
      if (done) return;
      done = true;
      navigate(hasSession ? '/dashboard' : '/auth', { replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(true);
      else setTimeout(() => finish(false), 2500);
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground" role="status">
        Completing sign-in…
      </p>
    </main>
  );
}
