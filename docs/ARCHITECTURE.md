# Arquitectura Isabel Market

## Decision central

Isabel Market usa Next.js como aplicacion full-stack desplegable en Vercel. El
frontend es React y el backend principal son Route Handlers Node.js. Supabase
mantiene Auth, Postgres, Storage, RLS y Edge Functions para operaciones que
conviene ejecutar cerca de la base.

## Modulos

- `auth`: email/password y phone OTP con Supabase Auth.
- `onboarding`: bloqueo obligatorio hasta completar `display_name`.
- `marketplace`: feed, busqueda, filtros, cards y likes.
- `products`: publicacion, imagenes, estados y detalle.
- `admin`: aprobacion, rechazo, ocultamiento, metricas y auditoria.
- `payments`: OAuth de vendedor, ordenes, Checkout Pro y webhook.
- `reputation`: score por ventas, likes y publicaciones aprobadas.
- `ui`: liquid glass, skeletons, toasts y microinteracciones.
- `three`: escena WebGL sutil con reduccion por hardware/motion.

## Seguridad

- RLS habilitado en todas las tablas publicas.
- El cliente solo usa anon key.
- Service role solo en Route Handlers o Edge Functions.
- Tokens de vendedor se guardan cifrados con `TOKEN_ENCRYPTION_KEY`.
- Webhook Mercado Pago valida `x-signature` + `x-request-id`.
- Pagos usan idempotencia por orden y `idempotency_key`.
- Productos pendientes no aparecen en vistas publicas.
- Imagenes de producto se suben a bucket privado y el servidor emite signed URLs.

## Flujo de publicacion

1. Usuario autenticado completa onboarding.
2. Crea producto en `draft`.
3. Sube minimo 2 imagenes a `product-images-private`.
4. Cambia estado a `pending_review`.
5. Admin revisa y aprueba, rechaza con motivo u oculta.
6. Solo `approved` aparece en `product_cards`.

## Flujo de pago

1. Vendedor conecta Mercado Pago por OAuth.
2. Comprador inicia checkout.
3. Backend valida usuario, producto `approved`, vendedor conectado y producto no propio.
4. Crea orden con comision fija del 10%.
5. Crea preferencia de Mercado Pago con `marketplace_fee`.
6. Webhook firmado confirma pago consultando la API de Mercado Pago.
7. RPC `confirm_paid_order` marca orden `paid` y producto `sold`.

## Reputacion

Formula inicial:

```txt
ventas completadas * 12 + likes recibidos * 0.2 + productos aprobados * 4
```

Triggers recalculan reputacion al cambiar likes, productos u ordenes.

## Cloudflare

No se incluye por defecto. Vercel y Supabase ya cubren CDN, TLS, cache e
infraestructura basica. Cloudflare aportaria valor en una fase posterior para
WAF, Turnstile, rate limiting avanzado, proteccion de webhooks o reglas de
acceso por pais/IP.
