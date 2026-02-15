import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Trips from "./pages/Trips";
import BookTrip from "./pages/BookTrip";
import Payment from "./pages/Payment";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import PublicTrip from "./pages/PublicTrip";
import Profile from "./pages/Profile";
import ApplyOrganizer from "./pages/ApplyOrganizer";
import SubmitDamageClaim from "./pages/SubmitDamageClaim";
import FAQ from "./pages/FAQ";
import HowItWorks from "./pages/HowItWorks";
import TravelSafe from "./pages/TravelSafe";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import BusGroups from "./pages/organizer/BusGroups";
import OrganizerTrips from "./pages/organizer/OrganizerTrips";
import OrganizerBookings from "./pages/organizer/OrganizerBookings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TripApprovals from "./pages/admin/TripApprovals";
import OrganizerApplications from "./pages/admin/OrganizerApplications";
import UserManagement from "./pages/admin/UserManagement";
import Announcements from "./pages/admin/Announcements";
import Representatives from "./pages/admin/Representatives";
import Reports from "./pages/admin/Reports";
import LuggageTags from "./pages/admin/LuggageTags";
import DamageClaims from "./pages/admin/DamageClaims";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/book/:tripId" element={<BookTrip />} />
            <Route path="/payment/:bookingId" element={<Payment />} />
            <Route path="/booking-confirmation/:bookingId" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
            <Route path="/trip/:shareId" element={<PublicTrip />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/apply-organizer" element={<ProtectedRoute><ApplyOrganizer /></ProtectedRoute>} />
            <Route path="/submit-claim" element={<ProtectedRoute><SubmitDamageClaim /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            {/* Info Pages */}
            <Route path="/faq" element={<FAQ />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/travel-safe" element={<TravelSafe />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* Organizer Routes - Protected */}
            <Route path="/organizer" element={<ProtectedRoute requiredRole="organizer"><OrganizerDashboard /></ProtectedRoute>} />
            <Route path="/organizer/bus-groups" element={<ProtectedRoute requiredRole="organizer"><BusGroups /></ProtectedRoute>} />
            <Route path="/organizer/trips" element={<ProtectedRoute requiredRole="organizer"><OrganizerTrips /></ProtectedRoute>} />
            <Route path="/organizer/bookings" element={<ProtectedRoute requiredRole="organizer"><OrganizerBookings /></ProtectedRoute>} />
            {/* Admin Routes - Protected */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="approvals"><TripApprovals /></ProtectedRoute>} />
            <Route path="/admin/organizer-applications" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="organizer_applications"><OrganizerApplications /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="users"><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="announcements"><Announcements /></ProtectedRoute>} />
            <Route path="/admin/representatives" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="representatives"><Representatives /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="reports"><Reports /></ProtectedRoute>} />
            <Route path="/admin/luggage-tags" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="luggage_tags"><LuggageTags /></ProtectedRoute>} />
            <Route path="/admin/damage-claims" element={<ProtectedRoute requiredRole="admin" requiredAdminSection="damage_claims"><DamageClaims /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;



