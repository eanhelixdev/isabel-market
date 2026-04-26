import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export const metadata = {
  title: "Resultado de pago",
};

export default async function PaymentResultPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const status = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;

  const state =
    status === "success"
      ? {
          icon: <CheckCircle2 className="h-7 w-7" />,
          title: "Pago iniciado correctamente",
          body: "Cuando Mercado Pago confirme el pago, el webhook marcara la pieza como vendida.",
        }
      : status === "pending"
        ? {
            icon: <Clock className="h-7 w-7" />,
            title: "Pago pendiente",
            body: "La orden queda esperando confirmacion asincronica de Mercado Pago.",
          }
        : {
            icon: <XCircle className="h-7 w-7" />,
            title: "Pago no completado",
            body: "La publicacion sigue disponible si el pago fue rechazado o cancelado.",
          };

  return (
    <PageShell>
      <section className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10">
        <GlassCard className="max-w-lg p-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-black text-white">
            {state.icon}
          </div>
          <h1 className="text-3xl font-semibold text-black">{state.title}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{state.body}</p>
          <Link href="/">
            <Button className="mt-6">Volver al marketplace</Button>
          </Link>
        </GlassCard>
      </section>
    </PageShell>
  );
}
