"use client";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="outline"
        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
      >
        Sair da conta
      </Button>
    </form>
  );
}
