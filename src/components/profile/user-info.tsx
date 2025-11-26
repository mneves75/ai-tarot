"use client";

import type { AuthUser } from "@/lib/dal";

interface UserInfoProps {
  user: AuthUser;
}

export function UserInfo({ user }: UserInfoProps) {
  const initials = getInitials(user.profile?.name ?? user.email);

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-semibold">{initials}</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            {user.profile?.name ?? "Usuário"}
          </h2>
          <p className="text-gray-400">{user.email}</p>
          {user.profile?.isAdmin && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
              Admin
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Membro desde</span>
            <p className="text-gray-300">
              {user.profile?.createdAt
                ? formatDate(user.profile.createdAt)
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Idioma</span>
            <p className="text-gray-300">
              {user.profile?.locale === "pt-BR"
                ? "Português (BR)"
                : "English (US)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.split(/[@\s]+/);
  const first = parts[0];
  const second = parts[1];
  if (first && first.length > 0 && second && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
