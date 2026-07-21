"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Target, TrendingUp, ShieldAlert, Award, PlusCircle, Edit3, Trash2 } from "lucide-react";
import { getGoals, addGoal, updateGoal, deleteGoal } from "@/app/actions";
import { Tooltip } from "../motion/tooltip";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/motion/select";
interface Goal {
  id: number;
  name: string;
  category: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
}

export function MetasView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !target || !unit || !deadline) return;

    try {
      await addGoal({
        name,
        category,
        target: parseFloat(target),
        unit,
        deadline,
      });
      setIsCreateOpen(false);
      setName("");
      setCategory("");
      setTarget("");
      setUnit("");
      setDeadline("");
      await loadGoals();
      toast.success("Meta criada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar meta");
    }
  };

  const handleEditClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setName(goal.name);
    setCategory(goal.category);
    setTarget(goal.target.toString());
    setCurrent(goal.current.toString());
    setUnit(goal.unit);
    setDeadline(goal.deadline);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !name || !category || !target || !current || !unit || !deadline) return;

    try {
      await updateGoal(selectedGoal.id, {
        name,
        category,
        target: parseFloat(target),
        current: parseFloat(current),
        unit,
        deadline,
      });
      setIsEditOpen(false);
      setSelectedGoal(null);
      await loadGoals();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar meta");
    }
  };

  const handleDeleteClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGoal) return;
    try {
      await deleteGoal(selectedGoal.id);
      setIsDeleteOpen(false);
      setSelectedGoal(null);
      await loadGoals();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir meta");
    }
  };

  const getIcon = (catName: string) => {
    const term = catName.toLowerCase();
    if (term.includes("finance")) return TrendingUp;
    if (term.includes("operac")) return Target;
    if (term.includes("qualid")) return Award;
    return ShieldAlert;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Metas Corporativas</h1>
          <p className="text-sm text-slate-500">
            Acompanhe o andamento das metas de faturamento, reparos e satisfação de clientes.
          </p>
        </div>

        {/* Create Modal Trigger */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl h-10 bg-slate-900 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Criar Meta
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <Target className="w-5 h-5 text-slate-900" /> Estabelecer Nova Meta
                </DialogTitle>
                <DialogDescription>
                  Defina os objetivos de faturamento ou volume de reparos da assistência técnica.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Nome da Meta</label>
                  <Input
                    placeholder="Ex: Faturamento Mensal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Categoria</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione uma Categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                      <SelectItem value="Qualidade">Qualidade</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Alvo (Meta)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 80000"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Unidade</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecione uma Unidade..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="R$">R$</SelectItem>
                        <SelectItem value="OS">OS (Ordens de Serviço)</SelectItem>
                        <SelectItem value="%">% (Porcentagem)</SelectItem>
                        <SelectItem value="un">Unidades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Prazo de Conclusão</label>
                  <DatePicker
                    value={deadline ? new Date(deadline.includes("/") ? deadline.split("/").reverse().join("-") + "T12:00:00" : deadline + "T12:00:00") : undefined}
                    onChange={(date) => {
                      if (date) {
                        const d = String(date.getDate()).padStart(2, '0');
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const y = date.getFullYear();
                        setDeadline(`${d}/${m}/${y}`);
                      } else {
                        setDeadline("");
                      }
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size={"lg"}
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border-slate-200"
                >
                  Cancelar
                </Button>
                <Button size={"lg"} type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
                  Criar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 font-medium">
          Carregando metas do banco de dados...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => {
            const Icon = getIcon(goal.category);
            const isReductionGoal = goal.name.toLowerCase().includes("retrabalho") || goal.name.toLowerCase().includes("custo");
            const percentage = isReductionGoal
              ? Math.max(0, 100 - (goal.current / goal.target) * 100)
              : Math.min(100, (goal.current / goal.target) * 100);

            let isPastDeadline = false;
            if (goal.deadline) {
              const parts = goal.deadline.includes("/") ? goal.deadline.split("/") : goal.deadline.split("-");
              const dateObj = goal.deadline.includes("/") 
                ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) 
                : new Date(goal.deadline);
              isPastDeadline = dateObj < new Date(new Date().setHours(0,0,0,0));
            }

            let statusText = "Em Progresso";
            let statusColor = "text-slate-500";
            if (percentage >= 100) {
              statusText = "Concluída";
              statusColor = "text-slate-900 font-bold";
            } else if (isPastDeadline) {
              statusText = "Não atingido";
              statusColor = "text-red-500 font-bold";
            }

            return (
              <Card key={goal.id} className="border border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <Icon className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{goal.name}</CardTitle>
                      <CardDescription className="text-xs">{goal.category}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tooltip content="Editar">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditClick(goal)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-900"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    </Tooltip>
                    <Tooltip content="Excluir">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClick(goal)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">
                        {goal.unit === "R$" ? `R$ ${goal.current.toLocaleString("pt-BR")}` : `${goal.current} ${goal.unit}`}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        de {goal.unit === "R$" ? `R$ ${goal.target.toLocaleString("pt-BR")}` : `${goal.target} ${goal.unit}`}
                      </span>
                    </div>
                    <Badge className="bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 rounded-lg text-xs font-bold">
                      {Math.round(percentage)}% atingido
                    </Badge>
                  </div>

                  <Progress value={percentage} className="h-3.5 [&div:bg-slate-900]" />

                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-50 pt-3">
                    <span>Prazo: {goal.deadline}</span>
                    <span className={statusColor}>
                      {statusText}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <Edit3 className="w-5 h-5 text-slate-900" /> Editar Meta
              </DialogTitle>
              <DialogDescription>
                Atualize o progresso atual ou mude o escopo do objetivo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Nome da Meta</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione uma Categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Qualidade">Qualidade</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Progresso Atual</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    className="rounded-xl border-slate-200 font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Alvo (Meta)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Unidade</label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione uma Unidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R$">R$</SelectItem>
                      <SelectItem value="OS">OS (Ordens de Serviço)</SelectItem>
                      <SelectItem value="%">% (Porcentagem)</SelectItem>
                      <SelectItem value="un">Unidades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Prazo</label>
                  <DatePicker
                    value={deadline ? new Date(deadline.includes("/") ? deadline.split("/").reverse().join("-") + "T12:00:00" : deadline + "T12:00:00") : undefined}
                    onChange={(date) => {
                      if (date) {
                        const d = String(date.getDate()).padStart(2, '0');
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const y = date.getFullYear();
                        setDeadline(`${d}/${m}/${y}`);
                      } else {
                        setDeadline("");
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl border-slate-200"
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Excluir Meta</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir a meta "{selectedGoal?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
