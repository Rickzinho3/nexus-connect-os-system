"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Landmark,
  RefreshCw,
  KeyRound,
  Edit3,
  Trash2,
  AlertTriangle,
  Plus,
  Minus,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck
} from "lucide-react";
import {
  getCurrentOpenSession,
  openCashSession,
  closeCashSession,
  getCashSessions,
  getSessionCashLogs,
  addCashLog,
  deleteCashLog,
  getEmployees
} from "@/app/actions";
import { Tooltip } from "@/components/motion/tooltip";
import { toast } from "sonner";

interface DrawerLog {
  id: number;
  time: string;
  type: "Abertura" | "Suprimento" | "Sangria" | "Venda" | "Serviço";
  description: string;
  value: number;
  category: string;
  paymentMethod: string;
  responsible: string;
  date: string;
}

interface CashSession {
  id: number;
  status: string;
  openedAt: string | Date;
  closedAt: string | Date | null;
  initialValue: number;
  expectedValue: number;
  countedValue: number | null;
  difference: number | null;
  notes: string | null;
  responsible: string;
  date: string;
}

export function CaixaView() {
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [logs, setLogs] = useState<DrawerLog[]>([]);
  const [sessionsHistory, setSessionsHistory] = useState<CashSession[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for Abertura
  const [initialValue, setInitialValue] = useState("");
  const [openingResponsible, setOpeningResponsible] = useState("");

  // Form states for Movimentações
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);
  const [txType, setTxType] = useState<"Suprimento" | "Sangria">("Suprimento");
  const [txValue, setTxValue] = useState("");
  const [txCategory, setTxCategory] = useState("Troco");
  const [txDescription, setTxDescription] = useState("");
  const [txPaymentMethod, setTxPaymentMethod] = useState("Dinheiro");
  const [txResponsible, setTxResponsible] = useState("");

  // Form states for Fechamento
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [countedValue, setCountedValue] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [closingResponsible, setClosingResponsible] = useState("");

  // Delete transaction state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DrawerLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [session, history, emps] = await Promise.all([
        getCurrentOpenSession(),
        getCashSessions(),
        getEmployees(),
      ]);

      setActiveSession(session as any);
      setEmployees(emps.map(e => ({ id: e.id, name: e.name })));
      setSessionsHistory(history as any);

      if (session) {
        const sessionLogs = await getSessionCashLogs(session.id);
        setLogs(sessionLogs as any);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do caixa:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialValue || !openingResponsible) return;

    try {
      await openCashSession({
        initialValue: parseFloat(initialValue),
        responsible: openingResponsible,
      });
      setInitialValue("");
      setOpeningResponsible("");
      await loadData();
      toast.success("Sessão de caixa aberta");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao abrir o caixa");
    }
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txValue || !txDescription || !txResponsible) return;

    try {
      const numericVal = parseFloat(txValue);
      // Sangria is negative, Suprimento is positive
      const val = txType === "Sangria" ? -numericVal : numericVal;

      await addCashLog({
        type: txType,
        description: txDescription,
        value: val,
        category: txCategory,
        paymentMethod: txPaymentMethod,
        responsible: txResponsible,
      });

      // Reset
      setIsTxDialogOpen(false);
      setTxValue("");
      setTxDescription("");
      setTxResponsible("");
      await loadData();
      toast.success("Movimentação registrada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar movimentação");
    }
  };

  const handleCloseCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !countedValue || !closingResponsible) return;

    try {
      await closeCashSession(activeSession.id, {
        countedValue: parseFloat(countedValue),
        notes: closingNotes,
        responsible: closingResponsible,
      });

      // Reset
      setIsCloseDialogOpen(false);
      setCountedValue("");
      setClosingNotes("");
      setClosingResponsible("");
      await loadData();
      toast.success("Sessão de caixa fechada");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fechar o caixa");
    }
  };

  const handleDeleteTx = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCashLog(deleteTarget.id);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await loadData();
      toast.success("Movimentação excluída com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir movimentação");
    }
  };

  // Computations
  const totalInflows = logs
    .filter((l) => l.value > 0 && l.type !== "Abertura")
    .reduce((sum, l) => sum + l.value, 0);

  const totalOutflows = logs
    .filter((l) => l.value < 0)
    .reduce((sum, l) => sum + Math.abs(l.value), 0);

  const expectedBalance = activeSession
    ? activeSession.initialValue + totalInflows - totalOutflows
    : 0;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Controle de Caixa</h1>
          <p className="text-sm text-slate-500">
            Abertura, fechamento e controle operacional do fluxo de dinheiro do dia.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          disabled={loading}
          className="rounded-xl border-slate-200 self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-medium animate-pulse">
          Carregando informações do caixa...
        </div>
      ) : !activeSession ? (
        /* CAIXA FECHADO - MOSTRAR ABERTURA */
        <div className="max-w-md mx-auto mt-6">
          <Card className="border border-slate-150 shadow-xl rounded-2xl overflow-visible">
            <CardHeader className="bg-slate-950 text-white p-6 relative rounded-t-2xl">
              <div className="absolute right-6 top-6 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full p-2">
                <Lock className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-bold">Caixa Fechado</CardTitle>
              <CardDescription className="text-slate-400">
                Inicie uma nova sessão de caixa para registrar movimentações hoje.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleOpenCash} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Valor Inicial em Caixa (Troco)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-[6px] text-slate-400 font-semibold text-sm">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={initialValue}
                      onChange={(e) => setInitialValue(e.target.value)}
                      className="pl-9 rounded-xl border-slate-200 focus-visible:ring-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Operador Responsável</label>
                  <Select value={openingResponsible} onValueChange={(val) => setOpeningResponsible(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione um funcionário..." />
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

                <Button type="submit" size="lg" className="w-full rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold h-11 transition-all flex items-center justify-center gap-2 mt-2">
                  <Unlock className="w-4 h-4" />
                  Abrir Caixa Operacional
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* CAIXA ABERTO - MOSTRAR FLUXO E OPERAÇÕES */
        <div className="space-y-6">
          {/* Sessão Ativa KPI Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-100 shadow-sm rounded-2xl bg-slate-950 text-white overflow-hidden relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5 text-green-400" /> Saldo Esperado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black">
                  R$ {expectedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Aberto às {new Date(activeSession.openedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} por {activeSession.responsible}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-150 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Abertura / Fundo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  R$ {activeSession.initialValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">Valor base de troco</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-150 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-green-600 uppercase tracking-wider">Total Entradas (Hoje)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  + R$ {totalInflows.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">Suprimentos e Vendas</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-150 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-red-600 uppercase tracking-wider">Total Saídas / Sangrias</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  - R$ {totalOutflows.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">Retiradas de caixa</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-none font-bold rounded-lg px-2.5 py-1 text-xs">
                SESSÃO ATIVA #{activeSession.id}
              </Badge>
              <span className="text-xs text-slate-500 font-semibold">Data: {activeSession.date}</span>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={isTxDialogOpen} onOpenChange={setIsTxDialogOpen}>
                <DialogTrigger render={<Button className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center gap-2" />}>
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nova Movimentação
                  </span>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
                  <form onSubmit={handleAddTx}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                        <Landmark className="w-5 h-5" /> Registrar Lançamento
                      </DialogTitle>
                      <DialogDescription>
                        Insira movimentações de entrada (Suprimento) ou saída (Sangria) da gaveta.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Operação</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              setTxType("Suprimento");
                              setTxCategory("Troco");
                            }}
                            variant={txType === "Suprimento" ? "default" : "outline"}
                            className={`rounded-xl h-10 ${
                              txType === "Suprimento" ? "bg-slate-950 text-white" : "border-slate-200 bg-white"
                            }`}
                          >
                            Suprimento (Entrada)
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setTxType("Sangria");
                              setTxCategory("Sangria");
                            }}
                            variant={txType === "Sangria" ? "default" : "outline"}
                            className={`rounded-xl h-10 ${
                              txType === "Sangria" ? "bg-slate-950 text-white" : "border-slate-200 bg-white"
                            }`}
                          >
                            Sangria (Retirada)
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={txValue}
                            onChange={(e) => setTxValue(e.target.value)}
                            className="rounded-xl border-slate-200"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                          <Select value={txCategory} onValueChange={(val) => setTxCategory(val || "")}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {txType === "Suprimento" ? (
                                <>
                                  <SelectItem value="Troco">Fundo de Troco</SelectItem>
                                  <SelectItem value="Aporte">Aporte Operacional</SelectItem>
                                  <SelectItem value="Outros">Outros</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="Sangria">Sangria</SelectItem>
                                  <SelectItem value="Insumos">Compra de Insumos</SelectItem>
                                  <SelectItem value="Despesa Operacional">Despesas Rápidas</SelectItem>
                                  <SelectItem value="Alimentação">Alimentação / Lanche</SelectItem>
                                  <SelectItem value="Outros">Outros</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Descrição / Motivo</label>
                        <Input
                          placeholder="Ex: Troco de notas baixas enviado do banco"
                          value={txDescription}
                          onChange={(e) => setTxDescription(e.target.value)}
                          className="rounded-xl border-slate-200"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Meio de Movimentação</label>
                          <Select value={txPaymentMethod} onValueChange={(val) => setTxPaymentMethod(val || "")}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dinheiro">Dinheiro Físico</SelectItem>
                              <SelectItem value="Pix">Pix (Transferência)</SelectItem>
                              <SelectItem value="Cartão">Cartão (Débito/Crédito)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Responsável</label>
                          <Select value={txResponsible} onValueChange={(val) => setTxResponsible(val || "")}>
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
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline" size="lg"
                        onClick={() => setIsTxDialogOpen(false)}
                        className="rounded-xl border-slate-200"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" size="lg" className="rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-semibold">
                        Registrar Movimentação
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <DialogTrigger render={<Button variant="outline" className="rounded-xl border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-2" />}>
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Fechar Caixa
                  </span>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
                  <form onSubmit={handleCloseCash}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                        <Lock className="w-5 h-5 text-slate-900" /> Fechamento de Caixa
                      </DialogTitle>
                      <DialogDescription>
                        Compare o saldo esperado no sistema com a contagem física da gaveta.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {/* Fechamento Stats Summary */}
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                          <span>Abertura (Fundo)</span>
                          <span className="text-slate-800">R$ {activeSession.initialValue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                          <span>(+) Entradas do Dia</span>
                          <span className="text-green-600">+ R$ {totalInflows.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                          <span>(-) Saídas do Dia</span>
                          <span className="text-red-600">- R$ {totalOutflows.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm font-bold text-slate-900">
                          <span>Saldo Esperado em Caixa</span>
                          <span>R$ {expectedBalance.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Valor Contado Fisicamente (R$)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={countedValue}
                            onChange={(e) => setCountedValue(e.target.value)}
                            className="pl-9 rounded-xl border-slate-200"
                            required
                          />
                        </div>
                        {countedValue && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {parseFloat(countedValue) - expectedBalance === 0 ? (
                              <Badge className="bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-1 font-semibold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Caixa Bate perfeitamente!
                              </Badge>
                            ) : parseFloat(countedValue) - expectedBalance < 0 ? (
                              <Badge className="bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-1 font-semibold text-xs">
                                <AlertTriangle className="w-3.5 h-3.5" /> Quebra de Caixa: Faltando R$ {Math.abs(parseFloat(countedValue) - expectedBalance).toFixed(2)}
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg flex items-center gap-1 font-semibold text-xs">
                                <TrendingUp className="w-3.5 h-3.5" /> Sobra de Caixa: R$ {Math.abs(parseFloat(countedValue) - expectedBalance).toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Responsável pelo Fechamento</label>
                        <Select value={closingResponsible} onValueChange={(val) => setClosingResponsible(val || "")}>
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

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Observações do Turno</label>
                        <Input
                          placeholder="Ex: Diferença de R$ 0.10 por troco arredondado"
                          value={closingNotes}
                          onChange={(e) => setClosingNotes(e.target.value)}
                          className="rounded-xl border-slate-200"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCloseDialogOpen(false)}
                        className="rounded-xl border-slate-200"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">
                        Confirmar e Fechar Caixa
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Lançamentos do Caixa Table */}
          <Card className="border border-slate-150 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-white">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" /> Movimentações do Turno Atual
              </CardTitle>
              <CardDescription>Lista completa de entradas e saídas registradas na gaveta do caixa hoje.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[90px] font-bold text-slate-500">Horário</TableHead>
                    <TableHead className="font-bold text-slate-500">Tipo</TableHead>
                    <TableHead className="font-bold text-slate-500">Descrição / Motivo</TableHead>
                    <TableHead className="font-bold text-slate-500">Categoria</TableHead>
                    <TableHead className="font-bold text-slate-500">Forma de Pagamento</TableHead>
                    <TableHead className="font-bold text-slate-500">Operador</TableHead>
                    <TableHead className="text-right font-bold text-slate-500">Valor</TableHead>
                    <TableHead className="w-[80px] text-center font-bold text-slate-500">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/40 transition-colors">
                        <TableCell className="text-xs text-slate-400 font-bold">{log.time}</TableCell>
                        <TableCell>
                          {log.type === "Abertura" ? (
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-semibold rounded-lg text-xs">
                              Abertura
                            </Badge>
                          ) : log.type === "Suprimento" ? (
                            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200 font-semibold rounded-lg text-xs">
                              Suprimento
                            </Badge>
                          ) : log.type === "Sangria" ? (
                            <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border border-red-200 font-semibold rounded-lg text-xs">
                              Sangria
                            </Badge>
                          ) : log.type === "Venda" ? (
                            <Badge className="bg-slate-900 text-white hover:bg-slate-900 border-none font-semibold rounded-lg text-xs">
                              Venda
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200 font-semibold rounded-lg text-xs">
                              O.S. Paga
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800 text-sm">{log.description}</TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-500 border border-slate-200 rounded-md font-medium text-[11px] px-1.5 py-0.5">
                            {log.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs font-semibold">{log.paymentMethod}</TableCell>
                        <TableCell className="text-slate-600 text-xs font-semibold">{log.responsible}</TableCell>
                        <TableCell className={`text-right font-black ${log.value >= 0 ? "text-slate-900" : "text-red-500"}`}>
                          {log.value >= 0 ? "+" : "-"} R$ {Math.abs(log.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {log.type !== "Abertura" && log.type !== "Venda" && log.type !== "Serviço" ? (
                            <Tooltip content="Excluir">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setDeleteTarget(log);
                                  setIsDeleteOpen(true);
                                }}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-semibold">Automático</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                        Nenhuma movimentação financeira neste turno.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de Caixas Fechados */}
      <Card className="border border-slate-150 shadow-sm rounded-2xl overflow-hidden mt-8">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4.5 h-4.5 text-slate-600" /> Histórico de Turnos Anteriores
          </CardTitle>
          <CardDescription>Arquivos e conciliação de fechamentos passados.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-bold text-slate-500">Data</TableHead>
                <TableHead className="font-bold text-slate-500">Status</TableHead>
                <TableHead className="font-bold text-slate-500">Abertura por</TableHead>
                <TableHead className="font-bold text-slate-500">Valor Inicial</TableHead>
                <TableHead className="font-bold text-slate-500">Total Esperado</TableHead>
                <TableHead className="font-bold text-slate-500">Total Contado</TableHead>
                <TableHead className="font-bold text-slate-500">Diferença</TableHead>
                <TableHead className="font-bold text-slate-500">Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionsHistory.length > 0 ? (
                sessionsHistory.map((session) => (
                  <TableRow key={session.id} className="hover:bg-slate-50/30 transition-colors text-xs font-semibold text-slate-600">
                    <TableCell className="font-bold text-slate-900">{session.date}</TableCell>
                    <TableCell>
                      {session.status === "Aberto" ? (
                        <Badge className="bg-green-50 text-green-700 border border-green-200 rounded-md text-[10px]">Aberto</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px]">Fechado</Badge>
                      )}
                    </TableCell>
                    <TableCell>{session.responsible}</TableCell>
                    <TableCell>R$ {session.initialValue.toFixed(2)}</TableCell>
                    <TableCell>R$ {session.expectedValue.toFixed(2)}</TableCell>
                    <TableCell>
                      {session.countedValue !== null ? `R$ ${session.countedValue.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {session.difference !== null ? (
                        session.difference === 0 ? (
                          <span className="text-green-600 font-bold">Sem divergência</span>
                        ) : session.difference < 0 ? (
                          <span className="text-red-500 font-bold">Faltou R$ {Math.abs(session.difference).toFixed(2)}</span>
                        ) : (
                          <span className="text-yellow-600 font-bold">Sobrou R$ {Math.abs(session.difference).toFixed(2)}</span>
                        )
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-400 font-medium">
                      {session.notes || "Sem observações"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                    Nenhum turno anterior arquivado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Excluir Lançamento?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir esta movimentação de caixa? O saldo esperado será recalculado.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1 font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span className="text-slate-800">{deleteTarget.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Descrição:</span>
                <span className="text-slate-800">{deleteTarget.description}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor:</span>
                <span className="text-slate-900 font-bold">R$ {Math.abs(deleteTarget.value).toFixed(2)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="grid grid-cols-2 gap-2 mt-2">
            <Button
              type="button"
              variant="outline" 
              size="lg"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="button" 
              size="lg"
              onClick={handleDeleteTx}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
