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

create table if not exists public.app_users (
  username text primary key,
  password text not null,
  role text not null check (role in ('admin', 'nurse', 'employee')),
  role_label text not null,
  fullname text not null,
  idcard text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists app_users_role_idx on public.app_users (role);

insert into public.app_users (username, password, role, role_label, fullname, idcard)
values
  ('admin', '1234', 'admin', 'แอดมิน', 'ผู้ดูแลระบบ', ''),
  ('nurse', '1234', 'nurse', 'พยาบาล', 'พยาบาลสมหญิง ใจดี', ''),
  ('employee', '1234', 'employee', 'พนักงาน', 'นายสมชาย รักสุข', '1-2345-67890-12-3')
on conflict (username) do nothing;
