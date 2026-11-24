import { NextResponse, type NextRequest } from "next/server";
import { isLocalRequest } from "@/lib/local-request";

export function proxy(request: NextRequest) {
  if (!isLocalRequest(request.headers)) {
    return new NextResponse(
      "AgentsChat only accepts requests from this machine.",
      {
        status: 403,
      }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
