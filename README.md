# Xder Web

Web corporativa para Xder, app móvil que combina citas y amistades. Construida con Next.js 14, App Router, TypeScript y Tailwind CSS.

## Requisitos previos

- Node.js >= 18
- pnpm >= 8

## Scripts

- `pnpm dev`: entorno de desarrollo
- `pnpm build`: compila la aplicación
- `pnpm start`: ejecuta la versión compilada
- `pnpm lint`: ejecuta ESLint
- `pnpm format`: aplica Prettier
- `pnpm test`: ejecuta pruebas unitarias con Jest
- `pnpm e2e`: corre las pruebas E2E con Playwright
- `pnpm typecheck`: verifica tipos
- `pnpm analyze`: build con análisis del bundle

## Desarrollo

1. Instala dependencias: `pnpm install`
2. Ejecuta en desarrollo: `pnpm dev`
3. Abre `http://localhost:3000`

### Añadir una entrada de blog (MDX)

1. Crea un archivo en `content/blog/mi-articulo.mdx`.
2. Añade frontmatter:
   ```mdx
   ---
   title: "Título"
   description: "Descripción breve"
   date: "2024-03-01"
   locale: "es"
   ---
   ```
3. Escribe contenido en MDX usando componentes como `<Callout />`.
4. Ejecuta `pnpm dev` o `pnpm build` para regenerar Contentlayer.

### Crear landing de ciudad o país

- Ciudad: añade un archivo en `data/cities/nombre-locale.mdx` con campos `title`, `description`, `locale`, `climate`.
- País: similar en `data/countries` pero sin `climate`.
- Las páginas se generan automáticamente desde `app/[locale]/cities` y `app/[locale]/countries`.

### Actualizar metadatos y Schema

- Configuración SEO base en `lib/seo.ts` y `next-seo.config.ts`.
- Esquemas JSON-LD en `lib/schema.ts`. Crea utilidades adicionales si necesitas estructuras específicas.
- Ajusta las traducciones en `messages/*.json` para textos localizados.

## SEO y accesibilidad

Checklist rápido:

- [ ] Títulos y descripciones traducidos en `messages`.
- [ ] Imagen OG por página en `public/og/` (placeholders actuales).
- [ ] Revisar contrastes con herramientas como Axe.
- [ ] Ejecutar Lighthouse en modo producción (`pnpm build && pnpm start`).

## PWA

- Configuración con `next-pwa` y manifiesto en `public/manifest.webmanifest`.
- Service worker se genera durante `pnpm build`.

## Testing

- Unit tests: Jest + React Testing Library.
- E2E: Playwright (`pnpm e2e`).

## Despliegue en Vercel

1. Crear proyecto y conectar el repo.
2. Configurar variables de entorno (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`).
3. Establecer `pnpm` como gestor de paquetes.
4. Deploy automático con `pnpm build` y `pnpm start`.
