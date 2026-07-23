"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./admin.module.css";

interface Content {
  subject: string;
  heading: string;
  intro: string;
  body: string;
  includeZoom: boolean;
}

interface Recipient {
  email: string;
  name?: string;
}

type Audience = "event" | "journal" | "all";

// Emails per request. Kept small so each request finishes well under the
// serverless timeout — this is what fixes the 504 on large lists.
const BATCH_SIZE = 12;

const EMPTY_CONTENT: Content = {
  subject: "",
  heading: "",
  intro: "",
  body: "",
  includeZoom: true,
};

export default function AdminConsole() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [content, setContent] = useState<Content>(EMPTY_CONTENT);
  const [sampleName, setSampleName] = useState("Ada");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");

  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [showList, setShowList] = useState(false);
  const [resend, setResend] = useState(false);
  const [audience, setAudience] = useState<Audience>("event");
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  /** POST to the reminder endpoint with the admin token attached. */
  const api = useCallback(
    async (payload: Record<string, unknown>, authToken?: string) => {
      const res = await fetch("/api/send-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken ?? token,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    },
    [token]
  );

  // Restore a token saved earlier this session.
  useEffect(() => {
    const saved = sessionStorage.getItem("ttr-admin-token");
    if (saved) setToken(saved);
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setUnlocking(true);
    setAuthError("");
    const { status, data } = await api({ preview: true }, token);
    setUnlocking(false);
    if (status === 200) {
      sessionStorage.setItem("ttr-admin-token", token);
      setContent(data.content as Content);
      setPreviewHtml(data.html as string);
      setPreviewSubject(data.subject as string);
      setUnlocked(true);
    } else if (status === 401) {
      setAuthError("That token doesn't match ADMIN_TOKEN. Check the value in Vercel.");
    } else {
      setAuthError(data.error || `Unexpected error (${status}).`);
    }
  }

  function lock() {
    sessionStorage.removeItem("ttr-admin-token");
    setUnlocked(false);
    setToken("");
    setRecipients(null);
  }

  // Live preview — re-render (debounced) whenever the content or sample changes.
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!unlocked) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      const { status, data } = await api({ preview: true, content, sampleName });
      if (status === 200) {
        setPreviewHtml(data.html as string);
        setPreviewSubject(data.subject as string);
      }
    }, 400);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [content, sampleName, unlocked, api]);

  async function loadRecipients() {
    setLoadingRecipients(true);
    setSendResult(null);
    setProgress(null);
    const { status, data } = await api({ dryRun: true, resend, audience });
    setLoadingRecipients(false);
    if (status === 200) {
      setRecipients(data.recipients as Recipient[]);
    } else {
      setRecipients(null);
      setSendResult({ ok: false, msg: data.error || `Couldn't load recipients (${status}).` });
    }
  }

  async function sendTest() {
    if (!testEmail) return;
    setSending(true);
    setTestStatus(null);
    const { status, data } = await api({ test: testEmail, content, sampleName });
    setSending(false);
    setTestStatus(
      status === 200
        ? { ok: true, msg: `Test sent to ${testEmail}. Check the inbox (and spam).` }
        : { ok: false, msg: data.error || `Failed (${status}).` }
    );
  }

  /**
   * Send in small batches from the browser. Each request emails only
   * BATCH_SIZE people, so it finishes quickly (no 504), and we accumulate a
   * live delivered count. Successful sends are marked in the sheet, so if this
   * is interrupted you can reload recipients and send again to finish the rest.
   */
  async function sendAll() {
    if (!recipients) return;
    const list = recipients;
    setSending(true);
    setConfirmSend(false);
    setSendResult(null);
    let sent = 0;
    let failed = 0;
    setProgress({ sent: 0, failed: 0, total: list.length });

    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE);
      try {
        const { status, data } = await api({ recipients: batch, content });
        if (status === 200) {
          sent += (data.sent as number) || 0;
          failed += (data.failed as number) || 0;
        } else {
          failed += batch.length;
        }
      } catch {
        failed += batch.length;
      }
      setProgress({ sent, failed, total: list.length });
      if (i + BATCH_SIZE < list.length) await new Promise((r) => setTimeout(r, 400));
    }

    setSending(false);
    setSendResult({
      ok: failed === 0,
      msg: `Delivered ${sent} of ${list.length}${failed ? ` · ${failed} failed. Reload recipients and send again to retry those.` : ". All done."}`,
    });
    // Note: successful sends are marked in the sheet, so click "Load recipients"
    // again to see who's left (e.g. to retry failures) without re-emailing anyone.
  }

  const set = (patch: Partial<Content>) => setContent((c) => ({ ...c, ...patch }));

  // ---------------------------------------------------------------- Lock screen
  if (!unlocked) {
    return (
      <div className={styles.page}>
        <form className={styles.lockCard} onSubmit={unlock}>
          <h2>Reminder Console</h2>
          <p>
            Enter the admin token (the <code>ADMIN_TOKEN</code> you set in Vercel) to
            manage and send reminder emails.
          </p>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              autoFocus
            />
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={unlocking || !token}>
            {unlocking ? "Checking…" : "Unlock"}
          </button>
          {authError && <div className={`${styles.status} ${styles.statusErr}`}>{authError}</div>}
        </form>
      </div>
    );
  }

  // ------------------------------------------------------------------- Console
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Reminder <span>Console</span>
          </h1>
          <p className={styles.subtitle}>
            Edit the reminder, preview it live, send yourself a test, then send to every registrant.
          </p>
        </div>
        <button className={styles.lockBtn} onClick={lock}>
          Lock
        </button>
      </div>

      <div className={styles.grid}>
        {/* ---------------------------------------------------------- Editor */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Compose</p>
          <p className={styles.panelHint}>
            Tip: <code>{"{{firstName}}"}</code>, <code>{"{{date}}"}</code>, <code>{"{{time}}"}</code>,{" "}
            <code>{"{{edition}}"}</code> are filled in automatically per person. Date, time and Zoom
            details come from your site settings.
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Subject line</label>
            <input
              className={styles.input}
              value={content.subject}
              onChange={(e) => set({ subject: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Headline (the red banner)</label>
            <input
              className={styles.input}
              value={content.heading}
              onChange={(e) => set({ heading: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Opening paragraph</label>
            <textarea
              className={styles.textarea}
              value={content.intro}
              onChange={(e) => set({ intro: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Second paragraph</label>
            <textarea
              className={styles.textarea}
              value={content.body}
              onChange={(e) => set({ body: e.target.value })}
            />
          </div>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={content.includeZoom}
              onChange={(e) => set({ includeZoom: e.target.checked })}
            />
            Include the Zoom join link, Meeting ID &amp; passcode
          </label>

          <div className={styles.divider} />

          <div className={styles.field}>
            <label className={styles.label}>Preview / test name</label>
            <input
              className={styles.input}
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              placeholder="Ada"
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Send a test to</label>
              <input
                className={styles.input}
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button className={styles.btn} onClick={sendTest} disabled={sending || !testEmail}>
              {sending ? "Sending…" : "Send test"}
            </button>
          </div>
          {testStatus && (
            <div className={`${styles.status} ${testStatus.ok ? styles.statusOk : styles.statusErr}`}>
              {testStatus.msg}
            </div>
          )}

          <div className={styles.divider} />

          <p className={styles.panelTitle}>Send to everyone</p>
          <div className={styles.field} style={{ marginTop: 10 }}>
            <label className={styles.label}>Who to email</label>
            <select
              className={styles.input}
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value as Audience);
                setRecipients(null);
              }}
            >
              <option value="event">Event registrants</option>
              <option value="journal">Journal subscribers</option>
              <option value="all">Everyone — registrants + journal (de-duplicated)</option>
            </select>
          </div>
          <div className={styles.row}>
            <button className={styles.btn} onClick={loadRecipients} disabled={loadingRecipients}>
              {loadingRecipients ? "Loading…" : "Load recipients"}
            </button>
            <label className={styles.checkboxRow} style={{ marginLeft: 4 }}>
              <input type="checkbox" checked={resend} onChange={(e) => setResend(e.target.checked)} />
              Include already-sent
            </label>
          </div>

          {progress && (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 8, background: "#222", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round(((progress.sent + progress.failed) / Math.max(progress.total, 1)) * 100)}%`,
                    background: "#d1ff00",
                    transition: "width .3s",
                  }}
                />
              </div>
              <p style={{ fontSize: 13, color: "#ac9f8c", marginTop: 6 }}>
                {sending ? "Sending…" : "Done."} {progress.sent} delivered
                {progress.failed ? `, ${progress.failed} failed` : ""} of {progress.total}
              </p>
            </div>
          )}

          {recipients && (
            <>
              <div className={`${styles.status} ${styles.statusInfo}`}>
                {recipients.length} recipient(s) will receive this reminder.{" "}
                <button
                  onClick={() => setShowList((v) => !v)}
                  style={{ background: "none", border: 0, color: "#d1ff00", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                >
                  {showList ? "hide list" : "show list"}
                </button>
              </div>
              {showList && (
                <div className={styles.recipients}>
                  {recipients.map((r) => (
                    <div className={styles.recipientRow} key={r.email}>
                      <span>{r.name || "—"}</span>
                      <span>{r.email}</span>
                    </div>
                  ))}
                </div>
              )}

              {!confirmSend ? (
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ marginTop: 14, width: "100%" }}
                  onClick={() => setConfirmSend(true)}
                  disabled={sending || recipients.length === 0}
                >
                  Send reminder to {recipients.length} {recipients.length === 1 ? "person" : "people"}
                </button>
              ) : (
                <div className={styles.confirmBox}>
                  <p>
                    This will email {recipients.length} {recipients.length === 1 ? "person" : "people"}{" "}
                    right now. This can&rsquo;t be undone.
                  </p>
                  <div className={styles.row}>
                    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={sendAll} disabled={sending}>
                      {sending ? "Sending…" : "Yes, send now"}
                    </button>
                    <button className={styles.btn} onClick={() => setConfirmSend(false)} disabled={sending}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {sendResult && (
            <div className={`${styles.status} ${sendResult.ok ? styles.statusOk : styles.statusErr}`}>
              {sendResult.msg}
            </div>
          )}
        </div>

        {/* --------------------------------------------------------- Preview */}
        <div className={styles.panel}>
          <div className={styles.previewBar}>
            <p className={styles.panelTitle} style={{ margin: 0 }}>
              Live preview
            </p>
            <span className={styles.previewSubject}>
              Subject: <b>{previewSubject}</b>
            </span>
          </div>
          <iframe className={styles.previewFrame} title="Email preview" srcDoc={previewHtml} />
        </div>
      </div>
    </div>
  );
}
