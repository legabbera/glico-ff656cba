import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, ShieldOff, UserCheck, UserX, Download, Gift, Copy, Link as LinkIcon, Users, DollarSign, Activity, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import {
  listUsersAdmin,
  setUserActiveAdmin,
  setUserRoleAdmin,
  seedRenaldoAdmin,
  setUserFreeAccessAdmin,
} from "@/lib/admin.functions";
import { importFromSheets } from "@/lib/import-sheets.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Gllico" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { hasSession } = useSession();
  const qc = useQueryClient();
  const list = useServerFn(listUsersAdmin);
  const setRole = useServerFn(setUserRoleAdmin);
  const setActive = useServerFn(setUserActiveAdmin);
  const setFree = useServerFn(setUserFreeAccessAdmin);
  const seedRenaldo = useServerFn(seedRenaldoAdmin);
  const importSheets = useServerFn(importFromSheets);

  // UTM Builder State
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const generatedUtm = `https://gllico.com/?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;

  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
    enabled: hasSession,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const roleM = useMutation({
    mutationFn: (v: { userId: string; makeAdmin: boolean }) => setRole({ data: v }),
    onSuccess: () => { toast.success("Role atualizado"); refresh(); },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });
  const activeM = useMutation({
    mutationFn: (v: { userId: string; active: boolean }) => setActive({ data: v }),
    onSuccess: () => { toast.success("Status atualizado"); refresh(); },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });
  const freeM = useMutation({
    mutationFn: (v: { userId: string; freeAccess: boolean }) => setFree({ data: v }),
    onSuccess: () => { toast.success("Acesso atualizado"); refresh(); },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });
  const renaldoM = useMutation({
    mutationFn: async () => {
      const r = await seedRenaldo();
      const imp = await importSheets({ data: { targetUserId: r.userId } });
      return { ...r, imp };
    },
    onSuccess: (r) => {
      toast.success(
        `${r.created ? "Conta criada" : "Conta já existia"} • importadas ${r.imp.inserted} medições`,
      );
      refresh();
    },
    onError: (e: Error) => toast.error("Falha no seed", { description: e.message }),
  });

  const copyUtm = () => {
    navigator.clipboard.writeText(generatedUtm);
    toast.success("Link copiado para a área de transferência!");
  };

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (q.error) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Acesso negado / Erro</CardTitle>
          <CardDescription>Esta área é restrita a administradores.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive font-mono break-words">
            {q.error instanceof Error
              ? (q.error.message.includes("<!doctype html>") || q.error.message.includes("<html")
                ? "Erro interno do servidor (500). Verifique os logs da Vercel ou as chaves de ambiente."
                : q.error.message)
              : String(q.error)}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refresh()}>
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const users = q.data?.users ?? [];
  const metrics = (q.data as any)?.metrics ?? { totalUsers: 0, activeSubscribers: 0, dau: 0, regions: {} };
  
  // Prepare chart data
  const regionData = Object.entries(metrics.regions).map(([uf, count]) => ({
    name: uf,
    count,
  })).sort((a, b) => (b.count as number) - (a.count as number));

  const monthlyPrice = 29.90; // Exemplo de preço
  const estimatedRevenue = metrics.activeSubscribers * monthlyPrice;

  return (
    <div className="space-y-6">
      
      {metrics.activeSubscribers >= 100 && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive flex flex-col gap-1">
          <div className="flex items-center gap-2 font-bold text-lg">
            <AlertTriangle className="h-5 w-5" />
            Alerta de Escalabilidade: Limite de 100 Assinantes Atingido
          </div>
          <p className="text-sm">
            Seu aplicativo ultrapassou a meta de 100 assinantes ativos! É altamente recomendável <strong>realizar o Upgrade do plano do seu banco de dados (Supabase)</strong> e ativar o Connection Pooling para suportar o novo volume de tráfego sem queda de conexões.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Cadastros totais na plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {estimatedRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{metrics.activeSubscribers} assinantes ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos (DAU)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dau}</div>
            <p className="text-xs text-muted-foreground">Registraram medidas nas últimas 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura Regional</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(metrics.regions).length}</div>
            <p className="text-xs text-muted-foreground">Estados brasileiros mapeados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Region Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Clientes por Região (UF)</CardTitle>
            <CardDescription>Distribuição geográfica dos usuários.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Nenhum dado de região disponível.
              </div>
            )}
          </CardContent>
        </Card>

        {/* UTM Builder */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>UTM Builder</CardTitle>
            <CardDescription>Gere links de campanhas rastreáveis para redes sociais e anúncios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source (Origem)</Label>
                <Input id="source" placeholder="ex: instagram" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medium">Medium (Mídia)</Label>
                <Input id="medium" placeholder="ex: stories" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign (Campanha)</Label>
              <Input id="campaign" placeholder="ex: promo_verao_2026" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} />
            </div>
            <div className="pt-4 border-t">
              <Label className="text-muted-foreground mb-2 block">URL Final</Label>
              <div className="flex items-center space-x-2">
                <Input readOnly value={generatedUtm} className="bg-muted/50 font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copyUtm}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Gestão de Usuários</CardTitle>
            <CardDescription>{users.length} usuário(s) encontrados</CardDescription>
          </div>
          <Button
            onClick={() => renaldoM.mutate()}
            disabled={renaldoM.isPending}
            variant="outline"
          >
            {renaldoM.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Criar Renaldo + importar planilha
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Região</TableHead>
                <TableHead className="text-right">Medições</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead className="text-center">Gratuidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {u.diabetes_type === "tipo1"
                      ? "Tipo 1"
                      : u.diabetes_type === "tipo2"
                      ? "Tipo 2"
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs uppercase text-muted-foreground">
                    {u.uf ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{u.measurements_count}</TableCell>
                  <TableCell>
                    <span
                      className={
                        u.is_active
                          ? "rounded-full bg-primary/40 px-2 py-0.5 text-xs"
                          : "rounded-full bg-destructive/30 px-2 py-0.5 text-xs text-destructive"
                      }
                    >
                      {u.is_active ? "Ativo" : "Inativo"}
                      {u.is_admin && " • admin"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {u.is_admin
                      ? "Admin"
                      : u.free_access
                        ? <span className="inline-flex items-center gap-1 text-emerald-600"><Gift className="h-3 w-3" /> Gratuito</span>
                        : u.subscription_status === "active"
                          ? <span className="text-primary font-medium">Assinante</span>
                          : u.trial_days_left > 0
                            ? <span className="text-muted-foreground">Trial • {u.trial_days_left}d</span>
                            : <span className="text-destructive">Expirado</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.free_access}
                      disabled={freeM.isPending}
                      onCheckedChange={(v) => freeM.mutate({ userId: u.id, freeAccess: !!v })}
                      aria-label="Alternar acesso gratuito"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/dashboard" search={{ u: u.id } as never}>Ver</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => roleM.mutate({ userId: u.id, makeAdmin: !u.is_admin })}
                        title={u.is_admin ? "Rebaixar" : "Promover a admin"}
                      >
                        {u.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => activeM.mutate({ userId: u.id, active: !u.is_active })}
                        title={u.is_active ? "Desativar" : "Ativar"}
                      >
                        {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}