import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardioForm } from '@/components/dashboard/CardioForm';
import { StrengthForm } from '@/components/dashboard/StrengthForm';
import { HIITForm } from '@/components/dashboard/HIITForm';
import { TMARMForm } from '@/components/dashboard/TMARMForm';
import { ProgressSummary } from '@/components/dashboard/ProgressSummary';
import CycleStatusBanner from '@/components/CycleStatusBanner';

import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Dumbbell, Flame, Heart, BarChart3, ArrowLeft, LogOut, Loader2, History, Settings, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyMissions } from '@/components/dashboard/MyMissions';
import { WeeklySummaries } from '@/components/dashboard/WeeklySummaries';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('summary');
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    }
    if (user) checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background texture-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-8">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link to="/dashboard/history">
                  <History className="w-4 h-4 mr-2" />
                  History
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/progress">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Progress Tracker
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link to="/profile/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings/notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Link>
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="border-primary/50 text-primary"
                >
                  <Link to="/admin/verify-logs">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Workout <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Log your workouts and track progress toward the 10-week challenge minimums.
          </p>
          <p className="text-sm text-primary mt-1">
            Logged in as: {user.email}
          </p>
        </div>
      </section>

      {/* Cycle status — the site is open year-round */}
      <section className="pb-4">
        <div className="container px-4">
          <CycleStatusBanner />
        </div>
      </section>

      {/* My Missions */}

      <section className="pb-4">
        <div className="container px-4">
          <MyMissions />
        </div>
      </section>

      {/* AI Weekly Summaries */}
      <section className="pb-4">
        <div className="container px-4">
          <WeeklySummaries />
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Panel - Forms */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 mb-6 bg-secondary/50 p-1 rounded-xl">
                  <TabsTrigger 
                    value="summary" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Summary</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cardio"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Cardio</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="strength"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                  >
                    <Dumbbell className="w-4 h-4" />
                    <span className="hidden sm:inline">Strength</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hiit"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                  >
                    <Flame className="w-4 h-4" />
                    <span className="hidden sm:inline">HIIT</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tmarm"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">TMAR-M</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-0">
                  <ProgressSummary />
                </TabsContent>

                <TabsContent value="cardio" className="mt-0">
                  <div className="glass rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-bold">Log Cardio</h2>
                        <p className="text-sm text-muted-foreground">Run, ruck, bike, swim, or row</p>
                      </div>
                    </div>
                    <CardioForm />
                  </div>
                </TabsContent>

                <TabsContent value="strength" className="mt-0">
                  <div className="glass rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-bold">Log Strength</h2>
                        <p className="text-sm text-muted-foreground">Weightlifting and resistance training</p>
                      </div>
                    </div>
                    <StrengthForm />
                  </div>
                </TabsContent>

                <TabsContent value="hiit" className="mt-0">
                  <div className="glass rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Flame className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-bold">Log HIIT</h2>
                        <p className="text-sm text-muted-foreground">High-intensity interval training</p>
                      </div>
                    </div>
                    <HIITForm />
                  </div>
                </TabsContent>

                <TabsContent value="tmarm" className="mt-0">
                  <div className="glass rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-bold">Log TMAR-M</h2>
                        <p className="text-sm text-muted-foreground">Tactical Mobility, Active Recovery & Mindfulness</p>
                      </div>
                    </div>
                    <TMARMForm />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Panel - Quick Stats (Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <ProgressSummary />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data verified by USARC notice */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="glass rounded-2xl p-6 border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Data Verification:</strong> All workout logs are integrity-based 
              and may be validated by designated USARC personnel. Maintain comprehensive records to support 
              efficient validation when required.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function Dashboard() {
  return (
    <WorkoutProvider>
      <DashboardContent />
    </WorkoutProvider>
  );
}
