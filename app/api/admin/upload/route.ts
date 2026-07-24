import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "../../../lib/supabase";

export const runtime = "nodejs";

const BUCKET = "media";
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (server-proxied upload limit)
// How long an uploaded file lives before the cleanup cron deletes it.
const TTL_DAYS = Number(process.env.MEDIA_TTL_DAYS || 90);

const ALLOWED = /^(image\/(png|jpe?g|gif|webp|svg\+xml)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.|text\/plain)/i;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export async function POST(request: Request) {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) return NextResponse.json({ error: "ADMIN_TOKEN is not set." }, { status: 500 });
  const provided = request.headers.get("x-admin-token") || "";
  if (provided !== admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Uploads need Supabase. Set SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB).` }, { status: 413 });
  }
  if (file.type && !ALLOWED.test(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }

  const db = getSupabase()!;

  // Ensure the bucket exists (idempotent, public).
  try {
    const { data: buckets } = await db.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      await db.storage.createBucket(BUCKET, { public: true });
    }
  } catch (err) {
    return NextResponse.json({ error: `Storage error: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }

  const path = `uploads/${Date.now()}-${safeName(file.name || "file")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;
  const kind = file.type.startsWith("image/") ? "image" : "file";
  const expires_at = TTL_DAYS > 0 ? new Date(Date.now() + TTL_DAYS * 86400_000).toISOString() : null;

  // Record it so the cleanup cron can expire it later. (Non-fatal if it fails.)
  await db.from("media").insert({ path, url, kind, bytes: file.size, expires_at }).then(
    () => {},
    () => {}
  );

  return NextResponse.json({ ok: true, url, kind, name: file.name, expires_at });
}
