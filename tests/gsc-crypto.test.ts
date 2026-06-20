import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { decryptToken, encryptToken } from "../lib/gsc/token-crypto";
test("encrypts and decrypts Google tokens without plaintext", () => { process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64"); const encrypted = encryptToken("secret-refresh-token"); assert.match(encrypted, /^v1:/); assert.equal(encrypted.includes("secret-refresh-token"), false); assert.equal(decryptToken(encrypted), "secret-refresh-token"); });
test("invalid encrypted token format fails", () => { process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64"); assert.throws(() => decryptToken("bad"), /invalid_encrypted_token_format/); });
