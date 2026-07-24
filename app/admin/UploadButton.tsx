"use client";

import { useRef, useState } from "react";
import styles from "./admin.module.css";
import { useAdminToken } from "./auth";

/** Uploads a chosen file to /api/admin/upload and returns its public URL. */
export default function UploadButton({
  accept,
  label,
  onUploaded,
}: {
  accept: string;
  label: string;
  onUploaded: (url: string, name: string) => void;
}) {
  const token = useAdminToken();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-token": token },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onUploaded(data.url as string, data.name as string);
      else setErr(data.error || `Upload failed (${res.status}).`);
    } catch {
      setErr("Upload failed.");
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        className={styles.btn}
        style={{ padding: "9px 12px" }}
        disabled={busy}
        onClick={() => ref.current?.click()}
      >
        {busy ? "Uploading…" : label}
      </button>
      <input ref={ref} type="file" accept={accept} hidden onChange={handle} />
      {err && <span style={{ color: "#f0b3b3", fontSize: 12, marginLeft: 8 }}>{err}</span>}
    </span>
  );
}
