import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@/shared/lib/prisma";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_SECRET) throw new Error("ACCESS_TOKEN_SECRET 환경변수가 설정되지 않았습니다.");

export function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export async function rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const record = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.refreshToken.delete({ where: { token: oldToken } });
    return null;
  }

  await prisma.refreshToken.delete({ where: { token: oldToken } });
  const newRefresh = await generateRefreshToken(record.userId);
  const accessToken = generateAccessToken(record.userId);
  return { accessToken, refreshToken: newRefresh };
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}
