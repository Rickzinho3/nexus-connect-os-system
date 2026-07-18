"use client";

import React, { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PlusCircle, FileText, Smartphone, PenTool, Edit3, Trash2, CheckCircle } from "lucide-react";
import { getServiceOrders, addServiceOrder, updateServiceOrder, deleteServiceOrder, getClients } from "@/app/actions";

interface ServiceOrder {
  id: string;
  clientId: string;
  client: string;
  device: string;
  serviceType: string;
  value: number;
  status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
  date: string;
  notes?: string | null;
}

interface ClientOption {
  id: string;
  name: string;
}

export function OSView() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Modal Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states (Create)
  const [selectedClientId, setSelectedClientId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  // Form states (Edit)
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editServiceType, setEditServiceType] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editStatus, setEditStatus] = useState<any>("");
  const [editNotes, setEditNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const orderList = await getServiceOrders();
      const clientList = await getClients();
      setOrders(orderList as any);
      setClients(clientList.map(c => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !deviceName || !serviceType || !value) return;

    try {
      await addServiceOrder({
        clientId: selectedClientId,
        deviceName,
        serviceType,
        value: parseFloat(value),
      });

      setIsCreateOpen(false);
      setSelectedClientId("");
      setDeviceName("");
      setServiceType("");
      setValue("");
      setNotes("");
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setEditDeviceName(order.device);
    setEditServiceType(order.serviceType);
    setEditValue(order.value.toString());
    setEditStatus(order.status);
    setEditNotes(order.notes || "");
    setIsEditOpen(true);
  };

  const handleUpdateOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !editDeviceName || !editServiceType || !editValue || !editStatus) return;

    try {
      await updateServiceOrder(selectedOrder.id, {
        deviceName: editDeviceName,
        serviceType: editServiceType,
        value: parseFloat(editValue),
        status: editStatus,
        notes: editNotes,
      });

      setIsEditOpen(false);
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      await deleteServiceOrder(selectedOrder.id);
      setIsDeleteOpen(false);
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.client.toLowerCase().includes(search.toLowerCase()) ||
      order.device.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ServiceOrder["status"]) => {
    switch (status) {
      case "Pendente":
        return <Badge className="bg-white text-slate-500 border border-slate-300 border-dashed hover:bg-slate-50 rounded-lg">Pendente</Badge>;
      case "Em Andamento":
        return <Badge className="bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 rounded-lg">Em Andamento</Badge>;
      case "Concluído":
        return <Badge className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg">Concluído</Badge>;
      case "Cancelado":
        return <Badge className="bg-white text-slate-400 border border-slate-200 line-through hover:bg-slate-50 rounded-lg">Cancelado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500">
            Gerencie diagnósticos, reparos em andamento e entrega de aparelhos de clientes.
          </p>
        </div>

        {/* Dialog for New OS */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Nova O.S.
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleAddOS}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <FileText className="w-5 h-5 text-slate-900" /> Abrir Ordem de Serviço
                </DialogTitle>
                <DialogDescription>
                  Selecione o cliente cadastrado e detalhe o aparelho e o serviço necessário.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Cliente</label>
                  <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id} className="rounded-lg">
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Aparelho</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Ex: iPhone 13 Pro"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="pl-10 rounded-xl border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Serviço / Defeito</label>
                  <div className="relative">
                    <PenTool className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Ex: Troca de Tela e Vedação"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="pl-10 rounded-xl border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Valor Estimado (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 850.00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border-slate-200"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                  Abrir O.S.
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente, aparelho ou O.S..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["Todos", "Pendente", "Em Andamento", "Concluído", "Cancelado"].map((status) => (
            <Button
              key={status}
              onClick={() => setStatusFilter(status)}
              variant={statusFilter === status ? "default" : "outline"}
              className={`rounded-xl text-xs py-1.5 h-8 ${
                statusFilter === status
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* OS Table */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[100px] font-semibold text-slate-500">O.S.</TableHead>
              <TableHead className="font-semibold text-slate-500">Cliente</TableHead>
              <TableHead className="font-semibold text-slate-500">Aparelho</TableHead>
              <TableHead className="font-semibold text-slate-500">Serviço/Defeito</TableHead>
              <TableHead className="font-semibold text-slate-500">Valor Total</TableHead>
              <TableHead className="font-semibold text-slate-500">Status</TableHead>
              <TableHead className="font-semibold text-slate-500">Data Abertura</TableHead>
              <TableHead className="text-right font-semibold text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Carregando ordens de serviço...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-slate-700">{order.id}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{order.client}</TableCell>
                  <TableCell className="text-slate-600">{order.device}</TableCell>
                  <TableCell className="text-slate-600 truncate max-w-[180px]">{order.serviceType}</TableCell>
                  <TableCell className="font-bold text-slate-900">
                    R$ {order.value.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-slate-400 text-xs font-semibold">{order.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(order)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(order)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Nenhuma ordem de serviço encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit OS Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handleUpdateOS}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <Edit3 className="w-5 h-5 text-slate-900" /> Editar Ordem de Serviço
              </DialogTitle>
              <DialogDescription>
                Atualize o andamento ou valor cobrado da O.S. {selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Cliente (Não Editável)</label>
                <Input value={selectedOrder?.client || ""} disabled className="rounded-xl border-slate-200 bg-slate-50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Aparelho</label>
                <Input
                  value={editDeviceName}
                  onChange={(e) => setEditDeviceName(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Serviço/Defeito</label>
                <Input
                  value={editServiceType}
                  onChange={(e) => setEditServiceType(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Status do Reparo</label>
                  <Select value={editStatus} onValueChange={(val) => setEditStatus(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      <SelectItem value="Pendente" className="rounded-lg">Pendente</SelectItem>
                      <SelectItem value="Em Andamento" className="rounded-lg">Em Andamento</SelectItem>
                      <SelectItem value="Concluído" className="rounded-lg">Concluído</SelectItem>
                      <SelectItem value="Cancelado" className="rounded-lg">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Valor Cobrado (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="rounded-xl border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Observações / Laudo Técnico</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full min-h-[70px] rounded-xl border border-slate-200 p-2.5 text-sm outline-none"
                  placeholder="Laudo preliminar ou observações internas..."
                />
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
            <DialogTitle className="text-slate-900 font-bold">Excluir Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir a ordem de serviço {selectedOrder?.id}? Todos os lançamentos dependentes serão removidos.
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
