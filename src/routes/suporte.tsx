import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { sendTelegramMessage } from "@/lib/telegram.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/suporte")({
  head: () => ({ meta: [{ title: "Fale Conosco — Gllico" }] }),
  component: SuportePage,
});

const formSchema = z.object({
  nome: z.string().min(2, "Nome é muito curto"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().optional(),
  assunto: z.string().min(1, "Selecione um assunto"),
  mensagem: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
});

function SuportePage() {
  const sendMessage = useServerFn(sendTelegramMessage);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      whatsapp: "",
      assunto: "",
      mensagem: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await sendMessage({ data: values });
      toast.success("Mensagem enviada com sucesso!", {
        description: "Nossa equipe retornará o contato em breve.",
      });
      form.reset();
    } catch (e: any) {
      toast.error("Erro ao enviar mensagem", {
        description: e.message || "Verifique sua conexão ou tente novamente mais tarde.",
      });
    }
  }

  return (
    <div className="flex w-full items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-md border-border/40">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Canal de Atendimento</CardTitle>
          <CardDescription className="text-base">
            Envie falhas, dúvidas, reclamações ou sugestões. 
            Responderemos o mais rápido possível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Como podemos te chamar?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(DDD) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um assunto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Dúvida">Dúvida</SelectItem>
                          <SelectItem value="Falha/Erro">Reportar Falha ou Erro</SelectItem>
                          <SelectItem value="Reclamação">Reclamação</SelectItem>
                          <SelectItem value="Sugestão">Sugestão de Melhoria</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mensagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva aqui os detalhes..." 
                        className="min-h-[120px] resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Enviar Mensagem
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
