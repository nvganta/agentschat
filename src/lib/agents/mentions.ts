function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve exact, case-insensitive @mentions against configured agent names.
 * If the message has no valid mentions, every agent participates.
 */
export function resolveMentions<T extends { name: string }>(
  content: string,
  members: T[]
): T[] {
  const names = members
    .map((member) => member.name.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (names.length === 0) return members;

  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}_])@(${names.map(escapeRegExp).join("|")})(?=$|[^\\p{L}\\p{N}_])`,
    "giu"
  );
  const mentionedNames = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    mentionedNames.add(match[2].toLowerCase());
  }

  if (mentionedNames.size === 0) return members;

  return members.filter((member) =>
    mentionedNames.has(member.name.trim().toLowerCase())
  );
}
