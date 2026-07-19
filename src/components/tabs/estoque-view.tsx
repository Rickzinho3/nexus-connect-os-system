"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, CheckCircle, RefreshCcw } from "lucide-react";
import { getParts, replenishStock } from "@/app/actions";
import { Tooltip } from "@/components/motion/tooltip";
import { useToast } from "@/components/providers/toast-provider";

interface StockItem {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
}

export function EstoqueView() {
  const { showToast } = useToast();
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    "Troca realizada: -1 un Conector de Carga USB-C Galaxy S22 para OS-1094",
    "Compra confirmada: +10 un Pasta Térmica Arctic MX-4",
    "Ajuste manual: +2 un Tela Frontal iPhone 13 (OLED) por Administrador",
  ]);

  const loadStock = async () => {
    setLoading(true);
    try {
      const data = await getParts();
      setStockList(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleRestock = async (sku: string, name: string, currentStock: number, minStock: number) => {
    try {
      await replenishStock(sku, currentStock, minStock);
      // Append replenishment to local logs
      const addedQty = minStock * 2;
      setLogs((prev) => [
        `Reabastecimento: +${addedQty} un de ${name} por Solicitação do Sistema`,
        ...prev,
      ]);
      await loadStock();
      showToast({ title: "Estoque reabastecido", status: "success" });
    } catch (err) {
      console.error(err);
      showToast({ title: "Erro ao reabastecer", status: "error" });
    }
  };

  const alertItems = stockList.filter((item) => item.quantity < item.minQuantity);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Estoque</h1>
          <p className="text-sm text-slate-500">
            Monitore níveis de estoque mínimo, atenda solicitações de compra e gerencie reposições.
          </p>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-100 shadow-sm rounded-2xl md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Itens com Estoque Crítico</CardTitle>
              <CardDescription>Peças que atingiram o limite mínimo e precisam de compra.</CardDescription>
            </div>
            <Badge className="bg-white border border-slate-300 border-dashed text-slate-500 hover:bg-slate-50 rounded-lg">
              {alertItems.length} Alertas
            </Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-500">Peça</TableHead>
                  <TableHead className="font-semibold text-slate-500">Mínimo / Atual</TableHead>
                  <TableHead className="font-semibold text-slate-500">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-500">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                      Carregando estoque...
                    </TableCell>
                  </TableRow>
                ) : alertItems.length > 0 ? (
                  alertItems.map((item) => (
                    <TableRow key={item.sku} className="hover:bg-slate-50/50">
                      <TableCell>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400 font-medium">SKU: {item.sku}</p>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {item.minQuantity} un / <span className="text-slate-900 font-bold">{item.quantity} un</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs hover:bg-slate-200">
                          Crítico
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip content="Adicionar ao Estoque">
                          <Button
                            onClick={() => handleRestock(item.sku, item.name, item.quantity, item.minQuantity)}
                            size="sm"
                            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs py-1 h-8 gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Reabastecer
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                      Nenhum item com estoque crítico! 🎉
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* History log */}
        <Card className="border border-slate-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Histórico de Movimentações</CardTitle>
            <CardDescription>Últimas entradas e saídas registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <div className="p-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 mt-0.5">
                    {log.startsWith("Compra") || log.startsWith("Reabastecimento") ? (
                      <CheckCircle className="w-4 h-4 text-slate-700" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{log}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Hoje</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
