import type { Metadata } from "next";
import { SettingsPageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Settings | AI Tarot",
  description: "Customize your AI Tarot experience - language and API keys",
};

/**
 * Settings page route.
 * Renders client component for interactive settings form.
 */
export default function SettingsPage() {
  return <SettingsPageClient />;
}
