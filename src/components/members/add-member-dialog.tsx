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
import { Plus } from "lucide-react";
import type { Member } from "@/lib/db/schema";

interface AddMemberDialogProps {
  roomId: number;
  onMemberAdded: (member: Member) => void;
}

export function AddMemberDialog({ roomId, onMemberAdded }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    repoPath: "",
    engine: "claude",
    context: "",
    apiKey: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.repoPath.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rooms/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          repoPath: formData.repoPath.trim(),
          engine: formData.engine,
          context: formData.context.trim() || undefined,
          apiKey: formData.apiKey.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add agent");
      }

      const member = await response.json();
      onMemberAdded(member);
      setOpen(false);
      setFormData({ name: "", repoPath: "", engine: "claude", context: "", apiKey: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add AI Agent</DialogTitle>
            <DialogDescription>
              Connect an AI coding agent to a local codebase
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="agent-name">Agent Name *</Label>
              <Input
                id="agent-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Frontend Agent"
                className="mt-1.5"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="repo-path">Repository Path *</Label>
              <Input
                id="repo-path"
                value={formData.repoPath}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, repoPath: e.target.value }))
                }
                placeholder="e.g., C:\Projects\my-app"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Absolute path to a local repository
              </p>
            </div>

            <div>
              <Label htmlFor="engine">Engine</Label>
              <Select
                value={formData.engine}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, engine: value }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="codex" disabled>
                    Codex (coming soon)
                  </SelectItem>
                  <SelectItem value="gemini" disabled>
                    Gemini (coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="context">Context (Optional)</Label>
              <Textarea
                id="context"
                value={formData.context}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, context: e.target.value }))
                }
                placeholder="e.g., You handle React components and styling..."
                className="mt-1.5"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                After adding the agent, you can attach PDFs, URLs, and more via
                context sources.
              </p>
            </div>

            <div>
              <Label htmlFor="api-key">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="sk-ant-..."
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use the default key from .env
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
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
              {loading ? "Adding..." : "Add Agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
