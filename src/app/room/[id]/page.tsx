import { Decision } from "@/components/chat/decision";
import { ChatInterface } from "@/components/chat/chat-interface";
import { MemberSidebar } from "@/components/members/member-sidebar";
import { getRoom } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params;
  const room = getRoom(parseInt(id));

  if (!room) {
    notFound();
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background px-6 py-3 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{room.name}</h1>
          <p className="text-xs text-muted-foreground">AgentsChat</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-y-auto md:overflow-hidden">
        <div className="flex-1 min-h-[55vh] flex flex-col">
          <Decision roomId={room.id} />
          <ChatInterface roomId={room.id} />
        </div>
        <div className="w-full md:w-80 md:border-l border-b bg-muted/20 max-h-[35vh] md:max-h-none overflow-y-auto">
          <MemberSidebar roomId={room.id} />
        </div>
      </div>
    </div>
  );
}
