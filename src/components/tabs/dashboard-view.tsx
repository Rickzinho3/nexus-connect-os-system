"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Smartphone, Wrench, FileCheck, CheckCircle, TrendingUp, TrendingDown, Badge } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Import the new KPI components requested
import { ProgressKPI1 } from "@/components/progress-kpi-01";
import { KPI1 } from "@/components/kpi-01";
import { ProgressKPI3 } from "@/components/progress-kpi-03";
import { ProgressKPI2 } from "@/components/progress-kpi-02";
import { getServiceOrders, getSales, getClients, getGoals, updateGoal, getFinancialTransactions } from "@/app/actions";

export function DashboardView() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live Stats States
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [completedRepairs, setCompletedRepairs] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [faturamentoMeta, setFaturamentoMeta] = useState<{target: number, percent: number}>({ target: 10000, percent: 0 });

  const [progressBarsOS, setProgressBarsOS] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [orders, sales, clients, txs, goalsData] = await Promise.all([
        getServiceOrders(),
        getSales(),
        getClients(),
        getFinancialTransactions(),
        getGoals(),
      ]);

      // 1. Calculate faturamento from transactions
      const paidTxs = txs.filter((t: any) => t.status === "Pago");
      const total = paidTxs.filter((t: any) => t.type === "Receita").reduce((sum: number, t: any) => sum + t.amount, 0);
      setTotalRevenue(total);

      // 2. Ticket Medio
      const ticket = total / ((orders.length + sales.length) || 1);
      setTicketMedio(ticket);

      // Fetch and sync goals
      const fatGoal = goalsData.find((g: any) => g.name.toLowerCase().includes("faturamento") || g.category.toLowerCase().includes("financeiro"));
      
      let targetFat = 10000;
      let percentFat = 0;
      if (fatGoal) {
        targetFat = fatGoal.target;
        percentFat = Math.min(Math.round((total / targetFat) * 100), 100);
        
        // auto-update the current progress of the goal
        if (fatGoal.current !== total) {
          await updateGoal(fatGoal.id, {
            name: fatGoal.name,
            category: fatGoal.category,
            target: fatGoal.target,
            current: total,
            unit: fatGoal.unit,
            deadline: fatGoal.deadline,
          });
        }
      } else {
        percentFat = Math.min(Math.round((total / targetFat) * 100), 100);
      }
      setFaturamentoMeta({ target: targetFat, percent: percentFat });

      // 3. Completed repairs
      const completed = orders.filter(o => o.status === "Concluído");
      setCompletedRepairs(completed.length);
      setTotalOrders(orders.length);

      // 4. Progress bars for status
      const totalCount = orders.length || 1;
      const concPercent = Math.round((completed.length / totalCount) * 100);
      const andPercent = Math.round((orders.filter(o => o.status === "Em Andamento").length / totalCount) * 100);
      const pendPercent = Math.round((orders.filter(o => o.status === "Pendente").length / totalCount) * 100);

      setProgressBarsOS([
        {
          label: "Concluídos",
          target: `${completed.length} aparelhos`,
          percentage: concPercent,
          fillClassName: "bg-slate-900",
        },
        {
          label: "Em Andamento",
          target: `${orders.filter(o => o.status === "Em Andamento").length} aparelhos`,
          percentage: andPercent,
          fillClassName: "bg-slate-500",
        },
        {
          label: "Aguardando Peça / Pendente",
          target: `${orders.filter(o => o.status === "Pendente").length} aparelhos`,
          percentage: pendPercent,
          fillClassName: "bg-slate-300",
        },
      ]);

      // 5. Recent activities
      const activities: any[] = [];
      orders.slice(0, 2).forEach((o, i) => {
        activities.push({
          id: `ord-${i}`,
          type: "order",
          text: `Ordem de Serviço ${o.id} registrada`,
          detail: `Cliente: ${o.client} - Aparelho: ${o.device} (${o.serviceType})`,
          time: "Hoje",
        });
      });

      clients.slice(0, 1).forEach((c, i) => {
        activities.push({
          id: `cli-${i}`,
          type: "client",
          text: `Cliente ${c.name} cadastrado`,
          detail: `Código de acesso gerado: ${c.accessCode}`,
          time: "Hoje",
        });
      });

      setRecentActivities(activities);

      // 6. Generate monthly finance chart data from actual transactions
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const currentYear = new Date().getFullYear();
      
      const groupedMonthly = months.map((month, idx) => {
        const monthTxs = paidTxs.filter((t: any) => {
          const parts = t.date.split("/");
          if (parts.length !== 3) return false;
          const txDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          return txDate.getMonth() === idx && txDate.getFullYear() === currentYear;
        });

        const faturamento = monthTxs.filter((t: any) => t.type === "Receita").reduce((sum: number, t: any) => sum + t.amount, 0);
        const despesas = monthTxs.filter((t: any) => t.type === "Despesa").reduce((sum: number, t: any) => sum + t.amount, 0);

        return { name: month, Faturamento: faturamento, CustosPeças: despesas };
      });

      const currentMonthIdx = new Date().getMonth();
      // Show at least 5 months back, up to current month
      const lastSixMonths = groupedMonthly.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1);
      setFinanceData(lastSixMonths);

    } catch (err) {
      console.error("Erro ao carregar dados do painel:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const dashboardChartConfig = {
    Faturamento: { label: "Faturamento", color: "var(--chart-2)" },
    CustosPeças: { label: "Custos & Peças", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h1>
        <p className="text-sm text-slate-500">
          Painel de controle corporativo da assistência técnica de eletrônicos.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400 font-medium">
          Carregando métricas da dashboard...
        </div>
      ) : (
        <>
          {/* Modern KPI Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: Faturamento Mensal (Progress KPI 1) */}
            <ProgressKPI1
              title="Faturamento Mensal"
              value={totalRevenue}
              trend={12.5}
              percentage={faturamentoMeta.percent}
              target={faturamentoMeta.target}
              formatter={formatCurrency}
            />

            {/* KPI 2: Ticket Médio (KPI 1) */}
            <KPI1
              title="Ticket Médio / Serviço"
              value={ticketMedio}
              trend={4.8}
              formatter={formatCurrency}
            />

            {/* KPI 3: Reparos Concluídos (Progress KPI 3) */}
            <ProgressKPI3
              title="Reparos Concluídos"
              current={completedRepairs}
              goal={totalOrders > 0 ? totalOrders : 10}
              unit="aparelhos"
            />

            {/* KPI 4: Status das O.S. (Progress KPI 2) */}
            <ProgressKPI2
              title="Status das O.S. (Hoje)"
              value={totalOrders}
              progressBars={progressBarsOS}
            />
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-7">
            {/* ReUI style Area Chart */}
            <Card className="lg:col-span-4 border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-950">Desempenho Financeiro</CardTitle>
                  <CardDescription>Receitas mensais brutas versus custos de insumos/peças de reposição</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ChartContainer config={dashboardChartConfig} className="w-full h-full">
                  <AreaChart data={financeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="colorCustos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                      </linearGradient>
                      <pattern
                        id="dashboard-stripe-pattern"
                        patternUnits="userSpaceOnUse"
                        width="6"
                        height="6"
                      >
                        <path
                          d="M0,6 L6,0"
                          stroke="currentColor"
                          strokeWidth="0.8"
                          className="text-slate-950/10"
                        />
                      </pattern>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          className="min-w-40 rounded-xl bg-slate-950 text-white p-3 border-none"
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-4 text-xs font-semibold text-slate-300">
                              <span>{name === "Faturamento" ? "Receitas:" : "Despesas:"}</span>
                              <span className="text-white font-bold">R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Area
                      type="natural"
                      dataKey="Faturamento"
                      stroke="var(--chart-2)"
                      strokeWidth={2.5}
                      fill="url(#colorFaturamento)"
                    />
                    <Area
                      type="natural"
                      dataKey="CustosPeças"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#colorCustos)"
                    />
                    {/* Pattern Overlay on faturamento to create a premium feel */}
                    <Area
                      type="natural"
                      dataKey="Faturamento"
                      fill="url(#dashboard-stripe-pattern)"
                      stroke="none"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-955">Movimentações e Atividades</CardTitle>
                <CardDescription>Eventos recentes cadastrados no banco de dados.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-900 border border-slate-200 mt-0.5 shrink-0">
                        {act.type === "order" ? (
                          <Wrench className="w-4 h-4" />
                        ) : act.type === "client" ? (
                          <CheckCircle className="w-4 h-4 text-slate-700" />
                        ) : (
                          <Bell className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 leading-snug">{act.text}</p>
                        <p className="text-[11px] text-slate-500">{act.detail}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{act.time}</p>
                      </div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium text-center py-6">Sem atividades recentes.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
