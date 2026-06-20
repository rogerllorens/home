"use client";
import { Button } from "@/components/ui/Button";

export function AuditTrackedLink({ href, token, eventType, children, variant }: { href: string; token: string; eventType: "cta_clicked" | "signup_clicked" | "upload_clicked" | "gsc_clicked"; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" }) {
  function track() {
    const payload = JSON.stringify({ token, eventType, metadata: { href } });
    if (navigator.sendBeacon) { navigator.sendBeacon("/api/audit-report/events", new Blob([payload], { type: "application/json" })); return; }
    void fetch("/api/audit-report/events", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true });
  }
  return <Button href={href} onClick={track} variant={variant}>{children}</Button>;
}
