import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, ShieldOff, UserCheck, UserX, Download, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
            {q.error instanceof Error ? q.error.message : String(q.error)}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refresh()}>
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const users = q.data?.users ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Administração</CardTitle>
            <CardDescription>{users.length} usuário(s)</CardDescription>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <Link to="/dashboard" search={{ u: u.id } as never}>
                          Ver
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          roleM.mutate({ userId: u.id, makeAdmin: !u.is_admin })
                        }
                        title={u.is_admin ? "Rebaixar" : "Promover a admin"}
                      >
                        {u.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          activeM.mutate({ userId: u.id, active: !u.is_active })
                        }
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