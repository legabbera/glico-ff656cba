import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save, Camera, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DiabetesTypeSlider, type DiabetesType } from "@/components/DiabetesTypeSlider";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Gllico" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { hasSession } = useSession();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);

  const q = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    enabled: hasSession,
  });

  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [type, setType] = useState<DiabetesType | null>(null);
  const [gMin, setGMin] = useState(70);
  const [gMax, setGMax] = useState(180);
  const [foodsBetter, setFoodsBetter] = useState("");
  const [foodsWorse, setFoodsWorse] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const p = q.data?.profile;
    if (!p) return;
    setDisplayName(p.display_name ?? "");
    setBirthDate(p.birth_date ?? "");
    setType(p.diabetes_type);
    setGMin(p.glucose_min);
    setGMax(p.glucose_max);
    setFoodsBetter(p.foods_better ?? "");
    setFoodsBetter(p.foods_better ?? "");
    setFoodsWorse(p.foods_worse ?? "");
    setAvatarUrl(p.avatar_url ?? "");
  }, [q.data]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${q.data?.profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      toast.success("Foto enviada! Clique em Salvar para confirmar.");
    } catch (error: any) {
      toast.error("Erro ao enviar foto", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const m = useMutation({
    mutationFn: () =>
      update({
        data: {
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
          birth_date: birthDate || null,
          diabetes_type: type,
          glucose_min: gMin,
          glucose_max: gMax,
          foods_better: foodsBetter || null,
          foods_worse: foodsWorse || null,
        },
      }),
    onSuccess: () => {
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">{q.data?.profile.email}</p>
      </div>
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Informações</CardTitle>
          <CardDescription>Personalize suas metas e preferências</CardDescription>
        </CardHeader>
        <CardContent>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="flex flex-col items-center justify-center gap-3 pb-2">
            <Avatar className="h-24 w-24 border shadow-sm">
              <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
              <AvatarFallback className="bg-muted">
                <UserCircle2 className="h-12 w-12 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                id="avatar-upload"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
              <Label
                htmlFor="avatar-upload"
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Alterar foto
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="dn">Nome completo</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bd">Data de nascimento</Label>
            <Input
              id="bd"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Tipo de diabetes</Label>
            <DiabetesTypeSlider value={type} onChange={setType} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gmin">Meta mínima (mg/dL)</Label>
              <Input
                id="gmin"
                type="number"
                min={40}
                max={200}
                value={gMin}
                onChange={(e) => setGMin(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gmax">Meta máxima (mg/dL)</Label>
              <Input
                id="gmax"
                type="number"
                min={80}
                max={400}
                value={gMax}
                onChange={(e) => setGMax(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="fb">Alimentos mais nutritivos pra mim</Label>
            <Textarea
              id="fb"
              value={foodsBetter}
              onChange={(e) => setFoodsBetter(e.target.value)}
              maxLength={2000}
              className="mt-1"
              rows={3}
              placeholder="ex.: aveia, abacate, ovos…"
            />
          </div>
          <div>
            <Label htmlFor="fw">Alimentos menos danosos / a evitar</Label>
            <Textarea
              id="fw"
              value={foodsWorse}
              onChange={(e) => setFoodsWorse(e.target.value)}
              maxLength={2000}
              className="mt-1"
              rows={3}
              placeholder="ex.: refrigerantes, doces…"
            />
          </div>
          <Button
            type="submit"
            disabled={m.isPending}
            className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}