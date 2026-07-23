"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getServiceOrderById } from "@/app/actions";
import { ArrowLeft, Smartphone, User, FileText, Camera, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/motion/popover";

export default function OSDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getServiceOrderById(id).then(data => {
        setOrder(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 animate-pulse font-medium">Carregando detalhes da O.S...</div>;
  if (!order) return <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
    <p className="text-slate-500 font-medium">O.S. não encontrada.</p>
    <Button variant="outline" onClick={() => router.push("/portal")}>Voltar para o Portal</Button>
  </div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pendente":
        return <Badge className="bg-white text-slate-500 border border-slate-300 border-dashed px-4 h-10 py-1 text-sm">Pendente</Badge>;
      case "Em Andamento":
        return <Badge className="bg-slate-100 text-slate-700 border border-slate-300 px-4 h-10 py-1 text-sm">Em Andamento</Badge>;
      case "Concluído":
        return <Badge className="bg-emerald-500 text-white px-4 h-10 py-1 text-sm">Concluído</Badge>;
      case "Cancelado":
        return <Badge className="bg-slate-100 text-slate-400 line-through px-4 h-10 py-1 text-sm">Cancelado</Badge>;
      default:
        return <Badge className="px-3 py-1 text-sm">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans selection:bg-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => router.push("/portal")} className="gap-2 text-slate-500 hover:text-slate-900 rounded-xl px-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Portal
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              Detalhes da O.S. <span className="text-slate-300 font-light">/</span> <span className="text-slate-600">{order.id}</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">Registrada em {order.date}</p>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(order.status)}
            <Popover align="start" side="bottom" sideOffset={8}>
              <PopoverTrigger>
                <Button variant="outline" size="icon" className="relative rounded-full h-10 w-10 border-slate-200">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl border-slate-100 shadow-xl overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" /> Notificações
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Acompanhe as atualizações da sua O.S.</p>
                </div>
                <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                  <div className="flex gap-3 items-start">
                    <div className="bg-emerald-100 p-2 rounded-full mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Status atualizado</p>
                      <p className="text-xs text-slate-500 mt-0.5">A sua ordem de serviço agora está com status de: {order.status}.</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {order.updatedAt 
                          ? `${new Date(order.updatedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}, ${new Date(order.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`
                          : order.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start opacity-70">
                    <div className="bg-slate-100 p-2 rounded-full mt-0.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Ordem registrada</p>
                      <p className="text-xs text-slate-500 mt-0.5">O.S. {order.id} foi registrada com sucesso no sistema.</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {order.createdAt 
                          ? `${new Date(order.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}, ${new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`
                          : order.date}
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50 pb-4">
              <CardTitle className="text-[14px] flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4 text-slate-400" /> Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Nome</p>
                <p className="text-lg font-bold text-slate-900">{order.client}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Telefone</p>
                  <p className="text-sm text-slate-700 font-medium">{order.clientPhone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-slate-700 font-medium truncate" title={order.clientEmail}>{order.clientEmail || "Não informado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50 pb-4">
              <CardTitle className="text-[14px] flex items-center gap-2 text-slate-600">
                <Smartphone className="w-4 h-4 text-slate-400" /> Aparelho e Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Dispositivo</p>
                <p className="text-lg font-bold text-slate-900">{order.device}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Serviço Solicitado</p>
                <p className="text-sm font-semibold text-slate-700 bg-slate-100 p-2.5 rounded-xl inline-block mt-1">{order.serviceType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Valor Estimado</p>
                <p className="text-xl font-black text-slate-900">R$ {order.value.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white rounded-3xl border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] flex items-center gap-2 text-slate-600">
              <FileText className="w-4 h-4 text-slate-400" /> Observações e Laudo Técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {order.notes || "Nenhuma observação técnica registrada."}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-3xl border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] flex items-center gap-2 text-slate-600">
              <Camera className="w-4 h-4 text-slate-400" /> Fotos do Aparelho (Chegada)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            {order.photos && order.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {order.photos.map((photo: string, idx: number) => (
                  <Dialog key={idx}>
                    <DialogTrigger render={
                      <div className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-slate-300 transition-all shadow-sm">
                        <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    } />
                    <DialogContent className="max-w-4xl bg-transparent border-none shadow-none flex justify-center items-center h-[90vh]">
                      <img src={photo} alt={`Foto ${idx + 1}`} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium text-sm">Nenhuma foto foi anexada a esta Ordem de Serviço.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
