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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  | "configuracoes";

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  closeMobile: () => void;
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
}: SidebarProps) {
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
    {
      title: "Financeiro",
      items: [
        { id: "financeiro", label: "Financeiro", icon: Wallet },
        { id: "caixa", label: "Caixa", icon: Landmark },
        { id: "relatorios", label: "Relatórios", icon: BarChart3 },
      ],
    },
  ];

  const adminGroup: MenuGroup = {
    title: "Administração",
    items: [
      { id: "funcionarios", label: "Funcionários", icon: UserCheck },
      { id: "configuracoes", label: "Configurações", icon: Settings },
    ],
  };

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
                "flex items-center w-full py-2 text-sm font-medium rounded-lg transition-all duration-150 gap-3 group text-left",
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
          "fixed md:relative inset-y-0 left-0 z-50 h-full flex flex-col justify-between py-6 bg-[#0c0b14] select-none text-slate-300 overflow-y-auto shrink-0 border-r border-slate-800/40 transition-all duration-300",
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
              <BarChart2 className="w-6 h-6 text-white shrink-0" />
              {!isCollapsed && (
                <span className="text-lg font-bold tracking-wide truncate">Nexus Connect</span>
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
          <nav className="space-y-6">{menuGroups.map(renderGroup)}</nav>
        </div>

        {/* Admin Group pinned at the bottom */}
        <div className="mt-8">{renderGroup(adminGroup)}</div>
      </aside>
    </>
  );
}
