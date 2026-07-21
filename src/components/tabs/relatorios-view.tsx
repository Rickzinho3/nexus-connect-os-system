"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Printer, RefreshCw, FileText } from "lucide-react";
import { getCashLogs, getServiceOrders, getParts, getSales } from "@/app/actions";

export function RelatoriosView() {
  const [reportType, setReportType] = useState("financeiro");
  const [period, setPeriod] = useState("30");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // Real Data States
  const [cashLogs, setCashLogs] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  const parseDate = (dateVal: any) => {
    if (!dateVal) return new Date(0);
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === "number") return new Date(dateVal);
    const str = String(dateVal);
    const parts = str.split(" ")[0].split("/");
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return new Date(str);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowReport(false);
    
    try {
      const p = parseInt(period);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - p);
      
      if (reportType === "financeiro") {
        const logs = await getCashLogs();
        setCashLogs(logs.filter((l: any) => parseDate(l.createdAt || l.time || l.date) >= cutoffDate));
      } else if (reportType === "os") {
        const os = await getServiceOrders();
        setServiceOrders(os.filter((o: any) => parseDate(o.date || o.createdAt) >= cutoffDate));
      } else if (reportType === "estoque") {
        const pList = await getParts();
        setParts(pList);
      } else if (reportType === "vendas") {
        const s = await getSales();
        setSales(s.filter((sItem: any) => parseDate(sItem.date || sItem.createdAt) >= cutoffDate));
      }
      
      setShowReport(true);
      toast.success("Relatório gerado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case "financeiro":
        return "Relatório Balancete Financeiro Mensal";
      case "os":
        return "Relatório de Produtividade de O.S.";
      case "estoque":
        return "Relatório Inventário Físico e Peças";
      case "vendas":
        return "Relatório Demonstrativo de Vendas Diretas";
      default:
        return "Relatório Gerencial";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportXLS = () => {
    const title = getReportTitle();
    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <h2>${title}</h2>
        <p>Período: Últimos ${period} dias | Extraído em: ${new Date().toLocaleDateString("pt-BR")}</p>
        <table border="1" style="border-collapse: collapse;">
    `;

    if (reportType === "financeiro") {
      tableHTML += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th>Descrição</th>
          <th>Tipo</th>
          <th>Valor (R$)</th>
          <th>Data</th>
        </tr>
      `;
      cashLogs.forEach(log => {
        const v = typeof log.value === 'number' ? log.value : parseFloat(log.value);
        const dateStr = log.time || (log.createdAt ? parseDate(log.createdAt).toLocaleDateString("pt-BR") : "");
        tableHTML += `<tr><td>${log.description}</td><td>${log.type}</td><td>${v.toFixed(2)}</td><td>${dateStr}</td></tr>`;
      });
    } else if (reportType === "os") {
      tableHTML += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th>Código O.S.</th>
          <th>Aparelho</th>
          <th>Serviço Efetuado</th>
          <th>Valor Total (R$)</th>
          <th>Status</th>
          <th>Data</th>
        </tr>
      `;
      serviceOrders.forEach(os => {
        const v = typeof os.value === 'number' ? os.value : parseFloat(os.value);
        tableHTML += `<tr><td>${os.id}</td><td>${os.deviceName}</td><td>${os.serviceType}</td><td>${v.toFixed(2)}</td><td>${os.status}</td><td>${os.date}</td></tr>`;
      });
    } else if (reportType === "estoque") {
      tableHTML += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th>SKU</th>
          <th>Componente</th>
          <th>Categoria</th>
          <th>Estoque Atual</th>
          <th>Estoque Mínimo</th>
          <th>Preço Unitário (R$)</th>
        </tr>
      `;
      parts.forEach(p => {
        const v = typeof p.price === 'number' ? p.price : parseFloat(p.price);
        tableHTML += `<tr><td>${p.sku}</td><td>${p.name}</td><td>${p.category}</td><td>${p.quantity}</td><td>${p.minQuantity}</td><td>${v.toFixed(2)}</td></tr>`;
      });
    } else {
      tableHTML += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th>Código Venda</th>
          <th>Forma de Pagamento</th>
          <th>Valor Faturado (R$)</th>
          <th>Data</th>
        </tr>
      `;
      sales.forEach(s => {
        const v = typeof s.amount === 'number' ? s.amount : parseFloat(s.amount);
        tableHTML += `<tr><td>${s.id}</td><td>${s.paymentMethod}</td><td>${v.toFixed(2)}</td><td>${s.date}</td></tr>`;
      });
    }

    tableHTML += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}_${period}_dias.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area-report, #printable-area-report * {
            visibility: visible;
          }
          #printable-area-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-area-report button {
            display: none !important;
          }
          table {
            width: 100% !important;
            border: 1px solid #000 !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
            text-align: left !important;
          }
        }
      `}} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatórios Gerenciais</h1>
        <p className="text-sm text-slate-500">
          Gere demonstrativos e relatórios diretamente do seu banco de dados atualizados em tempo real.
        </p>
      </div>

      <Card className="border border-slate-100 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-950">Filtros de Exportação</CardTitle>
          <CardDescription>Configure os parâmetros para extração de dados do banco</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Categoria do Relatório</label>
              <Select value={reportType} onValueChange={(val) => { setReportType(val || "financeiro"); setShowReport(false); }}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-100 rounded-xl">
                  <SelectItem value="financeiro" className="rounded-lg">Lançamentos (Caixa)</SelectItem>
                  <SelectItem value="os" className="rounded-lg">Ordens de Serviço</SelectItem>
                  <SelectItem value="estoque" className="rounded-lg">Inventário de Estoque</SelectItem>
                  <SelectItem value="vendas" className="rounded-lg">Volume de Vendas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Período de Apuração</label>
              <Select value={period} onValueChange={(val) => { setPeriod(val || "30"); setShowReport(false); }}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-100 rounded-xl">
                  <SelectItem value="7" className="rounded-lg">Últimos 7 dias</SelectItem>
                  <SelectItem value="30" className="rounded-lg">Últimos 30 dias</SelectItem>
                  <SelectItem value="90" className="rounded-lg">Últimos 90 dias</SelectItem>
                  <SelectItem value="365" className="rounded-lg">Ano Corrente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white gap-2 h-10 font-semibold"
              >
                {isGenerating ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando...</>
                ) : (
                  <><FileBarChart className="w-4 h-4" /> Gerar Relatório</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showReport && (
        <Card id="printable-area-report" className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-900" />
                {getReportTitle()}
              </CardTitle>
              <CardDescription>Período: Últimos {period} dias | Gerado em: {new Date().toLocaleDateString("pt-BR")}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm" className="rounded-lg border-slate-200 text-slate-600 gap-1.5 h-8 font-semibold bg-white hover:bg-slate-50">
                <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
              </Button>
              <Button onClick={handleExportXLS} size="sm" className="rounded-lg bg-slate-950 hover:bg-slate-800 text-white gap-1.5 h-8 font-semibold">
                <Download className="w-3.5 h-3.5" /> Exportar XLS
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {reportType === "financeiro" && (
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-500">Descrição</TableHead>
                        <TableHead className="font-semibold text-slate-500">Tipo</TableHead>
                        <TableHead className="font-semibold text-slate-500">Valor</TableHead>
                        <TableHead className="font-semibold text-slate-500">Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashLogs.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-4">Nenhum lançamento no período.</TableCell></TableRow>
                      ) : cashLogs.map((log) => {
                          const val = typeof log.value === 'number' ? log.value : parseFloat(log.value);
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="font-semibold text-slate-800">{log.description}</TableCell>
                              <TableCell>{log.type}</TableCell>
                              <TableCell className="text-slate-900 font-medium">R$ {val.toFixed(2)}</TableCell>
                              <TableCell className="text-slate-500">{log.time || (log.createdAt ? parseDate(log.createdAt).toLocaleDateString("pt-BR") : "")}</TableCell>
                            </TableRow>
                          );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {reportType === "os" && (
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-500">Código O.S.</TableHead>
                        <TableHead className="font-semibold text-slate-500">Aparelho</TableHead>
                        <TableHead className="font-semibold text-slate-500">Serviço Efetuado</TableHead>
                        <TableHead className="font-semibold text-slate-500">Status</TableHead>
                        <TableHead className="font-semibold text-slate-500">Valor Total</TableHead>
                        <TableHead className="font-semibold text-slate-500">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-4">Nenhuma O.S. no período.</TableCell></TableRow>
                      ) : serviceOrders.map((os) => {
                          const val = typeof os.value === 'number' ? os.value : parseFloat(os.value);
                          return (
                            <TableRow key={os.id}>
                              <TableCell className="font-bold text-slate-800">{os.id}</TableCell>
                              <TableCell className="font-medium text-slate-900">{os.deviceName}</TableCell>
                              <TableCell className="text-slate-600">{os.serviceType}</TableCell>
                              <TableCell>{os.status}</TableCell>
                              <TableCell className="font-semibold text-slate-900">R$ {val.toFixed(2)}</TableCell>
                              <TableCell className="text-slate-400 text-xs font-semibold">{os.date}</TableCell>
                            </TableRow>
                          );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {reportType === "estoque" && (
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-500">SKU</TableHead>
                        <TableHead className="font-semibold text-slate-500">Componente</TableHead>
                        <TableHead className="font-semibold text-slate-500">Categoria</TableHead>
                        <TableHead className="font-semibold text-slate-500">Estoque Atual</TableHead>
                        <TableHead className="font-semibold text-slate-500">Estoque Mínimo</TableHead>
                        <TableHead className="font-semibold text-slate-500">Preço Unitário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parts.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-4">Nenhuma peça no estoque.</TableCell></TableRow>
                      ) : parts.map((p) => {
                          const val = typeof p.price === 'number' ? p.price : parseFloat(p.price);
                          return (
                            <TableRow key={p.sku}>
                              <TableCell className="font-bold text-slate-700">{p.sku}</TableCell>
                              <TableCell className="font-semibold text-slate-900">{p.name}</TableCell>
                              <TableCell className="text-slate-500">{p.category}</TableCell>
                              <TableCell className="font-medium text-slate-900">{p.quantity} un</TableCell>
                              <TableCell className="text-slate-400">{p.minQuantity} un</TableCell>
                              <TableCell className="font-bold text-slate-900">R$ {val.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {reportType === "vendas" && (
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-500">Código Venda</TableHead>
                        <TableHead className="font-semibold text-slate-500">Forma de Pagamento</TableHead>
                        <TableHead className="font-semibold text-slate-500">Valor Faturado</TableHead>
                        <TableHead className="font-semibold text-slate-500">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-4">Nenhuma venda no período.</TableCell></TableRow>
                      ) : sales.map((sale) => {
                          const val = typeof sale.amount === 'number' ? sale.amount : parseFloat(sale.amount);
                          return (
                            <TableRow key={sale.id}>
                              <TableCell className="font-bold text-slate-800">{sale.id}</TableCell>
                              <TableCell className="text-slate-700 font-medium">{sale.paymentMethod}</TableCell>
                              <TableCell className="font-bold text-slate-900">R$ {val.toFixed(2)}</TableCell>
                              <TableCell className="text-slate-400 text-xs font-semibold">{sale.date}</TableCell>
                            </TableRow>
                          );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
