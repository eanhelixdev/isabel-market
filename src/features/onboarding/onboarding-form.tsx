"use client";

import { Upload } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input, Select } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { profileSchema } from "@/lib/validation/profile";

export function OnboardingForm({
  initialName,
}: {
  initialName?: string | null;
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      toast.error("Configura Supabase para guardar el perfil.");
      return;
    }

    startTransition(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Necesitas iniciar sesion.");
        return;
      }

      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() ?? "webp";
        const path = `${userData.user.id}/avatar-${Date.now()}.${ext}`;
        const uploaded = await supabase.storage.from("avatars").upload(path, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });
        if (uploaded.error) {
          toast.error(uploaded.error.message);
          return;
        }
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const parsed = profileSchema.safeParse({
        display_name: form.get("display_name"),
        gender: String(form.get("gender") ?? "") || null,
        age: form.get("age") ? Number(form.get("age")) : null,
        avatar_url: avatarUrl,
      });

      if (!parsed.success) {
        toast.error("Revisa los datos del perfil.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          ...parsed.data,
          onboarding_completed: true,
        })
        .eq("user_id", userData.user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Perfil completado.");
      window.location.href = "/";
    });
  }

  return (
    <GlassCard className="mx-auto w-full max-w-2xl p-5 sm:p-7">
      <h1 className="text-3xl font-semibold tracking-normal text-black">
        Configura tu perfil
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        El nombre es obligatorio para publicar, comprar o navegar con sesion completa.
      </p>

      <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-black">Nombre</span>
          <Input name="display_name" defaultValue={initialName ?? ""} required minLength={2} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-black">Sexo</span>
          <Select name="gender" defaultValue="">
            <option value="">Prefiero no decir</option>
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
            <option value="non_binary">No binario</option>
            <option value="other">Otro</option>
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-black">Edad</span>
          <Input name="age" type="number" min={13} max={120} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-black">Foto de perfil</span>
          <div className="flex min-h-24 cursor-pointer items-center justify-center rounded-3xl border border-dashed border-black/20 bg-white/60 p-5 text-sm text-zinc-600">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            />
            <span className="inline-flex items-center gap-2">
              <Upload className="h-4 w-4" aria-hidden />
              {avatarFile ? avatarFile.name : "Seleccionar imagen"}
            </span>
          </div>
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Guardando..." : "Completar onboarding"}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
