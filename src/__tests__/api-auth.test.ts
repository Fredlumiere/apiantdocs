import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing
vi.mock("@/lib/supabase", () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

describe("validateApiKey", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null for missing authorization header", async () => {
    const { validateApiKey } = await import("@/lib/api-auth");
    const request = {
      headers: { get: () => null },
    } as any;
    const result = await validateApiKey(request);
    expect(result).toBeNull();
  });

  it("returns null for non-Bearer auth header", async () => {
    const { validateApiKey } = await import("@/lib/api-auth");
    const request = {
      headers: { get: (name: string) => name === "authorization" ? "Basic abc" : null },
    } as any;
    const result = await validateApiKey(request);
    expect(result).toBeNull();
  });

  it("returns null for Bearer token without ak_ prefix", async () => {
    const { validateApiKey } = await import("@/lib/api-auth");
    const request = {
      headers: { get: (name: string) => name === "authorization" ? "Bearer not_an_api_key" : null },
    } as any;
    const result = await validateApiKey(request);
    expect(result).toBeNull();
  });
});

describe("requireWriteAccess", () => {
  it("rejects when service role key env is undefined", async () => {
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    vi.resetModules();
    const { requireWriteAccess } = await import("@/lib/api-auth");
    const request = {
      headers: { get: (name: string) => name === "authorization" ? "Bearer undefined" : null },
    } as any;
    const result = await requireWriteAccess(request);
    // Fixed: undefined env var no longer matches
    expect(result.authorized).toBe(false);

    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });
});
