create extension if not exists pgcrypto;
create extension if not exists unaccent;

do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_status as enum (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'sold',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',
    'payment_created',
    'paid',
    'cancelled',
    'failed',
    'refunded'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  gender text,
  age int check (age is null or age between 13 and 120),
  role public.user_role not null default 'user',
  onboarding_completed boolean not null default false,
  reputation_score numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_required_when_onboarded
    check (onboarding_completed = false or nullif(trim(display_name), '') is not null)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 20 and 4000),
  year int check (year is null or year between 1000 and extract(year from now())::int),
  estimated_age text,
  price numeric(12,2) not null check (price > 0),
  currency text not null default 'ARS',
  status public.product_status not null default 'draft',
  rejection_reason text,
  category text,
  condition text,
  dimensions text,
  material text,
  location text,
  origin_story text,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  product_id uuid not null references public.products(id),
  amount numeric(12,2) not null check (amount > 0),
  commission_rate numeric(5,4) not null default 0.10,
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  seller_net_amount numeric(12,2) not null check (seller_net_amount >= 0),
  payment_provider text not null default 'mercadopago',
  preference_id text,
  payment_id text,
  payment_status_detail text,
  idempotency_key uuid not null unique,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_user_id text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, provider)
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action_type text not null,
  target_type text not null,
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_status_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  old_status public.product_status,
  new_status public.product_status not null,
  actor_id uuid references public.profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  payload jsonb not null,
  status text not null default 'received',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists products_status_approved_at_idx on public.products(status, approved_at desc);
create index if not exists products_seller_status_idx on public.products(seller_id, status);
create index if not exists products_price_idx on public.products(price);
create index if not exists products_year_idx on public.products(year);
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index if not exists likes_product_idx on public.likes(product_id);
create index if not exists orders_buyer_idx on public.orders(buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders(seller_id, created_at desc);
create unique index if not exists one_paid_order_per_product
  on public.orders(product_id)
  where status = 'paid';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

create trigger seller_payment_accounts_touch_updated_at
before update on public.seller_payment_accounts
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
    and coalesce(auth.jwt()->>'role', '') <> 'service_role'
  then
    new.role = old.role;
    new.reputation_score = old.reputation_score;
    new.user_id = old.user_id;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

create or replace function public.bootstrap_admin_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_profile_id uuid;
begin
  update public.profiles p
  set role = 'admin'
  from auth.users u
  where p.user_id = u.id
    and lower(u.email) = lower(p_email)
  returning p.id into target_profile_id;

  if target_profile_id is null then
    raise exception 'No profile found for email %', p_email;
  end if;

  return target_profile_id;
end;
$$;

create or replace function public.require_two_images_for_review()
returns trigger
language plpgsql
as $$
declare
  image_count int;
begin
  if new.status = 'pending_review' and old.status is distinct from 'pending_review' then
    select count(*) into image_count
    from public.product_images
    where product_id = new.id;

    if image_count < 2 then
      raise exception 'A product needs at least 2 images before review';
    end if;
  end if;
  return new;
end;
$$;

create trigger products_require_two_images_for_review
before update of status on public.products
for each row execute function public.require_two_images_for_review();

create or replace function public.log_product_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.product_status_history (
      product_id,
      old_status,
      new_status,
      actor_id,
      reason
    )
    values (
      new.id,
      old.status,
      new.status,
      public.current_profile_id(),
      new.rejection_reason
    );
  end if;
  return new;
end;
$$;

create trigger products_log_status_change
after update of status on public.products
for each row execute function public.log_product_status_change();

create or replace function public.recalculate_reputation(p_seller_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_sales int;
  received_likes int;
  approved_products int;
  score numeric;
begin
  select count(*) into completed_sales
  from public.orders
  where seller_id = p_seller_id and status = 'paid';

  select count(*) into received_likes
  from public.likes l
  join public.products p on p.id = l.product_id
  where p.seller_id = p_seller_id;

  select count(*) into approved_products
  from public.products
  where seller_id = p_seller_id and status in ('approved', 'sold');

  score := (completed_sales * 12) + (received_likes * 0.2) + (approved_products * 4);

  update public.profiles
  set reputation_score = score
  where id = p_seller_id;

  return score;
end;
$$;

create or replace function public.recalculate_reputation_from_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seller uuid;
begin
  if tg_table_name = 'likes' then
    select seller_id into seller from public.products where id = coalesce(new.product_id, old.product_id);
  elsif tg_table_name = 'orders' then
    seller := coalesce(new.seller_id, old.seller_id);
  else
    seller := coalesce(new.seller_id, old.seller_id);
  end if;

  perform public.recalculate_reputation(seller);
  return coalesce(new, old);
end;
$$;

create trigger likes_recalculate_reputation
after insert or delete on public.likes
for each row execute function public.recalculate_reputation_from_product();

create trigger products_recalculate_reputation
after insert or update of status on public.products
for each row execute function public.recalculate_reputation_from_product();

create trigger orders_recalculate_reputation
after insert or update of status on public.orders
for each row execute function public.recalculate_reputation_from_product();

create or replace function public.confirm_paid_order(
  p_order_id uuid,
  p_payment_id text,
  p_status_detail text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_order public.orders%rowtype;
begin
  update public.orders
  set
    status = 'paid',
    payment_id = p_payment_id,
    payment_status_detail = p_status_detail,
    updated_at = now()
  where id = p_order_id
    and status <> 'paid'
  returning * into paid_order;

  if not found then
    return;
  end if;

  update public.products
  set status = 'sold', sold_at = now(), updated_at = now()
  where id = paid_order.product_id
    and status = 'approved';

  perform public.recalculate_reputation(paid_order.seller_id);
end;
$$;

create or replace view public.product_cards as
select
  p.id,
  p.seller_id,
  p.title,
  p.description,
  p.year,
  p.price,
  p.currency,
  p.status,
  p.category,
  p.condition,
  p.location,
  p.approved_at,
  p.created_at,
  (
    select pi.image_url
    from public.product_images pi
    where pi.product_id = p.id
    order by pi.sort_order asc
    limit 1
  ) as image_url,
  (
    select count(*)::int
    from public.likes l
    where l.product_id = p.id
  ) as likes_count,
  pr.display_name as seller_name,
  pr.avatar_url as seller_avatar_url,
  pr.reputation_score as seller_reputation_score,
  to_tsvector(
    'spanish',
    unaccent(coalesce(p.title, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.category, ''))
  ) as search_document
from public.products p
join public.profiles pr on pr.id = p.seller_id
where p.status = 'approved';

create or replace view public.seller_public_profiles as
select
  pr.id,
  pr.user_id,
  pr.display_name,
  pr.avatar_url,
  null::text as gender,
  null::int as age,
  pr.role,
  pr.onboarding_completed,
  pr.reputation_score,
  pr.created_at,
  pr.updated_at,
  (
    select count(*)::int from public.products p
    where p.seller_id = pr.id and p.status in ('approved', 'sold')
  ) as approved_products_count,
  (
    select count(*)::int from public.products p
    where p.seller_id = pr.id and p.status = 'sold'
  ) as sold_products_count,
  (
    select count(*)::int
    from public.likes l
    join public.products p on p.id = l.product_id
    where p.seller_id = pr.id
  ) as likes_received_count
from public.profiles pr
where pr.onboarding_completed = true;

create or replace view public.seller_payment_account_status as
select
  id,
  seller_id,
  provider,
  provider_user_id,
  status,
  created_at,
  updated_at
from public.seller_payment_accounts
where seller_id = public.current_profile_id() or public.is_admin();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.likes enable row level security;
alter table public.orders enable row level security;
alter table public.seller_payment_accounts enable row level security;
alter table public.admin_actions enable row level security;
alter table public.product_status_history enable row level security;
alter table public.webhook_events enable row level security;

create policy profiles_select_self_admin on public.profiles
for select using (user_id = auth.uid() or public.is_admin());

create policy profiles_insert_self on public.profiles
for insert with check (user_id = auth.uid());

create policy profiles_update_self on public.profiles
for update using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy products_select_public_owner_admin on public.products
for select using (
  status = 'approved'
  or seller_id = public.current_profile_id()
  or public.is_admin()
);

create policy products_insert_owner on public.products
for insert with check (
  seller_id = public.current_profile_id()
  and exists (
    select 1 from public.profiles
    where id = seller_id and onboarding_completed = true
  )
);

create policy products_update_owner_draft on public.products
for update using (
  seller_id = public.current_profile_id()
  and status in ('draft', 'rejected')
)
with check (
  seller_id = public.current_profile_id()
  and status in ('draft', 'pending_review')
);

create policy products_admin_all on public.products
for all using (public.is_admin())
with check (public.is_admin());

create policy product_images_select_visible on public.product_images
for select using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (p.status = 'approved' or p.seller_id = public.current_profile_id() or public.is_admin())
  )
);

create policy product_images_insert_owner on public.product_images
for insert with check (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and p.seller_id = public.current_profile_id()
      and p.status in ('draft', 'rejected')
  )
);

