import "server-only";

import crypto from "node:crypto";

function secretKey() {
  const source = process.env.TOKEN_ENCRYPTION_KEY || process.env.MERCADOPAGO_CLIENT_SECRET || "dev-key";
  return crypto.createHash("sha256").update(source).digest();
}

export function encryptSecret(value: string) {
  if (!process.env.TOKEN_ENCRYPTION_KEY) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(value: string) {
  if (!process.env.TOKEN_ENCRYPTION_KEY || !value.includes(".")) return value;
  const [iv, tag, encrypted] = value.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    secretKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function signState(payload: string) {
  const signature = crypto
    .createHmac("sha256", secretKey())
    .update(payload)
    .digest("base64url");
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64url");
}

export function verifyState(state: string) {
  const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
    payload: string;
    signature: string;
  };
  const expected = crypto
    .createHmac("sha256", secretKey())
    .update(parsed.payload)
    .digest("base64url");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(parsed.signature),
      Buffer.from(expected),
    )
  ) {
    throw new Error("Invalid OAuth state");
  }
  return parsed.payload;
}

export function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !xSignature || !xRequestId || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }),
  );

  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
}
