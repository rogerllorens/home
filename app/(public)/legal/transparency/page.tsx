export const metadata = {
  title: 'Transparencia | TKN Social'
};

import { FinancialPolicy } from '@/components/legal/financial-policy';

export default function TransparencyPage() {
  return (
    <article className="prose prose-invert max-w-3xl">
      <h1>Informe de transparencia</h1>
      <p>
        Actualizaremos esta página mensualmente con métricas clave de moderación conforme a los requisitos de la DSA.
        Todos los datos a continuación son simulados para el entorno de demo.
      </p>
      <h2>Resumen último mes</h2>
      <ul>
        <li>Contenido retirado: 42 piezas (30 PPV, 10 posts de foro, 2 perfiles).</li>
        <li>Tiempo medio de respuesta a reportes: 3h 12m.</li>
        <li>Reportes recibidos: 380 (0.8% de sesiones totales).</li>
        <li>Bloqueos de cuenta: 24 (18 permanentes, 6 shadowban).</li>
      </ul>
      <h2>Cómo reportar</h2>
      <p>
        Usa el botón “Reportar” en cada post o envía un correo a <a href="mailto:notice@tuweb.com">notice@tuweb.com</a>
        indicando URL, descripción y pruebas. Respondemos en menos de 24h.
      </p>
      <h2>Proceso de apelación</h2>
      <p>
        Si tu contenido fue retirado o tu cuenta bloqueada puedes apelar desde el panel de soporte o escribiendo a
        <a href="mailto:appeals@tuweb.com">appeals@tuweb.com</a>. Revisamos cada caso con intervención humana.
      </p>
      <FinancialPolicy />
    </article>
  );
}
