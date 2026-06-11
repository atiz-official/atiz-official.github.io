// Encrypt every .md in <srcDir> into <outDir>/<name>.md.enc + <outDir>/crypto.json
// Usage: DOCS_PASSWORD=... node tools/encrypt.mjs <srcDir> <outDir>
//
// Deterministic output: same password + same content -> identical files, so git
// only sees changes when a document actually changed (no commit spam from the
// nightly sync). IV is derived from HMAC(content) — it only repeats when the
// plaintext is identical, which yields an identical ciphertext (harmless).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { webcrypto as crypto } from 'node:crypto';

const [, , srcDir, outDir] = process.argv;
const password = process.env.DOCS_PASSWORD;
if (!password || !srcDir || !outDir) {
  console.error('usage: DOCS_PASSWORD=... node tools/encrypt.mjs <srcDir> <outDir>');
  process.exit(1);
}

const te = new TextEncoder();
const b64 = (buf) => Buffer.from(buf).toString('base64');
const ITER = 150000;

// Reuse the existing salt so the derived key (and output) stays stable.
let salt;
const cryptoPath = join(outDir, 'crypto.json');
if (existsSync(cryptoPath)) {
  salt = Buffer.from(JSON.parse(readFileSync(cryptoPath, 'utf8')).salt, 'base64');
} else {
  salt = crypto.getRandomValues(new Uint8Array(16));
}

const km = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, km, 512));
const aesKey = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt']);
const macKey = await crypto.subtle.importKey('raw', bits.slice(32, 64), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

async function encryptText(label, text) {
  const mac = await crypto.subtle.sign('HMAC', macKey, te.encode(label + '\0' + text));
  const iv = new Uint8Array(mac).slice(0, 12); // deterministic per (label, content)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, te.encode(text));
  return { iv: b64(iv), ct: b64(ct) };
}

mkdirSync(outDir, { recursive: true });
const check = await encryptText('check', 'drease-docs-ok');
writeFileSync(cryptoPath, JSON.stringify({ v: 1, salt: b64(salt), iterations: ITER, check }));

for (const f of readdirSync(srcDir).filter((f) => f.endsWith('.md'))) {
  const data = await encryptText(f, readFileSync(join(srcDir, f), 'utf8'));
  writeFileSync(join(outDir, f + '.enc'), JSON.stringify(data));
  console.log('encrypted', f);
}
console.log('done');
