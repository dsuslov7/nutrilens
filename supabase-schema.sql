-- Виконай цей SQL в Supabase → SQL Editor

-- Таблиця для даних кожного юзера
create table if not exists user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  meals jsonb default '{}'::jsonb,
  goals jsonb default '{"p":0,"f":0,"c":0,"k":0}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Кожен юзер бачить тільки свої дані (Row Level Security)
alter table user_data enable row level security;

create policy "Users can read own data"
  on user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on user_data for update
  using (auth.uid() = user_id);

-- Автооновлення updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_data_updated_at
  before update on user_data
  for each row execute function update_updated_at();
