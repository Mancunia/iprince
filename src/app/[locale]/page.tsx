import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import Icon from "@/components/site/Icon";
import Corners from "@/components/site/Corners";
import ContactForm from "@/components/site/ContactForm";
import { getFeaturedProfessions } from "@/lib/professions";
import { site } from "@/lib/site";

type Item = { icon: string; title: string; text?: string };
type Step = { title: string; text: string };
type Faq = { q: string; a: string };

const row = { display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 6 } as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const professions = await getFeaturedProfessions();

  const candidateItems = t.raw("doors.candidate.items") as Item[];
  const employerItems = t.raw("doors.employer.items") as Item[];
  const trust = t.raw("trust") as Item[];
  const why = t.raw("why.items") as Item[];
  const steps = t.raw("process.steps") as Step[];
  const faqs = t.raw("faq.items") as Faq[];

  return (
    <>
      <section
        className="container"
        style={{
          paddingBlock: "clamp(40px,7vw,88px) clamp(32px,5vw,56px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
          gap: "clamp(32px,5vw,64px)",
          alignItems: "center",
        }}
      >
        <div style={{ display: "grid", gap: 22 }}>
          <span className="kicker kicker-rule">{t("hero.kicker")}</span>
          <h1>{t("hero.title")}</h1>
          <p className="lead">{t("hero.lead")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="btn btn-primary btn-lg blueprint" href="/submit-cv">
              <Corners />
              {t("hero.apply")}
              <Icon name="arrow-right" />
            </Link>
            <Link className="btn btn-lg" href="/for-employers">
              {t("hero.request")}
            </Link>
          </div>
        </div>
        <figure className="blueprint" style={{ margin: 0 }}>
          <Corners />
          <div className="ph" style={{ aspectRatio: "4/3" }}>
            {t("hero.photo")}
          </div>
        </figure>
      </section>

      <section className="container" aria-label={t("trustLabel")}>
        <div className="trust-strip">
          {trust.map((b) => (
            <div key={b.title} className="trust-badge">
              <Icon name={b.icon} size="lg" />
              <div>
                <div className="trust-badge-title">{b.title}</div>
                <div className="trust-badge-sub">{b.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="kicker">{t("professions.kicker")}</span>
            <h2>{t("professions.title")}</h2>
          </div>
          <div className="cells" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))" }}>
            {professions.map((p) => (
              <Link
                key={p.slug}
                className="card"
                href="/jobs"
                style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: "18px 20px" }}
              >
                <Icon name={p.icon} size="lg" />
                <span style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
                  <span className="card-title" style={{ fontSize: 19 }}>
                    {p.name[locale as Locale]}
                  </span>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {t("professions.open", { count: p.openPositions })}
                  </span>
                </span>
                <Icon name="chevron-right" size="sm" style={{ color: "var(--text-accent)" }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="door-split blueprint">
            <Corners />
            <div className="door door-candidate" id="fachkraefte" style={{ background: "var(--surface-tint)" }}>
              <span className="kicker kicker-rule">{t("doors.candidate.kicker")}</span>
              <h2>{t("doors.candidate.title")}</h2>
              <p className="muted">{t("doors.candidate.text")}</p>
              <ul className="door-list">
                {candidateItems.map((it) => (
                  <li key={it.title}>
                    <Icon name={it.icon} />
                    <span>
                      <strong>{it.title}</strong>
                      <br />
                      <span className="muted">{it.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div style={row}>
                <Link className="btn btn-primary" href="/submit-cv">
                  {t("doors.candidate.primary")}
                </Link>
                <Link className="btn btn-ghost" href="/jobs">
                  {t("doors.candidate.secondary")}
                </Link>
              </div>
            </div>
            <div className="door door-employer" id="arbeitgeber">
              <span className="kicker kicker-rule">{t("doors.employer.kicker")}</span>
              <h2>{t("doors.employer.title")}</h2>
              <p className="muted">{t("doors.employer.text")}</p>
              <ul className="door-list">
                {employerItems.map((it) => (
                  <li key={it.title}>
                    <Icon name={it.icon} />
                    {it.title}
                  </li>
                ))}
              </ul>
              <div style={row}>
                <Link className="btn btn-primary" href="/for-employers">
                  {t("doors.employer.primary")}
                </Link>
                <a className="btn btn-ghost" href="#kontakt">
                  {t("doors.employer.secondary")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: "clamp(48px,8vw,96px)" }} aria-labelledby="why">
        <div className="section-head">
          <span className="kicker kicker-rule">{t("why.kicker")}</span>
          <h2 id="why">{t("why.title")}</h2>
        </div>
        <div className="cells" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))" }}>
          {why.map((w) => (
            <div key={w.title} style={{ display: "grid", gap: 10, padding: 22 }}>
              <Icon name={w.icon} size="lg" style={{ color: "var(--text-highlight)" }} />
              <h4>{w.title}</h4>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="ablauf" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="kicker">{t("process.kicker")}</span>
            <h2>{t("process.title")}</h2>
            <p className="muted">{t("process.text")}</p>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="steps-num">{String(i + 1).padStart(2, "0")}</span>
                <h4>{s.title}</h4>
                <p className="muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="kicker">{t("testimonials.kicker")}</span>
            <h2>{t("testimonials.title")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 28 }}>
            <figure className="quote blueprint" style={{ margin: 0 }}>
              <Corners />
              <Icon name="quote" size="lg" style={{ color: "var(--text-accent)" }} />
              <blockquote className="quote-text" style={{ margin: 0 }}>
                {t("testimonials.candidate.quote")}
              </blockquote>
              <figcaption className="quote-by">
                <div className="ph">{t("testimonials.photo")}</div>
                <div>
                  <strong>{t("testimonials.candidate.name")}</strong>
                  <div className="muted">{t("testimonials.candidate.meta")}</div>
                </div>
              </figcaption>
            </figure>
            <figure className="quote blueprint door-employer" style={{ margin: 0 }}>
              <Corners />
              <Icon name="quote" size="lg" style={{ color: "var(--text-accent)" }} />
              <blockquote className="quote-text" style={{ margin: 0 }}>
                {t("testimonials.employer.quote")}
              </blockquote>
              <figcaption className="quote-by">
                <div className="ph">Logo</div>
                <div>
                  <strong>{t("testimonials.employer.name")}</strong>
                  <div className="muted">{t("testimonials.employer.meta")}</div>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="section" id="faq" style={{ paddingTop: 0 }}>
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
            gap: "clamp(24px,5vw,64px)",
            alignItems: "start",
          }}
        >
          <div className="section-head" style={{ margin: 0 }}>
            <span className="kicker">{t("faq.kicker")}</span>
            <h2>{t("faq.title")}</h2>
            <p className="muted">{t("faq.text")}</p>
          </div>
          <div className="faq">
            {faqs.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}</summary>
                <p className="faq-body">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section door-employer" id="kontakt">
        <div
          className="container"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(28px,5vw,64px)" }}
        >
          <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
            <span className="kicker">{t("contact.kicker")}</span>
            <h2>{t("contact.title")}</h2>
            <p className="muted">{t("contact.text")}</p>
            <div>
              <a className="btn btn-primary btn-lg blueprint" href={site.whatsappHref} target="_blank" rel="noopener">
                <Corners />
                <Icon name="message-circle" />
                {t("contact.whatsapp")}
              </a>
            </div>
            <ul className="door-list">
              <li>
                <Icon name="message-circle" />
                WhatsApp: {site.phoneDisplay}
              </li>
              <li>
                <Icon name="mail" />
                {site.email}
              </li>
              <li>
                <Icon name="map-pin" />
                {site.address}
              </li>
            </ul>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
