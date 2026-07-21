"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Smartphone,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getServiceOrders, getClients, getFinancialTransactions, getGoals } from "@/app/actions";
import { NumberTicker } from "@/components/motion/number-ticker";
import { AnimatedNumber } from "@/components/animated-number";

type FilterPeriod = "Day" | "Week" | "Month" | "Year";

export function DashboardView() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FilterPeriod>("Month");

  // Filtered Metrics
  const [metrics, setMetrics] = useState({
    revCurr: 0,
    revTrend: 0,
    osCurr: 0,
    osTrend: 0,
    cliCurr: 0,
    cliTrend: 0,
    concCurr: 0,
    concTrend: 0,
    compRateCurr: 0,
    compRateTrend: 0,
    fatTargetCurr: 0,
    fatPercentCurr: 0,
  });

  const [financeData, setFinanceData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dateRangeStr, setDateRangeStr] = useState("");

  const parseDate = (dateVal: any) => {
    // Format is usually DD/MM/YYYY
    if (!dateVal) return new Date();
    if (typeof dateVal !== "string") {
      if (dateVal instanceof Date) return dateVal;
      if (typeof dateVal === "number") return new Date(dateVal);
      dateVal = String(dateVal);
    }
    const parts = dateVal.split(" ")[0].split("/");
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    if (dateVal.includes("-")) {
      return new Date(dateVal);
    }
    return new Date();
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [orders, clients, txs, goalsData] = await Promise.all([
        getServiceOrders(),
        getClients(),
        getFinancialTransactions(),
        getGoals(),
      ]);

      const now = new Date();
      let currentStart = new Date();
      let previousStart = new Date();
      let previousEnd = new Date();

      if (period === "Day") {
        currentStart.setHours(0, 0, 0, 0);
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);
        previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(-1);
      } else if (period === "Week") {
        currentStart.setDate(now.getDate() - 7);
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(-1);
      } else if (period === "Month") {
        currentStart.setDate(1);
        currentStart.setHours(0, 0, 0, 0);
        previousStart = new Date(currentStart);
        previousStart.setMonth(previousStart.getMonth() - 1);
        previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(-1);
      } else if (period === "Year") {
        currentStart.setMonth(0, 1);
        currentStart.setHours(0, 0, 0, 0);
        previousStart = new Date(currentStart);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(-1);
      }

      const isCurrent = (d: Date) => d >= currentStart && d <= now;
      const isPrevious = (d: Date) => d >= previousStart && d <= previousEnd;

      // Update Date Range Display
      const formatObj = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });
      setDateRangeStr(`${formatObj.format(currentStart)} - ${formatObj.format(now)}`);

      // 1. Revenue Metrics
      let revCurr = 0, revPrev = 0;
      txs.filter((t: any) => t.status === "Pago" && t.type === "Receita").forEach((t: any) => {
        const d = parseDate(t.date);
        if (isCurrent(d)) revCurr += parseFloat(t.amount);
        else if (isPrevious(d)) revPrev += parseFloat(t.amount);
      });

      // 2. Orders Metrics (Active/New)
      let osCurr = 0, osPrev = 0;
      let concCurr = 0, concPrev = 0;
      orders.forEach((o: any) => {
        const d = parseDate(o.date);
        if (isCurrent(d)) {
          osCurr++;
          if (o.status === "Concluído") concCurr++;
        } else if (isPrevious(d)) {
          osPrev++;
          if (o.status === "Concluído") concPrev++;
        }
      });

      // 3. New Clients Metrics
      let cliCurr = 0, cliPrev = 0;
      clients.forEach((c: any) => {
        const d = parseDate(c.createdAt || "");
        if (isCurrent(d)) cliCurr++;
        else if (isPrevious(d)) cliPrev++;
      });

      const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      const compRateCurr = osCurr > 0 ? (concCurr / osCurr) * 100 : 0;
      const compRatePrev = osPrev > 0 ? (concPrev / osPrev) * 100 : 0;

      // Faturamento Goal Progress
      const fatGoal = goalsData.find((g: any) => g.name.toLowerCase().includes("faturamento") || g.category.toLowerCase().includes("financeiro"));
      let fatTargetCurr = 0;
      let fatPercentCurr = 0;
      if (fatGoal) {
        fatTargetCurr = fatGoal.target;
        fatPercentCurr = Math.min(Math.round((revCurr / fatTargetCurr) * 100), 100);
      }

      setMetrics({
        revCurr,
        revTrend: calcTrend(revCurr, revPrev),
        osCurr,
        osTrend: calcTrend(osCurr, osPrev),
        cliCurr,
        cliTrend: calcTrend(cliCurr, cliPrev),
        concCurr,
        concTrend: calcTrend(concCurr, concPrev),
        compRateCurr,
        compRateTrend: compRateCurr - compRatePrev, // Absolute % points diff
        fatTargetCurr,
        fatPercentCurr,
      });

      // Fetch Recent Orders Table
      setRecentOrders(orders.slice(0, 5));

      // Bar Chart Monthly Evolution
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const currentYear = now.getFullYear();
      const groupedMonthly = months.map((month, idx) => {
        const monthTxs = txs.filter((t: any) => t.status === "Pago" && t.type === "Receita");
        const monthTotal = monthTxs.reduce((sum: number, t: any) => {
          const d = parseDate(t.date);
          if (d.getMonth() === idx && d.getFullYear() === currentYear) {
            return sum + parseFloat(t.amount);
          }
          return sum;
        }, 0);
        return { name: month, Total: monthTotal };
      });
      const currentMonthIdx = now.getMonth();
      const lastSixMonths = groupedMonthly.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1);
      setFinanceData(lastSixMonths);

    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [period]); // Reload metrics based on selected period

  const dashboardChartConfig = {
    Total: { label: "Revenue", color: "#27272a" },
  } satisfies ChartConfig;

  if (!mounted) return null;

  return (
    <div className="font-sans max-w-[1400px] mx-auto space-y-8 pb-8">
      {/* Top Header Row with Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-medium tracking-tight text-slate-900">Visão Geral</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100/80 p-1 rounded-full gap-2 shadow-inner border border-slate-200/60">
            {["Day", "Week", "Month", "Year"].map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p as FilterPeriod)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer duration-300 ${
                  period === p 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                {p === "Day" ? "Dia" : p === "Week" ? "Semana" : p === "Month" ? "Mês" : "Ano"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            {dateRangeStr}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-medium animate-pulse">
          Calculando métricas...
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Revenue (Dark) */}
            <Card className="bg-[#1c1c1e] text-white rounded-[24px] border-none shadow-xl relative overflow-hidden flex flex-col justify-between">
              <CardContent className="p-6 h-full flex flex-col justify-between z-10 space-y-6">
                <p className="text-slate-400 text-[13px] font-medium tracking-wide">Faturamento Total</p>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight flex items-center">
                    R$&nbsp;<NumberTicker value={metrics.revCurr} format={(v) => v.toLocaleString("pt-BR")} blur />
                  </h2>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      {metrics.revTrend >= 0 ? (
                        <span className="text-[#4ade80] flex items-center bg-[#4ade80]/10 px-1.5 py-0.5 rounded">
                          <TrendingUp className="w-3.5 h-3.5 mr-1"/> {metrics.revTrend.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center bg-rose-400/10 px-1.5 py-0.5 rounded">
                          <TrendingDown className="w-3.5 h-3.5 mr-1"/> {Math.abs(metrics.revTrend).toFixed(1)}%
                        </span>
                      )}
                      <span className="text-slate-400 font-medium">do período anterior</span>
                    </div>
                    {metrics.fatTargetCurr > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold tracking-wide">
                          <span>META DE FATURAMENTO</span>
                          <span className="text-white">{metrics.fatPercentCurr}% de R$ {metrics.fatTargetCurr.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${metrics.fatPercentCurr >= 100 ? 'bg-emerald-400' : 'bg-blue-400'}`} 
                            style={{ width: `${metrics.fatPercentCurr}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              {/* Subtle Gradient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            </Card>

            {/* Card 2: Active Orders */}
            <Card className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <CardContent className="p-6 h-full flex flex-col justify-between space-y-6">
                <p className="text-slate-500 text-[13px] font-medium tracking-wide">Ordens Registradas</p>
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                    <NumberTicker value={metrics.osCurr} format={(v) => v.toLocaleString("pt-BR")} blur />
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    {metrics.osTrend >= 0 ? (
                      <span className="text-emerald-500 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                        <TrendingUp className="w-3.5 h-3.5 mr-1"/> {metrics.osTrend.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                        <TrendingDown className="w-3.5 h-3.5 mr-1"/> {Math.abs(metrics.osTrend).toFixed(1)}%
                      </span>
                    )}
                    <span className="text-slate-400 font-medium">do período anterior</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: New Clients */}
            <Card className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <CardContent className="p-6 h-full flex flex-col justify-between space-y-6">
                <p className="text-slate-500 text-[13px] font-medium tracking-wide">Novos Clientes</p>
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                    <NumberTicker value={metrics.cliCurr} format={(v) => v.toLocaleString("pt-BR")} blur />
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    {metrics.cliTrend >= 0 ? (
                      <span className="text-emerald-500 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                        <TrendingUp className="w-3.5 h-3.5 mr-1"/> {metrics.cliTrend.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                        <TrendingDown className="w-3.5 h-3.5 mr-1"/> {Math.abs(metrics.cliTrend).toFixed(1)}%
                      </span>
                    )}
                    <span className="text-slate-400 font-medium">do período anterior</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Completed OS */}
            <Card className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <CardContent className="p-6 h-full flex flex-col justify-between space-y-6">
                <p className="text-slate-500 text-[13px] font-medium tracking-wide">O.S. Concluídas</p>
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                    <NumberTicker value={metrics.concCurr} format={(v) => v.toLocaleString("pt-BR")} blur />
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    {metrics.concTrend >= 0 ? (
                      <span className="text-emerald-500 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                        <TrendingUp className="w-3.5 h-3.5 mr-1"/> {metrics.concTrend.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                        <TrendingDown className="w-3.5 h-3.5 mr-1"/> {Math.abs(metrics.concTrend).toFixed(1)}%
                      </span>
                    )}
                    <span className="text-slate-400 font-medium">do período anterior</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3 items-stretch">
            {/* Main Bar Chart */}
            <Card className="lg:col-span-2 bg-white rounded-[24px] border border-slate-100 shadow-sm h-[320px] flex flex-col">
              <CardHeader className="pb-2 pt-6 px-6">
                <div className="flex justify-between items-center w-full">
                  <CardTitle className="text-[15px] font-medium text-slate-900">Faturamento Bruto</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreHorizontal className="w-4 h-4 text-slate-400" /></Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4 px-2">
                <ChartContainer config={dashboardChartConfig} className="w-full h-full min-h-[200px]">
                  <BarChart data={financeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={38}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`} 
                    />
                    <ChartTooltip
                      cursor={{fill: '#f8fafc'}}
                      content={
                        <ChartTooltipContent
                          className="min-w-32 rounded-xl bg-[#1c1c1e] text-white p-3 border-none shadow-xl"
                          formatter={(value) => (
                            <div className="flex w-full items-center justify-between gap-3 text-xs font-semibold text-slate-300">
                              <span className="text-white font-bold">R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="Total"
                      fill="#27272a"
                      radius={[8, 8, 8, 8]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Circular Rate Widget */}
            <Card className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col h-[320px]">
              <CardHeader className="pb-0 pt-6 px-6">
                <div className="flex justify-between items-center w-full">
                  <CardTitle className="text-[15px] font-medium text-slate-900 text-center w-full">Taxa de Conclusão</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle 
                      cx="72" cy="72" r="60" 
                      stroke="#27272a" strokeWidth="12" fill="none" 
                      strokeDasharray={`${2 * Math.PI * 60}`} 
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - metrics.compRateCurr / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-slate-900">
                      <AnimatedNumber value={metrics.compRateCurr} formatter={(v) => `${Math.round(v)}%`} />
                    </span>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  {metrics.compRateTrend >= 0 ? (
                    <span className="text-emerald-500 flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-1"/> +{metrics.compRateTrend.toFixed(1)}%</span>
                  ) : (
                    <span className="text-rose-500 flex items-center"><TrendingDown className="w-3.5 h-3.5 mr-1"/> {metrics.compRateTrend.toFixed(1)}%</span>
                  )}
                  <span>do período anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Table Row */}
          <Card className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-[15px] font-bold text-slate-900">Últimas Ordens de Serviço</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100" onClick={loadDashboardData}>
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100">
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader className="bg-white">
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-400 py-4 px-6 h-auto">Aparelho</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 py-4 h-auto">Cliente</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 py-4 h-auto">ID da OS</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 py-4 h-auto text-right">Valor</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 py-4 px-6 h-auto text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map(order => (
                  <TableRow key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-900 text-sm py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Smartphone className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">{order.deviceName}</span>
                          <span className="text-xs text-slate-500 font-medium">{order.serviceType}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium text-sm">{order.client}</TableCell>
                    <TableCell className="text-slate-500 font-semibold text-xs">#{order.id}</TableCell>
                    <TableCell className="text-slate-900 font-bold text-sm text-right">
                      R$ {parseFloat(order.value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <Badge className={`rounded-full px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider ${
                        order.status === "Concluído" 
                        ? "bg-slate-500 text-white hover:bg-slate-600" 
                        : order.status === "Em Andamento" 
                        ? "bg-slate-200 text-slate-800 hover:bg-slate-300" 
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}>
                        {order.status === "Concluído" ? "Finalizado" : order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-sm font-medium">
                      Nenhuma O.S. encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
