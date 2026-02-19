import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Shield, LogIn, UserPlus } from 'lucide-react';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import OAuthButtons from '@/components/OAuthButtons';
import defitLogo from '@/assets/defit-logo.png';
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});
type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
export default function Auth() {
  const {
    user,
    signIn,
    signUp
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [forgotOpen, setForgotOpen] = useState(false);
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  const handleSignIn = async (data: SignInValues) => {
    setIsLoading(true);
    const {
      error
    } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials' ? 'Invalid email or password. Please try again.' : error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'Signed in successfully.'
      });
      navigate('/dashboard');
    }
  };
  const handleSignUp = async (data: SignUpValues) => {
    setIsLoading(true);
    const {
      error
    } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);
    if (error) {
      const message = error.message.includes('already registered') ? 'This email is already registered. Please sign in instead.' : error.message;
      toast({
        title: 'Sign up failed',
        description: message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'Welcome to DEFIT. You can now log your workouts.'
      });
      navigate('/dashboard');
    }
  };
  return <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      
      <section className="pt-24 pb-16 min-h-[80vh] flex items-center">
        <div className="container px-4 max-w-md mx-auto">
          <div className="glass rounded-2xl p-8">
            <div className="flex flex-col items-center mb-8">
              <img alt="DEFIT Logo" className="w-40 h-40 mb-4 object-contain" src={`${import.meta.env.BASE_URL}lovable-uploads/97e87443-ab9a-45b2-852a-72f438faa764.png`} />
              <h1 className="text-2xl font-heading font-bold text-center">
                <span className="text-gradient">DEFIT</span> Challenge
              </h1>
              <p className="text-muted-foreground text-sm text-center mt-2">
                Double Eagle Fitness – Army Reserve
              </p>
            </div>

            <OAuthButtons />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField control={signInForm.control} name="email" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="soldier@army.mil" className="bg-secondary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={signInForm.control} name="password" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-secondary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                       <Shield className="w-4 h-4 mr-2" />
                       {isLoading ? 'Signing in...' : 'Sign In'}
                     </Button>
                     <button
                       type="button"
                       className="text-sm text-muted-foreground hover:text-primary transition-colors text-right w-full"
                       onClick={() => setForgotOpen(true)}
                     >
                       Forgot password?
                     </button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField control={signUpForm.control} name="fullName" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-secondary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={signUpForm.control} name="email" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="soldier@army.mil" className="bg-secondary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={signUpForm.control} name="password" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-secondary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={signUpForm.control} name="confirmPassword" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-secondary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
      <Footer />
    </main>;
}