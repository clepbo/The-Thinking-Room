"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";
import { AdminTokenContext } from "./auth";

const NAV = [
  { href: "/admin", label: "Reminders" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/events", label: "Events CMS" },
  { href: "/admin/dashboard", label: "Dashboard" },
];

/**
 * Wraps every /admin/* page. You enter the admin token ONCE; after that the
 * sidebar lets you move between tabs with no re-authentication (the token lives
 * in context + sessionStorage, and each page's API calls carry it).
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  const pathname = usePathname();

  // Restore a token from earlier this session — stay unlocked across reloads.
  useEffect(() => {
    const saved = sessionStorage.getItem("ttr-admin-token");
    if (saved) {
      setToken(saved);
      setUnlocked(true);
    }
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!input) return;
    setChecking(true);
    setErr("");
    // /api/send-reminders preview mode only needs a valid token to return 200.
    const res = await fetch("/api/send-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": input },
      body: JSON.stringify({ preview: true }),
    });
    setChecking(false);
    if (res.status === 200) {
      sessionStorage.setItem("ttr-admin-token", input);
      setToken(input);
      setUnlocked(true);
    } else if (res.status === 401) {
      setErr("That token doesn't match ADMIN_TOKEN.");
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || `Unexpected error (${res.status}).`);
    }
  }

  function lock() {
    sessionStorage.removeItem("ttr-admin-token");
    setToken("");
    setUnlocked(false);
    setInput("");
  }

  if (!unlocked) {
    return (
      <div className={styles.page}>
        <form className={styles.lockCard} onSubmit={unlock}>
          <h2>The Thinking Room — Admin</h2>
          <p>
            Enter your admin token (the <code>ADMIN_TOKEN</code> from Vercel) to continue.
          </p>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin token"
              autoFocus
            />
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={checking || !input}>
            {checking ? "Checking…" : "Unlock"}
          </button>
          {err && <div className={`${styles.status} ${styles.statusErr}`}>{err}</div>}
        </form>
      </div>
    );
  }

  return (
    <AdminTokenContext.Provider value={token}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            The Thinking <span>Room</span>
            <br />
            Admin
          </div>
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`${styles.sidebarLink} ${active ? styles.sidebarLinkActive : ""}`}
              >
                {n.label}
              </Link>
            );
          })}
          <div className={styles.sidebarSpacer} />
          <button className={styles.sidebarLock} onClick={lock}>
            Lock
          </button>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </AdminTokenContext.Provider>
  );
}
