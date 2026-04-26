"use client";

import { ImagePlus, Send } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { allowedImageTypes, maxImageBytes, productSchema } from "@/lib/validation/product";

export function ProductForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      toast.error("Configura Supabase para publicar productos.");
      return;
    }

    startTransition(async () => {
      if (files.length < 2) {
        toast.error("Subi al menos 2 imagenes.");
        return;
      }
      if (files.some((file) => !allowedImageTypes.includes(file.type) || file.size > maxImageBytes)) {
        toast.error("Usa imagenes JPG, PNG o WEBP de hasta 5 MB.");
        return;
      }

      const parsed = productSchema.safeParse(Object.fromEntries(form));
      if (!parsed.success) {
        toast.error("Revisa los campos obligatorios.");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Necesitas iniciar sesion.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, onboarding_completed")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!profile?.onboarding_completed) {
        window.location.href = "/onboarding";
        return;
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          ...parsed.data,
          seller_id: profile.id,
          status: "draft",
          currency: "ARS",
        })
        .select("id")
        .single();

      if (productError || !product) {
        toast.error(productError?.message ?? "No se pudo crear la publicacion.");
        return;
      }

      const imageRows = [];
      for (const [index, file] of files.entries()) {
        const ext = file.name.split(".").pop() ?? "webp";
        const path = `${userData.user.id}/${product.id}/${index}-${Date.now()}.${ext}`;
        const uploaded = await supabase.storage
          .from("product-images-private")
          .upload(path, file, { cacheControl: "3600" });

        if (uploaded.error) {
          toast.error(uploaded.error.message);
          return;
        }

        imageRows.push({
          product_id: product.id,
          image_url: path,
          sort_order: index,
        });
      }

      const images = await supabase.from("product_images").insert(imageRows);
      if (images.error) {
        toast.error(images.error.message);
        return;
      }

      const submitted = await supabase
        .from("products")
        .update({ status: "pending_review" })
        .eq("id", product.id);

      if (submitted.error) {
        toast.error(submitted.error.message);
        return;
      }

      toast.success("Publicacion enviada a revision.");
      window.location.href = "/me";
    });
  }

  return (
    <GlassCard className="mx-auto max-w-4xl p-5 sm:p-7">
      <div className="mb-7 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-black">
          Crear publicacion
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Las piezas quedan en revision y solo aparecen publicamente cuando un admin las aprueba.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-black">Imagenes</span>
          <div className="rounded-3xl border border-dashed border-black/20 bg-white/60 p-6">
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="sr-only"
              id="product-images"
            />
            <label
              htmlFor="product-images"
              className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 text-center text-sm text-zinc-600"
            >
              <ImagePlus className="h-7 w-7 text-black" aria-hidden />
              {files.length ? `${files.length} imagenes seleccionadas` : "Subir minimo 2 imagenes"}
            </label>
          </div>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-black">Titulo</span>
          <Input name="title" required />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-black">Descripcion</span>
          <Textarea name="description" required />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-black">Anio</span>
          <Input name="year" type="number" min={1000} max={new Date().getFullYear()} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-black">Precio</span>
          <Input name="price" type="number" min={1} required />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-black">Categoria</span>
          <Input name="category" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-black">Estado</span>
          <Select name="condition" defaultValue="">
            <option value="">Sin especificar</option>
            <option value="Excelente">Excelente</option>
            <option value="Muy bueno">Muy bueno</option>
            <option value="Bueno">Bueno</option>
            <option value="A restaurar">A restaurar</option>
          </Select>
        </label>
        <Input name="dimensions" placeholder="Medidas" />
        <Input name="material" placeholder="Material" />
        <Input name="location" placeholder="Ubicacion aproximada" />
        <Input name="estimated_age" placeholder="Antiguedad estimada" />
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-black">Historia / origen</span>
          <Textarea name="origin_story" />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isPending} className="w-full">
            <Send className="h-4 w-4" aria-hidden />
            {isPending ? "Enviando..." : "Enviar a revision"}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
