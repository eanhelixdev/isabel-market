# Isabel Market

Marketplace premium para compra y venta de antiguedades, construido con Next.js,
React, Supabase, Three.js y Mercado Pago marketplace split payments.

## Stack

- Frontend y BFF Node.js: Next.js 16, React 19, TypeScript.
- Datos, Auth, Storage, RLS y Edge Functions: Supabase.
- Pagos: Mercado Pago Checkout Pro con OAuth por vendedor y `marketplace_fee`.
- Visual: Tailwind CSS, liquid glass UI, Three.js lazy-loaded.

## Setup local

1. Copia `.env.example` a `.env.local`.
2. Crea un proyecto Supabase y ejecuta `supabase/migrations/001_isabel_market_schema.sql`.
3. Configura Auth por email y Phone Auth con un proveedor SMS en Supabase.
4. Carga las variables de Mercado Pago y registra el webhook:
   `/api/webhooks/mercadopago`.
5. Instala y ejecuta:

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Rutas principales

- `/`: marketplace y feed.
- `/auth`: email o telefono.
- `/onboarding`: perfil obligatorio.
- `/sell/new`: crear publicacion.
- `/products/[id]`: detalle.
- `/seller/[id]`: perfil publico.
- `/me`: perfil privado, publicaciones y Mercado Pago OAuth.
- `/admin`: moderacion, usuarios, ordenes y comisiones.
- `/checkout/[productId]`: compra.
- `/payment-result`: retorno de Mercado Pago.

## Supabase

La migracion crea tablas, enums, triggers, vistas, buckets y RLS:

- `profiles`, `products`, `product_images`, `likes`, `orders`.
- `seller_payment_accounts`, `admin_actions`, `webhook_events`.
- Buckets: `avatars`, `product-images-private`, `product-images-public`.

## Mercado Pago

El flujo productivo esta en Route Handlers Node.js:

- `GET /api/mercadopago/oauth/start`
- `GET /api/mercadopago/oauth/callback`
- `POST /api/checkout`
- `POST /api/webhooks/mercadopago`

Tambien hay Edge Functions equivalentes en `supabase/functions`.
