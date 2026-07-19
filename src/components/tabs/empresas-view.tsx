"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Pencil, Trash2, CheckCircle2, Copy, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getTenants, createTenant, updateTenant, deleteTenant } from "@/app/actions";
import { Tooltip } from "@/components/motion/tooltip";
import { useToast } from "@/components/providers/toast-provider";

const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  } else {
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }
};

export function EmpresasView() {
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", cnpj: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cnpj: formatCpfCnpj(e.target.value) });
  };

  const [successCreds, setSuccessCreds] = useState<{ login: string; password: string } | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<any>(null);

  const fetchTenants = async () => {
    try {
      const data = await getTenants();
      setTenants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openAddModal = () => {
    setEditingTenant(null);
    setFormData({ name: "", cnpj: "", phone: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: any) => {
    setEditingTenant(tenant);
    setFormData({ name: tenant.name, cnpj: tenant.cnpj || "", phone: tenant.phone || "" });
    setIsModalOpen(true);
  };

  const confirmDelete = (tenant: any) => {
    setTenantToDelete(tenant);
  };

  const executeDelete = async () => {
    if (!tenantToDelete) return;
    setLoading(true);
    try {
      await deleteTenant(tenantToDelete.id);
      setTenants(tenants.filter(t => t.id !== tenantToDelete.id));
      setTenantToDelete(null);
      showToast({ title: "Empresa excluída com sucesso", status: "success" });
    } catch (err) {
      console.error(err);
      showToast({ title: "Erro ao excluir a empresa", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTenant) {
        await updateTenant(editingTenant.id, formData);
        setTenants(tenants.map(t => t.id === editingTenant.id ? { ...t, ...formData } : t));
        setIsModalOpen(false);
        showToast({ title: "Empresa atualizada com sucesso", status: "success" });
      } else {
        const res = await createTenant(formData);
        if (res.success && res.credentials) {
          setIsModalOpen(false);
          setSuccessCreds(res.credentials);
          showToast({ title: "Empresa criada com sucesso", status: "success" });
        }
      }
    } catch (err) {
      console.error(err);
      showToast({ title: "Erro ao salvar a empresa", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Gestão de Empresas
          </h1>
          <p className="text-slate-500 mt-2">
            Área exclusiva do Super Admin para gerenciar as empresas clientes (Tenants).
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-slate-900 hover:bg-slate-800 text-slate-200 gap-2 cursor-pointer">
          <PlusCircle className="w-4 h-4" />
          Nova Empresa
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-slate-100 text-sm font-medium text-slate-500 bg-slate-50/50">
          <div className="col-span-2">Empresa</div>
          <div>CNPJ</div>
          <div>Telefone</div>
          <div>Data de Cadastro</div>
          <div className="text-right">Ações</div>
        </div>

        {initialLoading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma empresa cadastrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="grid grid-cols-6 gap-4 p-4 items-center text-sm group hover:bg-slate-50 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{tenant.name}</div>
                    <div className="text-slate-400 text-xs">{tenant.id}</div>
                  </div>
                </div>
                <div className="text-slate-600">{tenant.cnpj || "-"}</div>
                <div className="text-slate-600">{tenant.phone || "-"}</div>
                <div className="text-slate-500">
                  {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                </div>
                <div className="flex items-center justify-end gap-2 transition-opacity">
                  <Tooltip content="Editar">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(tenant)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Excluir">
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(tenant)} className="text-red-400 hover:text-red-500 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>{editingTenant ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingTenant ? "Altere os dados da empresa abaixo." : "Preencha os dados para registrar uma nova empresa cliente."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">Nome da Empresa</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white border-slate-200 focus-visible:ring-slate-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-slate-700">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={handleCnpjChange}
                maxLength={18}
                required
                className="bg-white border-slate-200 focus-visible:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white border-slate-200 focus-visible:ring-slate-900"
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-slate-200 cursor-pointer">
                {loading ? "Salvando..." : "Salvar Empresa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Success Credentials */}
      <Dialog open={!!successCreds} onOpenChange={(open) => {
        if(!open) {
          setSuccessCreds(null);
          fetchTenants(); // Recarrega os dados pra garantir
        }
      }}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              Empresa Criada com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              A empresa foi registrada. Copie as credenciais abaixo e envie para o dono acessar o sistema pela primeira vez.
            </DialogDescription>
          </DialogHeader>

          {successCreds && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 mt-4 relative">
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Login (CNPJ)</Label>
                <div className="font-mono text-slate-900 text-lg font-medium">{successCreds.login}</div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Senha Provisória</Label>
                <div className="font-mono text-slate-900 text-lg font-medium flex items-center justify-between">
                  {successCreds.password}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer" onClick={() => navigator.clipboard.writeText(`Login: ${successCreds.login}\nSenha: ${successCreds.password}`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button onClick={() => { setSuccessCreds(null); fetchTenants(); }} className="bg-slate-900 hover:bg-slate-800 text-slate-200 w-full cursor-pointer">
              Feito, já copiei!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Deletion Confirm */}
      <Dialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-red-600">Excluir Empresa</DialogTitle>
            <DialogDescription className="text-slate-500">
              Tem certeza que deseja excluir a empresa <span className="font-semibold text-slate-700">{tenantToDelete?.name}</span>? Todos os dados vinculados a ela serão perdidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setTenantToDelete(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
              Cancelar
            </Button>
            <Button type="button" disabled={loading} onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
              {loading ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
