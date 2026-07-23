"use client";

import { useCallback, useMemo, useState } from "react";
import styles from "../admin.module.css";
import { useAdminToken } from "../auth";
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
type Audience = "event" | "journal" | "all";
const BATCH_SIZE = 12;
const BLOCK_TYPES: Block["type"][] = ["heading", "text", "image", "button", "video", "divider", "spacer"];
const BLOCK_LABEL: Record<Block["type"], string> = {
  heading: "Heading",
  text: "Text",
  image: "Image",
  button: "Button",
  video: "Video",
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
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

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

  async function loadRecipients() {
    setLoadingRecipients(true);
    setSendResult(null);
    setProgress(null);
    const { status, data } = await api({ dryRun: true, audience, resend: true });
    setLoadingRecipients(false);
    if (status === 200) setRecipients(data.recipients as Recipient[]);
    else {
      setRecipients(null);
      setSendResult({ ok: false, msg: data.error || `Couldn't load recipients (${status}).` });
    }
  }

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

  async function sendAll() {
    if (!recipients) return;
    const list = recipients;
    const email = buildEmailPayload();
    setSending(true);
    setConfirmSend(false);
    setSendResult(null);
    let sent = 0;
    let failed = 0;
    setProgress({ sent: 0, failed: 0, total: list.length });
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE);
      try {
        const { status, data } = await api({ recipients: batch, email });
        if (status === 200) {
          sent += (data.sent as number) || 0;
          failed += (data.failed as number) || 0;
        } else failed += batch.length;
      } catch {
        failed += batch.length;
      }
      setProgress({ sent, failed, total: list.length });
      if (i + BATCH_SIZE < list.length) await new Promise((r) => setTimeout(r, 400));
    }
    setSending(false);
    setSendResult({ ok: failed === 0, msg: `Delivered ${sent} of ${list.length}${failed ? ` · ${failed} failed` : ". All done."}` });
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
            Use <code>{"{{firstName}}"}</code> to personalise. In text blocks, <code>**bold**</code> and{" "}
            <code>[link](https://…)</code> work.
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
          <p className={styles.panelTitle}>Send to your list</p>
          <div className={styles.field} style={{ marginTop: 10 }}>
            <label className={styles.label}>Who to email</label>
            <select className={styles.input} value={audience} onChange={(e) => { setAudience(e.target.value as Audience); setRecipients(null); }}>
              <option value="all">Everyone — registrants + journal (de-duplicated)</option>
              <option value="event">Event registrants only</option>
              <option value="journal">Journal subscribers only</option>
            </select>
          </div>
          <button className={styles.btn} onClick={loadRecipients} disabled={loadingRecipients}>
            {loadingRecipients ? "Loading…" : "Load recipients"}
          </button>

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

          {recipients && !progress && (
            <>
              <div className={`${styles.status} ${styles.statusInfo}`}>{recipients.length} recipient(s) will receive this email.</div>
              {!confirmSend ? (
                <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 12, width: "100%" }} onClick={() => setConfirmSend(true)} disabled={recipients.length === 0 || !meta.subject.trim()}>
                  {meta.subject.trim() ? `Send to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}` : "Add a subject line first"}
                </button>
              ) : (
                <div className={styles.confirmBox}>
                  <p>Email {recipients.length} {recipients.length === 1 ? "person" : "people"} now? This can&rsquo;t be undone.</p>
                  <div className={styles.row}>
                    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={sendAll} disabled={sending}>{sending ? "Sending…" : "Yes, send now"}</button>
                    <button className={styles.btn} onClick={() => setConfirmSend(false)} disabled={sending}>Cancel</button>
                  </div>
                </div>
              )}
            </>
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
      return <textarea className={styles.textarea} value={block.text} onChange={(e) => onChange({ text: e.target.value })} rows={4} />;
    case "image":
      return (
        <>
          {input({ value: block.src, onChange: (e) => onChange({ src: e.target.value }), placeholder: "Image URL (https://…)" })}
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
