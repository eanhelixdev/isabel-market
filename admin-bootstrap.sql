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

-- Cambia este email por el email con el que te registraste.
select public.bootstrap_admin_by_email('TU_EMAIL_DE_LOGIN');
