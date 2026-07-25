"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../admin.module.css";
import { useAdminToken } from "../auth";

interface Stats {
  sheetConfigured: boolean;
  supabaseConfigured: boolean;
  contacts: { total: number; event: number; journal: number; reminded: number } | null;
  events: { total: number; published: number; drafts: number } | null;
}

interface Campaign {
  id: string;
  subject: string;
  audience: string;
  scheduled_at: string;
  status: string;
  total: number;
  sent_count: number;
  failed_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: "#e3ff66",
  sending: "#ffcf6a",
  sent: "#8fce6b",
  canceled: "#b0a58c",
  error: "#ff8a8a",
};

function Stat({ num, label, accent }: { num: number | string; label: string; accent?: boolean }) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statNum} ${accent ? styles.accent : ""}`}>{num}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const token = useAdminToken();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [runMsg, setRunMsg] = useState("");

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/campaigns", { headers: { "x-admin-token": token } });
      const data = await res.json().catch(() => ({}));
      if (res.status === 200) setCampaigns(data.campaigns || []);
    } catch {
      /* ignore */
    }
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/dashboard", { headers: { "x-admin-token": token } });
      const data = await res.json().catch(() => ({}));
      if (res.status === 200) setStats(data as Stats);
      else setError(data.error || `Couldn't load stats (${res.status}).`);
    } catch {
      setError("Couldn't reach the server.");
    }
    setLoading(false);
    loadCampaigns();
  }, [token, loadCampaigns]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelCampaign(id: string) {
    if (!confirm("Cancel this scheduled send?")) return;
    await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ cancelId: id }),
    });
    loadCampaigns();
  }

  async function runDueNow() {
    setRunMsg("Running…");
    try {
      const res = await fetch("/api/cron/send", { headers: { "x-admin-token": token } });
      const data = await res.json().catch(() => ({}));
      const sent = (data.results || []).reduce((n: number, r: { sent: number }) => n + (r.sent || 0), 0);
      setRunMsg(res.status === 200 ? `Done — sent ${sent} in this run.` : data.error || `Failed (${res.status}).`);
    } catch {
      setRunMsg("Couldn't reach the server.");
    }
    loadCampaigns();
  }

  function fmt(iso: string) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Dash<span>board</span>
          </h1>
          <p className={styles.subtitle}>Your audience, events, and where tracking is headed.</p>
        </div>
        <button className={styles.lockBtn} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className={`${styles.status} ${styles.statusErr}`}>{error}</div>}

      {/* Audience */}
      <div className={styles.panel} style={{ marginBottom: 18 }}>
        <p className={styles.panelTitle}>Audience</p>
        {loading ? (
          <p className={styles.panelHint}>Loading…</p>
        ) : stats?.contacts ? (
          <div className={styles.statGrid}>
            <Stat num={stats.contacts.total} label="Total contacts" accent />
            <Stat num={stats.contacts.event} label="Event registrants" />
            <Stat num={stats.contacts.journal} label="Journal subscribers" />
            <Stat num={stats.contacts.reminded} label="Already emailed" />
          </div>
        ) : (
          <p className={styles.panelHint}>
            Connect the Google Sheet (SHEET_WEBHOOK_URL + SHEET_API_TOKEN) to see audience numbers.
          </p>
        )}
      </div>

      {/* Events */}
      <div className={styles.panel} style={{ marginBottom: 18 }}>
        <p className={styles.panelTitle}>Events</p>
        {loading ? (
          <p className={styles.panelHint}>Loading…</p>
        ) : stats?.events ? (
          <div className={styles.statGrid}>
            <Stat num={stats.events.published} label="Published" accent />
            <Stat num={stats.events.drafts} label="Drafts" />
            <Stat num={stats.events.total} label="Total" />
          </div>
        ) : (
          <p className={styles.panelHint}>
            Connect Supabase (SUPABASE_URL + SUPABASE_SECRET_KEY) and run the schema to manage events.
          </p>
        )}
      </div>

      {/* Scheduled campaigns */}
      <div className={styles.panel} style={{ marginBottom: 18 }}>
        <div className={styles.previewBar}>
          <p className={styles.panelTitle} style={{ margin: 0 }}>Scheduled &amp; recent campaigns</p>
          <button className={styles.lockBtn} onClick={runDueNow}>Run due sends now</button>
        </div>
        {runMsg && <div className={`${styles.status} ${styles.statusInfo}`}>{runMsg}</div>}
        {campaigns.length === 0 ? (
          <p className={styles.panelHint}>
            No campaigns yet. Compose one in <b>Newsletter</b> and use &ldquo;Schedule for later&rdquo;.
          </p>
        ) : (
          <div className={styles.recipients} style={{ maxHeight: "unset", marginTop: 12 }}>
            {campaigns.map((c) => (
              <div className={styles.recipientRow} key={c.id} style={{ alignItems: "center" }}>
                <span style={{ flex: 1 }}>
                  {c.subject || "(no subject)"}
                  <br />
                  <span style={{ color: "#6d6353", fontSize: 12 }}>
                    {fmt(c.scheduled_at)} · {c.audience}
                    {c.status === "sending" || c.status === "sent" ? ` · ${c.sent_count}/${c.total} sent` : ""}
                  </span>
                </span>
                <span style={{ color: STATUS_COLOR[c.status] || "#ac9f8c", fontWeight: 600, marginRight: 12 }}>
                  {c.status}
                </span>
                {(c.status === "scheduled" || c.status === "sending") && (
                  <button className={styles.lockBtn} style={{ padding: "5px 10px" }} onClick={() => cancelCampaign(c.id)}>
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <p className={styles.panelHint} style={{ marginTop: 12 }}>
          Scheduled emails send via a cron worker. On Vercel <b>Pro</b>, add a 5-minute cron for{" "}
          <code>/api/cron/send</code>; on <b>Hobby</b> (daily cron only), point a free pinger
          (e.g. cron-job.org) at it every few minutes, or use &ldquo;Run due sends now&rdquo;.
        </p>
      </div>

      {/* Tracking — next */}
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Email &amp; site tracking</p>
        <p className={styles.panelHint} style={{ marginBottom: 14 }}>
          Two kinds of tracking, both coming next on Supabase:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#ac9f8c", fontSize: 14, lineHeight: 1.9 }}>
          <li>
            <b style={{ color: "#f4efe6" }}>Email opens &amp; clicks</b> — a tracking pixel + redirect
            links logged to Supabase, shown here per campaign. (Opens are approximate — many mail apps
            block or preload images.)
          </li>
          <li>
            <b style={{ color: "#f4efe6" }}>Website analytics</b> — visits, page views, and referrers
            are already being collected by Vercel Analytics. View them at{" "}
            <span style={{ color: "#d1ff00" }}>Vercel → your project → Analytics</span> once deployed.
          </li>
        </ul>
      </div>
    </>
  );
}
