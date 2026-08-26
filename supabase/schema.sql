create extension if not exists "pgcrypto";

do $$ begin create type public.user_role as enum ('student','agent','landlord','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.approval_state as enum ('pending','approved','rejected','removed'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'student',
  phone text, whatsapp text,
  disabled boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120), description text not null default '',
  price numeric(12,2) not null check (price > 0), location text not null, university text not null check (university in ('DELSU Abraka','FUPRE')),
  property_type text not null check (property_type in ('Self-contained','Single room','Room and parlour','Shared apartment','Flat','Hostel')),
  bedrooms integer not null default 1 check (bedrooms >= 0), bathrooms integer not null default 1 check (bathrooms >= 0), address_area text,
  amenities text[] not null default '{}', verification_status text not null default 'pending', approval_status public.approval_state not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  url text not null, storage_path text, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.favorites (
  student_id uuid not null references public.profiles(id) on delete cascade, property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (student_id, property_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade, recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000), created_at timestamptz not null default now(), read_at timestamptz
);
create index if not exists properties_search_idx on public.properties (university, location, property_type, price, approval_status);
create index if not exists properties_owner_idx on public.properties (owner_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id,email,full_name,role) values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce((new.raw_user_meta_data->>'role')::public.user_role,'student')); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security; alter table public.properties enable row level security; alter table public.property_images enable row level security; alter table public.favorites enable row level security; alter table public.messages enable row level security;
drop policy if exists "public approved properties" on public.properties; create policy "public approved properties" on public.properties for select using (approval_status = 'approved' or owner_id = auth.uid());
drop policy if exists "public approved images" on public.property_images; create policy "public approved images" on public.property_images for select using (exists (select 1 from properties p where p.id=property_id and (p.approval_status='approved' or p.owner_id=auth.uid())));
create policy "users read own profile" on public.profiles for select using (id=auth.uid()); create policy "users update own profile" on public.profiles for update using (id=auth.uid());
create policy "owners manage properties" on public.properties for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "students manage favorites" on public.favorites for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy "participants manage messages" on public.messages for all using (sender_id=auth.uid() or recipient_id=auth.uid()) with check (sender_id=auth.uid());

insert into storage.buckets (id,name,public) values ('property-images','property-images',true) on conflict (id) do nothing;
create policy "public property image reads" on storage.objects for select using (bucket_id='property-images');
create policy "authenticated property image uploads" on storage.objects for insert to authenticated with check (bucket_id='property-images');
