create table if not exists public.health_records (
  id text primary key,
  fullname text not null,
  idcard text not null,
  date date not null,
  weight numeric not null,
  height numeric not null,
  bmi numeric not null,
  bp text not null,
  sugar numeric not null,
  note text default '',
  created_at timestamptz default now()
);

create index if not exists health_records_idcard_idx on public.health_records (idcard);
create index if not exists health_records_fullname_idx on public.health_records (fullname);
create index if not exists health_records_date_idx on public.health_records (date);
