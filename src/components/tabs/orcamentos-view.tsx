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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { Search, PlusCircle, Check, X, FileText, Smartphone, Edit3, Trash2 } from "lucide-react";
import { getQuotes, addQuote, updateQuote, deleteQuote, approveQuote, rejectQuote, getClients } from "@/app/actions";

interface Quote {
  id: string;
  clientId: string;
  client: string;
  device: string;
  description: string;
  value: number;
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Expirado";
  validUntil: string;
}

interface ClientOption {
  id: string;
  name: string;
}

export function OrcamentosView() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Form States (Create)
  const [clientId, setClientId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // Form States (Edit)
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editStatus, setEditStatus] = useState<any>("");
  const [editValidUntil, setEditValidUntil] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getQuotes();
      const clientList = await getClients();
      setQuotes(data as any);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !deviceName || !description || !value || !validUntil) return;

    try {
      await addQuote({
        clientId,
        deviceName,
        description,
        value: parseFloat(value),
        validUntil,
      });
      setIsCreateOpen(false);
      setClientId("");
      setDeviceName("");
      setDescription("");
      setValue("");
      setValidUntil("");
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setEditDeviceName(quote.device);
    setEditDescription(quote.description);
    setEditValue(quote.value.toString());
    setEditStatus(quote.status);
    setEditValidUntil(quote.validUntil);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote || !editDeviceName || !editDescription || !editValue || !editStatus || !editValidUntil) return;

    try {
      await updateQuote(selectedQuote.id, {
        deviceName: editDeviceName,
        description: editDescription,
        value: parseFloat(editValue),
        status: editStatus,
        validUntil: editValidUntil,
      });
      setIsEditOpen(false);
      setSelectedQuote(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuote) return;
    try {
      await deleteQuote(selectedQuote.id);
      setIsDeleteOpen(false);
      setSelectedQuote(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveQuote(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectQuote(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client.toLowerCase().includes(search.toLowerCase()) ||
      q.device.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos" || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Quote["status"]) => {
    switch (status) {
      case "Pendente":
        return <Badge className="bg-white text-slate-500 border border-slate-300 border-dashed hover:bg-slate-50 rounded-lg">Pendente</Badge>;
      case "Aprovado":
        return <Badge className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg">Aprovado</Badge>;
      case "Rejeitado":
        return <Badge className="bg-white text-slate-400 border border-slate-200 line-through hover:bg-slate-50 rounded-lg">Rejeitado</Badge>;
      case "Expirado":
        return <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 rounded-lg">Expirado</Badge>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orçamentos</h1>
          <p className="text-sm text-slate-500">
            Acompanhe a criação, envio e aprovação dos orçamentos comerciais dos clientes.
          </p>
        </div>

        {/* Dialog for New Quote */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Novo Orçamento
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <FileText className="w-5 h-5 text-slate-900" /> Criar Novo Orçamento
                </DialogTitle>
                <DialogDescription>
                  Preencha os valores e detalhes para enviar ao cliente.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Cliente</label>
                  <Select value={clientId} onValueChange={(val) => setClientId(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="rounded-lg">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Aparelho</label>
                  <Input
                    placeholder="Ex: iPhone 13 Pro"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Detalhes / Componentes</label>
                  <Input
                    placeholder="Ex: Troca de Tela e Vedação Oring"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Valor Estimado (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 850.00"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="rounded-xl border-slate-200 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Validade</label>
                    <input
                      type="date"
                      value={validUntil.includes("/") ? validUntil.split("/").reverse().join("-") : validUntil}
                      onChange={(e) => {
                        const [y, m, d] = e.target.value.split("-");
                        setValidUntil(`${d}/${m}/${y}`);
                      }}
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>
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
                  Enviar Orçamento
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
            placeholder="Buscar por cliente, aparelho ou orçamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["Todos", "Pendente", "Aprovado", "Rejeitado", "Expirado"].map((status) => (
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

      {/* Estimates Table */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[120px] font-semibold text-slate-500">Orçamento</TableHead>
              <TableHead className="font-semibold text-slate-500">Cliente</TableHead>
              <TableHead className="font-semibold text-slate-500">Aparelho</TableHead>
              <TableHead className="font-semibold text-slate-500">Serviços / Peças</TableHead>
              <TableHead className="font-semibold text-slate-500">Valor Total</TableHead>
              <TableHead className="font-semibold text-slate-500">Status</TableHead>
              <TableHead className="font-semibold text-slate-500">Validade</TableHead>
              <TableHead className="text-right font-semibold text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Carregando orçamentos...
                </TableCell>
              </TableRow>
            ) : filteredQuotes.length > 0 ? (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-slate-700">{quote.id}</TableCell>
                  <TableCell className="font-medium text-slate-900">{quote.client}</TableCell>
                  <TableCell className="text-slate-600">{quote.device}</TableCell>
                  <TableCell className="text-slate-600 truncate max-w-[180px]">{quote.description}</TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    R$ {quote.value.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-slate-400 text-xs font-medium">{quote.validUntil}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {quote.status === "Pendente" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleApprove(quote.id)}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReject(quote.id)}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(quote)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(quote)}
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
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Quote Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <Edit3 className="w-5 h-5 text-slate-900" /> Editar Orçamento
              </DialogTitle>
              <DialogDescription>
                Atualize as especificações comerciais do orçamento {selectedQuote?.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Cliente (Não Editável)</label>
                <Input value={selectedQuote?.client || ""} disabled className="rounded-xl border-slate-200 bg-slate-50" />
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
                <label className="text-xs font-semibold text-slate-500">Detalhes / Componentes</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Status</label>
                  <Select value={editStatus} onValueChange={(val) => setEditStatus(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      <SelectItem value="Pendente" className="rounded-lg">Pendente</SelectItem>
                      <SelectItem value="Aprovado" className="rounded-lg">Aprovado</SelectItem>
                      <SelectItem value="Rejeitado" className="rounded-lg">Rejeitado</SelectItem>
                      <SelectItem value="Expirado" className="rounded-lg">Expirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Valor Total (R$)</label>
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
                <label className="text-xs font-semibold text-slate-500">Validade do Orçamento</label>
                <input
                  type="date"
                  value={editValidUntil.includes("/") ? editValidUntil.split("/").reverse().join("-") : editValidUntil}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-");
                    setEditValidUntil(`${d}/${m}/${y}`);
                  }}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  required
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
            <DialogTitle className="text-slate-900 font-bold">Excluir Orçamento</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o orçamento {selectedQuote?.id}? Esta ação não pode ser desfeita.
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
