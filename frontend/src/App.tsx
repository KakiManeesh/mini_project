import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RegionProvider } from "@/hooks/use-region";
import { LanguageProvider } from "@/hooks/use-language";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const categories = [
  "technology",
  "business",
  "entertainment",
  "health",
  "science",
  "sports",
  "general",
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <RegionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Category Routes */}
              {categories.map((category) => (
                <Route
                  key={category}
                  path={`/${category}`}
                  element={<CategoryPage category={category} />}
                />
              ))}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RegionProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
