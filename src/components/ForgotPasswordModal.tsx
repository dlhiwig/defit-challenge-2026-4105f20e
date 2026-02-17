import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(255),
});

type ResetValues = z.infer<typeof resetSchema>;

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const handleSubmit = async (data: ResetValues) => {
    // Basic client-side rate limiting (30s cooldown)
    const now = Date.now();
    if (now - lastRequestTime < 30_000) {
      form.setError('email', {
        message: 'Please wait before requesting another reset link.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });
      setLastRequestTime(Date.now());
      setSubmitted(true);
    } catch {
      form.setError('email', {
        message: 'Something went wrong. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setSubmitted(false);
      form.reset();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <CheckCircle className="w-12 h-12 text-primary" />
            <DialogHeader>
              <DialogTitle className="text-foreground">Check your email</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                If an account exists for that email, a reset link has been sent.
                Please check your inbox and spam folder.
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={handleClose} className="mt-2">
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Reset your password</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter the email associated with your account and we'll send you a reset link.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="soldier@army.mil"
                          className="bg-secondary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-2">
                  <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                    <Mail className="w-4 h-4 mr-2" />
                    {isLoading ? 'Sending…' : 'Send reset link'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={handleClose}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
