import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Rules from "./pages/Rules";
import Resources from "./pages/Resources";
import Dashboard from "./pages/Dashboard";
import WorkoutHistory from "./pages/WorkoutHistory";
import ProfileSettings from "./pages/ProfileSettings";
import Leaderboard from "./pages/Leaderboard";
import LeaderboardUnits from "./pages/LeaderboardUnits";
import Auth from "./pages/Auth";
import AdminVerifyLogs from "./pages/AdminVerifyLogs";
import Notifications from "./pages/Notifications";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import ReportIssue from "./pages/ReportIssue";
import ContactPOC from "./pages/ContactPOC";
import SecurityCompliance from "./pages/SecurityCompliance";
import NotFound from "./pages/NotFound";
import Missions from "./pages/Missions";
import MissionDetail from "./pages/MissionDetail";
import Rankings from "./pages/Rankings";
import Scoring from "./pages/Scoring";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import RegistrationConfirmed from "./pages/RegistrationConfirmed";
import ProgressTracker from "./pages/ProgressTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
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
              <Route path="/auth" element={<Auth />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
