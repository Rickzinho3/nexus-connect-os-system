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
import { AnimatedAmountInput } from "@/components/ui/animated-amount-input";
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
import { Tooltip } from "@/components/motion/tooltip";
import { DollarSign, Search, PlusCircle, CreditCard, Banknote, Calendar, Edit3, Trash2 } from "lucide-react";
import { getSales, addSale, updateSale, deleteSale, getClients } from "@/app/actions";

interface Sale {
  id: string;
  client: string;
  paymentMethod: "Pix" | "Cartão" | "Dinheiro";
  amount: number;
  date: string;
}

interface ClientOption {
  id: string;
  name: string;
}

export function VendasView() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Pix" | "Cartão" | "Dinheiro">("Pix");
  const [amount, setAmount] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const salesList = await getSales();
      const clientList = await getClients();
      setSales(salesList as any);
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

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      await addSale({
        clientName: clientName || "Cliente de Balcão",
        paymentMethod,
        amount: parseFloat(amount),
      });

      setIsDialogOpen(false);
      // Reset form
      setClientName("");
      setPaymentMethod("Pix");
      setAmount("");
      // Reload
      await loadData();
      toast.success("Venda registrada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar venda");
    }
  };

  const handleEditClick = (sale: Sale) => {
    setSelectedSale(sale);
    setClientName(sale.client);
    setPaymentMethod(sale.paymentMethod);
    setAmount(sale.amount.toString());
    setIsEditOpen(true);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !amount) return;
    try {
      await updateSale(selectedSale.id, {
        clientName: clientName || "Cliente de Balcão",
        paymentMethod,
        amount: parseFloat(amount),
      });
      setIsEditOpen(false);
      setSelectedSale(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar venda");
    }
  };

  const handleDeleteClick = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSale) return;
    try {
      await deleteSale(selectedSale.id);
      setIsDeleteOpen(false);
      setSelectedSale(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir venda");
    }
  };

  const filteredSales = sales.filter((sale) => {
    return (
      sale.client.toLowerCase().includes(search.toLowerCase()) ||
      sale.id.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getPaymentIcon = (method: Sale["paymentMethod"]) => {
    switch (method) {
      case "Pix":
        return <Banknote className="w-3.5 h-3.5 text-slate-800 mr-1.5" />;
      case "Cartão":
        return <CreditCard className="w-3.5 h-3.5 text-slate-800 mr-1.5" />;
      case "Dinheiro":
        return <DollarSign className="w-3.5 h-3.5 text-slate-800 mr-1.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendas Diretas</h1>
          <p className="text-sm text-slate-500">
            Registre vendas de balcão (insumos, acessórios, carregadores) e faturamentos imediatos.
          </p>
        </div>

        {/* Dialog for New Sale */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="rounded-xl h-10 bg-slate-900 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto cursor-pointer" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Nova Venda
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleAddSale}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <DollarSign className="w-5 h-5 text-slate-900" /> Registrar Venda Direta
                </DialogTitle>
                <DialogDescription>
                  Gere o faturamento de acessórios ou componentes diretamente no caixa.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Cliente (Opcional)</label>
                  <Select value={clientName} onValueChange={(val) => setClientName(val || "")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione o cliente (ou balcão)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      <SelectItem value="Cliente de Balcão" className="rounded-lg">Cliente de Balcão</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.name} className="rounded-lg">
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Método de Pagamento</label>
                  <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod((val as any) || "Pix")}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                      <SelectItem value="Pix" className="rounded-lg">Pix</SelectItem>
                      <SelectItem value="Cartão" className="rounded-lg">Cartão de Crédito/Débito</SelectItem>
                      <SelectItem value="Dinheiro" className="rounded-lg">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Valor Recebido (R$)</label>
                  <AnimatedAmountInput value={amount} onChange={setAmount} />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size={"lg"}
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl border-slate-200 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button size={"lg"} type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
                  Confirmar Venda
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Filter */}
      <div className="flex bg-slate-50 p-3 rounded-2xl border border-slate-100 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="hidden md:block border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[120px] font-semibold text-slate-500">Código</TableHead>
              <TableHead className="font-semibold text-slate-500">Cliente</TableHead>
              <TableHead className="font-semibold text-slate-500">Método de Pagamento</TableHead>
              <TableHead className="font-semibold text-slate-500">Valor</TableHead>
              <TableHead className="font-semibold text-slate-500">Data</TableHead>
              <TableHead className="w-[80px] font-semibold text-slate-500 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Carregando vendas...
                </TableCell>
              </TableRow>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-slate-700">{sale.id}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{sale.client}</TableCell>
                  <TableCell className="text-slate-700 flex items-center font-medium">
                    {getPaymentIcon(sale.paymentMethod)}
                    {sale.paymentMethod}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    R$ {sale.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs font-semibold">{sale.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip content="Editar" side="top">
                        <Button size="icon" variant="ghost" onClick={() => handleEditClick(sale)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Excluir" side="top">
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(sale)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Nenhuma venda encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando vendas...</div>
        ) : filteredSales.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white border border-slate-200 rounded-3xl p-5 relative shadow-sm z-0">
                <div className="absolute top-4 left-4 right-4 h-28 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-2xl -z-10"></div>
                
                <div className="relative z-10 pt-16">
                  <div className="flex justify-between items-end">
                    <div className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center text-slate-700">
                      <Banknote className="w-8 h-8" />
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditClick(sale)} className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-900 cursor-pointer"><Edit3/></Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteClick(sale)} className="rounded-full bg-white text-slate-400 border-slate-200 hover:text-red-500 hover:bg-red-50 h-9 w-9 cursor-pointer"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{sale.client}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-sm text-slate-500 font-medium">
                        {getPaymentIcon(sale.paymentMethod)}
                        {sale.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">R$ {sale.amount.toFixed(2)}</div>
                      <div className="text-xs text-slate-400 font-semibold mt-1">{sale.date}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-5 text-sm text-slate-400">
                     <span>Cód: <span className="font-bold text-slate-700">{sale.id}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">Nenhuma venda encontrada.</div>
        )}
      </div>
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handleUpdateSale}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <Edit3 className="w-5 h-5 text-slate-900" /> Editar Venda
              </DialogTitle>
              <DialogDescription>
                Atualize os dados desta venda direta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Cliente (Opcional)</label>
                <Select value={clientName} onValueChange={(val) => setClientName(val || "")}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione o cliente (ou balcão)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 rounded-xl">
                    <SelectItem value="Cliente de Balcão" className="rounded-lg">Cliente de Balcão</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.name} className="rounded-lg">
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Método de Pagamento</label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod((val as any) || "Pix")}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 rounded-xl">
                    <SelectItem value="Pix" className="rounded-lg">Pix</SelectItem>
                    <SelectItem value="Cartão" className="rounded-lg">Cartão de Crédito/Débito</SelectItem>
                    <SelectItem value="Dinheiro" className="rounded-lg">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Valor Recebido (R$)</label>
                <AnimatedAmountInput value={amount} onChange={setAmount} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="lg" onClick={() => setIsEditOpen(false)} className="rounded-xl border-slate-200 cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" size="lg" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Excluir Venda</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir a venda "{selectedSale?.id}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="lg" onClick={() => setIsDeleteOpen(false)} className="rounded-xl border-slate-200 cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} size="lg" className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer">
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
