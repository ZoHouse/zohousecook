-- Run manually in Supabase SQL editor

create table if not exists iot_cameras (
  id            uuid primary key default gen_random_uuid(),
  operator_code text not null,
  name          text not null,
  location      text,
  floor         text,
  type          text default 'indoor' check (type in ('indoor', 'outdoor', 'entrance')),
  provider      text not null check (provider in ('ezviz', 'tapo')),
  stream_url    text not null,
  relay_url     text,
  go2rtc_name   text,
  status        text default 'offline' check (status in ('online', 'offline')),
  is_featured   boolean default false,
  last_seen_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create or replace view iot_cameras_public as
  select id, operator_code, name, location, floor, type, provider,
         relay_url, go2rtc_name, status, is_featured, last_seen_at, created_at, updated_at
  from iot_cameras;

alter table iot_cameras enable row level security;

create policy "Authenticated users can read cameras"
  on iot_cameras for select
  to authenticated
  using (true);

create policy "Service role can manage cameras"
  on iot_cameras for all
  to service_role
  using (true)
  with check (true);

insert into iot_cameras (operator_code, name, location, floor, type, provider, stream_url, relay_url, is_featured) values
  ('BNGHO812', 'Main Entrance',  '12th Floor', '12', 'entrance', 'ezviz', 'rtsp://placeholder', null, true),
  ('BNGHO812', 'Kitchen',        '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Warp Zone',      '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Living Room',    '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Hallway',        '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Rooftop',        '12th Floor', '12', 'outdoor',  'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Stairway',       '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Parking',        'Ground',     'G',  'outdoor',  'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Balcony',        '12th Floor', '12', 'outdoor',  'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Workspace',      '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Server Room',    '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', null, false),
  ('BNGHO812', 'Back Entrance',  '12th Floor', '12', 'entrance', 'ezviz', 'rtsp://placeholder', null, false);
