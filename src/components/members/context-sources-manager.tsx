"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Plus,
  Trash2,
  Globe,
  Upload,
  BookOpen,
  Loader2,
} from "lucide-react";
import type { ContextSourceClient } from "@/types";

interface ContextSourcesManagerProps {
  roomId: number;
  memberId: number;
}

const TYPE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  manual: { label: "Text", variant: "secondary" },
  pdf: { label: "PDF", variant: "default" },
  url: { label: "URL", variant: "outline" },
  notion: { label: "Notion", variant: "outline" },
  text_file: { label: "File", variant: "secondary" },
};

export function ContextSourcesManager({
  roomId,
  memberId,
}: ContextSourcesManagerProps) {
  const [sources, setSources] = useState<ContextSourceClient[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [notionApiKey, setNotionApiKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBase = `/api/rooms/${roomId}/members/${memberId}/context-sources`;

  useEffect(() => {
    if (dialogOpen) {
      setLoading(true);
      fetch(apiBase)
        .then((res) => res.json())
        .then(setSources)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [dialogOpen, apiBase]);

  function resetForm() {
    setManualTitle("");
    setManualContent("");
    setUrlInput("");
    setNotionUrl("");
    setNotionApiKey("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function addManualSource() {
    if (!manualContent.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "manual",
          title: manualTitle.trim() || "Manual context",
          content: manualContent.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add");
      }
      const source = await res.json();
      setSources((prev) => [...prev, source]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function addFileSource(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let type: string;
    if (ext === "pdf") {
      type = "pdf";
    } else if (ext === "txt" || ext === "md") {
      type = "text_file";
    } else {
      setError("Unsupported file type. Use .pdf, .txt, or .md");
      return;
    }

    setAdding(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch(apiBase, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload");
      }
      const source = await res.json();
      setSources((prev) => [...prev, source]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setAdding(false);
    }
  }

  async function addUrlSource() {
    if (!urlInput.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "url", url: urlInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch URL");
      }
      const source = await res.json();
      setSources((prev) => [...prev, source]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setAdding(false);
    }
  }

  async function addNotionSource() {
    if (!notionUrl.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "notion",
          url: notionUrl.trim(),
          notionApiKey: notionApiKey.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch Notion page");
      }
      const source = await res.json();
      setSources((prev) => [...prev, source]);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch Notion page"
      );
    } finally {
      setAdding(false);
    }
  }

  async function deleteSource(sourceId: number) {
    try {
      await fetch(`${apiBase}/${sourceId}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err) {
      console.error("Error deleting context source:", err);
    }
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
            <FileText className="h-3 w-3 shrink-0" />
            <span>
              {sources.length > 0
                ? `${sources.length} context source${sources.length !== 1 ? "s" : ""}`
                : "Add context sources"}
            </span>
            <Plus className="h-3 w-3 ml-auto shrink-0" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Context Sources</DialogTitle>
          </DialogHeader>

          {/* Existing sources list */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : sources.length > 0 ? (
            <ScrollArea className="max-h-[200px] border rounded-md p-2">
              <div className="space-y-2">
                {sources.map((source) => {
                  const badge = TYPE_BADGES[source.type] || {
                    label: source.type,
                    variant: "secondary" as const,
                  };
                  return (
                    <div
                      key={source.id}
                      className="flex items-start gap-2 p-2 rounded bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={badge.variant}
                            className="text-[10px] shrink-0"
                          >
                            {badge.label}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {source.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {source.content.slice(0, 100)}
                          {source.content.length > 100 ? "..." : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => deleteSource(source.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">
              No context sources yet. Add one below.
            </p>
          )}

          {/* Add new source */}
          <Tabs defaultValue="text" className="mt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Text
              </TabsTrigger>
              <TabsTrigger value="file" className="text-xs">
                <Upload className="h-3 w-3 mr-1" />
                File
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                URL
              </TabsTrigger>
              <TabsTrigger value="notion" className="text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                Notion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-2 mt-2">
              <div>
                <Label className="text-xs">Title (optional)</Label>
                <Input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g., Architecture notes"
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Content</Label>
                <Textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste text context here..."
                  className="mt-1 text-sm"
                  rows={4}
                />
              </div>
              <Button
                size="sm"
                onClick={addManualSource}
                disabled={!manualContent.trim() || adding}
                className="w-full"
              >
                {adding ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Add Text
              </Button>
            </TabsContent>

            <TabsContent value="file" className="space-y-2 mt-2">
              <div>
                <Label className="text-xs">Upload PDF, TXT, or MD file</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  className="mt-1 h-8 text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) addFileSource(file);
                  }}
                  disabled={adding}
                />
              </div>
              {adding && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Extracting text...
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-2 mt-2">
              <div>
                <Label className="text-xs">Web Page URL</Label>
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://docs.example.com/guide"
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                onClick={addUrlSource}
                disabled={!urlInput.trim() || adding}
                className="w-full"
              >
                {adding ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Globe className="h-3 w-3 mr-1" />
                )}
                Fetch & Add
              </Button>
            </TabsContent>

            <TabsContent value="notion" className="space-y-2 mt-2">
              <div>
                <Label className="text-xs">Notion Page URL</Label>
                <Input
                  value={notionUrl}
                  onChange={(e) => setNotionUrl(e.target.value)}
                  placeholder="https://notion.so/your-page-id"
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">
                  Notion API Key (optional if set in .env)
                </Label>
                <Input
                  type="password"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder="ntn_..."
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                onClick={addNotionSource}
                disabled={!notionUrl.trim() || adding}
                className="w-full"
              >
                {adding ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <BookOpen className="h-3 w-3 mr-1" />
                )}
                Fetch & Add
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
