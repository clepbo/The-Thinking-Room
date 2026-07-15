"use client";

import { useState } from "react";
import { site } from "../app/content";

type Status = "idle" | "loading" | "success" | "error";

export default function JournalForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const email = new FormData(form).get("email");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "journal" }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setMessage(site.journal.successMessage);
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <form className="journal-form" onSubmit={handleSubmit} noValidate>
        <input
          name="email"
          type="email"
          placeholder="Enter your email address"
          aria-label="Email address"
          required
        />
        <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p className="journal-status" role="status" style={status === "error" ? { color: "#e7b3b3" } : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
