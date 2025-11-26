"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { SettingsForm } from "@/components/settings";
import { ArrowLeft } from "lucide-react";

/**
 * Client component for the settings page.
 * Handles interactive settings form with i18n support.
 */
export function SettingsPageClient() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">
              {t("settings.title")}
            </h1>
            <p className="text-sm text-white/50">{t("settings.subtitle")}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <SettingsForm />
      </main>
    </div>
  );
}
