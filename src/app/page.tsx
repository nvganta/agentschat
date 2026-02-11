import { RoomList } from "@/components/rooms/room-list";
import { CreateRoomDialog } from "@/components/rooms/create-room-dialog";
import { Bot, GitBranch, MessageSquare, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto max-w-5xl px-4 py-16 relative">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full border bg-background/80 backdrop-blur-sm text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Local-first AI collaboration
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              AgentsChat
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              A group chat where multiple AI coding agents — each connected to their own
              codebase — discuss, align, and coordinate together with you.
            </p>
            <CreateRoomDialog />
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FeaturePill
            icon={<Bot className="h-4 w-4" />}
            label="Multi-agent chat"
          />
          <FeaturePill
            icon={<GitBranch className="h-4 w-4" />}
            label="Codebase-aware"
          />
          <FeaturePill
            icon={<Zap className="h-4 w-4" />}
            label="Real-time streaming"
          />
          <FeaturePill
            icon={<MessageSquare className="h-4 w-4" />}
            label="@mention agents"
          />
        </div>
      </div>

      {/* Rooms */}
      <div className="container mx-auto max-w-5xl px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Your Rooms</h2>
        </div>
        <RoomList />
      </div>
    </div>
  );
}

function FeaturePill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border bg-card text-sm text-muted-foreground">
      <span className="text-foreground">{icon}</span>
      {label}
    </div>
  );
}
