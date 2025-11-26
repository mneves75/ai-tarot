"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getUserJournalEntry,
  saveUserJournalEntry,
  deleteUserJournalEntry,
  type JournalActionResult,
} from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ReadingJournalProps {
  readingId: string;
}

type JournalState = {
  id: string | null;
  content: string;
  savedContent: string;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  lastSaved: Date | null;
};

export function ReadingJournal({ readingId }: ReadingJournalProps) {
  const [state, setState] = useState<JournalState>({
    id: null,
    content: "",
    savedContent: "",
    isEditing: false,
    isSaving: false,
    isDeleting: false,
    error: null,
    lastSaved: null,
  });
  const [loading, setLoading] = useState(true);

  const loadJournal = useCallback(async () => {
    try {
      setLoading(true);
      const journal = await getUserJournalEntry(readingId);
      if (journal) {
        setState((prev) => ({
          ...prev,
          id: journal.id,
          content: journal.content,
          savedContent: journal.content,
          lastSaved: journal.updatedAt,
          error: null,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Erro ao carregar anotação",
      }));
    } finally {
      setLoading(false);
    }
  }, [readingId]);

  useEffect(() => {
    loadJournal();
  }, [loadJournal]);

  const handleSave = async () => {
    if (!state.content.trim()) {
      setState((prev) => ({ ...prev, error: "A anotação não pode estar vazia" }));
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    const formData = new FormData();
    formData.set("readingId", readingId);
    formData.set("content", state.content);

    const result: JournalActionResult = await saveUserJournalEntry(formData);

    if (result.success && result.journal) {
      const savedJournal = result.journal;
      setState((prev) => ({
        ...prev,
        id: savedJournal.id,
        savedContent: savedJournal.content,
        isEditing: false,
        isSaving: false,
        lastSaved: savedJournal.updatedAt,
        error: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: result.error ?? "Erro ao salvar",
      }));
    }
  };

  const handleDelete = async () => {
    if (!state.id) return;

    setState((prev) => ({ ...prev, isDeleting: true, error: null }));

    const formData = new FormData();
    formData.set("journalId", state.id);

    const result = await deleteUserJournalEntry(formData);

    if (result.success) {
      setState({
        id: null,
        content: "",
        savedContent: "",
        isEditing: false,
        isSaving: false,
        isDeleting: false,
        error: null,
        lastSaved: null,
      });
    } else {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        error: result.error ?? "Erro ao excluir",
      }));
    }
  };

  const handleCancel = () => {
    setState((prev) => ({
      ...prev,
      content: prev.savedContent,
      isEditing: false,
      error: null,
    }));
  };

  const hasChanges = state.content !== state.savedContent;

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-700 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // No journal entry yet - show create button
  if (!(state.id || state.isEditing)) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Suas Anotações</CardTitle>
          <CardDescription className="text-gray-400">
            Adicione reflexões pessoais sobre esta leitura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setState((prev) => ({ ...prev, isEditing: true }))}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Adicionar Anotação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Suas Anotações</CardTitle>
            {state.lastSaved && !state.isEditing && (
              <CardDescription className="text-gray-400">
                Salvo em{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(state.lastSaved))}
              </CardDescription>
            )}
          </div>
          {!state.isEditing && state.id && (
            <Button
              onClick={() => setState((prev) => ({ ...prev, isEditing: true }))}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {state.error && (
          <p className="text-red-400 text-sm mb-4">{state.error}</p>
        )}

        {state.isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={state.content}
              onChange={(e) =>
                setState((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Escreva suas reflexões sobre esta leitura..."
              className="bg-gray-900 border-gray-600 text-white placeholder-gray-500 min-h-[150px] resize-y"
              maxLength={10000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {state.content.length} / 10.000 caracteres
              </span>
              <div className="flex gap-2">
                {state.id && (
                  <Button
                    onClick={handleDelete}
                    disabled={state.isDeleting || state.isSaving}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    {state.isDeleting ? "Excluindo..." : "Excluir"}
                  </Button>
                )}
                <Button
                  onClick={handleCancel}
                  disabled={state.isSaving}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={state.isSaving || !hasChanges || !state.content.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {state.isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-300 whitespace-pre-wrap">{state.content}</p>
        )}
      </CardContent>
    </Card>
  );
}
