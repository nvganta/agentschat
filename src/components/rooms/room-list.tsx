"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  MessageSquare,
  ArrowRight,
  Bot,
  Plus,
} from "lucide-react";
import type { Room } from "@/lib/db/schema";

interface RoomWithMeta extends Room {
  memberCount?: number;
  memberNames?: string[];
}

export function RoomList() {
  const [rooms, setRooms] = useState<RoomWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then(async (data: Room[]) => {
        // Fetch member counts for each room
        const enriched = await Promise.all(
          data.map(async (room) => {
            try {
              const res = await fetch(`/api/rooms/${room.id}/members`);
              const members: Array<{ name: string }> = await res.json();
              return {
                ...room,
                memberCount: members.length,
                memberNames: members.map((m) => m.name),
              };
            } catch {
              return { ...room, memberCount: 0, memberNames: [] };
            }
          })
        );
        setRooms(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this room? This cannot be undone.")) return;
    try {
      await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-2/3 bg-muted rounded" />
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-8 w-full bg-muted rounded mt-4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Create your first war room to bring AI coding agents together for a
          collaborative discussion.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <Link key={room.id} href={`/room/${room.id}`}>
          <Card className="group relative p-5 hover:shadow-lg hover:border-foreground/20 transition-all cursor-pointer h-full">
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, room.id)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div className="space-y-4">
              {/* Room header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold truncate pr-6">{room.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground ml-10">
                  Created {new Date(room.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Agents */}
              <div className="flex items-center gap-2">
                {room.memberCount && room.memberCount > 0 ? (
                  <>
                    <div className="flex -space-x-1.5">
                      {(room.memberNames || []).slice(0, 3).map((name, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center"
                          title={name}
                        >
                          <Bot className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ))}
                      {room.memberCount > 3 && (
                        <div className="h-6 w-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                          +{room.memberCount - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {room.memberCount} agent{room.memberCount !== 1 ? "s" : ""}
                    </span>
                  </>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Plus className="h-2.5 w-2.5" />
                    No agents yet
                  </Badge>
                )}
              </div>

              {/* Open action */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Open room
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
