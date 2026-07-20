import type { Metadata } from "next";
import Link from "next/link";
import { site } from "../content";
import { Icon } from "../../components/Icons";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import Statement from "../../components/Statement";

export const metadata: Metadata = {
  title: `${site.tadcircle.title} — ${site.tadcircle.subtitle} | ${site.brand.name}`,
  description: site.tadcircle.intro,
};

export default function TADCirclePage() {
  const { tadcircle, audience } = site;

  return (
    <>
      <Nav />

      {/* ================================================= PAGE HEADER */}
      <section className="page-hero">
        <div className="page-hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal className="page-hero-inner">
            <span className="eyebrow-badge">
              <span className="dot" />
              {tadcircle.eyebrow}
            </span>
            <h1>{tadcircle.title}</h1>
            <p className="page-hero-subtitle">{tadcircle.subtitle}</p>
          </Reveal>
        </div>
      </section>

      {/* ================================================= INTRO */}
      <section className="section">
        <div className="container">
          <Reveal className="tadcircle-intro">
            <p>{tadcircle.intro}</p>
          </Reveal>
        </div>
      </section>

      {/* ================================================= ENGAGEMENT */}
      <section className="section">
        <div className="container">
          <Reveal>
            <span className="eyebrow">{tadcircle.engagement.heading}</span>
          </Reveal>
          <div className="persona-grid engagement-grid">
            {tadcircle.engagement.items.map((item, i) => (
              <Reveal key={item.label} className="persona-card" delay={i * 60}>
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

      {/* ================================================= STATEMENT */}
      <Statement data={tadcircle.quote} />

      {/* ================================================= WHO IT'S FOR */}
      <section className="section">
        <div className="container">
          <Reveal className="audience-head">
            <span className="eyebrow">{tadcircle.audienceHeading}</span>
          </Reveal>
          <div className="persona-grid">
            {audience.items.map((item, i) => (
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

      {/* ================================================= MISSION */}
      <section className="mission-quote">
        <div className="container">
          <Reveal>
            <span className="eyebrow statement-kicker">{tadcircle.mission.kicker}</span>
            <blockquote>
              <span className="mark" aria-hidden>
                “
              </span>
              {tadcircle.mission.text}
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ================================================= CTA */}
      <section className="section page-cta">
        <div className="container">
          <Reveal>
            <h2>{tadcircle.cta.heading}</h2>
            <p className="lead">{tadcircle.cta.description}</p>
            <div className="page-cta-actions">
              <Link className="btn btn-primary" href={tadcircle.cta.primaryHref}>
                {tadcircle.cta.primaryLabel}
              </Link>
              <Link className="btn btn-ghost" href={tadcircle.cta.secondaryHref}>
                {tadcircle.cta.secondaryLabel}
                <span className="arrow" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
