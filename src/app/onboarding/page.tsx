import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Onboarding",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const profile = await getCurrentProfile();
  if (profile?.onboarding_completed && profile.display_name) redirect("/");

  return (
    <PageShell>
      <section className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-12">
        <OnboardingForm initialName={profile?.display_name} />
      </section>
    </PageShell>
  );
}
