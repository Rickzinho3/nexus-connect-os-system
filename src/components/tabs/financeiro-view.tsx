"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedAmountInput } from "@/components/ui/animated-amount-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/motion/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Filter,
  UserCheck,
  PlusCircle
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Label } from "recharts";
import {
  getFinancialTransactions,
  addFinancialTransaction,
  payFinancialTransaction,
  deleteFinancialTransaction,
  getEmployees
} from "@/app/actions";
import { Tooltip } from "@/components/motion/tooltip";
import { toast } from "sonner";

interface Transaction {
  id: string;
  description: string;
  type: "Receita" | "Despesa";
  amount: number;
  category: string;
  status: "Pago" | "Pendente";
  dueDate?: string | null;
  paymentMethod?: string | null;
  responsible?: string | null;
  date: string;
  time: string;
}

type PeriodFilter = "hoje" | "7dias" | "30dias" | "mes" | "todos";

export function FinanceiroView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("30dias");

  // New Transaction Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"Receita" | "Despesa">("Receita");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Venda");
  const [status, setStatus] = useState<"Pago" | "Pendente">("Pago");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [responsible, setResponsible] = useState("");

  // Payment dialog state
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Transaction | null>(null);
  const [payMethod, setPayMethod] = useState("Pix");
  const [payResponsible, setPayResponsible] = useState("");

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txs, emps] = await Promise.all([
        getFinancialTransactions(),
        getEmployees(),
      ]);
      setTransactions(txs as any);
      setEmployees(emps.map(e => ({ id: e.id, name: e.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !responsible) return;

    try {
      await addFinancialTransaction({
        description: desc,
        type,
        amount: parseFloat(amount),
        category,
        status,
        dueDate: status === "Pendente" ? dueDate : undefined,
        paymentMethod: status === "Pago" ? paymentMethod : undefined,
        responsible,
      });

      // Reset
      setIsAddOpen(false);
      setDesc("");
      setAmount("");
      setDueDate("");
      setResponsible("");
      await loadData();
      toast.success("Transação criada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar transação");
    }
  };

  const handlePayTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget || !payResponsible) return;

    try {
      await payFinancialTransaction(payTarget.id, payMethod, payResponsible);
      setIsPayOpen(false);
      setPayTarget(null);
      setPayResponsible("");
      await loadData();
      toast.success("Pagamento registrado com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar pagamento");
    }
  };

  const handleDeleteClick = (tx: Transaction) => {
    setDeleteTarget(tx);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFinancialTransaction(deleteTarget.id);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await loadData();
      toast.success("Transação excluída com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir transação");
    }
  };

  // Filtering Logic
  const filterByPeriod = (txs: Transaction[]) => {
    const now = new Date();
    return txs.filter((tx) => {
      // Parse date format "DD/MM/YYYY"
      const parts = tx.date.split("/");
      if (parts.length !== 3) return true;
      const txDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));

      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === "hoje") {
        return txDate.toDateString() === now.toDateString();
      } else if (period === "7dias") {
        return diffDays <= 7;
      } else if (period === "30dias") {
        return diffDays <= 30;
      } else if (period === "mes") {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return true; // todos
    });
  };

  const filteredTransactions = filterByPeriod(transactions);

  // Computations (based on filtered transactions)
  const paidTransactions = filteredTransactions.filter(t => t.status === "Pago");
  const pendingTransactions = filteredTransactions.filter(t => t.status === "Pendente");

  const totalReceitas = paidTransactions.filter(t => t.type === "Receita").reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = paidTransactions.filter(t => t.type === "Despesa").reduce((sum, t) => sum + t.amount, 0);
  const lucro = totalReceitas - totalDespesas;

  const contasAReceber = pendingTransactions.filter(t => t.type === "Receita").reduce((sum, t) => sum + t.amount, 0);
  const contasAPagar = pendingTransactions.filter(t => t.type === "Despesa").reduce((sum, t) => sum + t.amount, 0);

  // Recharts/ReUI Chart Data Formatter: c-chart-4 (Bar chart - Receitas vs Despesas)
  const getWeeklyBarData = () => {
    // Group last 7 days or weeks
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days.map((day, idx) => {
      const dayTxs = paidTransactions.filter((t) => {
        const parts = t.date.split("/");
        if (parts.length !== 3) return false;
        const txDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        return txDate.getDay() === idx;
      });

      const receitas = dayTxs.filter(t => t.type === "Receita").reduce((sum, t) => sum + t.amount, 0);
      const despesas = dayTxs.filter(t => t.type === "Despesa").reduce((sum, t) => sum + t.amount, 0);

      return { day, receitas, despesas };
    });
  };

  // c-chart-13 (Striped Area Chart - Cash Flow Evolution)
  const getCashFlowAreaData = () => {
    let accumulated = 0;
    // Sort transactions chronologically
    const sorted = [...paidTransactions].sort((a, b) => {
      const aParts = a.date.split("/");
      const bParts = b.date.split("/");
      const aDate = new Date(parseInt(aParts[2]), parseInt(aParts[1]) - 1, parseInt(aParts[0]));
      const bDate = new Date(parseInt(bParts[2]), parseInt(bParts[1]) - 1, parseInt(bParts[0]));
      return aDate.getTime() - bDate.getTime();
    });

    // Group by unique dates
    const dateMap: Record<string, number> = {};
    sorted.forEach((t) => {
      const net = t.type === "Receita" ? t.amount : -t.amount;
      dateMap[t.date] = (dateMap[t.date] || 0) + net;
    });

    const data = Object.entries(dateMap).map(([date, net]) => {
      accumulated += net;
      // Get short date label "DD/MM"
      const label = date.substring(0, 5);
      return { label, balance: accumulated };
    });

    // Fallback if empty
    if (data.length === 0) {
      return [];
    }
    return data;
  };

  // c-chart-19 (3D Pie Chart - Category distribution)
  const getCategoryPieData = () => {
    const catMap: Record<string, number> = {};
    paidTransactions.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    const colors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];

    const mapped = Object.entries(catMap).map(([category, amount], idx) => ({
      category,
      amount,
      fill: `url(#gradient-cat-${idx})`,
      colorKey: colors[idx % colors.length]
    }));

    return mapped;
  };

  // Chart configs
  const barChartConfig = {
    receitas: { label: "Receitas", color: "var(--chart-2)" },
    despesas: { label: "Despesas", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const areaChartConfig = {
    balance: { label: "Saldo Acumulado", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const pieChartConfig = {
    amount: { label: "Volume Total" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saúde Financeira</h1>
          <p className="text-sm text-slate-500">
            Painel corporativo e conciliação de fluxo de caixa, pagamentos e recebimentos.
          </p>
        </div>

        {/* Lançar Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-slate-950 h-10 hover:bg-slate-900 text-white font-bold gap-2 shrink-0 self-start sm:self-auto" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Lançar Movimentação
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleAddTransaction}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <DollarSign className="w-5 h-5 text-slate-900" /> Novo Lançamento Financeiro
                </DialogTitle>
                <DialogDescription>
                  Adicione uma receita, despesa ou fatura pendente (contas a pagar/receber).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={() => setType("Receita")}
                      variant={type === "Receita" ? "default" : "outline"}
                      className={`rounded-xl h-10 ${
                        type === "Receita" ? "bg-slate-950 text-white" : "border-slate-200 bg-white"
                      }`}
                    >
                      Receita (Entrada)
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setType("Despesa")}
                      variant={type === "Despesa" ? "default" : "outline"}
                      className={`rounded-xl h-10 ${
                        type === "Despesa" ? "bg-slate-950 text-white" : "border-slate-200 bg-white"
                      }`}
                    >
                      Despesa (Saída)
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                    <AnimatedAmountInput value={amount} onChange={setAmount} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                    <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {type === "Receita" ? (
                          <>
                            <SelectItem value="Venda">Vendas Balcão</SelectItem>
                            <SelectItem value="OS">Ordem de Serviço</SelectItem>
                            <SelectItem value="Serviços">Serviços Gerais</SelectItem>
                            <SelectItem value="Rendimentos">Rendimentos</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Peças">Compra de Peças</SelectItem>
                            <SelectItem value="Infraestrutura">Aluguel / Condomínio</SelectItem>
                            <SelectItem value="Utilidades">Luz / Água / Internet</SelectItem>
                            <SelectItem value="Salários">Folha de Pagamento</SelectItem>
                            <SelectItem value="Impostos">Tributos / Impostos</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição / Detalhe</label>
                  <Input
                    placeholder="Ex: Pagamento aluguel loja central"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={() => setStatus("Pago")}
                      variant={status === "Pago" ? "default" : "outline"}
                      className={`rounded-xl h-10 ${
                        status === "Pago" ? "bg-slate-950 text-white" : "border-slate-200 bg-white"
                      }`}
                    >
                      Efetivado (Pago)
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStatus("Pendente")}
                      variant={status === "Pendente" ? "default" : "outline"}
                      className={`rounded-xl h-10 ${
                        status === "Pendente" ? "bg-slate-950 text-white" : "border-slate-200 bg-white"
                      }`}
                    >
                      Pendente (A Faturar)
                    </Button>
                  </div>
                </div>

                {status === "Pago" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Forma de Pagamento</label>
                      <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || "")}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pix">Pix</SelectItem>
                          <SelectItem value="Cartão">Cartão</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Responsável</label>
                      <Select value={responsible} onValueChange={(val) => setResponsible(val || "")}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.name}>
                              {emp.name}
                            </SelectItem>
                          ))}
                          {employees.length === 0 && (
                            <SelectItem value="Gerente Geral">Gerente Geral</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Data de Vencimento</label>
                      <DatePicker
                        value={dueDate ? new Date(dueDate + "T12:00:00") : undefined}
                        onChange={(date) => {
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            setDueDate(`${y}-${m}-${d}`);
                          } else {
                            setDueDate("");
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Responsável</label>
                      <Select value={responsible} onValueChange={(val) => setResponsible(val || "")}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.name}>
                              {emp.name}
                            </SelectItem>
                          ))}
                          {employees.length === 0 && (
                            <SelectItem value="Gerente Geral">Gerente Geral</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size={"lg"}
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border-slate-200"
                >
                  Cancelar
                </Button>
                <Button size={"lg"} type="submit" className="rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold">
                  Salvar Lançamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Period Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
          <Filter className="w-4 h-4 text-slate-500" />
          Filtro Temporal:
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "hoje", label: "Hoje" },
              { id: "7dias", label: "Últimos 7 dias" },
              { id: "30dias", label: "Últimos 30 dias" },
              { id: "mes", label: "Este Mês" },
              { id: "todos", label: "Todo o período" },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              variant={period === item.id ? "default" : "ghost"}
              className={`rounded-xl px-4 py-1.5 h-8 text-xs font-semibold ${
                period === item.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-slate-150 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Receitas Efetivas <ArrowUpRight className="w-4 h-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-slate-900">
              R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Garantido em conta/gaveta</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-150 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Despesas Pagas <ArrowDownRight className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-slate-900">
              R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Desembolsado no período</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-md rounded-2xl bg-slate-955 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Saldo Líquido / Lucro {lucro >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-black ${lucro >= 0 ? "text-primary" : "text-red-400"}`}>
              R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Resultado líquido efetivado</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-150 shadow-sm rounded-2xl bg-green-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center justify-between">
              Contas a Receber <Clock className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-green-700">
              R$ {contasAReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Receitas futuras lançadas</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-150 shadow-sm rounded-2xl bg-red-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center justify-between">
              Contas a Pagar <Clock className="w-4 h-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-red-700">
              R$ {contasAPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Compromissos pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* ReUI Interactive Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* c-chart-4: Bar Chart - Receitas vs Despesas (dotted pattern) */}
        <Card className="border border-slate-150 shadow-sm rounded-2xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Receitas vs Despesas</CardTitle>
              <CardDescription>Fluxo financeiro semanal comparativo</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] mt-2">
              <ChartContainer config={barChartConfig} className="w-full h-full">
                <BarChart
                  data={getWeeklyBarData()}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={4}
                >
                  <defs>
                    <pattern
                      id="chart4-receitas-pattern"
                      x="0"
                      y="0"
                      width="5"
                      height="5"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="5" height="5" fill="#020617" opacity="0.1" />
                      <circle cx="2.5" cy="2.5" r="1.3" fill="#020617" opacity="0.8" />
                    </pattern>
                    <pattern
                      id="chart4-despesas-pattern"
                      x="0"
                      y="0"
                      width="5"
                      height="5"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="5" height="5" fill="#94a3b8" opacity="0.15" />
                      <circle cx="2.5" cy="2.5" r="1.3" fill="#94a3b8" opacity="0.5" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `R$${v}`} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        className="min-w-[160px] gap-2 rounded-xl bg-slate-950 text-white p-3 border-none shadow-xl"
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-4 text-xs font-semibold text-slate-300">
                            <span className="capitalize">{name}:</span>
                            <span className="text-white font-bold">R$ {Number(value).toFixed(2)}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="receitas" name="Receitas" fill="url(#chart4-receitas-pattern)" stroke="#020617" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="despesas" name="Despesas" fill="url(#chart4-despesas-pattern)" stroke="#94a3b8" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-950" />
                <span className="text-xs font-bold text-slate-600">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300" />
                <span className="text-xs font-bold text-slate-600">Despesas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* c-chart-13: Natural Area Chart - Cash Flow Evolution (striped pattern) */}
        <Card className="border border-slate-150 shadow-sm rounded-2xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Evolução do Fluxo de Caixa</CardTitle>
              <CardDescription>Saldo líquido acumulado ao longo das datas</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] mt-2">
              <ChartContainer config={areaChartConfig} className="w-full h-full">
                <AreaChart
                  data={getCashFlowAreaData()}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="chart13-balance-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                    </linearGradient>
                    <pattern
                      id="chart13-balance-stripe"
                      patternUnits="userSpaceOnUse"
                      width="6"
                      height="6"
                    >
                      <path
                        d="M0,6 L6,0"
                        stroke="#020617"
                        strokeWidth="0.8"
                        opacity="0.1"
                      />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `R$${v}`} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        className="min-w-[160px] gap-2 rounded-xl bg-slate-950 text-white p-3 border-none shadow-xl"
                        formatter={(value) => (
                          <div className="flex w-full items-center justify-between gap-4 text-xs font-semibold text-slate-300">
                            <span>Saldo:</span>
                            <span className="text-white font-bold">R$ {Number(value).toFixed(2)}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area
                    type="natural"
                    dataKey="balance"
                    name="balance"
                    fill="url(#chart13-balance-gradient)"
                    stroke="#020617"
                    strokeWidth={2}
                  />
                  <Area
                    type="natural"
                    dataKey="balance"
                    fill="url(#chart13-balance-stripe)"
                    stroke="none"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-xs font-bold text-slate-400">Linha de Evolução Financeira</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Pie chart & Transaction Table */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* c-chart-19: 3D Pie Chart - Category distribution */}
        <Card className="border border-slate-150 shadow-sm rounded-2xl md:col-span-1">
          <CardHeader className="pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Origem e Destino</CardTitle>
              <CardDescription>Principais categorias registradas</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[220px] w-full mt-2">
              <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[220px]">
                <PieChart>
                  <defs>
                    <filter id="chart19-3d-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="4" floodOpacity="0.15" />
                    </filter>
                    {getCategoryPieData().map((entry, idx) => (
                      <linearGradient id={`gradient-cat-${idx}`} key={idx} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.colorKey} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.colorKey} stopOpacity={0.75} />
                      </linearGradient>
                    ))}
                  </defs>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="min-w-[140px] rounded-xl bg-slate-950 text-white p-2 border-none"
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-3 text-xs text-slate-300 font-semibold">
                            <span>Vol:</span>
                            <span className="text-white font-bold">R$ {Number(value).toFixed(2)}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={getCategoryPieData()}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={50}
                    outerRadius={75}
                    cornerRadius={6}
                    paddingAngle={3}
                    stroke="var(--background)"
                    strokeWidth={3}
                    style={{ filter: "url(#chart19-3d-shadow)" }}
                  >
                    {getCategoryPieData().map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-slate-900 text-lg font-black tabular-nums"
                              >
                                R$ {Math.round(lucro / 1000)}k
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 16}
                                className="fill-slate-400 text-[10px] font-bold uppercase"
                              >
                                Lucro Est.
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
            {/* Pie Legend list */}
            <div className="w-full space-y-2 mt-4 border-t border-slate-100 pt-4">
              {getCategoryPieData().map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.colorKey }} />
                    <span className="capitalize">{cat.category}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    R$ {cat.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {getCategoryPieData().length === 0 && (
                <span className="text-xs text-slate-400 font-medium text-center block">Sem movimentações</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Ledgers & Bills */}
        <Card className="border border-slate-150 shadow-sm rounded-2xl md:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-white flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Histórico de Transações e Lançamentos</CardTitle>
              <CardDescription>Visualização completa de contas faturadas e pendentes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-bold text-slate-500">Lançamento</TableHead>
                    <TableHead className="font-bold text-slate-500">Detalhes</TableHead>
                    <TableHead className="font-bold text-slate-500">Categoria</TableHead>
                    <TableHead className="font-bold text-slate-500">Tipo</TableHead>
                    <TableHead className="font-bold text-slate-500">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-500">Valor</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-slate-500">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                        <TableCell>
                          <div className="font-bold text-slate-900 text-sm">
                            {tx.description}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">{tx.date} às {tx.time}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-semibold">
                          {tx.status === "Pago" ? (
                            <span>Via {tx.paymentMethod} por {tx.responsible}</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1">
                              Venc: {tx.dueDate || "Sem data"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-500 border border-slate-200 font-medium text-[11px] rounded-md px-1.5 py-0.5">
                            {tx.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tx.type === "Receita" ? (
                            <Badge className="bg-green-100 text-green-800 border-none font-bold rounded-lg px-2 py-0.5 text-[10px]">
                              Receita
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-none font-bold rounded-lg px-2 py-0.5 text-[10px]">
                              Despesa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.status === "Pago" ? (
                            <Badge className="bg-slate-900 text-white border-none font-semibold rounded-lg px-2 py-0.5 text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Pago
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-50 text-yellow-800 border border-yellow-200 font-semibold rounded-lg px-2 py-0.5 text-[10px] flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-black text-sm ${
                          tx.type === "Receita" ? "text-slate-900" : "text-slate-500"
                        }`}>
                          {tx.type === "Receita" ? "+" : "-"} R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {tx.status === "Pendente" && (
                              <Tooltip content="Liquidar lançamento">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPayTarget(tx);
                                    setIsPayOpen(true);
                                  }}
                                  className="rounded-lg h-7 px-2 border-slate-200 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 gap-1"
                                >
                                  <UserCheck className="w-3 h-3" /> Liquidar
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip content="Excluir">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(tx)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                        Nenhuma transação encontrada para este período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liquidate Bill Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handlePayTransaction}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <CheckCircle2 className="w-5 h-5 text-slate-900" /> Liquidar Fatura
              </DialogTitle>
              <DialogDescription>
                Confirme o pagamento deste lançamento pendente para integrá-lo no caixa/financeiro.
              </DialogDescription>
            </DialogHeader>

            {payTarget && (
              <div className="space-y-4 py-4">
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs space-y-1.5 font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Lançamento:</span>
                    <span className="text-slate-800">{payTarget.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categoria:</span>
                    <span className="text-slate-800">{payTarget.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="text-slate-800">{payTarget.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="text-slate-950 font-bold text-sm">R$ {payTarget.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Forma de Pagamento</label>
                  <Select value={payMethod} onValueChange={(val) => setPayMethod(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pix">Pix (Transferência)</SelectItem>
                      <SelectItem value="Cartão">Cartão (Débito/Crédito)</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro (Afeta Caixa Drawer se aberto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Confirmado por</label>
                  <Select value={payResponsible} onValueChange={(val) => setPayResponsible(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.name}>
                          {emp.name}
                        </SelectItem>
                      ))}
                      {employees.length === 0 && (
                        <SelectItem value="Gerente Geral">Gerente Geral</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPayOpen(false);
                  setPayTarget(null);
                  setPayResponsible("");
                }}
                className="rounded-xl border-slate-200"
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold">
                Confirmar Liquidação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Excluir Transação</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir a transação "{deleteTarget?.description}" no valor de R$ {deleteTarget?.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsDeleteOpen(false);
                setDeleteTarget(null);
              }}
              className="rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-semibold"
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
