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
import { Users, Search, PlusCircle, Mail, Phone, Smartphone, Edit3, Trash2, Key, Copy, Check, Printer } from "lucide-react";
import { getClients, addClient, updateClient, deleteClient } from "@/app/actions";
import { Tooltip } from "@/components/motion/tooltip";
import { useToast } from "@/components/providers/toast-provider";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  cpfCnpj: string;
  accessCode: string;
  status: "Ativo" | "Inativo";
}

// Regex formatting helpers for live masks
function formatCPFOrCNPJ(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 11) {
    // CPF: 000.000.000-00
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substring(0, 14);
  } else {
    // CNPJ: 00.000.000/0000-00
    return clean
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .substring(0, 18);
  }
}

function formatPhone(value: string) {
  const clean = value.replace(/\D/g, "");
  return clean
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
}

export function ClientesView() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Custom Card/Copy states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newlyCreatedClient, setNewlyCreatedClient] = useState<Client | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);

  // Form State (Create)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");

  // Form State (Edit)
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCpfCnpj, setEditCpfCnpj] = useState("");
  const [editStatus, setEditStatus] = useState<"Ativo" | "Inativo">("Ativo");

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !cpfCnpj) return;

    try {
      const created = await addClient({
        name,
        email,
        phone,
        address,
        cpfCnpj,
      });
      setIsCreateOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCpfCnpj("");
      await loadClients();

      if (created) {
        setNewlyCreatedClient(created as any);
        setIsCardOpen(true);
      }
      showToast({ title: "Cliente cadastrado com sucesso", status: "success" });
    } catch (err) {
      console.error(err);
      showToast({ title: "Erro ao cadastrar cliente", status: "error" });
    }
  };

  const handlePrintCard = (client: Client) => {
    if (typeof window === "undefined") return;
    const portalUrl = `${window.location.origin}/portal`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portalUrl)}`;
    const printWindow = window.open("", "_blank", "width=600,height=500");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cartão de Acesso - ${client.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
               justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .card {
              width: 360px;
              background: white;
              border: 2px solid #0f172a;
              border-radius: 20px;
              padding: 24px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              box-sizing: border-box;
              text-align: center;
            }
            .logo {
              font-size: 16px;
              font-weight: 900;
              letter-spacing: -0.025em;
              color: #0f172a;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .client-name {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 10px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 13px;
              font-weight: 600;
              color: #475569;
            }
            .info-value {
              color: #0f172a;
              font-weight: 800;
            }
            .qr-container {
              margin: 20px 0;
              display: flex;
              justify-content: center;
            }
            .qr-container img {
              border: 1px solid #e2e8f0;
              padding: 8px;
              border-radius: 12px;
              background: white;
            }
            .footer-text {
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
              margin-top: 10px;
            }
            @media print {
              body {
                background: white;
                height: auto;
              }
              .card {
                box-shadow: none;
                border: 1.5px solid #0f172a;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">🔑 Portal do Cliente</div>
            <h2 class="client-name">${client.name}</h2>
            <div style="border-top: 1px dashed #cbd5e1; margin: 15px 0;"></div>
            <div class="info-row">
              <span>CPF / CNPJ:</span>
              <span class="info-value">${client.cpfCnpj}</span>
            </div>
            <div class="info-row">
              <span>CÓDIGO DE ACESSO:</span>
              <span class="info-value" style="font-family: monospace; font-size: 14px; letter-spacing: 1px;">${client.accessCode}</span>
            </div>
            <div class="qr-container">
              <img src="${qrUrl}" width="130" height="130" alt="QR Code" />
            </div>
            <div class="footer-text">
              Escaneie o QR Code acima para acompanhar seus aparelhos e orçamentos em tempo real!
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditAddress(client.address);
    setEditCpfCnpj(client.cpfCnpj);
    setEditStatus(client.status);
    setIsEditOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !editName || !editEmail || !editPhone || !editAddress || !editCpfCnpj || !editStatus) return;

    try {
      await updateClient(selectedClient.id, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        cpfCnpj: editCpfCnpj,
        status: editStatus,
      });
      setIsEditOpen(false);
      setSelectedClient(null);
      await loadClients();
      showToast({ title: "Cliente atualizado com sucesso", status: "success" });
    } catch (err) {
      console.error(err);
      showToast({ title: "Erro ao atualizar cliente", status: "error" });
    }
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;
    try {
      await deleteClient(selectedClient.id);
      setIsDeleteOpen(false);
      setSelectedClient(null);
      await loadClients();
      showToast({ title: "Cliente excluído com sucesso", status: "success" });
    } catch (err) {
      console.error(err);
      showToast({ title: "Erro ao excluir cliente", status: "error" });
    }
  };

  const filteredClients = clients.filter((client) => {
    return (
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      (client.address && client.address.toLowerCase().includes(search.toLowerCase())) ||
      client.id.toLowerCase().includes(search.toLowerCase()) ||
      client.accessCode.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">
            Cadastre novos clientes, gerencie dados de contato e consulte códigos de acesso ao portal.
          </p>
        </div>

        {/* Dialog for New Client */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Novo Cliente
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleAddClient}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <Users className="w-5 h-5 text-slate-900" /> Cadastrar Cliente
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações para registrar o cliente no banco de dados.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                  <Input
                    placeholder="Ex: Amanda Santos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">CPF / CNPJ</label>
                  <Input
                    placeholder="Ex: 000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(formatCPFOrCNPJ(e.target.value))}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="Ex: amanda@exemplo.com"
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
                      placeholder="Ex: (11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="pl-10 rounded-xl border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Endereço Completo</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Ex: Av. Paulista, 1000"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
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
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border-slate-200"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Filter */}
      <div className="flex bg-slate-50 p-3 rounded-2xl border border-slate-100 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, email, telefone ou código de acesso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-500">CPF/CNPJ</TableHead>
              <TableHead className="font-semibold text-slate-500">Nome</TableHead>
              <TableHead className="font-semibold text-slate-500">Email</TableHead>
              <TableHead className="font-semibold text-slate-500">Telefone</TableHead>
              <TableHead className="font-semibold text-slate-500">Código de Acesso</TableHead>
              <TableHead className="font-semibold text-slate-500">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Carregando clientes...
                </TableCell>
              </TableRow>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-slate-700 text-xs">{client.cpfCnpj}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{client.name}</TableCell>
                  <TableCell className="text-slate-600">{client.email}</TableCell>
                  <TableCell className="text-slate-600 font-medium">{client.phone}</TableCell>
                  <TableCell className="text-slate-800 font-black text-sm">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 rounded-lg gap-1">
                        <Key className="w-3.5 h-3.5" />
                        {client.accessCode}
                      </Badge>
                      <Tooltip content="Copiar Código">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(client.accessCode);
                            setCopiedId(client.id);
                            setTimeout(() => setCopiedId(null), 2000);
                            showToast({ title: "Código copiado", status: "info" });
                          }}
                          className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-900"
                        >
                          {copiedId === client.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600 animate-in fade-in zoom-in duration-200" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.status === "Ativo" ? (
                      <Badge className="bg-slate-900 text-white border-transparent hover:bg-slate-800 rounded-lg">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 rounded-lg">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content="Imprimir Cartão">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setNewlyCreatedClient(client);
                            setIsCardOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Editar">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditClick(client)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Excluir">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(client)}
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
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handleUpdateClient}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <Edit3 className="w-5 h-5 text-slate-900" /> Editar Ficha do Cliente
              </DialogTitle>
              <DialogDescription>
                Modifique os dados de contato ou desative a conta do cliente.
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
                <label className="text-xs font-semibold text-slate-500">CPF / CNPJ</label>
                <Input
                  value={editCpfCnpj}
                  onChange={(e) => setEditCpfCnpj(formatCPFOrCNPJ(e.target.value))}
                  className="rounded-xl border-slate-200 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Email</label>
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
                    onChange={(e) => setEditPhone(formatPhone(e.target.value))}
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
                      <SelectItem value="Inativo" className="rounded-lg">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Endereço Completo</label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="rounded-xl border-slate-200"
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
            <DialogTitle className="text-slate-900 font-bold">Excluir Cliente</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o cliente "{selectedClient?.name}"? Todas as ordens de serviço vinculadas serão deletadas em cascata.
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

      {/* Dialog do Cartão de Acesso */}
      <Dialog open={isCardOpen} onOpenChange={(open) => !open && setIsCardOpen(false)}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100 p-6 flex flex-col items-center">
          <DialogHeader className="w-full text-center">
            <DialogTitle className="text-slate-900 font-bold text-lg flex items-center justify-center gap-2">
              <Printer className="w-5 h-5 text-slate-900" /> Cartão de Acesso
            </DialogTitle>
            <DialogDescription>
              Visualize e imprima o cartão do cliente para entrega física.
            </DialogDescription>
          </DialogHeader>

          {newlyCreatedClient && (
            <div className="my-6 flex flex-col items-center w-full">
              {/* Card visual mockup */}
              <div className="w-[340px] bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-white/5 rounded-full" />
                
                <div className="font-black text-sm uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-1.5">
                  <Key className="w-4 h-4" /> Portal do Cliente
                </div>
                
                <h3 className="text-xl font-extrabold truncate max-w-full text-white">{newlyCreatedClient.name}</h3>
                
                <div className="border-t border-slate-800/80 my-4" />
                
                <div className="space-y-3 text-xs text-slate-400 font-medium">
                  <div className="flex justify-between">
                    <span>CPF / CNPJ:</span>
                    <span className="text-white font-extrabold">{newlyCreatedClient.cpfCnpj}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Código de Acesso:</span>
                    <span className="text-white font-extrabold font-mono tracking-widest bg-white/10 px-2 py-0.5 rounded text-sm">
                      {newlyCreatedClient.accessCode}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center mt-5 p-2 bg-white rounded-2xl w-fit mx-auto border border-slate-700">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                      typeof window !== "undefined" ? `${window.location.origin}/portal` : ""
                    )}`}
                    width="110"
                    height="110"
                    alt="Portal QR Code"
                    className="rounded-lg"
                  />
                </div>
                
                <p className="text-[10px] text-slate-500 font-medium mt-4">
                  Aponte a câmera para o QR Code para acessar seus aparelhos ativos.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex w-full gap-3 mt-6">
                <Button
                  onClick={() => handlePrintCard(newlyCreatedClient)}
                  className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 border-none"
                >
                  <Printer className="w-4.5 h-4.5" /> Imprimir Cartão
                </Button>
                {/* <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCardOpen(false)}
                  className="rounded-xl border-slate-200 font-bold"
                >
                  Fechar
                </Button> */}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
