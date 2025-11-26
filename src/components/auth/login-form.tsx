"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  loginWithEmail,
  loginWithGoogle,
  type AuthActionResult,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/context";

/**
 * Login Form Component
 *
 * Premium glass morphism styled login form with full i18n support.
 * Supports email/password and Google OAuth authentication.
 *
 * @module components/auth/login-form
 */

interface LoginFormProps {
  error: string | undefined;
  next: string | undefined;
}

const initialState: AuthActionResult = {
  success: false,
};

export function LoginForm({ error: urlError, next }: LoginFormProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    loginWithEmail,
    initialState
  );

  // Redirect on successful login
  useEffect(() => {
    if (state.success) {
      router.push(next ?? "/");
      router.refresh();
    }
  }, [state.success, next, router]);

  const errorMessage = state.error ?? getUrlErrorMessage(urlError, locale);

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-500/10 border border-red-500/30 p-4"
          role="alert"
        >
          <p className="text-sm text-red-400">{errorMessage}</p>
        </motion.div>
      )}

      {/* Google Sign In */}
      <form action={loginWithGoogle}>
        <Button
          type="submit"
          variant="outline"
          className="w-full h-11 bg-white text-gray-900 hover:bg-gray-100 border-0 font-medium"
        >
          <GoogleIcon className="mr-2 h-5 w-5" />
          {t("auth.loginWithGoogle")}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-3 text-white/40 bg-transparent backdrop-blur-sm">
            {t("auth.orContinueWith")}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">
            {t("auth.email")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            disabled={isPending}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/80">
              {t("auth.password")}
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={isPending}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>

        <motion.div
          whileHover={{ scale: isPending ? 1 : 1.01 }}
          whileTap={{ scale: isPending ? 1 : 0.99 }}
        >
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-purple-500/25"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("common.loading")}
              </span>
            ) : (
              t("auth.loginButton")
            )}
          </Button>
        </motion.div>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-white/50">
        {t("auth.noAccount")}{" "}
        <Link
          href="/signup"
          className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          {t("auth.signupButton")}
        </Link>
      </p>
    </div>
  );
}

// ============================================================
// GOOGLE ICON
// ============================================================

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ============================================================
// UTILITIES
// ============================================================

function getUrlErrorMessage(error: string | undefined, locale: string): string | undefined {
  if (!error) return undefined;

  const ptBR = {
    auth_callback_error: "Erro ao autenticar. Por favor, tente novamente.",
    default: "Ocorreu um erro. Por favor, tente novamente.",
  };

  const enUS = {
    auth_callback_error: "Authentication error. Please try again.",
    default: "An error occurred. Please try again.",
  };

  const messages: Record<string, typeof enUS> = {
    "pt-BR": ptBR,
    "en-US": enUS,
  };

  const localeMessages = messages[locale] ?? enUS;
  return localeMessages[error as keyof typeof enUS] ?? localeMessages.default;
}
