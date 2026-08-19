"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "idle" | "submitting" | "done" | "error";

export default function UnsubscribeClient() {
  const params = useSearchParams();
  const email = (params.get("e") || "").trim();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function confirm() {
    setState("submitting");
    setError("");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong.");
      }
      setState("done");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0a0a0a",
    color: "#f4efe6",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: 24,
  };
  const card: React.CSSProperties = {
    maxWidth: 460,
    width: "100%",
    background: "#111",
    border: "1px solid rgba(221,37,37,0.3)",
    borderRadius: 12,
    padding: "36px 32px",
    textAlign: "center",
  };
  const btn: React.CSSProperties = {
    display: "inline-block",
    padding: "12px 22px",
    borderRadius: 6,
    border: 0,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "#dd2525" }}>
          The Thinking Room
        </p>

        {!email ? (
          <>
            <h1 style={{ fontSize: 22, margin: "14px 0 10px" }}>Invalid link</h1>
            <p style={{ color: "#ac9f8c", lineHeight: 1.7 }}>
              This unsubscribe link is missing an email address. Please use the link from the bottom of one of our emails.
            </p>
          </>
        ) : state === "done" ? (
          <>
            <h1 style={{ fontSize: 22, margin: "14px 0 10px" }}>You&rsquo;re unsubscribed</h1>
            <p style={{ color: "#ac9f8c", lineHeight: 1.7 }}>
              <b style={{ color: "#f4efe6" }}>{email}</b> won&rsquo;t receive further emails from The Thinking Room. Changed your mind? Just register or subscribe again anytime.
            </p>
            <a href="/" style={{ ...btn, background: "#1a1a1a", color: "#f4efe6", border: "1px solid rgba(255,255,255,0.15)", marginTop: 18 }}>
              Back to the site
            </a>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, margin: "14px 0 10px" }}>Unsubscribe?</h1>
            <p style={{ color: "#ac9f8c", lineHeight: 1.7 }}>
              Stop sending emails to <b style={{ color: "#f4efe6" }}>{email}</b>? You can always come back later.
            </p>
            {state === "error" && (
              <p style={{ color: "#f0b3b3", fontSize: 14, marginTop: 12 }}>{error}</p>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
              <button onClick={confirm} disabled={state === "submitting"} style={{ ...btn, background: "linear-gradient(180deg,#ff4d4d,#dd2525)", color: "#fff" }}>
                {state === "submitting" ? "Unsubscribing…" : "Yes, unsubscribe"}
              </button>
              <a href="/" style={{ ...btn, background: "#1a1a1a", color: "#f4efe6", border: "1px solid rgba(255,255,255,0.15)" }}>
                Keep me subscribed
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
