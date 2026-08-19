"use client";

import { useEffect, useState } from "react";
import { site } from "../app/content";

type Status = "idle" | "loading" | "success" | "error";

const WHATSAPP_URL = site.register.whatsappUrl;

export default function RegisterForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  // On success, auto-open the WhatsApp group after a short beat. The visible
  // button below is the fallback if the browser blocks or delays the redirect.
  useEffect(() => {
    if (status !== "success" || !WHATSAPP_URL) return;
    const t = setTimeout(() => {
      window.location.href = WHATSAPP_URL;
    }, 2500);
    return () => clearTimeout(t);
  }, [status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");

      setStatus("success");
      setMessage(site.register.successMessage);
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="register-success" role="status">
        <div className="register-success-check" aria-hidden>✓</div>
        <h3>Registration successful!</h3>
        <p>{site.register.whatsappMessage}</p>
        <a className="btn btn-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          Join the WhatsApp group
        </a>
        <p className="register-success-note">
          Not redirected automatically? Tap the button above to join.
          <br />
          We&rsquo;ve also emailed your confirmation and the session link.
        </p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <div className="field">
          <label htmlFor="name">Full Name</label>
          <input id="name" name="name" type="text" placeholder="Your name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email Address</label>
          <input id="email" name="email" type="email" placeholder="you@email.com" required />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="phone">Phone / WhatsApp (optional)</label>
          <input id="phone" name="phone" type="tel" placeholder="+234 ..." />
        </div>
        <div className="field">
          <label htmlFor="role">You are a…</label>
          <select id="role" name="role" defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            {site.audience.items.map((a) => (
              <option key={a.singular} value={a.singular}>
                {a.singular}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="expectations">What are you hoping to get from this?</label>
        <textarea
          id="expectations"
          name="expectations"
          rows={3}
          placeholder="What would make this conversation worth your time?"
        />
      </div>

      {status === "error" && (
        <div className="form-status error" role="alert">
          {message}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Reserving…" : "Reserve My Seat"}
      </button>
      <p className="form-note">
        Free to attend. We&rsquo;ll email you the Zoom link and a reminder.
      </p>
    </form>
  );
}
