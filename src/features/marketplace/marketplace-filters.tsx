"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export function MarketplaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();

    for (const key of ["q", "min", "max", "year", "seller", "sort"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) next.set(key, value);
    }

    router.push(`/?${next.toString()}`);
  }

  return (
    <form onSubmit={submit} className="glass relative rounded-[28px] p-3">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_0.9fr_auto]">
        <label className="relative">
          <span className="sr-only">Buscar publicaciones</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Buscar piezas, epocas o estilos"
            className="pl-10"
          />
        </label>
        <Input name="min" defaultValue={searchParams.get("min") ?? ""} placeholder="Precio min" inputMode="numeric" />
        <Input name="max" defaultValue={searchParams.get("max") ?? ""} placeholder="Precio max" inputMode="numeric" />
        <Input name="year" defaultValue={searchParams.get("year") ?? ""} placeholder="Hasta anio" inputMode="numeric" />
        <Select name="sort" defaultValue={searchParams.get("sort") ?? "recent"}>
          <option value="recent">Recientes</option>
          <option value="popular">Populares</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
        </Select>
        <Button type="submit">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filtrar
        </Button>
      </div>
    </form>
  );
}
