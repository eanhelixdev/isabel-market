"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LogOut, Plus, Sparkles, Upload, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input, Select } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ProductCard, Profile } from "@/types/marketplace";

export function ProfilePanel({
  profile,
  products,
}: {
  profile: Profile;
  products: ProductCard[];
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function connectMercadoPago() {
    const response = await fetch("/api/mercadopago/oauth/start");
    if (!response.ok) {
      toast.error("No se pudo iniciar OAuth de Mercado Pago.");
      return;
    }
    const { url } = await response.json();
    window.location.href = url;
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);

    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
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

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: String(form.get("display_name") ?? "").trim(),
        gender: String(form.get("gender") ?? "") || null,
        age: form.get("age") ? Number(form.get("age")) : null,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Perfil actualizado.");
      window.location.reload();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <GlassCard className="p-5 sm:p-7">
        <Avatar src={profile.avatar_url} name={profile.display_name} className="h-20 w-20" />
        <h1 className="mt-5 text-3xl font-semibold text-black">
          {profile.display_name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Rol: {profile.role} · Perfil {profile.onboarding_completed ? "completo" : "pendiente"}
        </p>
        <div className="mt-5 rounded-3xl bg-white/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-black">
            <Sparkles className="h-4 w-4" aria-hidden />
            Reputacion
          </p>
          <p className="mt-2 text-4xl font-semibold">{Math.round(profile.reputation_score)}</p>
        </div>
        <div className="mt-5 grid gap-3">
          <Link href="/sell/new">
            <Button className="w-full">
              <Plus className="h-4 w-4" aria-hidden />
              Nueva publicacion
            </Button>
          </Link>
          <Button type="button" variant="secondary" onClick={connectMercadoPago}>
            <WalletCards className="h-4 w-4" aria-hidden />
            Conectar Mercado Pago
          </Button>
          <Button type="button" variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesion
          </Button>
        </div>
      </GlassCard>

      <div className="space-y-6">
      <GlassCard className="p-5 sm:p-7">
        <h2 className="text-2xl font-semibold text-black">Datos privados</h2>
        <form onSubmit={updateProfile} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-black">Nombre</span>
            <Input name="display_name" defaultValue={profile.display_name ?? ""} required />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-black">Sexo</span>
            <Select name="gender" defaultValue={profile.gender ?? ""}>
              <option value="">Prefiero no decir</option>
              <option value="female">Femenino</option>
              <option value="male">Masculino</option>
              <option value="non_binary">No binario</option>
              <option value="other">Otro</option>
            </Select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-black">Edad</span>
            <Input name="age" type="number" min={13} max={120} defaultValue={profile.age ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-black">Foto</span>
            <span className="flex cursor-pointer items-center justify-center gap-2 rounded-3xl border border-dashed border-black/20 bg-white/60 p-4 text-sm text-zinc-600">
              <Upload className="h-4 w-4" aria-hidden />
              {avatarFile ? avatarFile.name : "Cambiar foto de perfil"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              />
            </span>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" className="w-full">
              Guardar cambios
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-black">Tus publicaciones</h2>
            <p className="text-sm text-zinc-600">Borradores, revision, aprobadas y vendidas.</p>
          </div>
        </div>
        <div className="grid gap-3">
          {products.length === 0 ? (
            <div className="rounded-3xl bg-white/60 p-6 text-sm text-zinc-600">
              Todavia no publicaste productos.
            </div>
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center justify-between rounded-3xl bg-white/62 p-4 transition hover:bg-white"
              >
                <span>
                  <span className="block text-sm font-semibold text-black">{product.title}</span>
                  <span className="mt-1 block text-xs text-zinc-600">{product.status}</span>
                </span>
                <span className="text-sm font-semibold text-black">
                  {product.likes_count} likes
                </span>
              </Link>
            ))
          )}
        </div>
      </GlassCard>
      </div>
    </div>
  );
}
