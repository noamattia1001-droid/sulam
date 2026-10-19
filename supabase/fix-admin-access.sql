-- תיקון: הדשבורד לא הציג פניות (הרשאה רקורסיבית על טבלת admins)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read leads"   on public.leads;
drop policy if exists "admins update leads" on public.leads;
drop policy if exists "admins delete leads" on public.leads;
drop policy if exists "admins see admins"   on public.admins;
create policy "admins read leads"   on public.leads  for select to authenticated using (public.is_admin());
create policy "admins update leads" on public.leads  for update to authenticated using (public.is_admin()) with check (true);
create policy "admins delete leads" on public.leads  for delete to authenticated using (public.is_admin());
create policy "admins see admins"   on public.admins for select to authenticated using (public.is_admin());

-- מחיקת פניית הבדיקה של Claude
delete from public.leads where phone = '050-0000000';

-- בדיקה: אמור להחזיר את המייל שלך
select email from public.admins;
