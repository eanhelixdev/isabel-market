"use client";

import { Mail, Phone, ShieldCheck } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AuthPanel() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      toast.error("Configura Supabase para habilitar autenticacion.");
      return;
    }

    startTransition(async () => {
      if (mode === "email") {
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          const signUp = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/onboarding`,
            },
          });
          if (signUp.error) {
            toast.error(signUp.error.message);
            return;
          }
          toast.success("Cuenta creada. Revisa tu email si requiere confirmacion.");
        } else {
          toast.success("Sesion iniciada.");
        }
      } else {
        const phone = String(form.get("phone") ?? "");
        const token = String(form.get("token") ?? "");

        if (!token) {
          const { error } = await supabase.auth.signInWithOtp({ phone });
          if (error) toast.error(error.message);
          else toast.success("Codigo enviado por SMS.");
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          phone,
          token,
          type: "sms",
        });
        if (error) toast.error(error.message);
        else toast.success("Telefono verificado.");
      }

      window.location.href = "/onboarding";
    });
  }

  return (
    <GlassCard className="mx-auto w-full max-w-md p-5 sm:p-7">
      <div className="mb-6">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-black text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold tracking-normal text-black">
          Accede a Isabel Market
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Usa email o telefono. El primer ingreso requiere completar el nombre.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-full border border-black/10 bg-white/60 p-1">
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm transition ${
            mode === "email" ? "bg-black text-white" : "text-zinc-600"
          }`}
        >
          <Mail className="h-4 w-4" aria-hidden />
          Email
        </button>
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm transition ${
            mode === "phone" ? "bg-black text-white" : "text-zinc-600"
          }`}
        >
          <Phone className="h-4 w-4" aria-hidden />
          Telefono
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "email" ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-black">Email</span>
              <Input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-black">Password</span>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>
          </>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-black">Telefono</span>
              <Input name="phone" type="tel" placeholder="+549..." required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-black">
                Codigo SMS
              </span>
              <Input name="token" inputMode="numeric" placeholder="Opcional al solicitar" />
            </label>
          </>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Procesando..." : mode === "email" ? "Entrar o registrarme" : "Enviar / verificar"}
        </Button>
      </form>
    </GlassCard>
  );
}
