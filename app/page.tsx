import Image from "next/image";

import AskMe from "@/components/AskMe";
import Hero3D from "@/components/scene/Hero3D";
import { Card, Field, Label, Section, Tag } from "@/components/ui";
import { profile, publicProfile, real } from "@/lib/profile";

/**
 * Structured data. Between this, /api/profile and the AI endpoint, the link
 * carries the same facts three ways: for search engines, for machines, and for
 * people who'd rather just ask a question.
 */
function PersonJsonLd() {
  const p = publicProfile();
  const json = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: profile.headline,
    description: profile.summary,
    email: `mailto:${profile.contact.email}`,
    image: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}${profile.photo}`
      : undefined,
    url: process.env.NEXT_PUBLIC_SITE_URL,
    address: { "@type": "PostalAddress", addressLocality: profile.location },
    worksFor: { "@type": "Organization", name: profile.experience[0]?.company },
    alumniOf: { "@type": "EducationalOrganization", name: profile.education[0]?.institution },
    sameAs: [real(profile.contact.linkedin), real(profile.contact.github)].filter(Boolean),
    knowsAbout: profile.coreAreas,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

function TopBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-rule/70 bg-page/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Label className="hidden sm:block">Sep ©2026</Label>
        <a href="#top" className="label !text-ink truncate">
          {profile.shortName}
        </a>
        <Label className="hidden truncate sm:block">{profile.headline}</Label>
        <nav className="flex gap-4 sm:hidden">
          <a href="#ask" className="label !text-accent-soft">
            Ask
          </a>
          <a href="#contact" className="label">
            Contact
          </a>
        </nav>
        <nav className="hidden gap-5 md:flex">
          {[
            ["About", "#about"],
            ["Work", "#experience"],
            ["Projects", "#projects"],
            ["Ask", "#ask"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="label transition-colors hover:!text-ink">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Hero() {
  const resumeUrl = profile.resume?.url;
  // The name carries the hero, split across the two faces of the pairing.
  const [firstName, ...restOfName] = profile.name.split(" ");
  const surname = restOfName.join(" ");

  return (
    <header id="top" className="grain relative overflow-hidden pt-14">
      <Hero3D />
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-14 md:grid-cols-[1fr_1.05fr] md:gap-14 md:pb-24 md:pt-20">
        <div>
          <div>
            <Label>
              01 <span className="text-rule">/</span> 07
            </Label>
          </div>

          {profile.openToWork?.active && (
            <p className="mt-6 inline-flex items-center gap-2 border border-accent/40 px-3 py-1.5 font-mono text-xs tracking-wider text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {profile.openToWork.blurb}
            </p>
          )}

          <h1 className="mt-6">
            <span className="grotesk block text-[clamp(2.9rem,8.6vw,6.1rem)]">{firstName}</span>
            <span className="display block text-[clamp(3rem,9.4vw,7rem)] italic text-ink-soft">
              {surname}
            </span>
          </h1>

          <p className="label mt-7 !text-ink" style={{ letterSpacing: "0.3em" }}>
            {profile.headline}
          </p>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            <Field value={profile.specialism} />.{" "}
            <span className="font-medium text-ink">
              <Field value={profile.tagline} />
            </span>
          </p>

          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            {profile.yearsExperience} years across core banking systems, legacy reporting
            modernization and data engineering in a regulated BFSI environment.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#ask"
              className="bg-ink px-6 py-3 font-medium text-page transition-colors hover:bg-ink-soft"
            >
              Ask about me
            </a>
            {resumeUrl && (
              <a
                href={resumeUrl}
                download
                className="border border-rule px-6 py-3 font-medium transition-colors hover:border-ink"
              >
                Résumé
              </a>
            )}
            <a
              href={`mailto:${profile.contact.email}`}
              className="border border-rule px-6 py-3 font-medium transition-colors hover:border-ink"
            >
              Get in touch
            </a>
          </div>
        </div>

        {/* The asset's own edges are blended to --page, so the photograph has
            no boundary: no frame, no scrim, no mask needed here. */}
        <div className="relative w-full">
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <Image
              src={profile.photo}
              alt={`${profile.name}, ${profile.headline}`}
              fill
              priority
              sizes="(max-width: 768px) 94vw, 580px"
              className="object-cover"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <Label>{profile.experience[0]?.company}</Label>
            <Label>
              {profile.location} · {profile.pronouns}
            </Label>
          </div>
        </div>
      </div>
    </header>
  );
}

function Signals() {
  return (
    <div className="border-t border-rule">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-rule px-6 md:grid-cols-4">
        {profile.signals.map((s) => (
          <div key={s.label} className="bg-page px-1 py-8 md:px-4">
            <dt className="display text-3xl text-ink md:text-4xl">{s.value}</dt>
            <dd className="mt-2 text-sm leading-snug text-muted">{s.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <PersonJsonLd />
      <TopBar />
      <main id="main" className="flex-1">
        <Hero />
        <Signals />

        <Section
          id="about"
          index="02"
          title="About"
          kicker="Where legacy banking systems meet modern data platforms."
        >
          <div className="flex flex-col gap-5 text-lg leading-relaxed text-ink-soft">
            {profile.summaryParagraphs.map((para, i) => (
              <p key={i} className={i === 0 ? "text-ink" : undefined}>
                <Field value={para} />
              </p>
            ))}
          </div>
          <ul className="mt-10 flex flex-wrap gap-2">
            {profile.coreAreas.map((area) => (
              <Tag key={area}>{area}</Tag>
            ))}
          </ul>
        </Section>

        <Section
          id="experience"
          index="03"
          title="Experience"
          kicker="Production work in a regulated BFSI environment."
        >
          <div className="flex flex-col gap-4">
            {profile.experience.map((job, i) => (
              <Card key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h3 className="text-xl">
                    <Field value={job.role} />
                  </h3>
                  <Label>
                    {job.start} — {job.end}
                    {job.duration ? ` · ${job.duration}` : ""}
                  </Label>
                </div>
                <p className="mt-2 text-accent-soft">
                  <Field value={job.company} />
                </p>
                {job.location && <p className="mt-1 text-sm text-muted">{job.location}</p>}
                <ul className="mt-6 flex flex-col gap-3">
                  {job.highlights.map((h, j) => (
                    <li key={j} className="flex gap-3 leading-relaxed text-ink-soft">
                      <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-accent/60" />
                      <span>
                        <Field value={h} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <Label>Education</Label>
            <div className="mt-4 flex flex-col gap-3">
              {profile.education.map((e, i) => (
                <Card key={i}>
                  <p className="text-lg">
                    <Field value={e.credential} />
                  </p>
                  <p className="mt-1 text-ink-soft">
                    <Field value={e.institution} />
                  </p>
                  <p className="mt-2 font-mono text-xs tracking-wider text-muted">
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                    {e.grade ? ` · ${e.grade}` : ""}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </Section>

        <Section
          id="projects"
          index="04"
          title="Projects"
          kicker="Built outside production work, to the same standard."
        >
          <div className="flex flex-col gap-4">
            {profile.projects.map((p) => (
              <Card key={p.name}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h3 className="text-xl">{p.name}</h3>
                  {p.period && <Label>{p.period}</Label>}
                </div>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">{p.summary}</p>
                {p.detail.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 leading-relaxed text-muted">
                    {p.detail.map((d, i) => (
                      <p key={i}>{d}</p>
                    ))}
                  </div>
                )}
                {p.stack.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {p.stack.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="skills"
          index="05"
          title="Capability"
          kicker="What I work with, and what I'm certified in."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.skills.map((group) => (
              <Card key={group.group}>
                <h3 className="text-lg">
                  <Field value={group.group} />
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <Label>Certifications</Label>
            <ul className="mt-4 divide-y divide-rule border-y border-rule">
              {profile.certifications.map((c) => (
                <li key={c.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                  <span className="text-ink-soft">{c.name}</span>
                  <Label>
                    {c.issuer}
                    {c.issued ? ` · ${c.issued}` : ""}
                  </Label>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section
          id="ask"
          index="06"
          title="Ask"
          kicker="A live model, grounded strictly in the facts on this page."
        >
          <p className="mb-6 max-w-2xl leading-relaxed text-muted">
            Rather than read the whole page, ask a question. If something
            isn&apos;t listed here, it will say so instead of guessing.
          </p>
          <AskMe />
        </Section>

        <Section
          id="contact"
          index="07"
          title="Contact"
          kicker={`Open to ${profile.openToWork.titles.slice(0, 2).join(" and ")} roles.`}
        >
          <div className="flex flex-col gap-px bg-rule">
            {[
              ["Email", profile.contact.email, `mailto:${profile.contact.email}`],
              ["Phone", profile.contact.phone, `tel:${profile.contact.phone?.replace(/\s/g, "")}`],
              ["LinkedIn", "in/kalithas-govindaraj", profile.contact.linkedin],
              ["GitHub", "KalithasG", profile.contact.github],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value, href]) => (
                <a
                  key={label}
                  href={href as string}
                  className="group flex items-baseline justify-between gap-6 bg-page py-5 transition-colors hover:bg-surface"
                >
                  <Label>{label}</Label>
                  <span className="text-right text-ink-soft transition-colors group-hover:text-accent-soft">
                    {value}
                  </span>
                </a>
              ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Preferred locations</Label>
              <p className="mt-3 leading-relaxed text-ink-soft">
                {profile.openToWork.locations.join(" · ")}
              </p>
            </div>
            <div>
              <Label>Arrangement</Label>
              <p className="mt-3 leading-relaxed text-ink-soft">
                {profile.openToWork.arrangements.join(" · ")} ·{" "}
                {profile.openToWork.employmentType}
              </p>
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8">
          <Label>
            © {new Date().getFullYear()} {profile.name}
          </Label>
          <Label>
            machine-readable:{" "}
            <a href="/api/profile" className="text-accent-soft hover:underline">
              /api/profile
            </a>
          </Label>
        </div>
      </footer>
    </>
  );
}
