export const metadata = {
  title: 'Privacidad | TKN Social'
};

export default function PrivacyPage() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <h1>Política de privacidad</h1>
      <p>Almacenamos mínimos datos: email, alias, logs de seguridad y preferencias para matching.</p>
      <p>Media sensible se sirve vía URLs firmadas con TTL 5 minutos y control de referer.</p>
      <p>Se permite descarga de historial financiero para efectos de payouts.</p>
    </div>
  );
}
