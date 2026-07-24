"use client";

import { useEffect, useRef } from "react";
import styles from "./admin.module.css";

/**
 * A small WYSIWYG editor for email body text. Produces email-safe inline HTML
 * (bold/italic/underline, lists, alignment, font family & size, links) using
 * the browser's built-in editing commands. Admin-authored content only.
 */

const FONTS = [
  { label: "Sans", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'Courier New', monospace" },
];
const SIZES = [
  { label: "Small", value: "13px" },
  { label: "Normal", value: "15px" },
  { label: "Large", value: "20px" },
  { label: "Huge", value: "26px" },
];

export default function RichText({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Set the initial HTML once (don't re-sync on every keystroke — that would
  // move the cursor).
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      /* older browsers */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      /* ignore */
    }
    document.execCommand(command, false, arg);
    emit();
  };

  /** Wrap the current selection in a span with an inline style (size / font). */
  const applyStyle = (prop: "fontSize" | "fontFamily", val: string) => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style[prop] = val;
    try {
      range.surroundContents(span);
    } catch {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL (https://…)");
    if (url) exec("createLink", url);
  };

  const Btn = ({ cmd, label, title }: { cmd: string; label: string; title: string }) => (
    <button
      type="button"
      className={styles.rtBtn}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        exec(cmd);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.rtWrap}>
      <div className={styles.rtToolbar}>
        <Btn cmd="bold" label="B" title="Bold" />
        <Btn cmd="italic" label="I" title="Italic" />
        <Btn cmd="underline" label="U" title="Underline" />
        <span className={styles.rtSep} />
        <Btn cmd="insertUnorderedList" label="•" title="Bulleted list" />
        <Btn cmd="insertOrderedList" label="1." title="Numbered list" />
        <span className={styles.rtSep} />
        <Btn cmd="justifyLeft" label="⯇" title="Align left" />
        <Btn cmd="justifyCenter" label="≡" title="Align center" />
        <Btn cmd="justifyRight" label="⯈" title="Align right" />
        <span className={styles.rtSep} />
        <button type="button" className={styles.rtBtn} title="Add link" onMouseDown={(e) => { e.preventDefault(); addLink(); }}>
          🔗
        </button>
        <button type="button" className={styles.rtBtn} title="Remove formatting" onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}>
          ⌫
        </button>
        <span className={styles.rtSep} />
        <select
          className={styles.rtSelect}
          defaultValue=""
          title="Font"
          onChange={(e) => { applyStyle("fontFamily", e.target.value); e.target.value = ""; }}
        >
          <option value="" disabled>Font</option>
          {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <select
          className={styles.rtSelect}
          defaultValue=""
          title="Size"
          onChange={(e) => { applyStyle("fontSize", e.target.value); e.target.value = ""; }}
        >
          <option value="" disabled>Size</option>
          {SIZES.map((s) => <option key={s.label} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div
        ref={ref}
        className={styles.rtEditor}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
