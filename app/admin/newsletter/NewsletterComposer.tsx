"use client";

import { useCallback, useMemo, useState } from "react";
import styles from "../admin.module.css";
import { useAdminToken } from "../auth";
import RichText from "../RichText";
import UploadButton from "../UploadButton";
import {
  type Block,
  type CampaignMeta,
  defaultCampaign,
  emptyBlock,
  renderCampaignHtml,
  renderCampaignText,
} from "../../lib/campaign";

interface Recipient {
  email: string;
  name?: string;
}
interface Selectable {
  email: string;
  name: string;
  source: "sheet" | "manual";
  checked: boolean;
}
type Audience = "event" | "journal" | "all";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOCK_TYPES: Block["type"][] = ["heading", "text", "image", "button", "video", "file", "divider", "spacer"];
const BLOCK_LABEL: Record<Block["type"], string> = {
  heading: "Heading",
  text: "Text",
  image: "Image",
  button: "Button",
  video: "Video",
  file: "File",
  divider: "Divider",
  spacer: "Spacer",
};

export default function NewsletterComposer() {
  const token = useAdminToken();

  const init = defaultCampaign();
  const [meta, setMeta] = useState<CampaignMeta>(init.meta);
  const [blocks, setBlocks] = useState<Block[]>(init.blocks);
  const [sampleName, setSampleName] = useState("Ada");

  const [audience, setAudience] = useState<Audience>("all");
  const [recipients, setRecipients] = useState<Selectable[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const api = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    },
    [token]
  );

  // ----- live preview (rendered client-side, {{firstName}} filled for realism)
  const previewHtml = useMemo(() => {
    const html = renderCampaignHtml(blocks, meta);
    return html.replace(/\{\{\s*firstName\s*\}\}/gi, sampleName || "there").replace(/\{\{\s*name\s*\}\}/gi, sampleName || "there");
  }, [blocks, meta, sampleName]);

  // ----- block editing helpers
  const addBlock = (type: Block["type"]) => setBlocks((b) => [...b, emptyBlock(type)]);
  const updateBlock = (id: string, patch: Partial<Block>) =>
    setBlocks((b) => b.map((bl) => (bl.id === id ? ({ ...bl, ...patch } as Block) : bl)));
  const removeBlock = (id: string) => setBlocks((b) => b.filter((bl) => bl.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) =>
    setBlocks((b) => {
      const i = b.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= b.length) return b;
      const next = [...b];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  function buildEmailPayload() {
    return {
      subject: meta.subject,
      html: renderCampaignHtml(blocks, meta),
      text: renderCampaignText(blocks),
    };
  }

  const selected = recipients.filter((r) => r.checked).map((r) => ({ email: r.email, name: r.name }));

  async function loadRecipients() {
    setLoadingRecipients(true);
    setSendResult(null);
    setProgress(null);
    const { status, data } = await api({ dryRun: true, audience, resend: true });
    setLoadingRecipients(false);
    if (status !== 200) {
      setSendResult({ ok: false, msg: data.error || `Couldn't load recipients (${status}).` });
      return;
    }
    const sheet: Selectable[] = (data.recipients as Recipient[]).map((r) => ({
      email: r.email.toLowerCase(),
      name: r.name || "",
      source: "sheet",
      checked: true,
    }));
    // Replace sheet entries with the fresh pull; keep any manually-added ones
    // that aren't already in the sheet.
    setRecipients((prev) => {
      const sheetEmails = new Set(sheet.map((s) => s.email));
      const manual = prev.filter((r) => r.source === "manual" && !sheetEmails.has(r.email));
      return [...sheet, ...manual];
    });
  }

  function addManual() {
    const emails = manualInput
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => EMAIL_RE.test(e));
    if (emails.length === 0) return;
    setRecipients((prev) => {
      const existing = new Set(prev.map((r) => r.email));
      const add: Selectable[] = [];
      for (const email of emails) {
        if (!existing.has(email)) {
          existing.add(email);
          add.push({ email, name: "", source: "manual", checked: true });
        }
      }
      return [...prev, ...add];
    });
    setManualInput("");
  }

  const toggle = (email: string) =>
    setRecipients((prev) => prev.map((r) => (r.email === email ? { ...r, checked: !r.checked } : r)));
  const setAllChecked = (checked: boolean) =>
    setRecipients((prev) => prev.map((r) => ({ ...r, checked })));
  const removeRecipient = (email: string) =>
    setRecipients((prev) => prev.filter((r) => r.email !== email));

  async function sendTest() {
    if (!testEmail) return;
    if (!meta.subject.trim()) {
      setTestStatus({ ok: false, msg: "Add a subject line first." });
      return;
    }
    setSending(true);
    setTestStatus(null);
    const { status, data } = await api({ test: testEmail, sampleName, email: buildEmailPayload() });
    setSending(false);
    setTestStatus(
      status === 200
        ? { ok: true, msg: `Test sent to ${testEmail}.` }
        : { ok: false, msg: data.error || `Failed (${status}).` }
    );
  }

  async function scheduleSend() {
    if (!meta.subject.trim()) {
      setScheduleMsg({ ok: false, msg: "Add a subject line first." });
      return;
    }
    if (!scheduleAt) {
      setScheduleMsg({ ok: false, msg: "Pick a date and time." });
      return;
    }
    // If you've curated a list (loaded and/or added emails), schedule to exactly
    // those checked. Otherwise fall back to the whole selected audience.
    const hasList = recipients.length > 0;
    if (hasList && selected.length === 0) {
      setScheduleMsg({ ok: false, msg: "Select at least one recipient (or clear the list to use the whole audience)." });
      return;
    }
    setScheduling(true);
    setScheduleMsg(null);
    const email = buildEmailPayload();
    const res = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({
        subject: email.subject,
        html: email.html,
        text: email.text,
        audience,
        scheduledAt: new Date(scheduleAt).toISOString(),
        recipients: hasList ? selected : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setScheduling(false);
    setScheduleMsg(
      res.status === 200
        ? {
            ok: true,
            msg: hasList
              ? `Scheduled to ${selected.length} selected recipient(s). Manage it on the Dashboard.`
              : `Scheduled to your "${audience}" list. Manage it on the Dashboard.`,
          }
        : { ok: false, msg: data.error || `Failed (${res.status}).` }
    );
  }

  // Send now = create a campaign dated now, then drive the worker to completion
  // (polling progress). This routes immediate sends through the same tracked
  // path as scheduled ones, so opens/clicks/failures show on the Dashboard.
  async function sendNow() {
    const list = selected;
    if (list.length === 0) return;
    const email = buildEmailPayload();
    setSending(true);
    setConfirmSend(false);
    setSendResult(null);
    setProgress({ sent: 0, failed: 0, total: list.length });

    const createRes = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({
        subject: email.subject,
        html: email.html,
        text: email.text,
        audience,
        scheduledAt: new Date().toISOString(),
        recipients: list,
      }),
    });
    const created = await createRes.json().catch(() => ({}));
    if (createRes.status !== 200) {
      setSending(false);
      setSendResult({ ok: false, msg: created.error || `Couldn't start send (${createRes.status}).` });
      return;
    }
    const id = created.id as string;

    // Drive the worker + poll until this campaign is done.
    for (let i = 0; i < 80; i++) {
      const run = await fetch("/api/cron/send", { headers: { "x-admin-token": token } });
      const rd = await run.json().catch(() => ({}));
      if (rd.ran === false && rd.error) {
        setSending(false);
        setSendResult({ ok: false, msg: rd.error });
        return;
      }
      const cs = await fetch("/api/admin/campaigns", { headers: { "x-admin-token": token } });
      const cd = await cs.json().catch(() => ({}));
      const c = (cd.campaigns || []).find((x: { id: string }) => x.id === id);
      if (c) {
        setProgress({ sent: c.sent_count, failed: c.failed_count, total: c.total || list.length });
        if (["sent", "error", "canceled"].includes(c.status)) {
          setSending(false);
          setSendResult({
            ok: c.failed_count === 0,
            msg: `Delivered ${c.sent_count} of ${c.total}${c.failed_count ? ` · ${c.failed_count} failed` : ""}. Opens & clicks appear on the Dashboard.`,
          });
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    setSending(false);
    setSendResult({ ok: true, msg: "Still sending — check the Dashboard for progress." });
  }

  // ------------------------------------------------------------------- composer
  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Newsletter <span>Composer</span>
          </h1>
          <p className={styles.subtitle}>Build a newsletter or digest, preview it, and send to your list.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* --------------------------------------------------------- Editor */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Email settings</p>
          <div className={styles.field}>
            <label className={styles.label}>Subject line</label>
            <input className={styles.input} value={meta.subject} onChange={(e) => setMeta({ ...meta, subject: e.target.value })} placeholder="What's this email about?" />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Preview text (preheader)</label>
              <input className={styles.input} value={meta.preheader} onChange={(e) => setMeta({ ...meta, preheader: e.target.value })} placeholder="Shown after the subject in the inbox" />
            </div>
            <div className={styles.field} style={{ maxWidth: 140 }}>
              <label className={styles.label}>Theme</label>
              <select className={styles.input} value={meta.theme} onChange={(e) => setMeta({ ...meta, theme: e.target.value as CampaignMeta["theme"] })}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className={styles.divider} />
          <p className={styles.panelTitle}>Content blocks</p>
          <p className={styles.panelHint}>
            Text blocks have a formatting toolbar (bold, italic, lists, alignment, size, links). Type{" "}
            <code>{"{{firstName}}"}</code> anywhere to personalise per recipient.
          </p>

          {blocks.map((b, i) => (
            <div key={b.id} className={styles.blockCard}>
              <div className={styles.blockHead}>
                <span className={styles.blockType}>{BLOCK_LABEL[b.type]}</span>
                <div className={styles.blockActions}>
                  <button onClick={() => moveBlock(b.id, -1)} disabled={i === 0} title="Move up">↑</button>
                  <button onClick={() => moveBlock(b.id, 1)} disabled={i === blocks.length - 1} title="Move down">↓</button>
                  <button onClick={() => removeBlock(b.id)} title="Delete">✕</button>
                </div>
              </div>
              <BlockEditor block={b} onChange={(patch) => updateBlock(b.id, patch)} />
            </div>
          ))}

          <div className={styles.addRow}>
            {BLOCK_TYPES.map((type) => (
              <button key={type} className={styles.addBtn} onClick={() => addBlock(type)}>
                + {BLOCK_LABEL[type]}
              </button>
            ))}
          </div>

          <div className={styles.divider} />
          <div className={styles.field}>
            <label className={styles.label}>Preview / test name</label>
            <input className={styles.input} value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Send a test to</label>
              <input className={styles.input} type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <button className={styles.btn} onClick={sendTest} disabled={sending || !testEmail}>
              {sending ? "…" : "Send test"}
            </button>
          </div>
          {testStatus && <div className={`${styles.status} ${testStatus.ok ? styles.statusOk : styles.statusErr}`}>{testStatus.msg}</div>}

          <div className={styles.divider} />
          <p className={styles.panelTitle}>Recipients</p>
          <div className={styles.field} style={{ marginTop: 10 }}>
            <label className={styles.label}>Pull from your list</label>
            <select className={styles.input} value={audience} onChange={(e) => { setAudience(e.target.value as Audience); setRecipients((prev) => prev.filter((r) => r.source === "manual")); }}>
              <option value="all">Everyone — registrants + journal (de-duplicated)</option>
              <option value="event">Event registrants only</option>
              <option value="journal">Journal subscribers only</option>
            </select>
          </div>
          <div className={styles.row} style={{ marginTop: 4 }}>
            <button className={styles.btn} onClick={loadRecipients} disabled={loadingRecipients}>
              {loadingRecipients ? "Loading…" : "Load from sheet"}
            </button>
          </div>

          <div className={styles.field} style={{ marginTop: 12 }}>
            <label className={styles.label}>Add emails manually</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className={styles.input}
                style={{ flex: 1 }}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManual(); } }}
                placeholder="name@email.com — comma, space or newline separated"
              />
              <button className={styles.btn} onClick={addManual} disabled={!manualInput.trim()}>Add</button>
            </div>
          </div>

          {recipients.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#ac9f8c" }}>
                  <b style={{ color: "#f4efe6" }}>{selected.length}</b> of {recipients.length} selected
                </span>
                <span style={{ display: "flex", gap: 6 }}>
                  <button className={styles.lockBtn} style={{ padding: "5px 10px" }} onClick={() => setAllChecked(true)}>All</button>
                  <button className={styles.lockBtn} style={{ padding: "5px 10px" }} onClick={() => setAllChecked(false)}>None</button>
                </span>
              </div>
              <div className={styles.recipients} style={{ maxHeight: 260 }}>
                {recipients.map((r) => (
                  <div className={styles.recipientRow} key={r.email} style={{ alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={r.checked} onChange={() => toggle(r.email)} style={{ width: 15, height: 15, accentColor: "#dd2525" }} />
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: r.checked ? "#f4efe6" : "#8a8a8a" }}>
                      {r.name ? `${r.name} · ` : ""}{r.email}
                    </span>
                    {r.source === "manual" && <span style={{ color: "#6d6353", fontSize: 11 }}>manual</span>}
                    <button onClick={() => removeRecipient(r.email)} title="Remove" style={{ background: "none", border: 0, color: "#8a8a8a", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.divider} />
          <p className={styles.panelTitle}>Schedule for later</p>
          <p className={styles.panelHint} style={{ marginBottom: 10 }}>
            Send automatically at a future time — no need to keep this open. Goes to your{" "}
            {recipients.length > 0 ? `${selected.length} selected recipient(s)` : `whole "${audience}" list`}.
          </p>
          <div className={styles.row}>
            <div className={styles.field}>
              <input
                className={styles.input}
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
            </div>
            <button className={styles.btn} onClick={scheduleSend} disabled={scheduling || !scheduleAt}>
              {scheduling ? "Scheduling…" : "Schedule send"}
            </button>
          </div>
          {scheduleMsg && (
            <div className={`${styles.status} ${scheduleMsg.ok ? styles.statusOk : styles.statusErr}`}>{scheduleMsg.msg}</div>
          )}

          {progress && (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 8, background: "#222", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(((progress.sent + progress.failed) / Math.max(progress.total, 1)) * 100)}%`, background: "#d1ff00", transition: "width .3s" }} />
              </div>
              <p style={{ fontSize: 13, color: "#ac9f8c", marginTop: 6 }}>
                {sending ? "Sending…" : "Done."} {progress.sent} delivered{progress.failed ? `, ${progress.failed} failed` : ""} of {progress.total}
              </p>
            </div>
          )}

          {recipients.length > 0 && !progress && (
            <div style={{ marginTop: 8 }}>
              {!confirmSend ? (
                <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: "100%" }} onClick={() => setConfirmSend(true)} disabled={selected.length === 0 || !meta.subject.trim()}>
                  {!meta.subject.trim()
                    ? "Add a subject line first"
                    : selected.length === 0
                    ? "Select at least one recipient"
                    : `Send now to ${selected.length} ${selected.length === 1 ? "person" : "people"}`}
                </button>
              ) : (
                <div className={styles.confirmBox}>
                  <p>Email {selected.length} {selected.length === 1 ? "person" : "people"} now? This can&rsquo;t be undone.</p>
                  <div className={styles.row}>
                    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={sendNow} disabled={sending}>{sending ? "Sending…" : "Yes, send now"}</button>
                    <button className={styles.btn} onClick={() => setConfirmSend(false)} disabled={sending}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {sendResult && <div className={`${styles.status} ${sendResult.ok ? styles.statusOk : styles.statusErr}`}>{sendResult.msg}</div>}
        </div>

        {/* --------------------------------------------------------- Preview */}
        <div className={styles.panel}>
          <div className={styles.previewBar}>
            <p className={styles.panelTitle} style={{ margin: 0 }}>Live preview</p>
            <span className={styles.previewSubject}>Subject: <b>{meta.subject || "(none yet)"}</b></span>
          </div>
          <iframe className={styles.previewFrame} title="Newsletter preview" srcDoc={previewHtml} />
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------ per-block field editor */
function BlockEditor({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input className={styles.input} {...props} />;
  switch (block.type) {
    case "heading":
      return (
        <div className={styles.row}>
          <div className={styles.field}>{input({ value: block.text, onChange: (e) => onChange({ text: e.target.value }), placeholder: "Heading text" })}</div>
          <div className={styles.field} style={{ maxWidth: 120 }}>
            <select className={styles.input} value={block.align} onChange={(e) => onChange({ align: e.target.value as "left" | "center" })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>
      );
    case "text":
      return <RichText value={block.html} onChange={(html) => onChange({ html })} />;
    case "image":
      return (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1 }}>{input({ value: block.src, onChange: (e) => onChange({ src: e.target.value }), placeholder: "Image URL, or upload →" })}</div>
            <UploadButton accept="image/*" label="Upload image" onUploaded={(url) => onChange({ src: url })} />
          </div>
          <div style={{ height: 8 }} />
          <div className={styles.row}>
            <div className={styles.field}>{input({ value: block.alt, onChange: (e) => onChange({ alt: e.target.value }), placeholder: "Alt text" })}</div>
            <div className={styles.field}>{input({ value: block.href, onChange: (e) => onChange({ href: e.target.value }), placeholder: "Link when clicked (optional)" })}</div>
          </div>
        </>
      );
    case "button":
      return (
        <div className={styles.row}>
          <div className={styles.field}>{input({ value: block.label, onChange: (e) => onChange({ label: e.target.value }), placeholder: "Button text" })}</div>
          <div className={styles.field}>{input({ value: block.href, onChange: (e) => onChange({ href: e.target.value }), placeholder: "https://…" })}</div>
        </div>
      );
    case "video":
      return (
        <>
          {input({ value: block.href, onChange: (e) => onChange({ href: e.target.value }), placeholder: "YouTube / video URL" })}
          <div style={{ height: 8 }} />
          <div className={styles.row}>
            <div className={styles.field}>{input({ value: block.label, onChange: (e) => onChange({ label: e.target.value }), placeholder: "Link label" })}</div>
            <div className={styles.field}>{input({ value: block.thumbnail, onChange: (e) => onChange({ thumbnail: e.target.value }), placeholder: "Thumbnail URL (auto for YouTube)" })}</div>
          </div>
        </>
      );
    case "file":
      return (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1 }}>{input({ value: block.url, onChange: (e) => onChange({ url: e.target.value }), placeholder: "File URL, or upload →" })}</div>
            <UploadButton accept=".pdf,.doc,.docx,.txt,image/*" label="Upload file" onUploaded={(url, name) => onChange({ url, label: block.label || `Download ${name}` })} />
          </div>
          <div style={{ height: 8 }} />
          {input({ value: block.label, onChange: (e) => onChange({ label: e.target.value }), placeholder: "Button label (e.g. Download the report)" })}
        </>
      );
    case "spacer":
      return (
        <select className={styles.input} value={block.size} onChange={(e) => onChange({ size: e.target.value as "sm" | "md" | "lg" })}>
          <option value="sm">Small gap</option>
          <option value="md">Medium gap</option>
          <option value="lg">Large gap</option>
        </select>
      );
    case "divider":
      return <p style={{ color: "#6d6353", fontSize: 12, margin: 0 }}>A horizontal line.</p>;
  }
}
