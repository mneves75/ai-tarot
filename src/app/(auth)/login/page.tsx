import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { LoginForm } from "@/components/auth/login-form";
import { AuthPageWrapper } from "@/components/auth/auth-page-wrapper";
import { SkeletonForm } from "@/components/ui/skeleton";

export const metadata = {
  title: "Log In - AI Mystic Tarot",
  description: "Sign in to your account to access your tarot readings.",
};

interface PageProps {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  // Redirect if already logged in
  const user = await getUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <AuthPageWrapper type="login">
      <Suspense fallback={<SkeletonForm fields={3} />}>
        <LoginForm error={params.error} next={params.next} />
      </Suspense>
    </AuthPageWrapper>
  );
}
