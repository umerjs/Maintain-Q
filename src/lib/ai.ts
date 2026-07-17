import type { HelpRequest, Urgency } from "@/data/mockData";
import { HELP_CATEGORIES } from "@/data/mockData";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "need",
  "help",
  "please",
  "someone",
  "looking",
  "want",
  "get",
  "got",
]);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Coding: [
    "code",
    "coding",
    "react",
    "javascript",
    "typescript",
    "python",
    "bug",
    "debug",
    "program",
    "api",
    "html",
    "css",
    "node",
    "sql",
    "git",
    "algorithm",
    "software",
    "app",
    "website",
  ],
  Math: [
    "math",
    "calculus",
    "algebra",
    "statistics",
    "geometry",
    "equation",
    "derivative",
    "integral",
    "matrix",
    "probability",
    "trigonometry",
    "homework",
  ],
  Design: [
    "design",
    "figma",
    "ui",
    "ux",
    "graphic",
    "logo",
    "color",
    "layout",
    "typography",
    "wireframe",
    "prototype",
    "portfolio",
    "illustration",
  ],
  Writing: [
    "write",
    "writing",
    "essay",
    "paper",
    "grammar",
    "edit",
    "proofread",
    "literature",
    "blog",
    "article",
    "outline",
    "thesis",
  ],
  Career: [
    "career",
    "resume",
    "cv",
    "interview",
    "job",
    "internship",
    "linkedin",
    "cover letter",
    "networking",
    "salary",
    "offer",
  ],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function categorize(text: string): string {
  const lower = text.toLowerCase();
  let best = "Other";
  let bestScore = 0;
  for (const cat of HELP_CATEGORIES) {
    if (cat === "Other") continue;
    const keywords = CATEGORY_KEYWORDS[cat] ?? [];
    const score = keywords.reduce((s, kw) => (lower.includes(kw) ? s + 1 : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
}

export function suggestTags(text: string): string[] {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();
  tokens.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([w]) => w);
}

export function detectUrgency(text: string): Urgency {
  const lower = text.toLowerCase();
  if (/\b(asap|urgent|immediately|deadline today|emergency|critical|right now)\b/.test(lower)) {
    return "Critical";
  }
  if (/\b(soon|tomorrow|this week|due|deadline|high priority)\b/.test(lower)) {
    return "High";
  }
  if (/\b(whenever|no rush|low priority|not urgent|flexible|sometime)\b/.test(lower)) {
    return "Low";
  }
  return "Medium";
}

export function suggestRewrite(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return "I need help with [topic] because [reason].";
  const category = categorize(cleaned);
  const urgency = detectUrgency(cleaned);
  const short = cleaned.length > 180 ? `${cleaned.slice(0, 177)}…` : cleaned;
  return `I need help with ${category.toLowerCase()}: ${short}${urgency === "Critical" || urgency === "High" ? ` (${urgency} urgency)` : ""}`;
}

export function suggestSkillMatches(userSkills: string[], requests: HelpRequest[]): HelpRequest[] {
  const skills = userSkills.map((s) => s.toLowerCase());
  if (skills.length === 0) return requests.filter((r) => r.status === "Open").slice(0, 5);

  return requests
    .filter((r) => r.status === "Open" || r.status === "In Progress")
    .map((r) => {
      const haystack = [r.category, ...r.tags, ...r.skillsNeeded].map((x) => x.toLowerCase());
      const score = skills.reduce(
        (acc, s) => acc + (haystack.some((h) => h.includes(s) || s.includes(h)) ? 1 : 0),
        0,
      );
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.r);
}

export function aiSummary(request: HelpRequest): string {
  const body = request.description.trim();
  const snippet = body.length > 150 ? `${body.slice(0, 147)}…` : body;
  return `${snippet} · Detected: ${request.category} · ${request.urgency} urgency`;
}

export function suggestSkillsFromInterests(interests: string[], skills: string[]): string[] {
  const pool = [
    "React",
    "TypeScript",
    "Python",
    "Calculus",
    "Statistics",
    "Figma",
    "UI/UX",
    "Essay Writing",
    "Resume",
    "Interview Prep",
    "JavaScript",
    "Linear Algebra",
  ];
  const have = new Set([...skills, ...interests].map((s) => s.toLowerCase()));
  return pool.filter((p) => !have.has(p.toLowerCase())).slice(0, 4);
}

export function suggestHelpAreas(skills: string[], interests: string[]): string[] {
  const cats = [...HELP_CATEGORIES].filter((c) => c !== "Other");
  const known = new Set([...skills, ...interests].map((s) => s.toLowerCase()));
  return cats.filter((c) => !known.has(c.toLowerCase())).slice(0, 3);
}
