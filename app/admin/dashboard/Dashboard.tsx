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
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

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
