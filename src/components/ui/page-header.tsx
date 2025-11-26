"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";

/**
 * PageHeader Component
 *
 * A consistent sticky glass header for all app pages.
 * Provides navigation, title, and optional actions.
 *
 * @module components/ui/page-header
 */

// ============================================================
// TYPES
// ============================================================

interface PageHeaderProps {
  /** Page title - if "AI Tarot" or "Mystic Tarot", renders the logo component */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Force logo display instead of text title */
  useLogo?: boolean;
  /** Show back button (links to provided href or defaults to "/") */
  showBack?: boolean;
  /** Back button destination */
  backHref?: string;
  /** Back button aria-label for accessibility */
  backLabel?: string;
  /** Show language toggle */
  showLanguageToggle?: boolean;
  /** Show settings link */
  showSettings?: boolean;
  /** Right-side actions slot */
  actions?: ReactNode;
  /** Additional className */
  className?: string;
  /** Maximum width of header content */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

// ============================================================
// STYLE MAPPINGS
// ============================================================

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

// ============================================================
// COMPONENT
// ============================================================

/**
 * PageHeader - Sticky glass navigation header.
 *
 * @example
 * // Basic usage with back button
 * <PageHeader
 *   title="Settings"
 *   subtitle="Manage your preferences"
 *   showBack
 *   backHref="/"
 * />
 *
 * @example
 * // With language toggle and settings
 * <PageHeader
 *   title="Demo"
 *   showLanguageToggle
 *   showSettings
 * />
 *
 * @example
 * // With custom actions
 * <PageHeader
 *   title="Credits"
 *   actions={<Button>Buy More</Button>}
 * />
 */
export function PageHeader({
  title,
  subtitle,
  useLogo = false,
  showBack = false,
  backHref = "/",
  backLabel = "Go back",
  showLanguageToggle = false,
  showSettings = false,
  actions,
  className,
  maxWidth = "4xl",
}: PageHeaderProps) {
  // Determine if we should render the logo based on title or explicit prop
  const shouldUseLogo = useLogo || title === "AI Tarot" || title === "Mystic Tarot";
  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "backdrop-blur-xl bg-black/80 border-b border-white/10",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 py-4",
          "flex items-center gap-4",
          maxWidthStyles[maxWidth]
        )}
      >
        {/* Left side: Back button + Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {showBack && (
            <Link
              href={backHref}
              className={cn(
                "p-2 -ml-2 rounded-lg",
                "text-white/60 hover:text-white",
                "hover:bg-white/10 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              )}
              aria-label={backLabel}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          <div className="min-w-0">
            {shouldUseLogo ? (
              <Link href="/" className="block">
                <Logo size="md" showText animated />
              </Link>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-white truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-white/60 truncate">
                    {subtitle}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {showLanguageToggle && <LanguageToggle />}

          {showSettings && (
            <Link
              href="/settings"
              className={cn(
                "p-2 rounded-lg",
                "text-white/60 hover:text-white",
                "hover:bg-white/10 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              )}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}

          {actions}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// SIMPLE HEADER VARIANT
// ============================================================

interface SimpleHeaderProps {
  /** Logo/brand text or element */
  logo?: ReactNode;
  /** Right-side content */
  right?: ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * SimpleHeader - Minimal header for landing pages or simple views.
 */
export function SimpleHeader({ logo, right, className }: SimpleHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "backdrop-blur-xl bg-black/50 border-b border-white/5",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logo ?? (
            <Link href="/">
              <Logo size="md" showText animated />
            </Link>
          )}
        </div>
        {right && <div className="flex items-center gap-3">{right}</div>}
      </div>
    </header>
  );
}
