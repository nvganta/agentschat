export interface MessageWithMember {
  id: number;
  roomId: number;
  role: "user" | "assistant";
  memberId: number | null;
  memberName: string | null;
  content: string;
  createdAt: Date;
}

export interface StreamingMessage {
  id: string;
  memberId: number;
  memberName: string;
  role: "assistant";
  content: string;
  isStreaming: boolean;
  createdAt: Date;
}

export interface SendMessageRequest {
  content: string;
  targetMemberId?: number;
}

export interface CreateRoomRequest {
  name: string;
}

export interface CreateMemberRequest {
  name: string;
  repoPath: string;
  engine?: string;
  context?: string;
  apiKey?: string;
}

export type SSEEvent =
  | { type: "start"; memberId: number; memberName: string }
  | { type: "chunk"; memberId: number; content: string }
  | { type: "done"; memberId: number }
  | { type: "error"; memberId: number; error: string };

export interface ContextSourceClient {
  id: number;
  memberId: number;
  type: "manual" | "pdf" | "url" | "notion" | "text_file";
  title: string;
  content: string;
  sourceUrl: string | null;
  fileName: string | null;
  createdAt: string;
}
