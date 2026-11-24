const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function hostnameOf(host: string): string {
  const value = host.trim().toLowerCase();
  if (value.startsWith("[")) return value.slice(0, value.indexOf("]") + 1);
  return value.split(":")[0];
}

// AgentsChat runs agents with read access to the user's disk and their API
// key, so only the user's own browser on this machine may talk to it. The Host
// check stops other machines on the network and DNS rebinding; the Origin check
// stops other websites from posting to the local server.
export function isLocalRequest(headers: Headers): boolean {
  const host = headers.get("host");
  if (!host || !LOCAL_HOSTNAMES.has(hostnameOf(host))) return false;

  const origin = headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).host.toLowerCase() === host.trim().toLowerCase();
  } catch {
    return false;
  }
}
