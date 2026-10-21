export const PROFILE_FILE = "PROFILE.md";
export const VOLATILE_FILE = "VOLATILE.md";
export const VOLATILE_MAX_LINES = 40;

const REMEMBER_RE = /\[REMEMBER:\s*([^\]]+?)\s*\]/g;

/** VOLATILE.md: a rolling log of recent context, capped at VOLATILE_MAX_LINES entries. */
export function appendVolatile(current: string, entry: string, now = new Date()): string {
  const lines = current.split("\n").filter((l) => l.startsWith("- "));
  lines.push(`- ${now.toISOString()} ${entry.replace(/\s+/g, " ").trim()}`);
  return `# ${VOLATILE_FILE}\n\n${lines.slice(-VOLATILE_MAX_LINES).join("\n")}\n`;
}

/** Pulls [REMEMBER: fact] tags out of a reply so they can be written to PROFILE.md. */
export function extractProfileUpdates(text: string): { clean: string; facts: string[] } {
  const facts: string[] = [];
  const clean = text
    .replace(REMEMBER_RE, (_m: string, fact: string) => {
      facts.push(fact);
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { clean, facts };
}

/** PROFILE.md: lasting facts about the user, de-duplicated. */
export function mergeProfile(current: string, facts: string[]): string {
  const lines = current.trim() ? current.trim().split("\n") : [`# ${PROFILE_FILE}`, ""];
  const known = new Set(lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim().toLowerCase()));
  for (const fact of facts) {
    const t = fact.trim();
    if (t && !known.has(t.toLowerCase())) {
      lines.push(`- ${t}`);
      known.add(t.toLowerCase());
    }
  }
  return `${lines.join("\n")}\n`;
}

export function buildMemoryContext(profile: string, volatile: string): string {
  return `<${PROFILE_FILE}>\n${profile.trim() || "(empty)"}\n</${PROFILE_FILE}>\n<${VOLATILE_FILE}>\n${volatile.trim() || "(empty)"}\n</${VOLATILE_FILE}>`;
}
