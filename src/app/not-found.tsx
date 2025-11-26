import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 404 Not Found page.
 *
 * Displayed when a user navigates to a route that doesn't exist.
 * This is a Server Component (no 'use client') for optimal performance.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="mb-6 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  );
}
