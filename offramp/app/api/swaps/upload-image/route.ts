import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

const BUCKET_NAME = "swap-images";

const getFileExtension = (filename: string, mimeType: string) => {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
};

async function ensureSwapImageBucket() {
  const admin = getSupabaseAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  const existing = (buckets ?? []).find((bucket) => bucket.name === BUCKET_NAME);
  if (existing) return;
  await admin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json({ error: "image file is required" }, { status: 400 });
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
    }

    await ensureSwapImageBucket();

    const extension = getFileExtension(image.name, image.type);
    const path = `${user.id}/${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    const admin = getSupabaseAdminClient();
    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, { contentType: image.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);
    return NextResponse.json({ ok: true, imageUrl: urlData.publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
