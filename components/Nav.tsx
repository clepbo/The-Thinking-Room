"use client";

import { useState } from "react";
import { site } from "../app/content";
import { LogoMark } from "./Logo";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className={`nav ${open ? "open" : ""}`}>
      <div className="container nav-inner">
        <a className="brand" href="#top" aria-label={site.brand.name}>
          <span className="brand-mark">
            <LogoMark className="brand-glyph" />
          </span>
          <span className="brand-text">
            <span className="brand-name">{site.brand.name}</span>
            <span className="brand-tagline">{site.brand.tagline}</span>
          </span>
        </a>

        <nav className="nav-links" onClick={() => setOpen(false)}>
          {site.nav.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
          <a className="btn btn-primary nav-cta" href="#register">
            Register
          </a>
        </nav>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
