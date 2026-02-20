import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET!;

export function createSession(userId: string) {
  const token = jwt.sign(
    { userId },
    SECRET,
    { expiresIn: "7d" }
  );
  cookies().set("session", token, {
    httpOnly: true,
    secure: true,
    path: "/",
  });
}

export function getSessionUserId() {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET) as any;
    return payload.userId;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete("session");
}
