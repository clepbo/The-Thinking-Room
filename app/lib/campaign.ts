/**
 * Newsletter / digest renderer. Turns an ordered list of content blocks into
 * email-safe HTML (table layout, inline styles) that renders in Gmail, Outlook,
 * Apple Mail, etc. Pure and dependency-free, so it runs on both the client
 * (live preview) and the server. Video can't play inside an email, so a "video"
 * block becomes a clickable thumbnail that opens the link (e.g. YouTube).
 */

export type Block =
  | { id: string; type: "heading"; text: string; align: "left" | "center" }
  | { id: string; type: "text"; html: string }
  | { id: string; type: "image"; src: string; alt: string; href: string }
  | { id: string; type: "button"; label: string; href: string; align: "left" | "center" }
  | { id: string; type: "video"; href: string; thumbnail: string; label: string }
  | { id: string; type: "file"; url: string; label: string }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer"; size: "sm" | "md" | "lg" };

export interface CampaignMeta {
  subject: string;
  preheader: string;
  theme: "light" | "dark";
  brandName: string;
  footerNote: string;
  unsubscribeEmail: string;
}

export function emptyBlock(type: Block["type"]): Block {
  const id = Math.random().toString(36).slice(2, 9);
  switch (type) {
    case "heading":
      return { id, type, text: "Your headline", align: "left" };
    case "text":
      return { id, type, html: "<p>Write your message here.</p>" };
    case "image":
      return { id, type, src: "", alt: "", href: "" };
    case "button":
      return { id, type, label: "Read more", href: "https://", align: "left" };
    case "video":
      return { id, type, href: "https://www.youtube.com/watch?v=", thumbnail: "", label: "Watch the video" };
    case "file":
      return { id, type, url: "", label: "Download the file" };
    case "divider":
      return { id, type };
    case "spacer":
      return { id, type, size: "md" };
  }
}

export function defaultCampaign(): { meta: CampaignMeta; blocks: Block[] } {
  return {
    meta: {
      subject: "",
      preheader: "",
      theme: "light",
      brandName: "The Thinking Room",
      footerNote: "You're receiving this because you registered or subscribed at The Thinking Room.",
      unsubscribeEmail: "hello@thethinkingroom.co",
    },
    blocks: [
      { id: "h", type: "heading", text: "This month at The Thinking Room", align: "left" },
      { id: "t", type: "text", html: "<p>Hello {{firstName}},</p><p>Here's what's new.</p>" },
    ],
  };
}

// ---------------------------------------------------------------- helpers

function esc(v: string) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Clean rich-text HTML (from the WYSIWYG editor) for email: drop <script>,
 * <style>, comments, and on*= handlers. The content is admin-authored, so this
 * is about email-safety more than untrusted-input XSS. Runs on client + server.
 */
export function sanitizeRichHtml(html: string): string {
  return (html || "")
    .replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

/** Strip all tags to a plain-text approximation. */
function stripTags(html: string): string {
  return (html || "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

interface Theme {
  pageBg: string;
  cardBg: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  headingColor: string;
}

function themeColors(theme: CampaignMeta["theme"]): Theme {
  return theme === "dark"
    ? { pageBg: "#0a0a0a", cardBg: "#111111", text: "#f4efe6", muted: "#ac9f8c", accent: "#ff5a5a", border: "rgba(255,255,255,0.1)", headingColor: "#ffffff" }
    : { pageBg: "#f4f2ee", cardBg: "#ffffff", text: "#1a1a1a", muted: "#6b6b6b", accent: "#dd2525", border: "#e6e2da", headingColor: "#141414" };
}

function renderBlock(b: Block, t: Theme): string {
  switch (b.type) {
    case "heading":
      return `<tr><td style="padding:8px 32px 4px;"><h2 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;color:${t.headingColor};text-align:${b.align};">${esc(b.text)}</h2></td></tr>`;
    case "text":
      return `<tr><td style="padding:8px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${t.text};" class="rt">${sanitizeRichHtml(b.html)}</td></tr>`;
    case "image": {
      if (!b.src) return "";
      const img = `<img src="${esc(b.src)}" alt="${esc(b.alt)}" width="536" style="width:100%;max-width:536px;border-radius:8px;display:block;" />`;
      const inner = b.href ? `<a href="${esc(b.href)}" style="text-decoration:none;">${img}</a>` : img;
      return `<tr><td style="padding:12px 32px;">${inner}</td></tr>`;
    }
    case "button": {
      if (!b.href) return "";
      return `<tr><td style="padding:12px 32px;" align="${b.align}"><table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;"><tr><td style="border-radius:6px;background:${t.accent};"><a href="${esc(b.href)}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(b.label)}</a></td></tr></table></td></tr>`;
    }
    case "video": {
      if (!b.href) return "";
      const yt = youTubeId(b.href);
      const thumb = b.thumbnail || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "");
      const thumbImg = thumb
        ? `<a href="${esc(b.href)}" style="text-decoration:none;display:block;"><img src="${esc(thumb)}" alt="${esc(b.label)}" width="536" style="width:100%;max-width:536px;border-radius:8px;display:block;" /></a>`
        : "";
      return `<tr><td style="padding:12px 32px;">${thumbImg}<div style="text-align:center;padding-top:10px;"><a href="${esc(b.href)}" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${t.accent};text-decoration:none;">▶ ${esc(b.label)}</a></div></td></tr>`;
    }
    case "file": {
      if (!b.url) return "";
      return `<tr><td style="padding:12px 32px;"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:6px;border:1px solid ${t.border};background:${t.pageBg};"><a href="${esc(b.url)}" style="display:inline-block;padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${t.accent};text-decoration:none;">⬇ ${esc(b.label)}</a></td></tr></table></td></tr>`;
    }
    case "divider":
      return `<tr><td style="padding:8px 32px;"><div style="border-top:1px solid ${t.border};"></div></td></tr>`;
    case "spacer": {
      const h = b.size === "sm" ? 10 : b.size === "lg" ? 40 : 24;
      return `<tr><td style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</td></tr>`;
    }
  }
}

export function renderCampaignHtml(blocks: Block[], meta: CampaignMeta): string {
  const t = themeColors(meta.theme);
  const body = blocks.map((b) => renderBlock(b, t)).join("");
  const preheader = meta.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(meta.preheader)}</div>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:0;background:${t.pageBg};">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${t.pageBg};padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:${t.cardBg};border:1px solid ${t.border};border-radius:10px;overflow:hidden;">
        <tr><td style="padding:22px 32px;border-bottom:1px solid ${t.border};">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${t.accent};">${esc(meta.brandName)}</span>
        </td></tr>
        <tr><td style="height:12px;font-size:0;">&nbsp;</td></tr>
        ${body}
        <tr><td style="height:16px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${t.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${t.muted};">
          ${esc(meta.footerNote)}<br>
          <a href="{{unsubscribeUrl}}" style="color:${t.muted};text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

/** A plain-text fallback so the email isn't HTML-only (helps deliverability). */
export function renderCampaignText(blocks: Block[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    if (b.type === "heading") lines.push(b.text.toUpperCase(), "");
    else if (b.type === "text") lines.push(stripTags(b.html), "");
    else if (b.type === "button" || b.type === "video") lines.push(`${b.type === "video" ? "▶ " : ""}${b.label}: ${b.href}`, "");
    else if (b.type === "file" && b.url) lines.push(`⬇ ${b.label}: ${b.url}`, "");
    else if (b.type === "image" && b.href) lines.push(b.href, "");
    else if (b.type === "divider") lines.push("—", "");
  }
  return lines.join("\n").trim();
}
