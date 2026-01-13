import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DynamicAdaptationProvider } from "@/contexts/DynamicAdaptationContext";
import { LayoutModeProvider } from "@/contexts/LayoutModeContext";
import { AIProvider } from "@/contexts/AIContext";
import CodeEditor from "@/pages/CodeEditor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CodeEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicAdaptationProvider>
        <LayoutModeProvider>
          <AIProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AIProvider>
        </LayoutModeProvider>
      </DynamicAdaptationProvider>
    </QueryClientProvider>
  );
}

export default App;
