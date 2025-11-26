import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { ProfileForm } from "@/components/profile/profile-form";
import { UserInfo } from "@/components/profile/user-info";
import { LogoutButton } from "@/components/profile/logout-button";
import { PageContainer, PageTitle } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCardSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Perfil - AI Tarot",
  description: "Gerencie seu perfil e configurações.",
};

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <PageContainer showOrbs maxWidth="2xl">
      <PageHeader
        title="AI Tarot"
        showBack
        backHref="/"
        showLanguageToggle
      />

      <main className="px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Page Title */}
        <PageTitle
          title="Seu Perfil"
          subtitle="Gerencie suas informações e preferências"
          centered
        />

        {/* User Info Card */}
        <Suspense fallback={<ProfileSkeleton />}>
          <UserInfo user={user} />
        </Suspense>

        {/* Profile Form */}
        <Suspense fallback={<FormSkeleton />}>
          <ProfileForm profile={user.profile} />
        </Suspense>

        {/* Logout Button */}
        <div className="flex justify-center pt-4">
          <LogoutButton />
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
        </div>
      </main>
    </PageContainer>
  );
}

function ProfileSkeleton() {
  return <GlassCardSkeleton className="h-32" />;
}

function FormSkeleton() {
  return <GlassCardSkeleton className="h-64" />;
}
