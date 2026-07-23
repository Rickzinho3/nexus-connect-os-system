"use client";

import React, { useState, useEffect } from "react";
import { queryOSByAccessCodeAndCpf } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/motion/popover";
import {
  Smartphone,
  Calendar,
  Wrench,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  ArrowRight,
  LogOut,
  FolderOpen,
  Bell,
  Search,
  Gift,
  Copy,
  Check,
  Menu,
  X,
  Ticket,
  XCircle,
  Layers,
  Eye,
  Share,
} from "lucide-react";
import { Loader } from "@/components/motion/loader";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tooltip } from "@/components/motion/tooltip";

interface TrackedOS {
  id: string;
  deviceName: string;
  serviceType: string;
  value: number;
  status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
  date: string;
  notes?: string | null;
}

interface TrackedQuote {
  id: string;
  deviceName: string;
  description: string;
  value: number;
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Expirado";
  validUntil: string;
}

interface TrackedResult {
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
    cpfCnpj: string;
    accessCode: string;
  };
  orders: TrackedOS[];
  quotes: TrackedQuote[];
}

type PortalTab = "ativos" | "historico" | "promocoes" | "cadastro";

export default function ClientPortal() {
  const [accessCode, setAccessCode] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<PortalTab>("ativos");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Bom dia");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);

  // Responsive sidebar default
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSidebarOpen(window.innerWidth > 768);
    }
  }, []);

  // Greeting based on current local hour
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
  }, []);

  // Automatic session recovery on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("clientPortalSession");
    if (savedSession) {
      try {
        const { accessCode: savedCode, cpfCnpj: savedCpf } = JSON.parse(savedSession);
        if (savedCode && savedCpf) {
          setLoading(true);
          queryOSByAccessCodeAndCpf(savedCode, savedCpf).then((data) => {
            if (data) {
              setResult(data as any);
              setAccessCode(savedCode);
              setCpfCnpj(savedCpf);
            } else {
              localStorage.removeItem("clientPortalSession");
            }
            setLoading(false);
          }).catch(() => {
            localStorage.removeItem("clientPortalSession");
            setLoading(false);
          });
        }
      } catch (e) {
        localStorage.removeItem("clientPortalSession");
      }
    }
  }, []);

  // Input mask helpers
  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 11) {
      return clean
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .substring(0, 14);
    } else {
      return clean
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
        .substring(0, 18);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim() || !cpfCnpj.trim()) return;

    setLoading(true);
    setError("");

    try {
      const data = await queryOSByAccessCodeAndCpf(accessCode, cpfCnpj);
      if (data) {
        setResult(data as any);
        setActiveTab("ativos");
        localStorage.setItem(
          "clientPortalSession",
          JSON.stringify({ accessCode: accessCode.trim(), cpfCnpj: cpfCnpj.trim() })
        );
      } else {
        setResult(null);
        setError("Autenticação falhou. Verifique se o código de acesso e o CPF/CNPJ informados estão corretos.");
      }
    } catch (err) {
      setError("Erro de comunicação com o banco de dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setResult(null);
    setAccessCode("");
    setCpfCnpj("");
    localStorage.removeItem("clientPortalSession");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Computations
  const completedRepairsCount = result?.orders.filter(o => o.status === "Concluído").length || 0;
  const activeOSList = result?.orders.filter(o => o.status === "Pendente" || o.status === "Em Andamento") || [];
  const activeOSBalance = activeOSList.reduce((acc, curr) => acc + curr.value, 0);

  // Timeline Step Resolver
  const getStatusStep = (status: TrackedOS["status"]) => {
    switch (status) {
      case "Pendente": return 1;
      case "Em Andamento": return 2;
      case "Concluído": return 3;
      default: return 0;
    }
  };

  const getStatusBadge = (status: any) => {
    switch (status) {
      case "Pendente":
        return <Badge className="bg-white text-slate-900 border border-slate-300 border-dashed rounded-xl text-xs font-semibold">Pendente</Badge>;
      case "Em Andamento":
        return <Badge className="bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold">Em Reparo</Badge>;
      case "Concluído":
      case "Aprovado":
        return <Badge className="bg-emerald-600 text-emerald-200 border-transparent rounded-xl text-xs font-semibold">Pronto</Badge>;
      case "Cancelado":
      case "Rejeitado":
        return <Badge className="bg-red-600 text-red-200 border-transparent rounded-xl text-xs font-semibold">Cancelado</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-400 border border-slate-300 rounded-xl text-xs font-semibold">Expirado</Badge>;
    }
  };

  const getQuoteStatusBadge = (status: any) => {
    switch (status) {
      case "Aprovado":
        return <Badge className="bg-emerald-600 text-emerald-200 border-transparent rounded-xl text-xs font-semibold">Aprovado</Badge>;
      case "Cancelado":
      case "Rejeitado":
        return <Badge className="bg-red-600 text-red-200 border border-red-300 rounded-xl text-xs font-semibold">Cancelado</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-400 border border-slate-300 rounded-xl text-xs font-semibold">Expirado</Badge>;
    }
  };

  // Vouchers Configuration
  const vouchers = [
    {
      id: "bronze",
      title: "Vale-Desconto Bronze",
      benefit: "5% OFF em Acessórios",
      required: 2,
      code: "BRONZE5",
      color: "from-slate-100 to-slate-200 border-slate-300 text-white bg-linear-to-r from-orange-500 to-orange-600",
      bgClass: "bg-white",
      percentage: "5% OFF"
    },
    {
      id: "prata",
      title: "Vale-Desconto Prata",
      benefit: "10% OFF em Peças",
      required: 4,
      code: "PRATA10",
      color: "from-slate-200 to-slate-300 border-slate-400 text-white bg-linear-to-r from-slate-500 to-slate-600",
      bgClass: "bg-white",
      percentage: "10% OFF"
    },
    {
      id: "ouro",
      title: "Vale-Desconto Ouro",
      benefit: "15% OFF Geral (Mão de Obra)",
      required: 6,
      code: "OURO15",
      color: "from-slate-300 to-slate-400 border-transparent text-white bg-linear-to-r from-yellow-500 to-yellow-600",
      bgClass: "bg-white",
      percentage: "15% OFF"
    }
  ];

const route = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased">
      
      {/* 1. Login Full Screen View */}
      {!result ? (
        <div className="flex-1 flex items-center justify-center bg-zinc-950 p-4 md:p-8 font-sans w-full min-h-screen">
          <div className="w-full max-w-[900px] bg-[#1c1c1e] rounded-3xl shadow-2xl flex overflow-hidden border border-zinc-800/50">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
              <div className="max-w-[320px] w-full mx-auto mt-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-zinc-100 mb-2">Portal do Cliente</h2>
                <p className="text-sm text-zinc-400 mb-8">
                  Acompanhe seus consertos e acesse benefícios.
                </p>

                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">
                      CPF ou CNPJ
                    </label>
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(formatCPF(e.target.value))}
                      className="h-11 bg-[#141415] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 rounded-lg text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">
                      Código de Acesso
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="CLI-XXXXXX"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        className="h-11 bg-[#141415] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 rounded-lg text-sm uppercase tracking-widest"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-b from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 text-white font-medium h-11 rounded-lg border border-zinc-600/50 shadow-inner mt-4 transition-all"
                  >
                    {loading ? <Loader variant="metaballs" size={50} className="text-white" /> : "Acessar Portal"}
                  </Button>
                </form>
                
                <div className="mt-12 text-center">
                  <p className="text-xs text-zinc-500">
                    Não sabe seu código? <button className="text-zinc-300 font-medium hover:text-white cursor-pointer" onClick={() => route.push("https://wa.me/5598984575955/")}>Fale conosco</button>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden lg:flex w-1/2 p-2">
              <div className="w-full h-full bg-[#050505] rounded-[20px] relative overflow-hidden flex flex-col items-center justify-center border border-white/[0.02]">
                
                {/* Minimalist Starfield */}
                <div className="absolute inset-0">
                  <div className="absolute top-[15%] left-[20%] w-[2px] h-[2px] bg-white/40 rounded-full"></div>
                  <div className="absolute top-[45%] left-[10%] w-[2px] h-[2px] bg-white/30 rounded-full"></div>
                  <div className="absolute top-[25%] right-[25%] w-[1.5px] h-[1.5px] bg-white/50 rounded-full"></div>
                  <div className="absolute bottom-[35%] left-[30%] w-[1.5px] h-[1.5px] bg-white/20 rounded-full"></div>
                  <div className="absolute bottom-[20%] right-[15%] w-[2px] h-[2px] bg-white/40 rounded-full"></div>
                  <div className="absolute top-[60%] right-[35%] w-[1px] h-[1px] bg-white/30 rounded-full"></div>
                </div>

                {/* Shooting Star Top Left */}
                <div className="absolute top-[20%] left-[25%] z-10">
                  <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"></div>
                  <div className="w-[1px] h-[120px] bg-gradient-to-b from-white/80 via-white/20 to-transparent mx-auto"></div>
                </div>

                {/* Shooting Star Bottom Right */}
                <div className="absolute bottom-[20%] right-[25%] z-10 rotate-180">
                  <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"></div>
                  <div className="w-[1px] h-[160px] bg-gradient-to-b from-white/80 via-white/20 to-transparent mx-auto"></div>
                </div>

                {/* Main Planet */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-300 via-blue-200 to-white shadow-[0_0_50px_rgba(219,234,254,0.15)] relative z-10 overflow-hidden flex items-center justify-center">
                  {/* Inner shadow to give 3D sphere effect */}
                  <div className="absolute inset-0 rounded-full shadow-[inset_-12px_-12px_24px_rgba(0,0,0,0.7)]"></div>
                  {/* Subtle texture/glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-60"></div>
                </div>

                {/* Small Moon */}
                <div className="absolute top-[30%] right-[20%] w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden">
                  <div className="absolute inset-0 rounded-full shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.6)]"></div>
                </div>

                {/* Logo */}
                <div className="absolute bottom-10 flex items-center gap-2 z-10">
                  <span className="text-white font-bold tracking-[0.2em] text-sm lowercase">nexus connect</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Full-Page Dark Minimalist Desktop Dashboard Layout */
        <div className="flex-1 flex flex-col md:flex-row min-h-screen relative overflow-hidden">
          
          {/* Left Sidebar Menu */}
          <aside className={`bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 z-40 transition-all duration-300 absolute md:static inset-y-0 left-0 md:h-auto h-screen shadow-xl md:shadow-none ${
            sidebarOpen ? "w-64 opacity-100 translate-x-0" : "w-0 p-0 opacity-0 -translate-x-full overflow-hidden border-r-0"
          }`}>
            <div className="space-y-6">
              
              {/* Branding and Logo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-sm tracking-tight text-slate-900">ÁREA DO CLIENTE</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 rounded-lg text-slate-400 hover:text-slate-900"
                >
                  <Image src="/close-circle.svg" width={20} height={20} alt="close"/>
                </Button>
              </div>

              {/* Sidebar Menu items */}
              <nav className="space-y-1">
                {[
                  { id: "ativos", label: "Aparelhos Ativos", icon: Smartphone },
                  { id: "historico", label: "Histórico Geral", icon: Clock },
                  { id: "promocoes", label: "Minhas Promoções", icon: Gift },
                  { id: "cadastro", label: "Meus Dados", icon: User }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        // Auto-close sidebar on mobile
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl cursor-pointer flex items-center gap-3 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Logout at bottom */}
            <div className="pt-4 border-t border-slate-200 mt-4">
              <div className="flex items-center justify-between pb-3.5 mb-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 truncate uppercase tracking-wider">Código Cliente</p>
                  <p className="text-xs font-bold text-slate-900 truncate">{result.client.accessCode}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full h-9 rounded-xl border border-rose-950/30 text-slate-900 hover:text-slate-800 hover:bg-slate-100 gap-2 text-xs font-bold"
              >
                {/* <LogOut className="w-4 h-4" /> Sair do Portal */}
                Sair do Portal
                <Image src="/logout-slate-900.svg" width={20} height={20} alt="Sair"/>
              </Button>
            </div>
          </aside>

          {/* Overlay for mobile when sidebar is open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Dashboard Content Area */}
          <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl w-full mx-auto space-y-8 pb-16 transition-all duration-300">
            
            {/* Top Greeting Header Bar (inspired by Morning, Wahid) */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarOpen(true)}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{greeting},</p>
                  <h3 className="text-2xl font-black text-slate-900">{result.client.name}</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-xs px-3.5 h-10 gap-1 shadow-sm">
                  Código: {result.client.accessCode}
                </Badge>
                {/* <Popover align="end" sideOffset={12}>
                  <PopoverTrigger>
                    <Button size="icon" variant="ghost" className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm relative">
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-white shadow-2xl border border-slate-100 rounded-[24px] overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h4 className="font-bold text-slate-900">Notificações</h4>
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">Marcar lidas</Badge>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      <div className="p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Orçamento Aprovado</p>
                          <p className="text-xs text-slate-500 mt-1">O conserto do seu aparelho foi iniciado.</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">Há 2 horas</p>
                        </div>
                      </div>
                      <div className="p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Novo Benefício!</p>
                          <p className="text-xs text-slate-500 mt-1">Você desbloqueou um novo voucher de desconto.</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">Ontem</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
                      <button className="text-xs font-bold text-slate-600 hover:text-slate-900">Ver todas as notificações</button>
                    </div>
                  </PopoverContent>
                </Popover> */}
              </div>
            </header>

            {/* Main Balance display ($25,362.36 layout for full desktop screen) */}
            <section className="grid gap-6 md:grid-cols-3">
              <Card className="col-span-1 md:col-span-2 border border-slate-200 bg-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Serviços em Triagem / Reparo</span>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                    R$ {activeOSBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </h2>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-900 font-bold">{activeOSList.length} Consertos Ativos</span>
                  <a
                    href="https://wa.me/5598984575955"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-slate-900 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    Falar com Suporte <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </Card>

              {/* Sidebar score/quick info card */}
              <Card className="border border-slate-200 bg-white rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[160px]">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Histórico de Consertos</span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {completedRepairsCount} Concluídos
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {completedRepairsCount >= 2 
                    ? "Seu voucher de desconto já está desbloqueado! Acesse a aba 'Minhas Promoções'."
                    : "Complete suas duas primeiras ordens de serviço na assistência e ganhe 5% de desconto."}
                </p>
              </Card>
            </section>

            {/* Sub-Views Content Pages */}
            <section className="pt-2">
              
              {/* A. Tab: Active Repairs (Ativos) */}
              {activeTab === "ativos" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">Ordens em Manutenção</h4>
                      <p className="text-xs text-slate-500">Consulte diagnósticos e andamento físico dos aparelhos na bancada.</p>
                    </div>
                  </div>

                  {activeOSList.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {activeOSList.map((order) => {
                        const step = getStatusStep(order.status);
                        return (
                          <Card key={order.id} className="border border-slate-200 bg-white rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-xs font-black text-slate-500 block">{order.id}</span>
                                <h5 className="font-extrabold text-base text-slate-900">{order.deviceName}</h5>
                                <p className="text-xs font-semibold text-slate-900">{order.serviceType}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <span className="text-xs text-slate-400 font-bold block">Abertura: {order.date}</span>
                                {getStatusBadge(order.status)}
                              </div>
                            </div>

                            {order.notes && (
                              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
                                <b>Laudo Técnico preliminar:</b> {order.notes}
                              </div>
                            )}

                            {/* Interactive timeline details */}
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                              <div className="flex justify-between text-xs font-bold text-slate-400">
                                <span className={step >= 1 ? "text-slate-900 font-black" : ""}>Triagem & Análise</span>
                                <span className={step >= 2 ? "text-slate-900 font-black" : ""}>Reparo Técnico</span>
                                <span className={step >= 3 ? "text-slate-900 font-black" : ""}>Pronto Retirada</span>
                              </div>
                              <Progress value={step === 1 ? 33 : step === 2 ? 66 : step === 3 ? 100 : 0} className="h-2 bg-slate-100 [&>div]:bg-slate-200 rounded-full" />
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl text-slate-500 text-sm space-y-2 shadow-sm">
                      <FolderOpen className="w-10 h-10 mx-auto text-slate-700" />
                      <p>Nenhum equipamento em conserto ativo neste momento.</p>
                    </div>
                  )}
                </div>
              )}

              {/* B. Tab: History (Histórico) */}
              {activeTab === "historico" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Histórico Geral de Serviços</h4>
                    <p className="text-xs text-slate-500">Consulte orçamentos aprovados/rejeitados e ordens concluídas.</p>
                  </div>
                  
                  {(() => {
                    const deviceNames = new Set([
                      ...result.orders.map(o => o.deviceName),
                      ...result.quotes.map(q => q.deviceName)
                    ]);
                    
                    const groups = Array.from(deviceNames).map(deviceName => ({
                      deviceName,
                      orders: result.orders.filter(o => o.deviceName === deviceName),
                      quotes: result.quotes.filter(q => q.deviceName === deviceName)
                    }));

                    return (
                      <>
                        {/* Desktop View */}
                        <div className="hidden md:flex flex-col gap-8">
                          {groups.map(group => (
                            <div key={`desk-${group.deviceName}`} className="border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-xl">
                              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                  <Smartphone className="w-5 h-5 text-slate-500" />
                                  {group.deviceName}
                                </h5>
                                <Badge variant="outline" className="text-slate-500 bg-white shadow-sm border-slate-200">{group.orders.length} O.S. | {group.quotes.length} Orçamentos</Badge>
                              </div>
                              <Table>
                                <TableHeader className="bg-white border-b border-slate-100">
                                  <TableRow>
                                    <TableHead className="font-semibold text-slate-500 w-[140px]">Tipo</TableHead>
                                    <TableHead className="font-semibold text-slate-500 w-[120px]">Documento</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Descrição / Serviço</TableHead>
                                    <TableHead className="font-semibold text-slate-500 w-[140px]">Valor Cobrado</TableHead>
                                    <TableHead className="font-semibold text-slate-500 w-[140px]">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-500 w-[100px]">Ação</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.orders.map(o => (
                                    <TableRow key={`os-${o.id}`} className="hover:bg-slate-50/30 border-b border-slate-100">
                                      <TableCell><Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none">Ordem (O.S.)</Badge></TableCell>
                                      <TableCell className="font-bold text-slate-700">{o.id}</TableCell>
                                      <TableCell className="text-slate-600 font-medium text-sm">{o.serviceType}</TableCell>
                                      <TableCell className="font-bold text-slate-900">R$ {o.value.toFixed(2)}</TableCell>
                                      <TableCell>{getStatusBadge(o.status)}</TableCell>
                                      <TableCell>
                                        <Tooltip content="Ver detalhes">
                                          <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900 rounded-xl px-2 cursor-pointer" onClick={() => route.push(`/os/${o.id}`)}>
                                            <Eye className="w-4 h-4" /> Ver
                                          </Button>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {group.quotes.map(q => (
                                    <TableRow key={`q-${q.id}`} className="hover:bg-slate-50/30 border-b border-slate-100 bg-slate-50/30">
                                      <TableCell><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none shadow-none">Orçamento</Badge></TableCell>
                                      <TableCell className="font-bold text-slate-500">{q.id}</TableCell>
                                      <TableCell className="text-slate-600 font-medium text-sm">{q.description}</TableCell>
                                      <TableCell className="font-bold text-slate-900">R$ {q.value.toFixed(2)}</TableCell>
                                      <TableCell>{getQuoteStatusBadge(q.status)}</TableCell>
                                      <TableCell>Nenhuma</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                          {groups.length === 0 && (
                            <div className="border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-xl py-12 text-center flex flex-col items-center gap-3">
                              <Layers className="w-10 h-10 text-slate-300" />
                              <p className="text-slate-500 text-sm font-medium">Nenhuma ordem finalizada ou orçamento no histórico.</p>
                            </div>
                          )}
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden flex flex-col gap-10">
                          {groups.map(group => (
                            <div key={`mob-${group.deviceName}`} className="relative flex flex-col">
                              {/* Group Header */}
                              <div className="flex items-center justify-between mb-4 sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md py-2 border-b border-slate-200/50">
                                <div className="flex items-center gap-3">
                                  <div className="bg-slate-200/60 p-2.5 rounded-2xl">
                                    {/* <Smartphone className="w-5 h-5 text-slate-700" /> */}
                                    <Image src={"/mobile.svg"} alt="Mobile" width={24} height={24}/>
                                  </div>
                                  <h5 className="font-black text-slate-800 text-lg tracking-tight">{group.deviceName}</h5>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-5 pl-2 relative">
                                {/* Timeline line */}
                                <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-slate-900/50 z-10 rounded-full"></div>

                                {group.orders.map(o => (
                                  <div key={`mob-os-${o.id}`} className="bg-[#0f1115] text-white border border-slate-800 rounded-[32px] p-6 relative shadow-xl z-0 ml-10 before:absolute before:w-6 before:h-[2px] before:bg-slate-900/50 before:-left-6 before:top-14">
                                    <div className="flex items-start gap-4">
                                      <div className="w-[72px] h-[72px] shrink-0 rounded-[24px] bg-white flex items-center justify-center shadow-inner">
                                        <Layers className="w-8 h-8 text-slate-900 drop-shadow-md" />
                                      </div>
                                      <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-xl font-bold tracking-tight leading-tight truncate text-white">{o.serviceType}</h3>
                                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                          Ordem de Serviço finalizada com sucesso.
                                        </p>
                                        <div className="flex items-center gap-3 mt-4">
                                          <Button onClick={() => route.push(`/os/${o.id}`)} className="bg-white hover:bg-slate-200 text-slate-900 rounded-full flex items-center justify-center gap-2 font-bold px-2 h-8 text-[11px] cursor-pointer">
                                            <Image src={"/iconsax-eye-slate-500.svg"} alt="Olho" width={20} height={20} className=""/>
                                            VER DETALHES
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-800">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Valor</span>
                                        <span className="text-lg font-bold text-white leading-none">R$ {o.value.toFixed(2)}</span>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</span>
                                        {getStatusBadge(o.status)}
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Doc</span>
                                        <span className="text-sm font-bold text-slate-300">{o.id}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {group.quotes.map(q => (
                                  <div key={`mob-q-${q.id}`} className="bg-[#0f1115] text-white border border-slate-800 rounded-[32px] p-6 relative shadow-xl z-0 ml-10 before:absolute before:w-6 before:h-[2px] before:bg-slate-900/50 before:-left-6 before:top-14">
                                    <div className="flex items-start gap-4">
                                      <div className="w-[72px] h-[72px] shrink-0 rounded-[24px] bg-white flex items-center justify-center shadow-inner">
                                        <FileText className="w-8 h-8 text-slate-900 drop-shadow-md" />
                                      </div>
                                      <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-xl font-bold tracking-tight leading-tight truncate text-white">{q.description}</h3>
                                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                          Orçamento de manutenção registrado.
                                        </p>
                                        <div className="flex items-center gap-3 mt-4">
                                          <Badge className="bg-white/10 hover:bg-white/20 text-white border-none rounded-full font-bold px-4 h-8 text-[10px]">
                                            ORÇAMENTO
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-800">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Valor</span>
                                        <span className="text-lg font-bold text-white leading-none">R$ {q.value.toFixed(2)}</span>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</span>
                                        {getQuoteStatusBadge(q.status)}
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Doc</span>
                                        <span className="text-sm font-bold text-slate-300">{q.id}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {groups.length === 0 && (
                            <div className="text-center py-12 flex flex-col items-center gap-3">
                              <Layers className="w-10 h-10 text-slate-300" />
                              <p className="text-slate-500 text-sm font-medium">Nenhuma ordem finalizada ou orçamento no histórico.</p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* C. Tab: Promotions (Promoções) */}
              {activeTab === "promocoes" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Vouchers e Recompensas de Fidelidade</h4>
                    <p className="text-xs text-slate-500">Complete ordens de serviço e desbloqueie cupons de desconto.</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-3">
                    {vouchers.map((v) => {
                      const isUnlocked = completedRepairsCount >= v.required;
                      const percent = Math.min(100, (completedRepairsCount / v.required) * 100);

                      return (
                        <Card key={v.id} className={`border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between min-h-[220px] ${v.bgClass}`}>
                          <div className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                              <Badge className={`bg-slate-900 border text-[9px] rounded-lg ${v.color}`}>
                                {isUnlocked ? "Cupom Liberado" : `Requer ${v.required} Reparo(s)`}
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              <h5 className="font-black text-base text-slate-900 leading-tight">{v.title}</h5>
                              <p className="text-xs text-slate-500 font-bold">{v.benefit}</p>
                            </div>
                          </div>

                          <div className="p-5 pt-0 space-y-2">
                            {isUnlocked ? (
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={() => setSelectedVoucher(v)}
                                  className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95 border-none"
                                >
                                  <Ticket className="w-4 h-4" /> Apresentar Cupom
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => copyToClipboard(v.code)}
                                  className="w-full h-9 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
                                >
                                  {copiedCode === v.code ? (
                                    <>
                                      <Check className="w-4 h-4 text-green-600" /> Copiado
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4" /> Copiar Código ({v.code})
                                    </>
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-400 font-bold">
                                  <span>Falta(m) {v.required - completedRepairsCount} reparo(s)</span>
                                  <span>{Math.round(percent)}%</span>
                                </div>
                                <Progress value={percent} className="h-1.5 [&>div]:bg-slate-300 rounded-full" />
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* D. Tab: Profile (Cadastro) */}
              {activeTab === "cadastro" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Ficha Cadastral do Cliente</h4>
                    <p className="text-xs text-slate-500">Consulte suas informações pessoais registradas no sistema.</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {[
                      { icon: "/user.svg", label: "CPF / CNPJ", value: result.client.cpfCnpj },
                      { icon: "/call.svg", label: "Telefone de Contato", value: result.client.phone },
                      { icon: "/email-snow.svg", label: "Endereço de E-mail", value: result.client.email },
                      { icon: "/location.svg", label: "Endereço Residencial", value: result.client.address }
                    ].map((info, idx) => {
                      return (
                        <Card key={idx} className="border border-slate-200 bg-white rounded-3xl p-5 flex items-center gap-4 shadow-xl">
                          <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shrink-0">
                            <Image src={info.icon} alt="" width={20} height={20} />
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{info.label}</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{info.value}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

            </section>
          </main>
        </div>
      )}

      {/* Flight-Ticket Coupon Modal */}
      <Dialog open={!!selectedVoucher} onOpenChange={(open) => !open && setSelectedVoucher(null)}>
        <DialogContent className="max-w-[340px] p-0 bg-transparent border-none shadow-none flex flex-col items-center justify-center select-none outline-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Apresentar Cupom</DialogTitle>
            <DialogDescription>
              Apresente o cupom ao atendente da assistência técnica.
            </DialogDescription>
          </DialogHeader>

          {selectedVoucher && (
            <div className="w-[310px] filter drop-shadow-2xl flex flex-col rounded-3xl overflow-hidden font-sans">
              
              {/* TOP TICKET SECTION (Orange) */}
              <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 relative flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  CUPOM FIDELIDADE
                </span>
                
                {/* Airplane-ticket style layout header */}
                <div className="flex w-full items-center justify-between mt-3 text-xs font-bold opacity-90 px-2">
                  <span>DESCONTO</span>
                  <div className="h-[1px] flex-1 bg-white/30 mx-2 relative">
                    <div className="w-1.5 h-1.5 bg-white rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <span>EXCLUSIVO</span>
                </div>
                
                {/* Large visual Discount Rate */}
                <h1 className="text-5xl font-black tracking-tighter mt-4 mb-2 drop-shadow-md">
                  {selectedVoucher.percentage}
                </h1>
                
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-black/15 px-3 py-1 rounded-full text-orange-100">
                  {selectedVoucher.title}
                </span>
              </div>

              {/* TICKET TEAR-OFF LINE SEPARATOR */}
              <div className="relative h-6 bg-transparent flex items-center justify-center">
                {/* Left Hole Cutout */}
                <div className="w-6 h-6 rounded-full bg-slate-950 absolute -left-3 top-1/2 -translate-y-1/2 z-10" />
                
                {/* Dashed line */}
                <div className="w-full border-t border-dashed border-slate-300 absolute left-0" />
                
                {/* Right Hole Cutout */}
                <div className="w-6 h-6 rounded-full bg-slate-950 absolute -right-3 top-1/2 -translate-y-1/2 z-10" />
              </div>

              {/* BOTTOM TICKET SECTION (White) */}
              <div className="bg-white text-slate-800 p-6 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Beneficiário</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 truncate max-w-full uppercase">
                  {result?.client.name}
                </span>

                <div className="border-t border-slate-100 w-full my-4" />

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-left w-full text-xs font-semibold text-slate-500">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Código Cupom</span>
                    <span className="text-slate-900 font-extrabold text-xs uppercase tracking-wider mt-0.5 block">{selectedVoucher.code}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Meta Atingida</span>
                    <span className="text-slate-900 font-extrabold text-xs mt-0.5 block">{selectedVoucher.required} Conserto(s)</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Voucher Categoria</span>
                    <span className="text-slate-900 font-extrabold text-xs uppercase tracking-wider mt-0.5 block">{selectedVoucher.id}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Cliente ID</span>
                    <span className="text-slate-900 font-extrabold text-xs mt-0.5 block">{result?.client.accessCode}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 w-full my-4" />

                {/* Barcode Render SVG */}
                <div className="w-full flex flex-col items-center">
                  <svg className="w-full h-14" viewBox="0 0 100 40">
                    <rect x="5" y="0" width="2" height="40" fill="black" />
                    <rect x="8" y="0" width="1" height="40" fill="black" />
                    <rect x="10" y="0" width="3" height="40" fill="black" />
                    <rect x="14" y="0" width="1" height="40" fill="black" />
                    <rect x="16" y="0" width="4" height="40" fill="black" />
                    <rect x="22" y="0" width="1" height="40" fill="black" />
                    <rect x="24" y="0" width="2" height="40" fill="black" />
                    <rect x="27" y="0" width="3" height="40" fill="black" />
                    <rect x="31" y="0" width="1" height="40" fill="black" />
                    <rect x="33" y="0" width="4" height="40" fill="black" />
                    <rect x="38" y="0" width="1" height="40" fill="black" />
                    <rect x="40" y="0" width="2" height="40" fill="black" />
                    <rect x="43" y="0" width="3" height="40" fill="black" />
                    <rect x="47" y="0" width="1" height="40" fill="black" />
                    <rect x="49" y="0" width="4" height="40" fill="black" />
                    <rect x="54" y="0" width="2" height="40" fill="black" />
                    <rect x="57" y="0" width="1" height="40" fill="black" />
                    <rect x="59" y="0" width="3" height="40" fill="black" />
                    <rect x="63" y="0" width="1" height="40" fill="black" />
                    <rect x="65" y="0" width="4" height="40" fill="black" />
                    <rect x="70" y="0" width="2" height="40" fill="black" />
                    <rect x="73" y="0" width="1" height="40" fill="black" />
                    <rect x="75" y="0" width="3" height="40" fill="black" />
                    <rect x="79" y="0" width="1" height="40" fill="black" />
                    <rect x="81" y="0" width="4" height="40" fill="black" />
                    <rect x="86" y="0" width="2" height="40" fill="black" />
                    <rect x="89" y="0" width="1" height="40" fill="black" />
                    <rect x="91" y="0" width="3" height="40" fill="black" />
                  </svg>
                  <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1.5 uppercase">
                    *{selectedVoucher.code}*
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
