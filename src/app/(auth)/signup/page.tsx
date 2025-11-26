import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthPageWrapper } from "@/components/auth/auth-page-wrapper";
import { SkeletonForm } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sign Up - AI Tarot",
  description: "Create your free account and get credits for your first readings.",
};

interface PageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  // Redirect if already logged in
  const user = await getUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <AuthPageWrapper type="signup">
      <Suspense fallback={<SkeletonForm fields={4} />}>
        <SignupForm error={params.error} />
      </Suspense>
    </AuthPageWrapper>
  );
}
