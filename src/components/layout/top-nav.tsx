import Link from "next/link";
import { Heart, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";

export async function TopNav() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/56 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-2 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-sm font-semibold text-white">
            IM
          </span>
          <span className="hidden text-sm font-semibold tracking-wide sm:block">
            Isabel Market
          </span>
        </Link>

        <Link
          href="/marketplace"
          className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-700 transition hover:bg-black/5 md:flex"
        >
          <Search className="h-4 w-4" aria-hidden />
          Explorar
        </Link>
        <Link
          href="/sell/new"
          className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-700 transition hover:bg-black/5 md:flex"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Publicar
        </Link>
        <Link
          href="/admin"
          className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-700 transition hover:bg-black/5 md:flex"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Admin
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Favoritos">
            <Heart className="h-5 w-5" aria-hidden />
          </Button>
          {profile ? (
            <Link href="/me" aria-label="Perfil">
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name}
                className="h-10 w-10"
              />
            </Link>
          ) : (
            <Link href="/auth">
              <Button variant="secondary">
                <UserRound className="h-4 w-4" aria-hidden />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
