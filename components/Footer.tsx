import Link from "next/link";
import { site } from "../app/content";
import { Icon } from "./Icons";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link className="brand" href="/#top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={site.brand.name} className="brand-logo" />
            </Link>
            <span className="brand-tagline footer-tagline">{site.brand.tagline}</span>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <div className="footer-links">
              {site.footer.quickLinks.map((l) => (
                <Link key={l.label} href={l.href}>
                  {l.label}
                </Link>
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
  );
}
