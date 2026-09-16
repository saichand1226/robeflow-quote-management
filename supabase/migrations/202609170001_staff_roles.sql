create type public.staff_role as enum ('Admin','Sales','Accounts','Operations');
create type public.staff_status as enum ('Pending','Approved','Disabled');

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.staff_role not null default 'Sales',
  status public.staff_status not null default 'Pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

alter table public.staff_profiles enable row level security;

create policy "staff can read their profile" on public.staff_profiles
  for select to authenticated using (id = auth.uid());

create policy "admins can read all profiles" on public.staff_profiles
  for select to authenticated using (
    exists(select 1 from public.staff_profiles p where p.id=auth.uid() and p.role='Admin' and p.status='Approved')
  );

create policy "admins can update profiles" on public.staff_profiles
  for update to authenticated using (
    exists(select 1 from public.staff_profiles p where p.id=auth.uid() and p.role='Admin' and p.status='Approved')
  );

create function public.create_staff_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.staff_profiles(id,email,full_name)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_staff_profile();
