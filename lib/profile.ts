/**
 * Typed access to data/profile.json — the single source of truth for the site.
 *
 * Values not yet filled in are marked with a leading "TODO:". Those render as
 * visible markers in the UI but are stripped everywhere the site speaks as
 * fact: /api/profile and the AI assistant. A placeholder must never be served
 * as if it were true.
 */
import raw from "@/data/profile.json";

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Experience {
  company: string;
  role: string;
  start: string;
  end: string;
  duration?: string;
  location?: string;
  type?: string;
  highlights: string[];
}

export interface Education {
  institution: string;
  credential: string;
  start?: string;
  end?: string;
  grade?: string;
  note?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issued?: string;
  expires?: string;
  credentialId?: string;
}

export interface Project {
  name: string;
  period?: string;
  summary: string;
  detail: string[];
  stack: string[];
  featured: boolean;
}

export interface Signal {
  value: string;
  label: string;
}

export interface Profile {
  meta: { status: string; note: string; lastUpdated: string };
  name: string;
  shortName: string;
  pronouns?: string;
  headline: string;
  specialism: string;
  tagline: string;
  linkedinHeadline: string;
  location: string;
  photo: string;
  avatar: string;
  yearsExperience: string;
  openToWork: {
    active: boolean;
    role: string;
    blurb: string;
    titles: string[];
    locations: string[];
    arrangements: string[];
    employmentType: string;
  };
  summary: string;
  summaryParagraphs: string[];
  signals: Signal[];
  contact: {
    email: string;
    phone?: string;
    linkedin: string;
    github?: string;
  };
  resume: { url: string | null; note?: string };
  coreAreas: string[];
  skills: SkillGroup[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  interests: string[];
}

export const profile = raw as Profile;

/** A value still waiting to be filled in. */
export function isTodo(value: unknown): boolean {
  return typeof value === "string" && /^\s*todo:/i.test(value);
}

/** Text for display: the real value, or null when it's still a placeholder. */
export function real(value: string | undefined | null): string | null {
  if (!value || isTodo(value)) return null;
  return value;
}

/** Recursively drop placeholders so nothing fake escapes as fact. */
function strip(value: unknown): unknown {
  if (isTodo(value)) return null;
  if (Array.isArray(value)) {
    return value.map(strip).filter((v) => v !== null && v !== undefined);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const s = strip(v);
      if (s === null || s === "" || (Array.isArray(s) && s.length === 0)) continue;
      out[k] = s;
    }
    return out;
  }
  return value;
}

/**
 * The profile as the outside world sees it. Phone is deliberately withheld
 * from the public JSON — it's on the page for humans, not for scrapers.
 */
export function publicProfile(): Record<string, unknown> {
  const p = profile;
  return strip({
    name: p.name,
    pronouns: p.pronouns,
    headline: p.headline,
    specialism: p.specialism,
    tagline: p.tagline,
    linkedinHeadline: p.linkedinHeadline,
    location: p.location,
    yearsExperience: p.yearsExperience,
    openToWork: p.openToWork,
    summary: p.summary,
    about: p.summaryParagraphs,
    signals: p.signals,
    contact: { email: p.contact.email, linkedin: p.contact.linkedin, github: p.contact.github },
    resumeUrl: p.resume.url,
    coreAreas: p.coreAreas,
    skills: p.skills.filter((s) => !isTodo(s.group)),
    experience: p.experience.filter((e) => !isTodo(e.company) && !isTodo(e.role)),
    education: p.education.filter((e) => !isTodo(e.institution)),
    certifications: p.certifications,
    projects: p.projects,
    interests: p.interests,
  }) as Record<string, unknown>;
}

/** Dotted paths still holding a TODO — powers `npm run profile:todo`. */
export function missingFields(): string[] {
  const out: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (isTodo(value)) return void out.push(path);
    if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (path === "" && k === "meta") continue;
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(profile, "");
  return out;
}

/** Compact fact sheet the AI assistant is allowed to draw on. */
export function factSheet(): string {
  return JSON.stringify(publicProfile(), null, 1);
}
