import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/embeddings";

describe("chunkText", () => {
  it("returns single chunk for short text", () => {
    const chunks = chunkText("Hello world");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Hello world");
  });

  it("returns empty array for empty string", () => {
    const chunks = chunkText("");
    // Known behavior: empty string produces no chunks (while loop doesn't execute)
    expect(chunks).toHaveLength(0);
  });

  it("splits long text into overlapping chunks", () => {
    const text = "a".repeat(2500);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be <= CHUNK_SIZE (1000)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1000);
    }
  });

  it("creates overlap between chunks", () => {
    const text = "a".repeat(1500);
    const chunks = chunkText(text);
    expect(chunks.length).toBe(2);
    // Second chunk should start 800 chars in (1000 - 200 overlap)
    expect(chunks[1].length).toBe(700); // 1500 - 800
  });

  it("handles text exactly at chunk size", () => {
    const text = "a".repeat(1000);
    const chunks = chunkText(text);
    // Known behavior: text at exactly CHUNK_SIZE produces 2 chunks due to overlap logic
    // (start advances by CHUNK_SIZE - OVERLAP = 800, so second iteration starts at 800)
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(text);
    expect(chunks[1]).toBe("a".repeat(200)); // last 200 chars from overlap
  });
});
