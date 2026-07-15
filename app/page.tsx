import { site } from "./content";
import { Icon } from "../components/Icons";
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
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow-row">
              <span className="eyebrow">{site.hero.eyebrow}</span>
              <span className="hero-edition">{site.hero.edition}</span>
            </div>
            <h1>
              {site.hero.titleTop}
              <br />
              <span className="gold">{site.hero.titleBottom}</span>
            </h1>
            <p className="hero-desc">{site.hero.description}</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#register">
                {site.hero.primaryCta}
              </a>
              <a className="btn btn-ghost" href="#about">
                {site.hero.secondaryCta}
                <span className="arrow" aria-hidden>
                  →
                </span>
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* ================================================= ABOUT */}
      <section id="about" className="section">
        <div className="container about-grid">
          <Reveal className="about-body">
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

      {/* ================================================= EXPLORE */}
      <section id="explore" className="section explore">
        <div className="container">
          <Reveal>
            <h2 className="section-heading">{site.explore.heading}</h2>
            <hr className="heading-rule" />
          </Reveal>
          <div className="explore-grid">
            {site.explore.items.map((item, i) => (
              <Reveal key={item.label} className="explore-card" delay={i * 80}>
                <Icon name={item.icon} className="explore-icon" />
                <p>{item.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= AUDIENCE */}
      <section id="audience" className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-heading">{site.audience.heading}</h2>
            <hr className="heading-rule" />
          </Reveal>
          <div className="audience-grid">
            {site.audience.items.map((item, i) => (
              <Reveal key={item.label} className="audience-item" delay={i * 60}>
                <Icon name={item.icon} className="audience-icon" />
                <span>{item.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
                <span className="brand-mark">{site.brand.initials}</span>
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

/**
 * Cinematic hero illustration — a lamp-lit armchair, drawn inline so there are
 * no external image files to host or break. Swap this out for a real photo
 * later by replacing the <HeroScene /> above with an <img> / next/image.
 */
function HeroScene() {
  return (
    <svg viewBox="0 0 600 720" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="glow" cx="52%" cy="26%" r="42%">
          <stop offset="0%" stopColor="#f6dfa6" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#d4af6a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#d4af6a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6dfa6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f6dfa6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* light cone */}
      <polygon points="300,150 250,150 150,560 470,560 350,150" fill="url(#cone)" />
      <ellipse cx="310" cy="170" rx="230" ry="180" fill="url(#glow)" />

      {/* pendant lamp */}
      <g stroke="#d4af6a" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <line x1="300" y1="0" x2="300" y2="120" />
        <path d="M255 150 Q300 100 345 150 Z" fill="#1c1710" />
        <path d="M255 150 h90" />
        <ellipse cx="300" cy="150" rx="30" ry="7" fill="#f6dfa6" opacity="0.5" stroke="none" />
      </g>

      {/* framed picture on the wall */}
      <g stroke="#8a7541" strokeWidth="2" fill="none">
        <rect x="470" y="150" width="70" height="92" rx="3" />
        <rect x="483" y="166" width="44" height="60" rx="2" stroke="#6f5c33" />
      </g>

      {/* side table + glass */}
      <g stroke="#d4af6a" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <ellipse cx="185" cy="452" rx="52" ry="14" />
        <line x1="150" y1="458" x2="150" y2="560" />
        <line x1="220" y1="458" x2="220" y2="560" />
        <line x1="185" y1="466" x2="185" y2="560" />
        <path d="M172 424 h26 l-3 26 h-20 z" fill="#f6dfa6" opacity="0.14" />
      </g>

      {/* armchair */}
      <g stroke="#d4af6a" strokeWidth="2.6" fill="#1a150d" strokeLinejoin="round">
        <path d="M300 300
                 q90 0 96 70
                 l6 150
                 q0 28 -28 28
                 l-148 0
                 q-28 0 -28 -28
                 l6 -150
                 q6 -70 96 -70 z" />
        <path d="M254 470 q46 -26 92 0 l0 78 l-92 0 z" fill="#120e08" />
        <line x1="300" y1="470" x2="300" y2="548" stroke="#8a7541" strokeWidth="1.6" />
        <line x1="240" y1="548" x2="240" y2="612" strokeLinecap="round" />
        <line x1="360" y1="548" x2="360" y2="612" strokeLinecap="round" />
      </g>

      {/* floor line */}
      <line x1="0" y1="612" x2="600" y2="612" stroke="#3a3122" strokeWidth="1.4" />
    </svg>
  );
}
