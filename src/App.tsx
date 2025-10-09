import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import PostItem from "./pages/PostItem";
import Browse from "./pages/Browse";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import BecomeFixer from "./pages/BecomeFixer";
import ItemDetail from "./pages/ItemDetail";
import Messages from "./pages/Messages";
import FixerProfile from "./pages/FixerProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/post" element={<PostItem />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/fixer/:userId" element={<FixerProfile />} />
            <Route path="/become-fixer" element={<BecomeFixer />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
