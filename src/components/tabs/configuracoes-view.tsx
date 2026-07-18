"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Percent, Check, RefreshCw } from "lucide-react";
import { getSettings, updateSettings } from "@/app/actions";

export function ConfiguracoesView() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [address, setAddress] = useState("");
  const [tax, setTax] = useState("");
  const [commission, setCommission] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const tenant = await getSettings();
      if (tenant) {
        setName(tenant.name);
        setCnpj(tenant.cnpj || "");
        setAddress(tenant.address || "");
        setTax(tenant.taxRate || "12.5");
        setCommission(tenant.commissionRate || "8.0");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        name,
        cnpj,
        address,
        taxRate: tax,
        commissionRate: commission,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await loadSettings();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-400 font-medium">
        Carregando configurações...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações do Sistema</h1>
          <p className="text-sm text-slate-500">
            Ajuste informações cadastrais da assistência técnica, alíquotas fiscais e comissões da equipe.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Registration Card */}
        <Card className="border border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100">
              <Building2 className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-950">Dados da Assistência</CardTitle>
              <CardDescription>Informações básicas exibidas em notas e orçamentos</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Razão Social / Nome Fantasia</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">CNPJ</label>
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Endereço Completo</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Service settings */}
        <Card className="border border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100">
              <Percent className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-950">Alíquotas e Comissões</CardTitle>
              <CardDescription>Defina taxas de impostos padrão e comissionamentos da assistência técnica</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Alíquota de Impostos Padrão (ISS/ICMS - %)</label>
              <Input
                type="number"
                step="0.1"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Comissão de Técnicos por Serviço (%)</label>
              <Input
                type="number"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer save buttons */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center text-slate-900 font-medium text-sm gap-2">
          {saved && (
            <>
              <Check className="w-4 h-4" /> Alterações salvas com sucesso no banco de dados!
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadSettings}
            className="rounded-xl border-slate-200 gap-1.5 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Descartar
          </Button>
          <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold">
            Salvar Configurações
          </Button>
        </div>
      </div>
    </form>
  );
}
