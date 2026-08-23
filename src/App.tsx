import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { BiometricGate } from "@/components/BiometricGate";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const ExpenseTracking = lazy(() => import("./pages/guides/ExpenseTracking"));
const Budgeting = lazy(() => import("./pages/guides/Budgeting"));
const Reports = lazy(() => import("./pages/guides/Reports"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Install = lazy(() => import("./pages/Install"));
const SharedReport = lazy(() => import("./pages/SharedReport"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const Legal = lazy(() => import("./pages/Legal"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <OfflineIndicator />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SidebarProvider defaultOpen={false}>
              <BiometricGate>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/install" element={<Install />} />
                    <Route path="/shared/:token" element={<SharedReport />} />
                    <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                    <Route path="/privacy" element={<Legal variant="privacy" />} />
                    <Route path="/terms" element={<Legal variant="terms" />} />
                    <Route path="/urmarirea-cheltuielilor" element={<ExpenseTracking />} />
                    <Route path="/bugete-personale" element={<Budgeting />} />
                    <Route path="/rapoarte-financiare" element={<Reports />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BiometricGate>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
