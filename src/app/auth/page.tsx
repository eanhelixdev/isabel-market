import { PageShell } from "@/components/layout/page-shell";
import { AuthPanel } from "@/features/auth/auth-panel";

export const metadata = {
  title: "Acceso",
};

export default function AuthPage() {
  return (
    <PageShell>
      <section className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-12">
        <AuthPanel />
      </section>
    </PageShell>
  );
}
