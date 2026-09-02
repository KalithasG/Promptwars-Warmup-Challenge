import Image from "next/image";

import AskMe from "@/components/AskMe";
import Portrait from "@/components/Portrait";
import ThemeToggle from "@/components/ThemeToggle";
import Backdrop from "@/components/scene/Backdrop";
import { Card, Chip, Field, Section } from "@/components/ui";
import { profile, publicProfile, real } from "@/lib/profile";

/**
 * Structured data. Between this, /api/profile and the AI endpoint, the link
 * carries the same facts three ways: for search engines, for machines, and for
 * people who would rather just ask a question.
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
    award: profile.awards.map((a) => a.name),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

/** Apple's global nav: thin, translucent, always available. */
function Nav() {
  const links = [
    ["About", "#about"],
    ["Experience", "#experience"],
    ["Projects", "#projects"],
    ["Skills", "#skills"],
    ["Ask", "#ask"],
    ["Contact", "#contact"],
  ];

  return (
    <header className="material sticky top-0 z-50 border-b border-separator">
      <nav className="relative mx-auto flex h-12 max-w-5xl items-center">
        {/* Centred on the bar itself. The appearance control is taken out of
            the flow so it cannot pull the links off-centre. */}
        <ul className="flex w-full items-center justify-start gap-5 overflow-x-auto pl-5 pr-2 mr-12 [mask-image:linear-gradient(to_right,#000_88%,transparent)] [scrollbar-width:none] md:mr-0 md:justify-center md:gap-8 md:px-12 md:[mask-image:none] [&::-webkit-scrollbar]:hidden">
          {links.map(([label, href]) => (
            <li key={href} className="shrink-0">
              <a
                href={href}
                className="text-[0.8125rem] text-label-2 transition-colors hover:text-label"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

/**
 * The hero follows Apple's product-page pattern: centred type, then the image
 * at full width beneath it. The portrait is the largest element on the page.
 */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <Backdrop />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 pt-14 pb-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] md:gap-12 md:pt-20 md:pb-14">
        <div>
          {profile.openToWork?.active && (
            <p className="t-eyebrow reveal" style={{ animationDelay: "80ms" }}>
              {profile.openToWork.blurb}
            </p>
          )}
          <h1 className="t-display reveal mt-3" style={{ animationDelay: "160ms" }}>
            <Field value={profile.name} />
          </h1>
          <p
            className="t-title reveal mt-3 text-label-2"
            style={{ animationDelay: "240ms" }}
          >
            <Field value={profile.headline} />
          </p>
          <p
            className="t-body-lg reveal mt-6 max-w-xl text-label-2"
            style={{ animationDelay: "320ms" }}
          >
            <Field value={profile.specialism} />. <Field value={profile.tagline} />.
          </p>

          <div
            className="reveal mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "400ms" }}
          >
            <a href="#ask" className="btn btn-filled">
              Ask about me
            </a>
            <a href="#contact" className="btn btn-tinted">
              Get in touch
            </a>
            {profile.resume?.url && (
              <a href={profile.resume.url} download className="btn btn-tinted">
                Résumé
              </a>
            )}
          </div>

          <p className="t-caption reveal mt-6" style={{ animationDelay: "480ms" }}>
            {profile.location} · {profile.pronouns} · {profile.yearsExperience} years
          </p>
        </div>

        {/* The portrait leads the right column and stays the largest element
            on the page. The reveal sits on this wrapper so it cannot fight the
            pointer parallax, which sets a transform of its own inside. */}
        <div className="reveal-media" style={{ animationDelay: "200ms" }}>
          <Portrait
            src={profile.photo}
            alt={`${profile.name}, ${profile.headline}`}
            width={1265}
            height={1500}
            priority
            sizes="(max-width: 768px) 100vw, 660px"
            className="mx-auto h-auto w-full max-w-[660px] object-contain md:mr-0"
          />
        </div>
      </div>
    </section>
  );
}

/** The numbers, as a quiet band between hero and content. */
function Signals() {
  return (
    <section className="border-y border-separator bg-grouped">
      <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
        {profile.signals.map((s) => (
          <div key={s.label}>
            <dt className="t-title">{s.value}</dt>
            <dd className="mt-2 text-[0.95rem] leading-snug text-label-2">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <PersonJsonLd />
      <Nav />

      <main id="main">
        <Hero />
        <Signals />

        <Section
          id="about"
          eyebrow="About"
          title="Legacy systems, modern data platforms."
          standfirst="Four-plus years in a regulated BFSI environment, working the seam between core banking and analytics."
        >
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
            <div className="flex flex-col gap-5 text-label-2">
              {profile.summaryParagraphs.map((para, i) => (
                <p key={i} className={i === 0 ? "t-body-lg text-label" : undefined}>
                  <Field value={para} />
                </p>
              ))}
              <ul className="mt-2 flex flex-wrap gap-2">
                {profile.coreAreas.map((area) => (
                  <Chip key={area}>{area}</Chip>
                ))}
              </ul>
            </div>
            <figure className="md:sticky md:top-24 md:self-start">
              <Image
                src={profile.photoAbout}
                alt={profile.name}
                width={1000}
                height={1250}
                sizes="(max-width: 768px) 90vw, 272px"
                className="w-full rounded-2xl object-cover"
              />
              <figcaption className="t-caption mt-3">{profile.location}</figcaption>
            </figure>
          </div>
        </Section>

        <Section
          id="experience"
          eyebrow="Experience"
          title="Where the work happened."
          tone="grouped"
        >
          <div className="flex flex-col gap-5">
            {profile.experience.map((job, i) => (
              <Card key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="t-headline">
                    <Field value={job.role} />
                  </h3>
                  <p className="t-caption">
                    {job.start} – {job.end}
                    {job.duration ? ` · ${job.duration}` : ""}
                  </p>
                </div>
                <p className="mt-1 text-accent">
                  <Field value={job.company} />
                </p>
                {job.location && <p className="t-caption mt-1">{job.location}</p>}
                <ul className="mt-5 flex flex-col gap-3 text-label-2">
                  {job.highlights.map((h, j) => (
                    <li key={j} className="flex gap-3">
                      <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-label-3" />
                      <span>
                        <Field value={h} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="t-headline mb-4">Education</h3>
              {profile.education.map((e, i) => (
                <Card key={i}>
                  <p className="font-medium">
                    <Field value={e.credential} />
                  </p>
                  <p className="mt-1 text-label-2">
                    <Field value={e.institution} />
                  </p>
                  <p className="t-caption mt-2">
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                    {e.grade ? ` · ${e.grade}` : ""}
                  </p>
                </Card>
              ))}
            </div>
            <div>
              <h3 className="t-headline mb-4">Recognition</h3>
              {profile.awards.map((a) => (
                <Card key={a.name}>
                  <p className="font-medium">{a.name}</p>
                  <p className="mt-1 text-label-2">
                    {a.issuer}
                    {a.date ? ` · ${a.date}` : ""}
                  </p>
                  {a.citation && <p className="t-caption mt-3 leading-relaxed">{a.citation}</p>}
                </Card>
              ))}
            </div>
          </div>
        </Section>

        <Section
          id="projects"
          eyebrow="Projects"
          title="Built outside production, to the same standard."
        >
          <div className="flex flex-col gap-5">
            {profile.projects.map((p) => (
              <Card key={p.name}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="t-headline">{p.name}</h3>
                  {p.period && <p className="t-caption">{p.period}</p>}
                </div>
                <p className="t-body-lg mt-4 text-label-2">{p.summary}</p>
                {p.detail.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 text-label-2">
                    {p.detail.map((d, i) => (
                      <p key={i}>{d}</p>
                    ))}
                  </div>
                )}
                {p.stack.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {p.stack.map((s) => (
                      <Chip key={s}>{s}</Chip>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="skills"
          eyebrow="Capability"
          title="What I work with."
          tone="grouped"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {profile.skills.map((group) => (
              <Card key={group.group}>
                <h3 className="t-headline">
                  <Field value={group.group} />
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <h3 className="t-headline mt-12 mb-4">Certifications</h3>
          <ul className="card divide-y divide-separator">
            {profile.certifications.map((c) => (
              <li
                key={c.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 py-4"
              >
                <span>{c.name}</span>
                <span className="t-caption">
                  {c.issuer}
                  {c.issued ? ` · ${c.issued}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="ask"
          eyebrow="Ask"
          title="Rather than read it all, ask."
          standfirst="Answers come from a live model grounded strictly in the facts on this page. If something isn't listed here, it will say so instead of guessing."
        >
          <AskMe />
        </Section>

        <Section id="contact" eyebrow="Contact" title="Get in touch." tone="grouped">
          <ul className="card divide-y divide-separator">
            {[
              ["Email", profile.contact.email, `mailto:${profile.contact.email}`],
              ["Phone", profile.contact.phone, `tel:${profile.contact.phone?.replace(/\s/g, "")}`],
              ["LinkedIn", "in/kalithas-govindaraj", profile.contact.linkedin],
              ["GitHub", "KalithasG", profile.contact.github],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value, href]) => (
                <li key={label}>
                  <a
                    href={href as string}
                    className="flex items-baseline justify-between gap-6 px-6 py-4 transition-colors hover:bg-fill"
                  >
                    <span className="text-label-2">{label}</span>
                    <span className="text-right text-accent">{value}</span>
                  </a>
                </li>
              ))}
          </ul>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="t-headline">Preferred locations</h3>
              <p className="mt-2 text-label-2">{profile.openToWork.locations.join(" · ")}</p>
            </div>
            <div>
              <h3 className="t-headline">Arrangement</h3>
              <p className="mt-2 text-label-2">
                {profile.openToWork.arrangements.join(" · ")} · {profile.openToWork.employmentType}
              </p>
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t border-separator">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-8">
          <p className="t-caption">
            © {new Date().getFullYear()} {profile.name}
          </p>
          <p className="t-caption">
            Machine-readable:{" "}
            <a href="/api/profile" className="text-accent hover:underline">
              /api/profile
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
