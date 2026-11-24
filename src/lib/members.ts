import { repositoryBranch } from "@/lib/repository";
import type { Member } from "@/lib/db/schema";

export type ClientMember = Omit<Member, "apiKey"> & {
  hasApiKey: boolean;
  branch: string | null;
};

export function toClientMember(member: Member): ClientMember {
  const { apiKey, ...safeMember } = member;
  return {
    ...safeMember,
    hasApiKey: Boolean(apiKey),
    branch: repositoryBranch(member.repoPath),
  };
}
