import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/leaderboard/units" element={<LeaderboardUnits />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/history" element={<WorkoutHistory />} />
            <Route path="/profile/settings" element={<ProfileSettings />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/verify-logs" element={<AdminVerifyLogs />} />
            <Route path="/notifications" element={<Notifications />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
