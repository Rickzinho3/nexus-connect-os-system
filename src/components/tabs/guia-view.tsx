"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Copy,
  Check,
  Printer,
  Search,
  User,
  Smartphone,
  Key,
  CheckCircle2,
  Ticket,
  Send,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { getClients } from "@/app/actions";

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

export function GuiaView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [portalUrl, setPortalUrl] = useState("http://localhost:3000/portal");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPortalUrl(`${window.location.origin}/portal`);
    }
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data as Client[]);
      if (data && data.length > 0) {
        setSelectedClient(data[0] as Client);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getShareMessage = (client: Client) => {
    return `Olá, ${client.name}! Para acompanhar o status do seu aparelho e consultar seus orçamentos em tempo real, acesse o nosso Portal do Cliente:\n\n🔗 ${portalUrl}\n\n🔑 Seu Código de Acesso: ${client.accessCode}\n📄 Seu CPF/CNPJ: ${client.cpfCnpj}\n\nLá você também pode resgatar cupons de desconto exclusivos!`;
  };

  const handleCopyMessage = (client: Client) => {
    navigator.clipboard.writeText(getShareMessage(client));
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleSendWhatsApp = (client: Client) => {
    let cleanPhone = client.phone.replace(/\D/g, "");
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = "55" + cleanPhone; // Add Brazil country code if missing
    }
    const message = getShareMessage(client);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePrintCard = (client: Client) => {
    if (typeof window === "undefined") return;
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
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
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
              line-height: 1.4;
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

  const filteredClients = clients.filter((c) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const matchesName = c.name.toLowerCase().includes(query);
    const matchesCode = c.accessCode.toLowerCase().includes(query);

    const digitsOnlyQuery = query.replace(/\D/g, "");
    const matchesCpf = digitsOnlyQuery.length > 0
      ? c.cpfCnpj.replace(/\D/g, "").includes(digitsOnlyQuery)
      : false;

    return matchesName || matchesCode || matchesCpf;
  });

  const mainQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    portalUrl
  )}`;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Guia de Acesso ao Portal</h1>
        <p className="text-sm text-slate-500">
          Ajude os clientes a acessar o Portal do Cliente para acompanhar o andamento de seus reparos e resgatar cupons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Guide Steps */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-slate-900 animate-spin-slow" /> Como o Cliente Acessa?
              </CardTitle>
              <CardDescription>Instruções gerais passo a passo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-900 text-sm">
                  1
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-900 leading-none">Acessar a URL do Portal</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    O cliente deve abrir o navegador e acessar o endereço do portal. Você pode copiar o link ou mostrar o QR Code.
                  </p>
                  
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700 select-all break-all pr-12 relative">
                    <span className="truncate">{portalUrl}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyLink}
                      className="w-8 h-8 rounded-lg absolute right-1 top-1 text-slate-400 hover:text-slate-955 hover:bg-slate-200"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-900 text-sm">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-slate-900 leading-none">Inserir Credenciais</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    No formulário de login do portal, o cliente precisará informar:
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      <span>CPF ou CNPJ do Titular</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>Código de Acesso exclusivo (ex: CLI-MARK94)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-900 text-sm">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-slate-900 leading-none">Navegar pelas Abas</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Após logar, ele tem acesso às informações e ações exclusivas dele:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 rounded-lg justify-start gap-1 py-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Status da OS
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 rounded-lg justify-start gap-1 py-1">
                      <Compass className="w-3 h-3 text-blue-500" /> Orçamentos
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 rounded-lg justify-start gap-1 py-1">
                      <Ticket className="w-3 h-3 text-orange-500" /> Vouchers Desconto
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 rounded-lg justify-start gap-1 py-1">
                      <User className="w-3 h-3 text-purple-500" /> Dados Cadastrais
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex flex-col items-center">
                <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-inner">
                  <img src={mainQrCodeUrl} width="140" height="140" alt="QR Code do Portal" className="rounded-lg" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">
                  Aponte a câmera para testar o portal
                </span>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Search & Action Utility */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-slate-100 shadow-sm rounded-2xl flex flex-col h-full min-h-[500px]">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-900" /> Buscar e Enviar Acesso
              </CardTitle>
              <CardDescription>Selecione um cliente para copiar ou enviar instruções personalizadas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col flex-1 gap-6">
              
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, CPF/CNPJ ou código de acesso..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-white border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Layout splits into lists of search results & detailed share action */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-stretch min-h-[300px]">
                
                {/* Search Results list */}
                <div className="md:col-span-5 border border-slate-100 rounded-xl overflow-y-auto max-h-[340px] p-2 space-y-1 bg-slate-50/50">
                  {loading ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium">
                      Carregando clientes...
                    </div>
                  ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`w-full p-2.5 rounded-lg text-left text-xs transition-all flex flex-col gap-1 border ${
                          selectedClient?.id === client.id
                            ? "bg-slate-900 border-slate-600 text-white font-bold shadow-md shadow-slate-900/10"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="font-extrabold truncate w-full">{client.name}</span>
                        <div className="flex justify-between items-center w-full text-[10px] opacity-90 mt-0.5">
                          <span>{client.cpfCnpj}</span>
                          <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{client.accessCode}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium">
                      Nenhum cliente encontrado.
                    </div>
                  )}
                </div>

                {/* Dispatch / Share Options Card */}
                <div className="md:col-span-7 flex flex-col justify-between border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  {selectedClient ? (
                    <div className="flex flex-col justify-between h-full space-y-4">
                      
                      {/* Customer Details Display */}
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cliente Selecionado</span>
                            <h4 className="font-black text-sm text-slate-900 truncate leading-tight uppercase mt-0.5">
                              {selectedClient.name}
                            </h4>
                          </div>
                          <Badge className="bg-slate-100 text-slate-900 border-none rounded-lg text-[9px] uppercase tracking-wider font-extrabold">
                            {selectedClient.status}
                          </Badge>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Código de Acesso</span>
                            <span className="font-mono text-slate-900 font-extrabold tracking-wider mt-0.5 block uppercase">
                              {selectedClient.accessCode}
                            </span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">CPF / CNPJ</span>
                            <span className="text-slate-900 font-extrabold mt-0.5 block">
                              {selectedClient.cpfCnpj}
                            </span>
                          </div>
                        </div>

                        {/* Text Message Preview */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pré-visualização da Mensagem</span>
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 font-semibold leading-relaxed max-h-[140px] overflow-y-auto whitespace-pre-wrap select-all select-none border-dashed border-slate-300">
                            {getShareMessage(selectedClient)}
                          </div>
                        </div>
                      </div>

                      {/* Dispatch Controls */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleCopyMessage(selectedClient)}
                            variant="outline"
                            className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 h-10 gap-1.5 text-xs font-bold transition-all active:scale-95"
                          >
                            {copiedMsg ? (
                              <>
                                <Check className="w-4 h-4 text-green-600" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" /> Copiar Mensagem
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handlePrintCard(selectedClient)}
                            variant="outline"
                            className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 h-10 gap-1.5 text-xs font-bold transition-all active:scale-95"
                          >
                            <Printer className="w-4 h-4 text-slate-600" /> Imprimir Cartão
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => handleSendWhatsApp(selectedClient)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 border-none shadow-md shadow-slate-900/10"
                        >
                          <Send className="w-4 h-4" /> Enviar Credenciais via WhatsApp
                        </Button>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 p-8">
                      <Smartphone className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-xs font-medium max-w-[200px] leading-relaxed">
                        Nenhum cliente selecionado. Escolha um cliente na lista ao lado para compartilhar.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
