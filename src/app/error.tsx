"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary for the application.
 *
 * This catches unhandled errors in any page/layout and displays
 * a user-friendly error message with a retry option.
 *
 * IMPORTANT: This is a Client Component ('use client') because
 * error boundaries must handle client-side state (the error).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development, or to error reporting service in production
    console.error("Global error caught:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });

    // TODO: In production, send to error reporting service (Sentry, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error);
    // }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          Something went wrong
        </h2>
        <p className="mb-6 text-muted-foreground">
          We apologize for the inconvenience. An unexpected error occurred.
          Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button
            onClick={() => {
              window.location.href = "/";
            }}
            variant="outline"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
