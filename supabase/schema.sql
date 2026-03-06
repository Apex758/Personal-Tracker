create extension if not exists pgcrypto;

create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  date date,
  financial_nature text,
  account_type text,
  category text,
  payment_method text,
  project text,
  amount numeric default 0,
  month text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists lifestyle_entries (
  id uuid primary key default gen_random_uuid(),
  date date,
  prayers_praises numeric default 0,
  gym numeric default 0,
  smoking numeric default 0,
  drinking numeric default 0,
  skincare numeric default 0,
  haircare numeric default 0,
  hand_feet_care numeric default 0,
  journal numeric default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists skill_entries (
  id uuid primary key default gen_random_uuid(),
  date date,
  skill_area text,
  specific_skill text,
  goal_outcome text,
  current_level numeric default 0,
  target_level numeric default 0,
  hours_invested numeric default 0,
  learning_resource text,
  status text,
  next_review_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists work_entries (
  id uuid primary key default gen_random_uuid(),
  date date,
  area text,
  project_client text,
  task_deliverable text,
  priority text,
  status text,
  hours numeric default 0,
  expected_income numeric default 0,
  actual_income numeric default 0,
  expense numeric default 0,
  due_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists travel_entries (
  id uuid primary key default gen_random_uuid(),
  trip_name text,
  destination text,
  purpose text,
  start_date date,
  end_date date,
  budget numeric default 0,
  estimated_cost numeric default 0,
  actual_cost numeric default 0,
  status text,
  booking_reference text,
  people numeric default 1,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists wishlist_entries (
  id uuid primary key default gen_random_uuid(),
  item text,
  category text,
  priority text,
  need_or_want text,
  target_budget numeric default 0,
  expected_price numeric default 0,
  actual_price numeric default 0,
  purchase_status text,
  shop_source text,
  target_date date,
  bought_date date,
  notes text,
  created_at timestamptz not null default now()
);
