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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { Tooltip } from "@/components/motion/tooltip";
import { Search, PlusCircle, Edit3, Trash2, Tag, Percent } from "lucide-react";
import { getParts, addPart, updatePart, deletePart } from "@/app/actions";

interface Part {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
}

export function PecasView() {
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Form States (Create)
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [price, setPrice] = useState("");

  // Form States (Edit)
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editMinQuantity, setEditMinQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const loadParts = async () => {
    setLoading(true);
    try {
      const data = await getParts();
      setParts(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !category || !quantity || !minQuantity || !price) return;

    try {
      await addPart({
        sku: sku.trim().toUpperCase(),
        name,
        category,
        quantity: parseInt(quantity),
        minQuantity: parseInt(minQuantity),
        price: parseFloat(price),
      });

      setIsCreateOpen(false);
      setSku("");
      setName("");
      setCategory("");
      setQuantity("");
      setMinQuantity("");
      setPrice("");
      await loadParts();
      toast.success("Peça adicionada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar peça");
    }
  };

  const handleEditClick = (part: Part) => {
    setSelectedPart(part);
    setEditName(part.name);
    setEditCategory(part.category);
    setEditQuantity(part.quantity.toString());
    setEditMinQuantity(part.minQuantity.toString());
    setEditPrice(part.price.toString());
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !editName || !editCategory || !editQuantity || !editMinQuantity || !editPrice) return;

    try {
      await updatePart(selectedPart.sku, {
        name: editName,
        category: editCategory,
        quantity: parseInt(editQuantity),
        minQuantity: parseInt(editMinQuantity),
        price: parseFloat(editPrice),
      });

      setIsEditOpen(false);
      setSelectedPart(null);
      await loadParts();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar peça");
    }
  };

  const handleDeleteClick = (part: Part) => {
    setSelectedPart(part);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPart) return;
    try {
      await deletePart(selectedPart.sku);
      setIsDeleteOpen(false);
      setSelectedPart(null);
      await loadParts();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir peça");
    }
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(search.toLowerCase()) ||
      part.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "Todas" || part.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = ["Todas", "Telas", "Baterias", "Conectores", "Insumos", "CIs/Placa"];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Catálogo de Componentes</h1>
          <p className="text-sm text-slate-500">
            Consulte preços de venda, códigos SKU e categorias de componentes eletrônicos disponíveis no catálogo.
          </p>
        </div>

        {/* Dialog for New Part */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl h-10 bg-slate-900 text-white hover:bg-slate-800 gap-2 shrink-0 self-start sm:self-auto cursor-pointer" />}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Cadastrar Peça
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                  <Tag className="w-5 h-5 text-slate-900" /> Registrar Nova Peça
                </DialogTitle>
                <DialogDescription>
                  Adicione o código SKU e a quantidade inicial no catálogo de estoque.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">SKU Único</label>
                    <Input
                      placeholder="Ex: PEC-2006"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="rounded-xl border-slate-200 font-bold uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Categoria</label>
                    <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-100 rounded-xl">
                        {categories.filter(c => c !== "Todas").map(c => (
                          <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Nome do Componente</label>
                  <Input
                    placeholder="Ex: Tela LCD Compatível iPhone XR"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Qtd Atual</label>
                    <Input
                      type="number"
                      placeholder="Ex: 5"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Qtd Mínima</label>
                    <Input
                      type="number"
                      placeholder="Ex: 2"
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(e.target.value)}
                      className="rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Preço (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 180"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="rounded-xl border-slate-200 font-bold"
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
                  className="rounded-xl border-slate-200 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button size={"lg"} type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer">
                  Confirmar Cadastro
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
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              variant={categoryFilter === cat ? "default" : "outline"}
              className={`rounded-xl text-xs py-1.5 h-8 cursor-pointer ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Parts Table */}
      <div className="hidden md:block border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[120px] font-semibold text-slate-500">SKU</TableHead>
              <TableHead className="font-semibold text-slate-500">Nome da Peça</TableHead>
              <TableHead className="font-semibold text-slate-500">Categoria</TableHead>
              <TableHead className="font-semibold text-slate-500">Estoque Atual</TableHead>
              <TableHead className="font-semibold text-slate-500">Estoque Mínimo</TableHead>
              <TableHead className="font-semibold text-slate-500">Preço Unitário</TableHead>
              <TableHead className="font-semibold text-slate-500">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Carregando peças...
                </TableCell>
              </TableRow>
            ) : filteredParts.length > 0 ? (
              filteredParts.map((part) => {
                const isUnderMin = part.quantity < part.minQuantity;
                return (
                  <TableRow key={part.sku} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-700">{part.sku}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{part.name}</TableCell>
                    <TableCell className="text-slate-600">
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none rounded-lg text-xs">
                        {part.category}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-semibold ${isUnderMin ? "text-slate-500" : "text-slate-900"}`}>
                      {part.quantity} un
                    </TableCell>
                    <TableCell className="text-slate-500">{part.minQuantity} un</TableCell>
                    <TableCell className="font-bold text-slate-900">
                      R$ {part.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {isUnderMin ? (
                        <Badge className="bg-white text-slate-500 border border-slate-300 border-dashed hover:bg-slate-50 rounded-lg">
                          Abaixo do Mín.
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg">
                          Regular
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content="Editar" side="top">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditClick(part)}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Excluir" side="top">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteClick(part)}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Nenhuma peça encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando peças...</div>
        ) : filteredParts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredParts.map((part) => {
              const isUnderMin = part.quantity < part.minQuantity;
              return (
              <div key={part.sku} className="bg-white border border-slate-200 rounded-3xl p-5 relative shadow-sm z-0">
                <div className="absolute top-4 left-4 right-4 h-28 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-2xl -z-10"></div>
                
                <div className="relative z-10 pt-16">
                  <div className="flex justify-between items-end">
                    <div className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center text-slate-700">
                      <Tag className="w-8 h-8" />
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditClick(part)} className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-900 cursor-pointer"><Edit3/></Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteClick(part)} className="rounded-full bg-white text-slate-400 border-slate-200 hover:text-red-500 hover:bg-red-50 h-9 w-9 cursor-pointer"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-1">{part.name}</h3>
                      <Badge className="bg-slate-100 text-slate-600 border-none rounded-lg text-xs">
                        {part.category}
                      </Badge>
                    </div>
                    <div className="text-right pl-2">
                      <div className="text-lg font-black text-slate-900 whitespace-nowrap">R$ {part.price.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                     <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-500">Estoque Atual</span>
                        <span className={`text-base font-bold ${isUnderMin ? "text-red-600" : "text-slate-900"}`}>{part.quantity} un</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-500">Estoque Mínimo</span>
                        <span className="font-bold text-slate-700">{part.minQuantity} un</span>
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-5">
                     <div className="text-sm text-slate-400">
                        SKU: <span className="font-bold text-slate-700">{part.sku}</span>
                     </div>
                     <div>
                        {isUnderMin ? (
                          <Badge className="bg-white text-slate-500 border border-slate-300 border-dashed rounded-lg">Abaixo do Mín.</Badge>
                        ) : (
                          <Badge className="bg-slate-900 text-white rounded-lg">Regular</Badge>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">Nenhuma peça encontrada.</div>
        )}
      </div>

      {/* Edit Part Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-slate-100">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <Edit3 className="w-5 h-5 text-slate-900" /> Editar Peça
              </DialogTitle>
              <DialogDescription>
                Atualize as especificações, quantidade em estoque ou valor de venda da peça.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">SKU (Não Editável)</label>
                <Input value={selectedPart?.sku || ""} disabled className="rounded-xl border-slate-200 bg-slate-50 font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Nome do Componente</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Categoria</label>
                <Select value={editCategory} onValueChange={(val) => setEditCategory(val || "")}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 rounded-xl">
                    {categories.filter(c => c !== "Todas").map(c => (
                      <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Qtd Atual</label>
                  <Input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="rounded-xl border-slate-200 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Qtd Mínima</label>
                  <Input
                    type="number"
                    value={editMinQuantity}
                    onChange={(e) => setEditMinQuantity(e.target.value)}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Preço (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="rounded-xl border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline" size="lg"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl border-slate-200 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer">
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
            <DialogTitle className="text-slate-900 font-bold">Excluir Componente</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o componente "{selectedPart?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline" size="lg"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border-slate-200 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete} 
              size="lg"
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
