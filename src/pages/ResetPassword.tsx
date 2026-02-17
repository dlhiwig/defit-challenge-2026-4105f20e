import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
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
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Supabase automatically exchanges the recovery token from the URL hash
    // and creates a session. We listen for that event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    // Also check if there's already a session (user clicked the link and session was set)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Password update failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      toast({
        title: 'Password updated',
        description: 'Please sign in with your new password.',
      });
      navigate('/auth');
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-background texture-canvas">
        <Navbar />
        <section className="pt-24 pb-16 min-h-[80vh] flex items-center justify-center">
          <p className="text-muted-foreground">Verifying reset link…</p>
        </section>
        <Footer />
      </main>
    );
  }

  if (!isValidSession) {
    return (
      <main className="min-h-screen bg-background texture-canvas">
        <Navbar />
        <section className="pt-24 pb-16 min-h-[80vh] flex items-center">
          <div className="container px-4 max-w-md mx-auto text-center">
            <div className="glass rounded-2xl p-8">
              <h1 className="text-2xl font-heading font-bold text-foreground mb-4">
                Invalid or expired link
              </h1>
              <p className="text-muted-foreground mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button variant="hero" onClick={() => navigate('/auth')}>
                Back to sign in
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      <section className="pt-24 pb-16 min-h-[80vh] flex items-center">
        <div className="container px-4 max-w-md mx-auto">
          <div className="glass rounded-2xl p-8">
            <div className="flex flex-col items-center mb-6">
              <KeyRound className="w-12 h-12 text-primary mb-3" />
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Create a new password
              </h1>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-secondary"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Minimum 8 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-secondary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isLoading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
