import dns from "node:dns/promises";
import net from "node:net";
import type { ValidatedAuditUrl } from "./types";

const BLOCKED_SUFFIXES = [".local", ".internal", ".test", ".localhost"];
const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "169.254.169.254"]);

function normalizeInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("La URL es obligatoria.");
  if (trimmed.length > 2048) throw new Error("La URL es demasiado larga.");
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || a >= 224;
}

function isPrivateIpv6(ip: string) {
  const lower = ip.toLowerCase();
  return lower === "::1" || lower === "::" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:") || lower.startsWith("::ffff:127.") || lower.startsWith("::ffff:10.") || lower.startsWith("::ffff:192.168.") || /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(lower);
}

export function isPrivateOrLocalAddress(address: string) {
  const version = net.isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

function assertSafeHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(host) || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) throw new Error("Dominio interno o local bloqueado.");
  const ipVersion = net.isIP(host);
  if (ipVersion && isPrivateOrLocalAddress(host)) throw new Error("IP privada o local bloqueada.");
}

async function resolvePublicAddress(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
  hostname = hostname.replace(/^\[|\]$/g, "");
  const literal = net.isIP(hostname);
  if (literal) {
    if (isPrivateOrLocalAddress(hostname)) throw new Error("IP privada o local bloqueada.");
    return { address: hostname, family: literal as 4 | 6 };
  }
  const records = await dns.lookup(hostname, { all: true, verbatim: false });
  const publicRecords = records.filter((record): record is { address: string; family: 4 | 6 } => (record.family === 4 || record.family === 6) && !isPrivateOrLocalAddress(record.address));
  if (!publicRecords.length) throw new Error("El dominio no resuelve a una IP pública válida.");
  return publicRecords[0];
}

export async function validateAuditUrl(input: string, options: { resolveDns?: boolean } = {}): Promise<ValidatedAuditUrl> {
  const url = new URL(normalizeInput(input));
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Solo se permiten URLs http o https.");
  if (url.username || url.password) throw new Error("No se permiten credenciales en la URL.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Puerto no permitido para auditoría pública.");
  if (url.pathname.length > 1024) throw new Error("El path de la URL es demasiado largo.");
  assertSafeHostname(url.hostname);
  const resolved = options.resolveDns === false ? { address: "0.0.0.0", family: 4 as const } : await resolvePublicAddress(url.hostname);
  if (url.pathname === "") url.pathname = "/";
  return { inputUrl: input.trim(), normalizedUrl: url.toString(), domain: url.hostname, url, resolvedIp: resolved.address, resolvedFamily: resolved.family };
}
