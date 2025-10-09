"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-center text-foreground">
      <h1 className="text-5xl font-semibold">500</h1>
      <p className="max-w-md text-muted">Algo salió mal. Puedes intentarlo de nuevo o escribirnos en la página de contacto.</p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button variant="secondary" asChild>
          <Link href="/contact">Contacto</Link>
        </Button>
      </div>
    </div>
  );
}
