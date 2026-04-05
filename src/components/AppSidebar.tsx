import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ClipboardList,
  BarChart3,
  Settings,
  ShoppingCart,
  Users,
  DollarSign,
  FileText,
  Monitor,
  Flame,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "PDV Balcão", url: "/pdv", icon: Monitor },
  { title: "Fornadas", url: "/cozinha", icon: Flame },
];

const salesItems = [
  { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
  { title: "Clientes", url: "/clientes", icon: Users },
];

const operationItems = [
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Estoque", url: "/estoque", icon: Warehouse },
  { title: "Entradas", url: "/entradas", icon: ArrowDownToLine },
  { title: "Saídas", url: "/saidas", icon: ArrowUpFromLine },
  { title: "Ordens de Produção", url: "/ordens", icon: ClipboardList },
];

const financialItems = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Notas Fiscais", url: "/notas", icon: FileText },
];

const managementItems = [
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

function MenuGroup({ label, items }: { label: string; items: typeof mainItems }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-muted uppercase text-[10px] tracking-widest font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <Warehouse className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-black text-sm text-sidebar-primary tracking-tight leading-none uppercase">Food Control</h1>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <MenuGroup label="Principal" items={mainItems} />
        <MenuGroup label="Vendas" items={salesItems} />
        <MenuGroup label="Produção & Estoque" items={operationItems} />
        <MenuGroup label="Financeiro" items={financialItems} />
        <MenuGroup label="Gestão" items={managementItems} />
      </SidebarContent>
    </Sidebar>
  );
}
