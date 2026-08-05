import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, ClipboardCheck, Loader2, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CHALLENGE_CYCLE, CHALLENGE_DATE_RANGE, CHALLENGE_LABEL } from '@/lib/challenge';

const UNIT_CATEGORIES = [
  { value: 'military_family', label: 'Soldier / Military Family' },
  { value: 'veterans', label: 'Veteran' },
  { value: 'government', label: 'Government / DoD Civilian' },
  { value: 'civilian', label: 'Civilian Supporter' },
  { value: 'other', label: 'Other' },
] as const;

const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Enter a valid email address').max(255),
    unitCategory: z.enum(['military_family', 'veterans', 'government', 'civilian', 'other'], {
      required_error: 'Select a category',
    }),
    command: z.string().trim().max(120).optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters').max(72),
    confirmPassword: z.string(),
    emailReminders: z.boolean().default(true),
    acceptRules: z.boolean().refine((v) => v === true, {
      message: 'You must accept the Rules of Participation',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegistrationValues = z.infer<typeof registrationSchema>;

export default function Register() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = `Register | ${CHALLENGE_LABEL} Challenge`;
    const desc = document.querySelector('meta[name="description"]');
    const previous = desc?.getAttribute('content') ?? null;
    desc?.setAttribute(
      'content',
      `Register for ${CHALLENGE_LABEL}, the 10-week Army Reserve H2F challenge running ${CHALLENGE_DATE_RANGE}.`
    );
    return () => {
      if (previous) desc?.setAttribute('content', previous);
    };
  }, []);

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      command: '',
      password: '',
      confirmPassword: '',
      emailReminders: true,
      acceptRules: false,
    },
  });

  const onSubmit = async (data: RegistrationValues) => {
    setIsSubmitting(true);
    try {
      const { error: signUpError } = await signUp(data.email, data.password, data.fullName);

      if (signUpError) {
        const message = signUpError.message.includes('already')
          ? 'This email already has a DEFIT account. Sign in instead and your registration will be linked.'
          : signUpError.message;
        toast({ title: 'Registration failed', description: message, variant: 'destructive' });
        return;
      }

      const { error: insertError } = await supabase.from('defit_registrations').insert({
        full_name: data.fullName,
        email: data.email.toLowerCase(),
        unit_category: data.unitCategory,
        command: data.command || null,
        cycle: CHALLENGE_CYCLE,
        email_reminders: data.emailReminders,
      });

      if (insertError && insertError.code !== '23505') {
        console.error('Registration record failed:', insertError);
      }

      sessionStorage.setItem(
        'defit_registration',
        JSON.stringify({ fullName: data.fullName, email: data.email, emailReminders: data.emailReminders })
      );

      navigate('/register/confirmed');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      <section className="pt-28 pb-16">
        <div className="container px-4 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="inline-flex items-center gap-2 text-sm text-primary uppercase tracking-widest font-heading">
              <CalendarDays className="w-4 h-4" />
              {CHALLENGE_DATE_RANGE}
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mt-3">
              Register for <span className="text-gradient">{CHALLENGE_LABEL}</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Ten weeks of holistic health and fitness. Register once, then log cardio, strength, HIIT
              and TMAR-M all cycle long.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8">
            {user && (
              <p className="mb-6 text-sm text-muted-foreground">
                You're signed in as {user.email}. Submitting this form registers you for the{' '}
                {CHALLENGE_LABEL} cycle.
              </p>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" className="bg-secondary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className="bg-secondary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="unitCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-secondary">
                              <SelectValue placeholder="Select your category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card">
                            {UNIT_CATEGORIES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="command"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit / Command (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 200th MP CMD" className="bg-secondary" {...field} />
                        </FormControl>
                        <FormDescription>Used for unit rankings on the OML.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="bg-secondary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="bg-secondary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="emailReminders"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="cursor-pointer">
                          Email me {CHALLENGE_LABEL} milestone reminders
                        </FormLabel>
                        <FormDescription>
                          Kickoff, mid-cycle checkpoints and the final logging deadline. No marketing.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptRules"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="cursor-pointer">
                          I accept the{' '}
                          <Link to="/rules" className="text-primary underline">
                            Rules of Participation
                          </Link>{' '}
                          and{' '}
                          <Link to="/terms" className="text-primary underline">
                            Terms
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting registration...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      Complete registration
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground flex items-center gap-2 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Already registered?{' '}
                  <Link to="/auth" className="text-primary underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </Form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
