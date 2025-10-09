export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-accent"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="status"
      aria-label="Cargando"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
