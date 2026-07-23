"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../admin.module.css";
import { useAdminToken } from "../auth";
import { slugify, type EventRecord } from "../../lib/events";

type Draft = Omit<EventRecord, "created_at" | "updated_at">;

const BLANK: Draft = {
  slug: "",
  title: "",
  edition: "",
  tagline: "",
  description: "",
  starts_at: "",
  location: "Zoom",
  cover_image_url: "",
  link_url: "",
  status: "draft",
  is_featured: false,
};

// datetime-local <-> ISO helpers
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
const fromLocal = (local: string) => (local ? new Date(local).toISOString() : null);

export default function EventsAdmin() {
  const token = useAdminToken();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const api = useCallback(
    async (method: "GET" | "POST", payload?: unknown) => {
      const res = await fetch("/api/admin/events", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    },
    [token]
  );

  const refresh = useCallback(async () => {
    const { status, data } = await api("GET");
    if (status === 200) {
      setEvents(data.events || []);
      setLoadError("");
    } else {
      setLoadError(data.error || `Couldn't load events (${status}).`);
    }
  }, [api]);

  // Load events on mount.
  useEffect(() => {
    refresh();
  }, [refresh]);

  function newEvent() {
    setDraft({ ...BLANK });
    setSlugTouched(false);
    setMsg(null);
  }
  function editEvent(ev: EventRecord) {
    setDraft({ ...ev, starts_at: ev.starts_at });
    setSlugTouched(true);
    setMsg(null);
  }

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  async function save(publish?: boolean) {
    if (!draft) return;
    if (!draft.title.trim() || !draft.slug.trim()) {
      setMsg({ ok: false, text: "Title and slug are required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    const event = { ...draft, status: publish ? "published" : draft.status };
    const { status, data } = await api("POST", { event });
    setSaving(false);
    if (status === 200) {
      setMsg({ ok: true, text: `Saved${publish ? " & published" : ""}.` });
      setDraft(data.event);
      setSlugTouched(true);
      refresh();
    } else {
      setMsg({ ok: false, text: data.error || `Save failed (${status}).` });
    }
  }

  async function remove(id?: string) {
    if (!id || !confirm("Delete this event? This can't be undone.")) return;
    const { status, data } = await api("POST", { deleteId: id });
    if (status === 200) {
      setDraft(null);
      refresh();
    } else setMsg({ ok: false, text: data.error || "Delete failed." });
  }

  // ------------------------------------------------------------------- console
  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Events <span>CMS</span>
          </h1>
          <p className={styles.subtitle}>Create events and publish them to the website (/events).</p>
        </div>
        <div className={styles.headerNav}>
          <a className={styles.lockBtn} href="/events" target="_blank">View site ↗</a>
        </div>
      </div>

      {loadError && <div className={`${styles.status} ${styles.statusErr}`} style={{ marginBottom: 16 }}>{loadError}</div>}

      <div className={styles.grid}>
        {/* ---------------------------------------------------------- list */}
        <div className={styles.panel}>
          <div className={styles.previewBar}>
            <p className={styles.panelTitle} style={{ margin: 0 }}>All events</p>
            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: "8px 14px" }} onClick={newEvent}>
              + New event
            </button>
          </div>
          {events.length === 0 && <p className={styles.panelHint}>No events yet. Click “New event”.</p>}
          <div className={styles.recipients} style={{ maxHeight: "unset" }}>
            {events.map((ev) => (
              <div className={styles.recipientRow} key={ev.id} style={{ cursor: "pointer" }} onClick={() => editEvent(ev)}>
                <span>
                  {ev.is_featured ? "★ " : ""}
                  {ev.title}
                </span>
                <span style={{ color: ev.status === "published" ? "#8fce6b" : "#b0a58c" }}>{ev.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --------------------------------------------------------- editor */}
        <div className={styles.panel}>
          {!draft ? (
            <p className={styles.panelHint}>Select an event to edit, or create a new one.</p>
          ) : (
            <>
              <p className={styles.panelTitle}>{draft.id ? "Edit event" : "New event"}</p>
              <div className={styles.field}>
                <label className={styles.label}>Title</label>
                <input className={styles.input} value={draft.title} onChange={(e) => setField("title", e.target.value)} />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Slug (URL)</label>
                  <input className={styles.input} value={draft.slug} onChange={(e) => { setSlugTouched(true); setField("slug", slugify(e.target.value)); }} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Edition</label>
                  <input className={styles.input} value={draft.edition ?? ""} onChange={(e) => setField("edition", e.target.value)} placeholder="Edition 002" />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tagline</label>
                <input className={styles.input} value={draft.tagline ?? ""} onChange={(e) => setField("tagline", e.target.value)} placeholder="One-line hook" />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Date &amp; time</label>
                  <input className={styles.input} type="datetime-local" value={toLocal(draft.starts_at)} onChange={(e) => setField("starts_at", fromLocal(e.target.value))} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Location</label>
                  <input className={styles.input} value={draft.location ?? ""} onChange={(e) => setField("location", e.target.value)} placeholder="Zoom" />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Cover image URL</label>
                <input className={styles.input} value={draft.cover_image_url ?? ""} onChange={(e) => setField("cover_image_url", e.target.value)} placeholder="https://…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Link (register / learn more)</label>
                <input className={styles.input} value={draft.link_url ?? ""} onChange={(e) => setField("link_url", e.target.value)} placeholder="https://…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} rows={4} value={draft.description ?? ""} onChange={(e) => setField("description", e.target.value)} />
              </div>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={draft.is_featured} onChange={(e) => setField("is_featured", e.target.checked)} />
                Feature this event
              </label>

              {msg && <div className={`${styles.status} ${msg.ok ? styles.statusOk : styles.statusErr}`}>{msg.text}</div>}

              <div className={styles.divider} />
              <div className={styles.row}>
                <button className={styles.btn} onClick={() => save(false)} disabled={saving}>
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button className={`${styles.btn} ${styles.btnLime}`} onClick={() => save(true)} disabled={saving}>
                  Save &amp; publish
                </button>
                {draft.id && (
                  <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => remove(draft.id)} disabled={saving} style={{ marginLeft: "auto" }}>
                    Delete
                  </button>
                )}
              </div>
              <p className={styles.panelHint} style={{ marginTop: 10 }}>
                Status: <b style={{ color: draft.status === "published" ? "#8fce6b" : "#b0a58c" }}>{draft.status}</b>
                {draft.slug ? ` · /events shows published events` : ""}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
