import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import { listPublishedEvents, type EventRecord } from "../lib/events";

export const metadata: Metadata = {
  title: "Events — The Thinking Room",
  description: "Upcoming and past conversations from The Thinking Room.",
};

// Always read the latest published events from the database.
export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default async function EventsPage() {
  const events = await listPublishedEvents();

  return (
    <>
      <Nav />
      <section className="section">
        <div className="container">
          <div className="events-head">
            <span className="eyebrow">The Thinking Room</span>
            <h1 className="section-heading center" style={{ marginTop: "1rem" }}>
              Events
            </h1>
            <hr className="heading-rule center" />
          </div>

          {events.length === 0 ? (
            <p className="events-empty">
              No events published yet. Check back soon.
            </p>
          ) : (
            <div className="events-grid">
              {events.map((ev: EventRecord) => (
                <article className="event-card" key={ev.id}>
                  {ev.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="event-cover" src={ev.cover_image_url} alt={ev.title} />
                  )}
                  <div className="event-body">
                    {(ev.edition || ev.starts_at) && (
                      <span className="event-date">
                        {[ev.edition, formatDate(ev.starts_at)].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    <h2 className="event-title">{ev.title}</h2>
                    {ev.tagline && <p className="event-tagline">{ev.tagline}</p>}
                    {ev.description && <p className="event-tagline">{ev.description}</p>}
                    {ev.link_url && (
                      <a className="btn btn-primary" href={ev.link_url} target="_blank" rel="noopener noreferrer">
                        Learn more
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
