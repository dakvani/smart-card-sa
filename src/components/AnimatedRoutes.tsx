import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import { ScrollToTop } from "./ScrollToTop";
import { ScrollProgress } from "./ScrollProgress";
import { FloatingActionButton } from "./FloatingActionButton";
import { BackToTopButton } from "./BackToTopButton";
import Index from "@/pages/Index";

// Lazy-load all non-landing routes to shrink the initial JS bundle.
// Landing (Index) stays eager so the homepage LCP is not delayed by an
// extra chunk fetch on first paint.
const Auth = lazy(() => import("@/pages/Auth"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const SmartLinkBio = lazy(() => import("@/pages/SmartLinkBio"));
const Contact = lazy(() => import("@/pages/Contact"));
const NFCProducts = lazy(() => import("@/pages/NFCProducts"));
const OrderHistory = lazy(() => import("@/pages/OrderHistory"));
const AdminOrders = lazy(() => import("@/pages/AdminOrders"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Learn = lazy(() => import("@/pages/Learn"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const QRRedirect = lazy(() => import("@/pages/QRRedirect"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const MarketingUnsubscribe = lazy(() => import("@/pages/MarketingUnsubscribe"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const AdminLinks = lazy(() => import("@/pages/admin/AdminLinks"));
const AdminDesign = lazy(() => import("@/pages/admin/AdminDesign"));
const AdminQR = lazy(() => import("@/pages/admin/AdminQR"));
const AdminInsights = lazy(() => import("@/pages/admin/AdminInsights"));
const AdminBuilderSettings = lazy(() => import("@/pages/admin/AdminSettings"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
      <ScrollProgress />
      <ScrollToTop />
      <FloatingActionButton />
      <BackToTopButton />
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Index /></PageTransition>} />
            <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
            <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
            <Route path="/admin-login" element={<PageTransition><AdminLogin /></PageTransition>} />
            <Route path="/smartlink-bio" element={<PageTransition><SmartLinkBio /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            {/* Legacy routes redirect into the merged SmartLink Bio page */}
            <Route path="/pricing" element={<Navigate to="/smartlink-bio#pricing" replace />} />
            <Route path="/templates" element={<Navigate to="/smartlink-bio#templates" replace />} />
            <Route path="/products" element={<Navigate to="/smartlink-bio#features" replace />} />
            <Route path="/nfc-products" element={<PageTransition><NFCProducts /></PageTransition>} />
            <Route path="/order-history" element={<PageTransition><OrderHistory /></PageTransition>} />
            <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
            <Route path="/admin/orders" element={<PageTransition><AdminOrders /></PageTransition>} />
            <Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
            <Route path="/learn" element={<PageTransition><Learn /></PageTransition>} />
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
            <Route path="/~oauth/*" element={<Navigate to="/login" replace />} />
            <Route path="/unsubscribe" element={<PageTransition><Unsubscribe /></PageTransition>} />
            <Route path="/marketing-unsubscribe" element={<PageTransition><MarketingUnsubscribe /></PageTransition>} />
            <Route path="/qr/:username" element={<QRRedirect />} />
            <Route path="/:username" element={<PageTransition><PublicProfile /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  );
}
