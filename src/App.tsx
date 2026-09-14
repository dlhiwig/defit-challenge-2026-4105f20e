import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";

const H2F = lazy(() => import("./pages/H2F"));
const WaistToHeight = lazy(() => import("./pages/WaistToHeight"));
const About = lazy(() => import("./pages/About"));
const Rules = lazy(() => import("./pages/Rules"));
const Resources = lazy(() => import("./pages/Resources"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WorkoutHistory = lazy(() => import("./pages/WorkoutHistory"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LeaderboardUnits = lazy(() => import("./pages/LeaderboardUnits"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminVerifyLogs = lazy(() => import("./pages/AdminVerifyLogs"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const ContactPOC = lazy(() => import("./pages/ContactPOC"));
const SecurityCompliance = lazy(() => import("./pages/SecurityCompliance"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Missions = lazy(() => import("./pages/Missions"));
const MissionDetail = lazy(() => import("./pages/MissionDetail"));
const Rankings = lazy(() => import("./pages/Rankings"));
const Scoring = lazy(() => import("./pages/Scoring"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Register = lazy(() => import("./pages/Register"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const RegistrationConfirmed = lazy(() => import("./pages/RegistrationConfirmed"));
const ProgressTracker = lazy(() => import("./pages/ProgressTracker"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const ChallengeIndex = lazy(() => import("./pages/challenge/ChallengeIndex"));
const ChallengeSeason = lazy(() => import("./pages/challenge/ChallengeSeason"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/h2f" element={<H2F />} />
                <Route path="/waist-to-height" element={<WaistToHeight />} />
                <Route path="/about" element={<About />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/leaderboard/units" element={<LeaderboardUnits />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/history" element={<ProtectedRoute><WorkoutHistory /></ProtectedRoute>} />
                <Route path="/dashboard/progress" element={<ProtectedRoute><ProgressTracker /></ProtectedRoute>} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/confirmed" element={<RegistrationConfirmed />} />
                <Route path="/profile/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/admin/verify-logs" element={<ProtectedRoute><AdminVerifyLogs /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/report-issue" element={<ReportIssue />} />
                <Route path="/contact" element={<ContactPOC />} />
                <Route path="/security" element={<SecurityCompliance />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/missions/:slug" element={<MissionDetail />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/scoring" element={<Scoring />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/challenge" element={<ChallengeIndex />} />
                <Route path="/challenge/:year" element={<ChallengeSeason />} />
                <Route path="/challenge/:year/rankings" element={<Rankings />} />
                <Route path="/challenge/:year/rules" element={<Rules />} />
                <Route
                  path="/challenge/:year/progress"
                  element={<ProtectedRoute><ProgressTracker /></ProtectedRoute>}
                />
                <Route path="/challenge/:year/register" element={<Navigate to="/register" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
