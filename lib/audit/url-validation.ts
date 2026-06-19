import dns from "node:dns/promises";
import net from "node:net";
import type { ValidatedAuditUrl } from "./types";

const BLOCKED_SUFFIXES = [".local", ".internal", ".test", ".localhost"];
const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

function normalizeInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("La URL es obligatoria.");
  if (trimmed.length > 2048) throw new Error("La URL es demasiado larga.");
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isPrivateIpv6(ip: string) {
  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:") || lower.startsWith("::ffff:127.") || lower.startsWith("::ffff:10.") || lower.startsWith("::ffff:192.168.");
}

export function isPrivateOrLocalAddress(address: string) {
  const version = net.isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

function assertSafeHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) throw new Error("Dominio interno o local bloqueado.");
  if (host === "169.254.169.254") throw new Error("Endpoint metadata cloud bloqueado.");
  const ipVersion = net.isIP(host);
  if (ipVersion && isPrivateOrLocalAddress(host)) throw new Error("IP privada o local bloqueada.");
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
  if (options.resolveDns !== false && !net.isIP(url.hostname)) {
    const records = await dns.lookup(url.hostname, { all: true, verbatim: false });
    if (!records.length) throw new Error("No se pudo resolver el dominio.");
    if (records.some((record) => isPrivateOrLocalAddress(record.address))) throw new Error("El dominio resuelve a una IP privada o local.");
  }
  if (url.pathname === "") url.pathname = "/";
  return { inputUrl: input.trim(), normalizedUrl: url.toString(), domain: url.hostname, url };
}
