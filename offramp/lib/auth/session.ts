import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET!;

export async function createSession(userId: string) {
  const token = jwt.sign(
    { userId },
    SECRET,
    { expiresIn: "7d" }
  );

  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: true,
    path: "/",
  });
}

export async function getSessionUserId() {
  const cookieStore = await cookies();

  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, SECRET) as any;
    return payload.userId;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
};