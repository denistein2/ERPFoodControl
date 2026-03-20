import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import MaterialEntry from "./pages/MaterialEntry";
import StockMovement from "./pages/StockMovement";
import MaterialExit from "./pages/MaterialExit";
import ProductionOrders from "./pages/ProductionOrders";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Pedidos from "./pages/Pedidos";
import Clientes from "./pages/Clientes";
import Financeiro from "./pages/Financeiro";
import NotasFiscais from "./pages/NotasFiscais";
import PDVBalcao from "./pages/PDVBalcao";
import PainelCozinha from "./pages/PainelCozinha";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./pages/Profile";
import Security from "./pages/Security";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Help from "./pages/Help";
import Logout from "./pages/Logout";
import Home from "./pages/Home";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/security" element={<Security />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/estoque" element={<Stock />} />
            <Route path="/entradas" element={<MaterialEntry />} />
            <Route path="/movimentacoes" element={<StockMovement />} />
            <Route path="/saidas" element={<MaterialExit />} />
            <Route path="/ordens" element={<ProductionOrders />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/notas" element={<NotasFiscais />} />
            <Route path="/pdv" element={<PDVBalcao />} />
            <Route path="/cozinha" element={<PainelCozinha />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
