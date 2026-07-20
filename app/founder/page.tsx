import type { Metadata } from "next";
import Link from "next/link";
import { site } from "../content";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import Statement from "../../components/Statement";

export const metadata: Metadata = {
  title: `${site.founder.name} — The Founder | ${site.brand.name}`,
  description: site.founder.paragraphs[0],
};

export default function FounderPage() {
  const { founder } = site;

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
              {founder.eyebrow}
            </span>
            <h1>{founder.name}</h1>
            <p className="page-hero-subtitle">{founder.title}</p>
          </Reveal>
        </div>
      </section>

      {/* ================================================= BIO */}
      <section className="section">
        <div className="container hero-grid">
          <Reveal className="hero-copy founder-bio">
            {founder.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Reveal>

          <Reveal className="hero-visual" delay={140}>
            <div className="hero-visual-glow" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={founder.photo}
              alt={`Portrait of ${founder.name}`}
              className="hero-photo"
            />
          </Reveal>
        </div>
      </section>

      {/* ================================================= DISCIPLINES */}
      <section className="section disciplines">
        <div className="container">
          <Reveal>
            <span className="eyebrow">{founder.disciplines.heading}</span>
            <p className="disciplines-intro">{founder.disciplines.intro}</p>
            <div className="chip-list">
              <span className="chip chip-origin">{founder.disciplines.origin}</span>
              {founder.disciplines.items.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================================= STATEMENT */}
      <Statement data={founder.quote} />

      {/* ================================================= CTA */}
      <section className="section page-cta">
        <div className="container">
          <Reveal>
            <h2>{founder.cta.heading}</h2>
            <p className="lead">{founder.cta.description}</p>
            <div className="page-cta-actions">
              <Link className="btn btn-primary" href={founder.cta.primaryHref}>
                {founder.cta.primaryLabel}
              </Link>
              <Link className="btn btn-ghost" href={founder.cta.secondaryHref}>
                {founder.cta.secondaryLabel}
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
