import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  // Get the oobCode from URL (Firebase password reset code)
  const oobCode = searchParams.get('oobCode') || searchParams.get('code');

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Verify the password reset code
    const verifyCode = async () => {
      if (!oobCode) {
        setChecking(false);
        return;
      }

      try {
        const auth = getFirebaseAuth();
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsValidCode(true);
      } catch (error) {
        console.error('Invalid reset code:', error);
        setIsValidCode(false);
      } finally {
        setChecking(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleResetPassword = async (data: ResetPasswordValues) => {
    if (!oobCode) return;

    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      await confirmPasswordReset(auth, oobCode, data.password);
      
      toast({
        title: 'Password updated',
        description: 'Please sign in with your new password.',
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Password update failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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

  if (!isValidCode) {
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
              {email && (
                <p className="text-sm text-muted-foreground mt-2">
                  for {email}
                </p>
              )}
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
