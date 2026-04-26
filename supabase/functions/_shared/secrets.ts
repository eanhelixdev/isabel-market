const encoder = new TextEncoder();

async function keyMaterial() {
  const source =
    Deno.env.get("TOKEN_ENCRYPTION_KEY") ??
    Deno.env.get("MERCADOPAGO_CLIENT_SECRET") ??
    "dev-key";
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(source));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["decrypt"]);
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export async function decryptSecret(value: string) {
  if (!Deno.env.get("TOKEN_ENCRYPTION_KEY") || !value.includes(".")) return value;
  const [iv, tag, encrypted] = value.split(".");
  const payload = new Uint8Array([...fromBase64Url(encrypted), ...fromBase64Url(tag)]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(iv), tagLength: 128 },
    await keyMaterial(),
    payload,
  );
  return new TextDecoder().decode(decrypted);
}
