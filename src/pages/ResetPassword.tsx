import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { mapDbError } from '@/lib/mapDbError';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, CheckCircle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be less than 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Supabase delivers a recovery session via the URL fragment; the auth client
    // exchanges it automatically, so we only need to confirm a session exists.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setEmail(session?.user?.email ?? null);
        setIsValidLink(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setEmail(data.session.user.email ?? null);
        setIsValidLink(true);
      }
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Could not update password',
        description: mapDbError(error, 'reset-password'),
        variant: 'destructive',
      });
      return;
    }

    setDone(true);
    toast({ title: 'Password updated', description: 'You can now use your new password.' });
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      <section className="pt-28 pb-16 min-h-[70vh] flex items-center">
        <div className="container px-4 max-w-md mx-auto">
          <div className="glass rounded-2xl p-8">
            <div className="flex flex-col items-center mb-6 text-center">
              <span className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
                {done ? (
                  <CheckCircle className="w-6 h-6 text-primary" />
                ) : (
                  <KeyRound className="w-6 h-6 text-primary" />
                )}
              </span>
              <h1 className="text-2xl font-heading font-bold">Set a new password</h1>
              {email && !done && (
                <p className="text-sm text-muted-foreground mt-2">for {email}</p>
              )}
            </div>

            {checking ? (
              <p className="text-sm text-muted-foreground text-center" role="status">
                Checking your reset link…
              </p>
            ) : done ? (
              <p className="text-sm text-muted-foreground text-center">
                Your password has been updated. Redirecting to your dashboard…
              </p>
            ) : !isValidLink ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  This reset link is invalid or has expired. Request a new one from the sign-in
                  page.
                </p>
                <Button variant="hero" className="w-full" onClick={() => navigate('/auth')}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <Input type="password" className="bg-secondary" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormDescription>At least 8 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <Input type="password" className="bg-secondary" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Updating…' : 'Update password'}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
