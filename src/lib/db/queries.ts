import { db } from "./index";
import {
  rooms,
  members,
  messages,
  contextSources,
  type NewRoom,
  type NewMember,
  type NewMessage,
  type NewContextSource,
} from "./schema";
import { eq, desc, asc, inArray } from "drizzle-orm";

// ── Rooms ──

export function createRoom(data: NewRoom) {
  return db.insert(rooms).values(data).returning().get();
}

export function getRooms() {
  return db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
}

export function getRoom(id: number) {
  return db.select().from(rooms).where(eq(rooms.id, id)).get();
}

export function deleteRoom(id: number) {
  return db.delete(rooms).where(eq(rooms.id, id)).run();
}

// ── Members ──

export function createMember(data: NewMember) {
  return db.insert(members).values(data).returning().get();
}

export function getMembers(roomId: number) {
  return db
    .select()
    .from(members)
    .where(eq(members.roomId, roomId))
    .orderBy(asc(members.sortOrder), asc(members.id))
    .all();
}

export function getMember(id: number) {
  return db.select().from(members).where(eq(members.id, id)).get();
}

export function deleteMember(id: number) {
  return db.delete(members).where(eq(members.id, id)).run();
}

export function updateMemberOrder(id: number, sortOrder: number) {
  return db
    .update(members)
    .set({ sortOrder })
    .where(eq(members.id, id))
    .run();
}

// ── Messages ──

export function createMessage(data: NewMessage) {
  return db.insert(messages).values(data).returning().get();
}

export function getMessages(roomId: number, limit = 100) {
  return db
    .select({
      id: messages.id,
      roomId: messages.roomId,
      role: messages.role,
      memberId: messages.memberId,
      content: messages.content,
      createdAt: messages.createdAt,
      memberName: members.name,
    })
    .from(messages)
    .leftJoin(members, eq(messages.memberId, members.id))
    .where(eq(messages.roomId, roomId))
    .orderBy(messages.createdAt)
    .limit(limit)
    .all();
}

export function getRecentMessages(roomId: number, limit = 20) {
  return getMessages(roomId, limit);
}

// ── Context Sources ──

export function createContextSource(data: NewContextSource) {
  return db.insert(contextSources).values(data).returning().get();
}

export function getContextSources(memberId: number) {
  return db
    .select()
    .from(contextSources)
    .where(eq(contextSources.memberId, memberId))
    .orderBy(asc(contextSources.createdAt))
    .all();
}

export function deleteContextSource(id: number) {
  return db.delete(contextSources).where(eq(contextSources.id, id)).run();
}

export function getContextSourcesByMemberIds(memberIds: number[]) {
  if (memberIds.length === 0) return [];
  return db
    .select()
    .from(contextSources)
    .where(inArray(contextSources.memberId, memberIds))
    .orderBy(asc(contextSources.createdAt))
    .all();
}