create policy product_images_update_owner_admin on public.product_images
for update using (
  public.is_admin()
  or exists (
    select 1 from public.products p
    where p.id = product_id
      and p.seller_id = public.current_profile_id()
      and p.status in ('draft', 'rejected')
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.products p
    where p.id = product_id
      and p.seller_id = public.current_profile_id()
      and p.status in ('draft', 'rejected')
  )
);

create policy likes_select_public on public.likes
for select using (true);

create policy likes_insert_own on public.likes
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'approved'
  )
);

create policy likes_delete_own on public.likes
for delete using (user_id = auth.uid());

create policy orders_select_participants_admin on public.orders
for select using (
  buyer_id = public.current_profile_id()
  or seller_id = public.current_profile_id()
  or public.is_admin()
);

create policy seller_payment_accounts_admin_all on public.seller_payment_accounts
for all using (public.is_admin())
with check (public.is_admin());

create policy admin_actions_admin_all on public.admin_actions
for all using (public.is_admin())
with check (public.is_admin());

create policy product_status_history_admin_select on public.product_status_history
for select using (
  public.is_admin()
  or exists (
    select 1 from public.products p
    where p.id = product_id and p.seller_id = public.current_profile_id()
  )
);

create policy webhook_events_admin_select on public.webhook_events
for select using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('product-images-private', 'product-images-private', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('product-images-public', 'product-images-public', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_public_read on storage.objects
for select using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_update_own on storage.objects
for update using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy product_images_private_insert_own on storage.objects
for insert with check (
  bucket_id = 'product-images-private'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy product_images_private_select_owner_admin on storage.objects
for select using (
  bucket_id = 'product-images-private'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy product_images_private_delete_owner_admin on storage.objects
for delete using (
  bucket_id = 'product-images-private'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy product_images_public_read on storage.objects
for select using (bucket_id = 'product-images-public');

create policy product_images_public_admin_write on storage.objects
for all using (
  bucket_id = 'product-images-public' and public.is_admin()
) with check (
  bucket_id = 'product-images-public' and public.is_admin()
);
