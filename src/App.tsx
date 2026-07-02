import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { SkipLink } from "./components/accessibility/SkipLink";
import { KeyboardShortcutsHelp } from "./components/accessibility/KeyboardShortcuts";
import { FocusVisibilityManager } from "./components/accessibility/FocusRing";
import { LoadingScreen, shouldShowLoadingScreen } from "./components/LoadingScreen";
import { WelcomeEmailTrigger } from "./components/WelcomeEmailTrigger";
import { useTheme } from "./components/ThemeToggle";

const queryClient = new QueryClient();

const SiteThemeSync = () => {
  useTheme();
  return null;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(() => shouldShowLoadingScreen());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SiteThemeSync />
        <FocusVisibilityManager />
        <Toaster />
        <Sonner />
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
        <BrowserRouter>
          <SkipLink />
          <KeyboardShortcutsHelp />
          <WelcomeEmailTrigger />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
