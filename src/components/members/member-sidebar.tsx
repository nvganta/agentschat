"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddMemberDialog } from "./add-member-dialog";
import { ContextSourcesManager } from "./context-sources-manager";
import { Trash2, Bot, FolderOpen, ChevronUp, ChevronDown } from "lucide-react";
import type { Member } from "@/lib/db/schema";

interface MemberSidebarProps {
  roomId: number;
}

export function MemberSidebar({ roomId }: MemberSidebarProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/members`)
      .then((res) => res.json())
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId]);

  async function handleDelete(id: number) {
    if (!confirm("Remove this agent from the room?")) return;
    try {
      await fetch(`/api/rooms/${roomId}/members/${id}`, {
        method: "DELETE",
      });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  }

  function handleMemberAdded(member: Member) {
    setMembers((prev) => [...prev, member]);
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newMembers = [...members];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newMembers.length) return;

    [newMembers[index], newMembers[swapIndex]] = [
      newMembers[swapIndex],
      newMembers[index],
    ];
    setMembers(newMembers);

    // Persist new order
    try {
      await fetch(`/api/rooms/${roomId}/members/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: newMembers.map((m) => m.id),
        }),
      });
    } catch (error) {
      console.error("Error reordering members:", error);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-3">AI Agents</h2>
        <AddMemberDialog roomId={roomId} onMemberAdded={handleMemberAdded} />
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading agents...</p>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                No agents yet. Add your first agent to start chatting.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {members.length > 1 && (
              <p className="text-[10px] text-muted-foreground mb-2">
                Response order (top responds first)
              </p>
            )}
            <div className="space-y-3">
              {members.map((member, index) => (
                <Card key={member.id}>
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      {/* Reorder buttons */}
                      {members.length > 1 && (
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            disabled={index === 0}
                            onClick={() => handleMove(index, "up")}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            disabled={index === members.length - 1}
                            onClick={() => handleMove(index, "down")}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] shrink-0 w-5 h-5 flex items-center justify-center p-0 rounded-full"
                          >
                            {index + 1}
                          </Badge>
                          <Bot className="h-4 w-4 shrink-0" />
                          <span className="truncate">{member.name}</span>
                        </CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FolderOpen className="h-3 w-3 shrink-0" />
                          <span className="truncate" title={member.repoPath}>
                            {member.repoPath.split(/[/\\]/).pop()}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">
                            {member.engine}
                          </Badge>
                          {member.apiKey && (
                            <Badge variant="outline" className="text-[10px]">
                              Custom Key
                            </Badge>
                          )}
                        </div>
                        <ContextSourcesManager
                          roomId={roomId}
                          memberId={member.id}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
