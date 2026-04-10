import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "0.2.0",
    update_command: "curl -sf https://info.apiant.com/apiant-docs-mcp.js -o ~/.apiant-docs-mcp.js",
  });
}
