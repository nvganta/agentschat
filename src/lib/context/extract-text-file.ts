export function extractTextFileContent(buffer: Buffer): string {
  return buffer.toString("utf-8").trim();
}
