export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-center text-foreground">
      <h1 className="text-5xl font-semibold">404</h1>
      <p className="max-w-md text-muted">No encontramos la página que buscas. Usa la navegación superior para explorar funciones y recursos.</p>
    </div>
  );
}
