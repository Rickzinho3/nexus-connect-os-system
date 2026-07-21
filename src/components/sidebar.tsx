"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Target,
  Wrench,
  FileText,
  UsersRound,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  Landmark,
  BarChart3,
  UserRoundCheck,
  Settings,
  X,
  Compass,
  Building2,
  LogOut,
  Icon,
  ArrowLeft,
  Pencil,
  User,
  Phone,
  Mail,
  MapPin,
  Store,
  Save,
  FileDigit,
  Headset,
  PanelLeftOpen,
  PanelRightOpen
} from "lucide-react";
import { waveCircle } from "@lucide/lab"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSession, signOut } from "next-auth/react";
import { updateTenantProfile } from "@/app/actions";
import { Loader } from "./motion/loader";

export type TabId =
  | "dashboard"
  | "metas"
  | "os"
  | "orcamentos"
  | "clientes"
  | "pecas"
  | "estoque"
  | "vendas"
  | "financeiro"
  | "caixa"
  | "relatorios"
  | "funcionarios"
  | "configuracoes"
  | "guia"
  | "empresas";

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  closeMobile: () => void;
  tenantName?: string;
  tenantData?: any;
}

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  isMobileOpen,
  closeMobile,
  tenantName,
  tenantData,
}: SidebarProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Atendente";
  const userName = session?.user?.name || "Usuário";

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(tenantData?.profilePhoto || "");
  const [editBusinessName, setEditBusinessName] = useState(tenantData?.name || tenantName || "");
  const [editCpfCnpj, setEditCpfCnpj] = useState(tenantData?.cnpj || "");
  const [editPhone, setEditPhone] = useState(tenantData?.phone || "");
  const [editEmail, setEditEmail] = useState(tenantData?.email || "");
  const [editAddress, setEditAddress] = useState(tenantData?.address || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep state in sync if tenantData changes (e.g. after save + revalidation)
  useEffect(() => {
    if (tenantData) {
      setEditBusinessName(tenantData.name || "");
      setEditCpfCnpj(tenantData.cnpj || "");
      setEditPhone(tenantData.phone || "");
      setEditEmail(tenantData.email || "");
      setEditAddress(tenantData.address || "");
      setProfilePhoto(tenantData.profilePhoto || "");
    }
  }, [tenantData]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateTenantProfile({
        name: editBusinessName,
        cnpj: editCpfCnpj,
        phone: editPhone,
        email: editEmail,
        address: editAddress,
        profilePhoto: profilePhoto,
      });
      setIsProfileOpen(false);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const menuGroups: MenuGroup[] = [
    {
      title: "Gestão",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "metas", label: "Metas", icon: Target },
        { id: "os", label: "Ordens de Serviço", icon: Wrench },
        { id: "orcamentos", label: "Orçamentos", icon: FileText },
      ],
    },
    {
      title: "Comercial",
      items: [
        { id: "clientes", label: "Clientes", icon: UsersRound },
        { id: "pecas", label: "Peças", icon: Package },
        { id: "estoque", label: "Estoque", icon: Boxes },
        { id: "vendas", label: "Vendas", icon: ShoppingCart },
      ],
    },
  ];

  // Restrict Financeiro to Dono or Super Admin
  if (role === "Dono" || role === "Super Admin") {
    menuGroups.push({
      title: "Financeiro",
      items: [
        { id: "financeiro", label: "Financeiro", icon: Wallet },
        { id: "caixa", label: "Caixa", icon: Landmark },
        { id: "relatorios", label: "Relatórios", icon: BarChart3 },
      ],
    });
  } else {
    // Atendente só vê caixa
    menuGroups.push({
      title: "Financeiro",
      items: [
        { id: "caixa", label: "Caixa", icon: Landmark },
      ],
    });
  }

  menuGroups.push({
    title: "Suporte",
    items: [
      { id: "guia", label: "Guia do Portal", icon: Compass },
    ],
  });

  const adminGroup: MenuGroup | null =
    role === "Super Admin"
      ? {
          title: "Sistema (Admin)",
          items: [
            { id: "empresas", label: "Empresas", icon: Building2 },
            { id: "funcionarios", label: "Funcionários", icon: UserRoundCheck },
            { id: "configuracoes", label: "Configurações", icon: Settings },
          ],
        }
      : role === "Dono"
      ? {
          title: "Administração",
          items: [
            { id: "funcionarios", label: "Funcionários", icon: UserRoundCheck },
            { id: "configuracoes", label: "Configurações", icon: Settings },
          ],
        }
      : null;

  const renderGroup = (group: MenuGroup) => (
    <div key={group.title} className="mb-5">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-xs font-medium tracking-wider text-slate-500 uppercase">
          {group.title}
        </h3>
      )}
      <div className="space-y-1">
        {group.items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) {
                  closeMobile();
                }
              }}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center w-full py-2 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer gap-3 group text-left",
                isCollapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors duration-150",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 h-full flex flex-col py-6 bg-[#0c0b14] select-none text-slate-300 shrink-0 transition-all duration-300",
          isCollapsed ? "w-20 px-2" : "w-64 px-4",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header / Logo */}
        <div
          className={cn(
            "flex items-center gap-3 mb-6 shrink-0",
            isCollapsed ? "justify-center" : "justify-between px-3"
          )}
        >
          <div className="flex items-center gap-3">
            {/* <Icon iconNode={waveCircle}/> */}
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-wide truncate">{tenantName || "Empresa"}</span>
            )}
          </div>
          {!isCollapsed && (
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden text-slate-400 hover:text-white hover:bg-white/10 w-8 h-8 rounded-lg"
              onClick={closeMobile}
            >
              <PanelRightOpen className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Dynamic Groups */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          <nav className="space-y-6">
            {menuGroups.map(renderGroup)}
            {adminGroup && renderGroup(adminGroup)}
          </nav>
        </div>

        {/* User Profile / Logout */}
        <div className="pt-4 border-t border-slate-800/50 px-2 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 overflow-hidden hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors text-left flex-1 mr-2 cursor-pointer"
                onClick={() => setIsProfileOpen(true)}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-zinc-300 shrink-0">
                    {editBusinessName?.charAt(0)?.toUpperCase() || userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-sm font-medium text-slate-200 truncate">{editBusinessName || tenantName || userName}</div>
                  <div className="text-xs text-slate-500 truncate">{role}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className="cursor-pointer"
                onClick={() => setIsProfileOpen(true)}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-zinc-700" title={editBusinessName || userName} />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors" title={editBusinessName || userName}>
                    {editBusinessName?.charAt(0)?.toUpperCase() || userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}

          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogContent className="sm:max-w-[700px] bg-[#f8f9fc] p-0 border-0 rounded-[32px] text-slate-900 overflow-hidden shadow-2xl font-sans [&>button]:hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-2">
                <div
                  className="p-2 -ml-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <ArrowLeft className="w-5 h-5 text-slate-700" strokeWidth={2.5} />
                </div>
                <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Perfil</h2>
                <div className="w-9" />
              </div>

              <div className="px-5 pb-1 max-h-[80vh] overflow-y-auto no-scrollbar">
                {/* Profile Card */}
                <div className="bg-white rounded-[20px] p-4 mt-2 shadow-sm flex items-center gap-4">
                  <div 
                    className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 cursor-pointer shrink-0 group border border-slate-100"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-medium text-slate-400">
                        {editBusinessName?.charAt(0)?.toUpperCase() || "E"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                  />
                  <div className="flex flex-col flex-1 truncate justify-center">
                    <span className="font-semibold text-slate-900 text-[15px] truncate leading-snug">{editBusinessName || "Empresa"}</span>
                    <span className="text-[13px] text-slate-500 truncate mb-1">{editEmail || session?.user?.email || ""}</span>
                    <div 
                      className="flex items-center gap-1.5 text-[12px] font-medium text-slate-900 hover:bg-slate-200 px-2 py-0.5 rounded-[10px] transition-colors w-fit cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                      Alterar foto
                    </div>
                  </div>
                </div>

                {/* Dados da Assistência */}
                <div className="mt-6">
                  <h3 className="text-[13px] font-medium text-slate-500 mb-2 ml-1">Dados da Assistência</h3>
                  <div className="bg-white rounded-[20px] shadow-sm divide-y divide-slate-100">
                    <div className="flex items-center gap-3 p-[14px] px-4">
                      <Store className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={editBusinessName}
                        onChange={(e) => setEditBusinessName(e.target.value)}
                        placeholder="Nome da assistência"
                        className="flex-1 text-[14px] font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="flex items-center gap-3 p-[14px] px-4">
                      <FileDigit className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={editCpfCnpj}
                        onChange={(e) => setEditCpfCnpj(e.target.value)}
                        placeholder="CPF / CNPJ"
                        className="flex-1 text-[14px] font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="mt-6">
                  <h3 className="text-[13px] font-medium text-slate-500 mb-2 ml-1">Contato</h3>
                  <div className="bg-white rounded-[20px] shadow-sm divide-y divide-slate-100">
                    <div className="flex items-center gap-3 p-[14px] px-4">
                      <Phone className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="flex-1 text-[14px] font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="flex items-center gap-3 p-[14px] px-4">
                      <Mail className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Email comercial"
                        className="flex-1 text-[14px] font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="mt-6">
                  <h3 className="text-[13px] font-medium text-slate-500 mb-2 ml-1">Endereço</h3>
                  <div className="bg-white rounded-[20px] shadow-sm divide-y divide-slate-100">
                    <div className="flex items-center gap-3 p-[14px] px-4">
                      <MapPin className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Endereço completo"
                        className="flex-1 text-[14px] font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Salvar */}
                <div className="mt-6 my-auto mb-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[14px] font-semibold h-10 rounded-[16px] transition-colors shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? <>"Salvando" <Loader className="text-white" variant="metaballs" /> </> : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </aside>
    </>
  );
}
