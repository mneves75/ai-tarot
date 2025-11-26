"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import { updateProfile, type ProfileActionResult } from "@/app/actions/profile";
import type { UserProfile } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileFormProps {
  profile: UserProfile | null;
}

const initialState: ProfileActionResult = {
  success: false,
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState
  );

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Editar Perfil</CardTitle>
        <CardDescription className="text-gray-400">
          Atualize suas informações pessoais
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          )}

          {showSuccess && (
            <div className="rounded-md bg-green-500/10 border border-green-500/50 p-3">
              <p className="text-sm text-green-400">
                Perfil atualizado com sucesso!
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-200">
              Nome
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={profile?.name ?? ""}
              placeholder="Seu nome"
              className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale" className="text-gray-200">
              Idioma
            </Label>
            <Select name="locale" defaultValue={profile?.locale ?? "pt-BR"}>
              <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="pt-BR" className="text-white">
                  Português (Brasil)
                </SelectItem>
                <SelectItem value="en-US" className="text-white">
                  English (US)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isPending}
          >
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
