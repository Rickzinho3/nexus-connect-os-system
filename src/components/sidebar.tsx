"use client";

import React from "react";
import {
  BarChart2,
  LayoutGrid,
  Target,
  Wrench,
  FileText,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  Landmark,
  BarChart3,
  UserCheck,
  Settings,
  X,
  Compass,
  Building2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export type TabId =
  | "dashboard"
  | "metas"
  | "os"
  | "orcamentos"
  | "clientes"
  | "pecas"
  | "estoque"
  | "vendas"
  | "financeiro"
  | "caixa"
  | "relatorios"
  | "funcionarios"
  | "configuracoes"
  | "guia"
  | "empresas";

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  closeMobile: () => void;
  tenantName?: string;
}

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  isMobileOpen,
  closeMobile,
  tenantName,
}: SidebarProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Atendente";
  const userName = session?.user?.name || "Usuário";

  const menuGroups: MenuGroup[] = [
    {
      title: "Gestão",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
        { id: "metas", label: "Metas", icon: Target },
        { id: "os", label: "Ordens de Serviço", icon: Wrench },
        { id: "orcamentos", label: "Orçamentos", icon: FileText },
      ],
    },
    {
      title: "Comercial",
      items: [
        { id: "clientes", label: "Clientes", icon: Users },
        { id: "pecas", label: "Peças", icon: Package },
        { id: "estoque", label: "Estoque", icon: Boxes },
        { id: "vendas", label: "Vendas", icon: ShoppingCart },
      ],
    },
  ];

  // Restrict Financeiro to Dono or Super Admin
  if (role === "Dono" || role === "Super Admin") {
    menuGroups.push({
      title: "Financeiro",
      items: [
        { id: "financeiro", label: "Financeiro", icon: Wallet },
        { id: "caixa", label: "Caixa", icon: Landmark },
        { id: "relatorios", label: "Relatórios", icon: BarChart3 },
      ],
    });
  } else {
    // Atendente só vê caixa
    menuGroups.push({
      title: "Financeiro",
      items: [
        { id: "caixa", label: "Caixa", icon: Landmark },
      ],
    });
  }

  menuGroups.push({
    title: "Suporte",
    items: [
      { id: "guia", label: "Guia do Portal", icon: Compass },
    ],
  });

  const adminGroup: MenuGroup | null =
    role === "Super Admin"
      ? {
          title: "Sistema (Admin)",
          items: [
            { id: "empresas", label: "Empresas", icon: Building2 },
            { id: "funcionarios", label: "Funcionários", icon: UserCheck },
            { id: "configuracoes", label: "Configurações", icon: Settings },
          ],
        }
      : role === "Dono"
      ? {
          title: "Administração",
          items: [
            { id: "funcionarios", label: "Funcionários", icon: UserCheck },
            { id: "configuracoes", label: "Configurações", icon: Settings },
          ],
        }
      : null;

  const renderGroup = (group: MenuGroup) => (
    <div key={group.title} className="mb-5">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-xs font-medium tracking-wider text-slate-500 uppercase">
          {group.title}
        </h3>
      )}
      <div className="space-y-1">
        {group.items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) {
                  closeMobile();
                }
              }}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center w-full py-2 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer gap-3 group text-left",
                isCollapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors duration-150",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 h-full flex flex-col justify-between py-6 bg-[#0c0b14] select-none text-slate-300 overflow-y-auto shrink-0 border-r border-slate-800/40 transition-all duration-300 no-scrollbar",
          isCollapsed ? "w-20 px-2" : "w-64 px-4",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div>
          {/* Top Header / Logo */}
          <div
            className={cn(
              "flex items-center mb-8",
              isCollapsed ? "justify-center" : "justify-between px-3"
            )}
          >
            <div className="flex items-center gap-3">
              {/* <BarChart2 className="w-6 h-6 text-white shrink-0" /> */}
              {!isCollapsed && (
                <span className="text-lg font-bold tracking-wide truncate">{tenantName || "Empresa"}</span>
              )}
            </div>
            {!isCollapsed && (
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden text-slate-400 hover:text-white hover:bg-white/10 w-8 h-8 rounded-lg"
                onClick={closeMobile}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Dynamic Groups */}
          <nav className="space-y-6">
            {menuGroups.map(renderGroup)}
            {adminGroup && renderGroup(adminGroup)}
          </nav>
        </div>

        {/* User Profile / Logout */}
        <div className="mt-8 pt-4 border-t border-slate-800/50 px-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-zinc-300 shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium text-slate-200 truncate">{userName}</div>
                  <div className="text-xs text-slate-500 truncate">{role}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-zinc-300" title={userName}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
