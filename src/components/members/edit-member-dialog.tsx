"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { KeyRound, Pencil, Trash2 } from "lucide-react";
import type { ClientMember } from "@/lib/members";

interface EditMemberDialogProps {
  roomId: number;
  member: ClientMember;
  onMemberUpdated: (member: ClientMember) => void;
}

function getInitialForm(member: ClientMember) {
  return {
    name: member.name,
    repoPath: member.repoPath,
    engine: member.engine,
    context: member.context || "",
    apiKey: "",
  };
}

export function EditMemberDialog({
  roomId,
  member,
  onMemberUpdated,
}: EditMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [formData, setFormData] = useState(() => getInitialForm(member));

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setFormData(getInitialForm(member));
      setClearApiKey(false);
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.repoPath.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/members/${member.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            repoPath: formData.repoPath.trim(),
            engine: formData.engine,
            context: formData.context.trim() || null,
            apiKey: formData.apiKey.trim() || undefined,
            clearApiKey,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update agent");
      }

      onMemberUpdated(data);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label={`Edit ${member.name}`}
          title="Edit agent"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit AI Agent</DialogTitle>
            <DialogDescription>
              Update how this agent identifies itself and reads its codebase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor={`agent-name-${member.id}`}>Agent Name *</Label>
              <Input
                id={`agent-name-${member.id}`}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1.5"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor={`repo-path-${member.id}`}>
                Repository Path *
              </Label>
              <Input
                id={`repo-path-${member.id}`}
                value={formData.repoPath}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    repoPath: e.target.value,
                  }))
                }
                className="mt-1.5 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The folder must exist on this computer.
              </p>
            </div>

            <div>
              <Label htmlFor={`engine-${member.id}`}>Engine</Label>
              <Select
                value={formData.engine}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, engine: value }))
                }
              >
                <SelectTrigger id={`engine-${member.id}`} className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="codex" disabled>
                    Codex (Phase 4)
                  </SelectItem>
                  <SelectItem value="gemini" disabled>
                    Gemini (Phase 4)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`instructions-${member.id}`}>
                Agent Instructions
              </Label>
              <Textarea
                id={`instructions-${member.id}`}
                value={formData.context}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, context: e.target.value }))
                }
                placeholder="Describe this agent's role and responsibilities."
                className="mt-1.5"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                These instructions are always included alongside attached
                context sources.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor={`api-key-${member.id}`}>Custom API Key</Label>
                  <p className="text-xs text-muted-foreground">
                    {member.hasApiKey && !clearApiKey
                      ? "A custom key is currently saved."
                      : "Using the default key from .env."}
                  </p>
                </div>
              </div>

              <Input
                id={`api-key-${member.id}`}
                type="password"
                value={formData.apiKey}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }));
                  setClearApiKey(false);
                }}
                placeholder={
                  member.hasApiKey ? "Enter a replacement key" : "sk-ant-..."
                }
                disabled={clearApiKey}
              />

              {member.hasApiKey && (
                <Button
                  type="button"
                  variant={clearApiKey ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setClearApiKey((value) => !value);
                    setFormData((prev) => ({ ...prev, apiKey: "" }));
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  {clearApiKey ? "Keep saved key" : "Remove saved key"}
                </Button>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.name.trim() || !formData.repoPath.trim() || loading
              }
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
