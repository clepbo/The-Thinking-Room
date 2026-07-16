import { site } from "./content";
import { Icon } from "../components/Icons";
import { LogoMark } from "../components/Logo";
import Nav from "../components/Nav";
import Reveal from "../components/Reveal";
import RegisterForm from "../components/RegisterForm";
import JournalForm from "../components/JournalForm";

export default function Home() {
  return (
    <>
      <span id="top" />
      <Nav />

      {/* ================================================= HERO */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <HeroBackdrop />
        </div>
        <div className="container hero-inner">
          <Reveal className="hero-badges">
            <span className="eyebrow-badge">
              <span className="dot" />
              {site.hero.eyebrow}
            </span>
            <span className="eyebrow-badge">{site.hero.edition}</span>
          </Reveal>

          <Reveal delay={80}>
            <h1>
              {site.hero.titleTop}{" "}
              <span className="gold">{site.hero.titleBottom}</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="hero-desc">{site.hero.description}</p>
          </Reveal>

          <Reveal className="hero-actions" delay={220}>
            <a className="btn btn-primary" href="#register">
              {site.hero.primaryCta}
            </a>
            <a className="btn btn-ghost" href="#about">
              {site.hero.secondaryCta}
              <span className="arrow" aria-hidden>
                →
              </span>
            </a>
          </Reveal>

          <Reveal className="hero-meta" delay={300}>
            {site.details.slice(0, 3).map((d) => (
              <div className="hero-meta-item" key={d.label}>
                <span className="k">{d.label}</span>
                <span className="v">{d.value}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ================================================= ABOUT */}
      <section id="about" className="section">
        <div className="container about-grid">
          <Reveal className="about-body">
            <span className="eyebrow">The Platform</span>
            <h2>{site.about.heading}</h2>
            {site.about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Reveal>
          <Reveal className="about-visual" delay={120}>
            <Icon name="door" />
          </Reveal>
        </div>
      </section>

      {/* ================================================= STATEMENT 1 */}
      {site.statements[0] && <Statement data={site.statements[0]} />}

      {/* ================================================= EXPLORE */}
      <section id="explore" className="section explore">
        <div className="container">
          <Reveal className="explore-head">
            <span className="eyebrow">In This Conversation</span>
            <h2 className="section-heading" style={{ marginTop: "1rem" }}>
              {site.explore.heading}
            </h2>
          </Reveal>
          <div className="explore-list">
            {site.explore.items.map((item, i) => (
              <Reveal key={item.label} className="explore-row" delay={i * 60}>
                <span className="explore-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="explore-label">{item.label}</span>
                <Icon name={item.icon} className="explore-icon" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= AUDIENCE */}
      <section id="audience" className="section">
        <div className="container">
          <Reveal className="audience-head">
            <span className="eyebrow">Who This Is For</span>
            <h2 className="section-heading" style={{ marginTop: "1rem" }}>
              Built for people who refuse to stay stuck.
            </h2>
          </Reveal>
          <div className="persona-grid">
            {site.audience.items.map((item, i) => (
              <Reveal key={item.label} className="persona-card" delay={i * 50}>
                <span className="persona-icon">
                  <Icon name={item.icon} />
                </span>
                <h3 className="persona-name">{item.label}</h3>
                <p className="persona-blurb">{item.blurb}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= STATEMENT 2 */}
      {site.statements[1] && <Statement data={site.statements[1]} />}

      {/* ================================================= DETAILS BAR */}
      <section className="details">
        <div className="container details-row">
          {site.details.map((d) => (
            <div className="detail" key={d.label}>
              <Icon name={d.icon} className="detail-icon" />
              <div>
                <div className="detail-label">{d.label}</div>
                <div className="detail-value">{d.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= REGISTER */}
      <section id="register" className="section register">
        <div className="container">
          <Reveal className="register-inner">
            <span className="eyebrow">{site.register.eyebrow}</span>
            <h2>{site.register.heading}</h2>
            <p className="lead">{site.register.description}</p>
            <RegisterForm />
          </Reveal>
        </div>
      </section>

      {/* ================================================= JOURNAL */}
      <section id="journal" className="section journal">
        <div className="container journal-grid">
          <div className="journal-copy">
            <Icon name="envelope" className="journal-icon" />
            <div>
              <h2>{site.journal.heading}</h2>
              <p>{site.journal.description}</p>
            </div>
          </div>
          <JournalForm />
        </div>
      </section>

      {/* ================================================= FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <a className="brand" href="#top">
                <span className="brand-mark">
                  <LogoMark className="brand-glyph" />
                </span>
                <span className="brand-text">
                  <span className="brand-name">{site.brand.name}</span>
                  <span className="brand-tagline">{site.brand.tagline}</span>
                </span>
              </a>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <div className="footer-links">
                {site.footer.quickLinks.map((l) => (
                  <a key={l.label} href={l.href}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-col">
              <h4>Connect</h4>
              <div className="footer-contact">
                <a href={`mailto:${site.footer.email}`}>{site.footer.email}</a>
                <a href="#">{site.footer.handle}</a>
              </div>
              <div className="socials">
                {site.footer.socials.map((soc) => (
                  <a key={soc.label} href={soc.href} className="social" aria-label={soc.label}>
                    <Icon name={soc.icon} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-bottom">{site.footer.copyright}</div>
        </div>
      </footer>
    </>
  );
}

/* ---------------------------------------------------- Statement band */
function Statement({
  data,
}: {
  data: { kicker: string; line1: string; highlight: string; line2: string };
}) {
  return (
    <section className="statement">
      <div className="container">
        <Reveal>
          <span className="eyebrow statement-kicker">{data.kicker}</span>
          <h2>
            {data.line1} <span className="gold">{data.highlight}</span>
            <span className="dim">{data.line2}</span>
          </h2>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Full-bleed cinematic hero backdrop — a spotlit armchair silhouette in a dark
 * room, drawn inline so there are no external image files. Kept low-contrast so
 * the giant headline stays the focus. Swap for a real photo later if you like.
 */
function HeroBackdrop() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="spot" cx="72%" cy="12%" r="55%">
          <stop offset="0%" stopColor="#ffcf87" stopOpacity="0.5" />
          <stop offset="35%" stopColor="#e0842e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#e0842e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcf87" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffcf87" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ambient glow + light cone from the top-right */}
      <rect width="1440" height="900" fill="url(#spot)" />
      <polygon points="1040,0 970,0 800,760 1230,760 1130,0" fill="url(#cone)" />

      {/* pendant lamp */}
      <g stroke="#e0913f" strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round">
        <line x1="1050" y1="0" x2="1050" y2="150" />
        <path d="M1010 182 Q1050 132 1090 182 Z" fill="#1a1108" />
        <path d="M1010 182 h80" />
      </g>

      {/* armchair silhouette (filled, low-contrast) */}
      <g opacity="0.9">
        <path
          d="M1040 360
             q120 0 128 92
             l8 250
             q0 34 -34 34
             l-204 0
             q-34 0 -34 -34
             l8 -250
             q8 -92 128 -92 z"
          fill="#0c0805"
          stroke="#e0913f"
          strokeOpacity="0.35"
          strokeWidth="2.5"
        />
        <path d="M978 616 q62 -34 124 0 l0 104 l-124 0 z" fill="#080502" />
      </g>

      {/* side table + glass */}
      <g stroke="#e0913f" strokeWidth="2.4" strokeOpacity="0.4" fill="none" strokeLinecap="round">
        <ellipse cx="835" cy="600" rx="58" ry="15" />
        <line x1="797" y1="606" x2="797" y2="736" />
        <line x1="873" y1="606" x2="873" y2="736" />
      </g>

      {/* floor line */}
      <line x1="0" y1="760" x2="1440" y2="760" stroke="#3a2c1a" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
