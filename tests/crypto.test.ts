import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptToken, encryptToken, safeEqual, sha256 } from "@/lib/crypto";

const key = randomBytes(32);

describe("Integration token encryption", () => {
  it("round-trips a token", () => {
    const sealed = encryptToken("ghp_example_token", key);
    expect(decryptToken(sealed, key)).toBe("ghp_example_token");
  });

  it("never stores the plain token", () => {
    const sealed = encryptToken("vercel_secret_value", key);
    expect(JSON.stringify(sealed)).not.toContain("vercel_secret_value");
  });

  it("uses a fresh IV every time", () => {
    expect(encryptToken("same", key).iv).not.toBe(encryptToken("same", key).iv);
  });

  it("rejects tampered ciphertext", () => {
    const sealed = encryptToken("abc", key);
    const bytes = Buffer.from(sealed.ciphertext, "base64");
    bytes[0] ^= 0xff;
    expect(() => decryptToken({ ...sealed, ciphertext: bytes.toString("base64") }, key)).toThrow();
  });

  it("rejects the wrong key", () => {
    expect(() => decryptToken(encryptToken("abc", key), randomBytes(32))).toThrow();
  });

  it("requires ENCRYPTION_KEY when no key is passed", () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptToken("abc")).toThrow(/ENCRYPTION_KEY/);
    if (saved !== undefined) process.env.ENCRYPTION_KEY = saved;
  });

  it("compares and hashes", () => {
    expect(safeEqual("a", "a")).toBe(true);
    expect(safeEqual("a", "b")).toBe(false);
    expect(sha256("zido")).toHaveLength(64);
  });
});
