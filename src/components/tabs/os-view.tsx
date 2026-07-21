"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Search, PlusCircle, FileText, Smartphone, PenTool, Edit3, Trash2, CheckCircle, Camera, Eye } from "lucide-react";
import { 
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { getServiceOrders, addServiceOrder, updateServiceOrder, deleteServiceOrder, getClients } from "@/app/actions";
import { Tooltip } from "@/components/motion/tooltip";
import { toast } from "sonner";

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
  const router = useRouter();
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
  const [photoPreviews, setPhotoPreviews] = useState<{file: File, url: string}[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreviews(prev => [...prev, { file, url: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

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
        photos: photoPreviews.map(p => p.url),
      });

      setIsCreateOpen(false);
      setSelectedClientId("");
      setDeviceName("");
      setServiceType("");
      setValue("");
      setNotes("");
      setPhotoPreviews([]);
      await loadData();
      toast.success("O.S. criada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar O.S.");
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
      toast.success("O.S. atualizada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar O.S.");
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
      toast.success("O.S. excluída com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir O.S.");
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
          <DialogTrigger render={<Button className="rounded-xl h-10 bg-slate-900 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto" />}>
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

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-500">Fotos do Aparelho (Chegada)</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Camera className="w-5 h-5 mb-1 text-slate-400" />
                        <span className="text-xs font-medium">Adicionar imagens</span>
                      </div>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    {photoPreviews.length > 0 && (
                      <AttachmentGroup>
                        {photoPreviews.map((preview, idx) => (
                          <Attachment key={idx} size="sm" className="bg-slate-50">
                            <AttachmentMedia variant="image">
                              <img src={preview.url} alt={`Preview ${idx}`} />
                            </AttachmentMedia>
                            <AttachmentContent>
                              <AttachmentTitle className="text-xs truncate max-w-24">{preview.file.name}</AttachmentTitle>
                              <AttachmentDescription>{(preview.file.size / 1024).toFixed(0)} KB</AttachmentDescription>
                            </AttachmentContent>
                            <AttachmentActions>
                              <AttachmentAction 
                                onClick={() => setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))} 
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </AttachmentAction>
                            </AttachmentActions>
                          </Attachment>
                        ))}
                      </AttachmentGroup>
                    )}
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
      <div className="hidden md:block border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
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
                      <Tooltip content="Ver Detalhes e Fotos">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => router.push(`/os/${order.id}`)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Editar">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditClick(order)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Excluir">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(order)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Nenhuma ordem de serviço encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando ordens de serviço...</div>
        ) : filteredOrders.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-5 relative shadow-sm z-0">
                <div className="absolute top-4 left-4 right-4 h-28 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-2xl -z-10"></div>
                
                <div className="relative z-10 pt-16">
                  <div className="flex justify-between items-end">
                    <div className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center text-slate-700">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditClick(order)} className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-900 cursor-pointer"><Edit3/></Button>
                      <Button variant="outline" size="icon" onClick={() => router.push(`/os/${order.id}`)} className="rounded-full bg-white text-slate-700 hover:text-slate-900 border-slate-200 h-9 w-9 cursor-pointer"><Eye className="w-4 h-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteClick(order)} className="rounded-full bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 cursor-pointer"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{order.client}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-0.5">{order.device}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="font-semibold text-slate-900">Serviço:</span> <br/>
                     {order.serviceType}
                  </div>

                  <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-5">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">O.S. / Data</div>
                      <div className="text-sm font-bold text-slate-900">#{order.id}</div>
                      <div className="text-xs text-slate-500">{order.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Valor Total</div>
                      <div className="text-lg font-black text-slate-900">R$ {order.value.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">Nenhuma ordem de serviço encontrada.</div>
        )}
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
