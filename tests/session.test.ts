import { describe, expect, it } from "vitest";
import { createSessionValue, readSessionValue } from "@/lib/session";

const secret = "x".repeat(40);

describe("session cookie", () => {
  it("reads back the user id", () => {
    expect(readSessionValue(createSessionValue("user_1", secret), secret)).toBe("user_1");
  });

  it("rejects another secret, a forged payload and an expired session", () => {
    const value = createSessionValue("user_1", secret, 1000, 10);
    expect(readSessionValue(createSessionValue("user_1", secret), "y".repeat(40))).toBeNull();
    const forged = Buffer.from(JSON.stringify({ uid: "admin", exp: 9e15 })).toString("base64url") + "." + value.split(".")[1];
    expect(readSessionValue(forged, secret)).toBeNull();
    expect(readSessionValue(value, secret, 5000)).toBeNull();
    expect(readSessionValue(undefined, secret)).toBeNull();
  });
});
