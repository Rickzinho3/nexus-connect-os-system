"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, TabId } from "@/components/sidebar";
import { DashboardView } from "@/components/tabs/dashboard-view";
import { MetasView } from "@/components/tabs/metas-view";
import { OSView } from "@/components/tabs/os-view";
import { OrcamentosView } from "@/components/tabs/orcamentos-view";
import { ClientesView } from "@/components/tabs/clientes-view";
import { PecasView } from "@/components/tabs/pecas-view";
import { EstoqueView } from "@/components/tabs/estoque-view";
import { VendasView } from "@/components/tabs/vendas-view";
import { FinanceiroView } from "@/components/tabs/financeiro-view";
import { CaixaView } from "@/components/tabs/caixa-view";
import { RelatoriosView } from "@/components/tabs/relatorios-view";
import { FuncionariosView } from "@/components/tabs/funcionarios-view";
import { ConfiguracoesView } from "@/components/tabs/configuracoes-view";
import { GuiaView } from "@/components/tabs/guia-view";
import { EmpresasView } from "@/components/tabs/empresas-view";
import { seedInitialDatabase } from "@/app/actions";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Seed initial database data once on mount if empty
    seedInitialDatabase();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "metas":
        return <MetasView />;
      case "os":
        return <OSView />;
      case "orcamentos":
        return <OrcamentosView />;
      case "clientes":
        return <ClientesView />;
      case "pecas":
        return <PecasView />;
      case "estoque":
        return <EstoqueView />;
      case "vendas":
        return <VendasView />;
      case "financeiro":
        return <FinanceiroView />;
      case "caixa":
        return <CaixaView />;
      case "relatorios":
        return <RelatoriosView />;
      case "funcionarios":
        return <FuncionariosView />;
      case "configuracoes":
        return <ConfiguracoesView />;
      case "guia":
        return <GuiaView />;
      case "empresas":
        return <EmpresasView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex w-screen h-screen bg-[#0c0b14] overflow-hidden select-none font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Floating Canvas Content Container */}
      <main className="flex-1 h-full py-2 px-2 md:py-4 md:pr-4 md:pl-0 flex flex-col min-w-0">
        <div className="flex-1 bg-white rounded-2xl md:rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-slate-800/40 relative">
          
          {/* Top Header Bar for Sidebar Toggling */}
          <header className="h-14 md:h-16 shrink-0 border-b border-slate-100 flex items-center px-4 md:px-6 bg-white/50 backdrop-blur sticky top-0 z-10">
            {/* Mobile Menu Button */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 -ml-2 mr-2"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Desktop Collapse Button */}
            <Button
              size="icon"
              variant="ghost"
              className="hidden md:flex w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 -ml-2 mr-2"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </Button>
            
            <h2 className="font-bold text-slate-900 tracking-tight capitalize hidden sm:block">
              {activeTab === "os"
                ? "Ordens de Serviço"
                : activeTab === "guia"
                ? "Guia do Portal"
                : activeTab}
            </h2>
          </header>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-200">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
