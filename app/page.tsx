import { site } from "./content";
import { Icon } from "../components/Icons";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import RegisterForm from "../components/RegisterForm";
import JournalForm from "../components/JournalForm";
import Statement from "../components/Statement";

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
        <div className="container hero-inner hero-grid">
          <div className="hero-copy">
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

          <Reveal className="hero-visual" delay={140}>
            <div className="hero-visual-glow" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-portrait.webp"
              alt="Portrait of the host of The Thinking Room"
              className="hero-photo"
              fetchPriority="high"
            />
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

      {/* ================================================= COMMUNITY */}
      <section id="community" className="section community">
        <div className="container">
          <Reveal className="community-card">
            <span className="community-badge">
              <Icon name="whatsapp" className="community-badge-icon" />
            </span>
            <span className="eyebrow">{site.community.eyebrow}</span>
            <h2>{site.community.heading}</h2>
            <p className="lead">{site.community.description}</p>
            <a
              className="btn community-btn"
              href={site.register.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {site.community.cta}
            </a>
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

      <Footer />
    </>
  );
}

/**
 * Ambient glow + light-cone backdrop that sits behind the hero photo, drawn
 * inline so it scales losslessly. Gives the portrait a spotlit, cinematic
 * entrance without needing a separate lighting photo.
 */
function HeroBackdrop() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="spot" cx="72%" cy="10%" r="60%">
          <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#dd2525" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#dd2525" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcf87" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffcf87" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ambient glow + light cone from the top-right, over the portrait */}
      <rect width="1440" height="900" fill="url(#spot)" />
      <polygon points="1040,0 970,0 800,760 1230,760 1130,0" fill="url(#cone)" />

      {/* pendant lamp */}
      <g stroke="#e0913f" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round">
        <line x1="1050" y1="0" x2="1050" y2="150" />
        <path d="M1010 182 Q1050 132 1090 182 Z" fill="#1a1108" />
        <path d="M1010 182 h80" />
      </g>
    </svg>
  );
}
