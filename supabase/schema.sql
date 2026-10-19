-- סולם · טבלת פניות מהאתר
-- להריץ פעם אחת: Supabase > SQL Editor > New query > להדביק > Run

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  org         text,
  phone       text not null,
  msg         text,
  source      text not null default 'website',
  status      text not null default 'new' check (status in ('new','contacted','meeting','won','lost')),
  notes       text,
  updated_at  timestamptz not null default now()
);

-- מי מורשה להיכנס לדשבורד
create table if not exists public.admins (
  email text primary key
);

alter table public.leads  enable row level security;
alter table public.admins enable row level security;

-- רק מנהלים רשומים קוראים ומעדכנים פניות. האתר שומר פניות דרך השרת (service role), לכן אין הרשאת הוספה לציבור.
drop policy if exists "admins read leads"   on public.leads;
drop policy if exists "admins update leads" on public.leads;
drop policy if exists "admins delete leads" on public.leads;
create policy "admins read leads"   on public.leads for select to authenticated using ((auth.jwt() ->> 'email') in (select email from public.admins));
create policy "admins update leads" on public.leads for update to authenticated using ((auth.jwt() ->> 'email') in (select email from public.admins)) with check (true);
create policy "admins delete leads" on public.leads for delete to authenticated using ((auth.jwt() ->> 'email') in (select email from public.admins));

drop policy if exists "admins see admins" on public.admins;
create policy "admins see admins" on public.admins for select to authenticated using ((auth.jwt() ->> 'email') in (select email from public.admins));

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();

-- עדכון חי בדשבורד כשנכנסת פנייה חדשה
do $$ begin
  alter publication supabase_realtime add table public.leads;
exception when duplicate_object then null; end $$;

-- להוסיף את המייל שלך (ושל השותפים) כמנהלים:
insert into public.admins (email) values ('noamattia1001@gmail.com') on conflict do nothing;
