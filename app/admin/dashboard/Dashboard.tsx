"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import styles from "../admin.module.css";
import { useAdminToken } from "../auth";

interface Stats {
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
  opened_count: number;
  clicked_count: number;
}

// CVD-safe chart colors (validated): green = opens/journal, blue = clicks/event.
const C_OPEN = "#3fa564";
const C_CLICK = "#5a86e0";
const C_FAIL = "#e0564f";
const INK = "#f4efe6";
const MUTED = "#ac9f8c";

const STATUS_COLOR: Record<string, string> = {
  scheduled: "#e3ff66",
  sending: "#ffcf6a",
  sent: "#8fce6b",
  canceled: "#b0a58c",
  error: "#ff8a8a",
};

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

export default function Dashboard() {
  const token = useAdminToken();
  const [stats, setStats] = useState<Stats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [runMsg, setRunMsg] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [failures, setFailures] = useState<Record<string, { email: string; error: string }[]>>({});

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

  async function toggleExpand(id: string) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!failures[id]) {
      const res = await fetch(`/api/admin/campaigns?id=${id}`, { headers: { "x-admin-token": token } });
      const data = await res.json().catch(() => ({}));
      setFailures((f) => ({ ...f, [id]: data.campaign?.failures || [] }));
    }
  }

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

  // ---- derived metrics ----
  const sentCampaigns = campaigns.filter((c) => c.sent_count > 0);
  const totalSent = campaigns.reduce((n, c) => n + c.sent_count, 0);
  const totalFailed = campaigns.reduce((n, c) => n + c.failed_count, 0);
  const avgOpen =
    sentCampaigns.length > 0
      ? Math.round(sentCampaigns.reduce((n, c) => n + pct(c.opened_count, c.sent_count), 0) / sentCampaigns.length)
      : 0;
  const avgClick =
    sentCampaigns.length > 0
      ? Math.round(sentCampaigns.reduce((n, c) => n + pct(c.clicked_count, c.sent_count), 0) / sentCampaigns.length)
      : 0;
  const recent = sentCampaigns.slice(0, 6);

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Dash<span>board</span>
          </h1>
          <p className={styles.subtitle}>Audience, email performance, and campaign history.</p>
        </div>
        <div className={styles.headerNav}>
          <button className={styles.lockBtn} onClick={runDueNow}>Run due sends now</button>
          <button className={styles.lockBtn} onClick={load} disabled={loading}>{loading ? "…" : "Refresh"}</button>
        </div>
      </div>

      {error && <div className={`${styles.status} ${styles.statusErr}`}>{error}</div>}
      {runMsg && <div className={`${styles.status} ${styles.statusInfo}`}>{runMsg}</div>}

      {/* KPI tiles */}
      <div className={styles.statGrid} style={{ marginBottom: 18 }}>
        <Stat num={stats?.contacts?.total ?? "—"} label="Total contacts" accent />
        <Stat num={totalSent} label="Emails sent" />
        <Stat num={`${avgOpen}%`} label="Avg open rate" />
        <Stat num={`${avgClick}%`} label="Avg click rate" />
      </div>

      <div className={styles.chartRow}>
        {/* Audience donut */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Audience</p>
          {stats?.contacts && stats.contacts.total > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
              <Donut
                segments={[
                  { label: "Event registrants", value: stats.contacts.event, color: C_CLICK },
                  { label: "Journal subscribers", value: stats.contacts.journal, color: C_OPEN },
                ]}
              />
              <div>
                <Legend color={C_CLICK} label="Event registrants" value={stats.contacts.event} />
                <Legend color={C_OPEN} label="Journal subscribers" value={stats.contacts.journal} />
                <p className={styles.panelHint} style={{ marginTop: 10 }}>
                  {stats.contacts.reminded} already emailed
                </p>
              </div>
            </div>
          ) : (
            <p className={styles.panelHint}>
              Connect the Google Sheet (SHEET_WEBHOOK_URL + SHEET_API_TOKEN) to see your audience.
            </p>
          )}
        </div>

        {/* Campaign engagement bars */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Recent campaign engagement</p>
          {recent.length > 0 ? (
            <>
              <div style={{ display: "flex", gap: 16, margin: "8px 0 14px" }}>
                <Legend color={C_OPEN} label="Open rate" />
                <Legend color={C_CLICK} label="Click rate" />
              </div>
              {recent.map((c) => (
                <div key={c.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.subject || "(no subject)"}
                  </div>
                  <Bar value={pct(c.opened_count, c.sent_count)} color={C_OPEN} />
                  <Bar value={pct(c.clicked_count, c.sent_count)} color={C_CLICK} />
                </div>
              ))}
              <p className={styles.panelHint} style={{ marginTop: 4 }}>
                Opens are approximate — some mail apps block or preload the tracking pixel.
              </p>
            </>
          ) : (
            <p className={styles.panelHint}>No sent campaigns yet. Send a newsletter to see open &amp; click rates here.</p>
          )}
        </div>
      </div>

      {/* Campaigns table */}
      <div className={styles.panel} style={{ marginTop: 18 }}>
        <p className={styles.panelTitle}>Campaigns</p>
        {campaigns.length === 0 ? (
          <p className={styles.panelHint}>
            No campaigns yet. Compose one in <b>Newsletter</b> and Send or Schedule it.
          </p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table className={styles.dashTable}>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>When</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Opened</th>
                  <th>Clicked</th>
                  <th>Failed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <Fragment key={c.id}>
                    <tr>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject || "(no subject)"}</td>
                      <td style={{ color: MUTED, whiteSpace: "nowrap" }}>{fmt(c.scheduled_at)}</td>
                      <td style={{ color: STATUS_COLOR[c.status] || MUTED, fontWeight: 600 }}>{c.status}</td>
                      <td>{c.sent_count}{c.total ? `/${c.total}` : ""}</td>
                      <td>{c.opened_count} <span style={{ color: MUTED }}>({pct(c.opened_count, c.sent_count)}%)</span></td>
                      <td>{c.clicked_count} <span style={{ color: MUTED }}>({pct(c.clicked_count, c.sent_count)}%)</span></td>
                      <td style={{ color: c.failed_count ? C_FAIL : INK }}>{c.failed_count}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {c.failed_count > 0 && (
                          <button className={styles.lockBtn} style={{ padding: "4px 9px" }} onClick={() => toggleExpand(c.id)}>
                            {expanded === c.id ? "Hide" : "Failures"}
                          </button>
                        )}
                        {(c.status === "scheduled" || c.status === "sending") && (
                          <button className={styles.lockBtn} style={{ padding: "4px 9px", marginLeft: 6 }} onClick={() => cancelCampaign(c.id)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                    {expanded === c.id && (
                      <tr>
                        <td colSpan={8} style={{ background: "#0d0d0d" }}>
                          <div style={{ padding: "6px 4px" }}>
                            <div style={{ fontSize: 12, color: C_FAIL, fontWeight: 600, marginBottom: 6 }}>
                              ⚠ Failed deliveries ({failures[c.id]?.length ?? "…"})
                            </div>
                            {!failures[c.id] ? (
                              <span className={styles.panelHint}>Loading…</span>
                            ) : failures[c.id].length === 0 ? (
                              <span className={styles.panelHint}>No details recorded.</span>
                            ) : (
                              <div className={styles.recipients} style={{ maxHeight: 200 }}>
                                {failures[c.id].map((f, i) => (
                                  <div className={styles.recipientRow} key={i} style={{ fontSize: 12 }}>
                                    <span style={{ color: INK }}>{f.email}</span>
                                    <span style={{ color: MUTED, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis" }}>{f.error}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalFailed > 0 && (
          <p className={styles.panelHint} style={{ marginTop: 10 }}>
            {totalFailed} failed delivery(ies) across all campaigns — click <b>Failures</b> on a row to see the addresses and the reason (bounce, invalid address, etc.).
          </p>
        )}
      </div>

      {/* Events + site analytics */}
      <div className={styles.chartRow} style={{ marginTop: 18 }}>
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Events</p>
          {stats?.events ? (
            <div className={styles.statGrid}>
              <Stat num={stats.events.published} label="Published" accent />
              <Stat num={stats.events.drafts} label="Drafts" />
              <Stat num={stats.events.total} label="Total" />
            </div>
          ) : (
            <p className={styles.panelHint}>Connect Supabase and run the schema to manage events.</p>
          )}
        </div>
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Website analytics</p>
          <p className={styles.panelHint}>
            Visits, page views, and referrers are collected by Vercel Analytics — view them at{" "}
            <span style={{ color: "#d1ff00" }}>Vercel → your project → Analytics</span>.
          </p>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------- chart pieces */
function Stat({ num, label, accent }: { num: number | string; label: string; accent?: boolean }) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statNum} ${accent ? styles.accent : ""}`}>{num}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, marginBottom: 4 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color, flex: "none" }} />
      <span style={{ color: INK }}>{label}</span>
      {value !== undefined && <span>· {value}</span>}
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ flex: 1, height: 10, background: "#1c1c1c", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: color, borderRadius: 5 }} title={`${value}%`} />
      </div>
      <span style={{ width: 38, textAlign: "right", fontSize: 12, color: INK }}>{value}%</span>
    </div>
  );
}

function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 54;
  const C = 2 * Math.PI * r;
  const gap = 3;
  let acc = 0;
  return (
    <svg viewBox="0 0 140 140" width="132" height="132" style={{ flex: "none" }}>
      <g transform="rotate(-90 70 70)">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#222" strokeWidth="20" />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const len = Math.max(frac * C - gap, 0);
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-acc * C}
            >
              <title>{s.label}: {s.value} ({Math.round(frac * 100)}%)</title>
            </circle>
          );
          acc += frac;
          return el;
        })}
      </g>
      <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="800" fill={INK}>{total}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="10" fill={MUTED}>contacts</text>
    </svg>
  );
}
