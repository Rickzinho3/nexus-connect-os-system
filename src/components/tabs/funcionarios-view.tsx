"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Users, Search, PlusCircle, Mail, Phone, Wrench, Shield, Edit3, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from "@/app/actions";
import { Tooltip } from "@/components/motion/tooltip";

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "Ativo" | "Férias" | "Afastado";
}

export function FuncionariosView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form state (Create)
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Form state (Edit)
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<"Ativo" | "Férias" | "Afastado">("Ativo");

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !email || !phone) return;

    try {
      await addEmployee({ name, role, email, phone });
      setIsCreateOpen(false);
      setName("");
      setRole("");
      setEmail("");
      setPhone("");
      await loadEmployees();
      toast.success("Funcionário cadastrado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar funcionário");
    }
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditName(emp.name);
    setEditRole(emp.role);
    setEditEmail(emp.email);
    setEditPhone(emp.phone);
    setEditStatus(emp.status);
    setIsEditOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !editName || !editRole || !editEmail || !editPhone || !editStatus) return;

    try {
      await updateEmployee(selectedEmployee.id, {
        name: editName,
        role: editRole,
        email: editEmail,
        phone: editPhone,
        status: editStatus,
      });
      setIsEditOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar funcionário");
    }
  };

  const handleDeleteClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee.id);
      setIsDeleteOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir funcionário");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    return (
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusBadge = (status: Employee["status"]) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg">Ativo</Badge>;
      case "Férias":
        return <Badge className="bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300 rounded-lg">Férias</Badge>;
      case "Afastado":
        return <Badge className="bg-white text-slate-500 border border-slate-300 border-dashed hover:bg-slate-50 rounded-lg">Afastado</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes("técnico")) {
      return <Wrench className="w-3.5 h-3.5 text-slate-900 mr-1.5" />;
    }
    return <Shield className="w-3.5 h-3.5 text-slate-900 mr-1.5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quadro de Funcionários</h1>
          <p className="text-sm text-slate-500">
            Gerencie o cadastro da equipe de técnicos, atendentes e administradores da assistência técnica.
          </p>
        </div>

        {/* Dialog for New Employee */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-slate-900 h-10 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Adicionar Colaborador
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleAddEmployee}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <Users className="w-5 h-5 text-slate-900" /> Cadastrar Funcionário
                </DialogTitle>
                <DialogDescription>
                  Insira os dados do novo funcionário para registro no sistema de ponto/comissão.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                  <Input
                    placeholder="Ex: Anderson Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Cargo / Função</label>
                  <Select value={role} onValueChange={(val) => setRole(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      <SelectItem value="Dono" className="rounded-lg">Dono</SelectItem>
                      <SelectItem value="Técnico de Placas" className="rounded-lg">Técnico de Placas</SelectItem>
                      <SelectItem value="Técnico de Smartphones" className="rounded-lg">Técnico de Smartphones</SelectItem>
                      <SelectItem value="Técnico de Notebooks" className="rounded-lg">Técnico de Notebooks</SelectItem>
                      <SelectItem value="Atendimento & Triagem" className="rounded-lg">Atendimento & Triagem</SelectItem>
                      <SelectItem value="Gerente Comercial" className="rounded-lg">Gerente Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Email Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="Ex: nome@oficina.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Ex: (11) 98888-8888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 rounded-xl border-slate-200"
                      required
                    />
                  </div>
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
                <Button size={"lg"} type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Search */}
      <div className="flex bg-slate-50 p-3 rounded-2xl border border-slate-100 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por colaborador ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[100px] font-semibold text-slate-500">Código</TableHead>
              <TableHead className="font-semibold text-slate-500">Colaborador</TableHead>
              <TableHead className="font-semibold text-slate-500">Função</TableHead>
              <TableHead className="font-semibold text-slate-500">Contato</TableHead>
              <TableHead className="font-semibold text-slate-500">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Carregando colaboradores...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-slate-700">{emp.id}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{emp.name}</TableCell>
                  <TableCell className="text-slate-700 flex items-center font-medium">
                    {getRoleIcon(emp.role)}
                    {emp.role}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {emp.email}</p>
                      <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {emp.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(emp.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content="Editar" side="top">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(emp)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      </Tooltip>
                      <Tooltip content="Excluir" side="top">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(emp)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handleUpdateEmployee}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <Edit3 className="w-5 h-5 text-slate-900" /> Editar Colaborador
              </DialogTitle>
              <DialogDescription>
                Atualize o cargo ou status de trabalho do colaborador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Cargo / Função</label>
                <Select value={editRole} onValueChange={(val) => setEditRole(val || "")}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 rounded-xl">
                    <SelectItem value="Técnico de Placas" className="rounded-lg">Técnico de Placas</SelectItem>
                    <SelectItem value="Técnico de Smartphones" className="rounded-lg">Técnico de Smartphones</SelectItem>
                    <SelectItem value="Técnico de Notebooks" className="rounded-lg">Técnico de Notebooks</SelectItem>
                    <SelectItem value="Atendimento & Triagem" className="rounded-lg">Atendimento & Triagem</SelectItem>
                    <SelectItem value="Gerente Comercial" className="rounded-lg">Gerente Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Email Corporativo</label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Telefone</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Status</label>
                  <Select value={editStatus} onValueChange={(val: any) => setEditStatus(val || "Ativo")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      <SelectItem value="Ativo" className="rounded-lg">Ativo</SelectItem>
                      <SelectItem value="Férias" className="rounded-lg">Férias</SelectItem>
                      <SelectItem value="Afastado" className="rounded-lg">Afastado</SelectItem>
                    </SelectContent>
                  </Select>
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
            <DialogTitle className="text-slate-900 font-bold">Excluir Funcionário</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o funcionário "{selectedEmployee?.name}"? Esta ação não pode ser desfeita.
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
