-- Run manually in Supabase SQL editor

create table if not exists iot_devices (
  id            uuid primary key default gen_random_uuid(),
  operator_code text not null,
  category      text not null check (category in ('camera', 'screen', 'light', 'lock', 'wifi', 'power')),
  name          text not null,
  location      text,
  floor         text,
  type          text,                     -- camera: indoor/outdoor/entrance, light: strip/bulb, screen: signage/menu_board
  provider      text,                     -- ezviz, tapo, wled, pisignage, cas
  status        text default 'offline' check (status in ('online', 'offline')),
  is_featured   boolean default false,
  last_seen_at  timestamptz,

  -- camera-specific
  stream_url    text,                     -- rtsp://... (never sent to frontend)
  relay_url     text,                     -- go2rtc base URL
  go2rtc_name   text,                     -- stream name in go2rtc.yaml

  -- light-specific
  ip_address    text,                     -- WLED HTTP API address
  current_preset text,                    -- social, focus, party, etc.
  brightness    int,                      -- 0-255

  -- screen-specific
  content_url   text,                     -- what's currently playing
  resolution    text,                     -- 1920x1080, etc.

  -- lock-specific
  device_ref_id text,                     -- CAS device reference
  lock_state    text check (lock_state in ('locked', 'unlocked', null)),

  -- meta
  config        jsonb default '{}',       -- catch-all for device-specific config
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Public view: hides stream_url (RTSP credentials) and ip_address (internal network)
create or replace view iot_devices_public as
  select id, operator_code, category, name, location, floor, type, provider,
         status, is_featured, last_seen_at,
         relay_url, go2rtc_name,
         current_preset, brightness,
         content_url, resolution,
         device_ref_id, lock_state,
         config, created_at, updated_at
  from iot_devices;

-- RLS
alter table iot_devices enable row level security;

create policy "Authenticated users can read devices"
  on iot_devices for select
  to authenticated
  using (true);

create policy "Service role can manage devices"
  on iot_devices for all
  to service_role
  using (true)
  with check (true);

-- Indexes
create index idx_iot_devices_operator on iot_devices(operator_code);
create index idx_iot_devices_category on iot_devices(operator_code, category);

-- Seed: BLRxZo cameras
insert into iot_devices (operator_code, category, name, location, floor, type, provider, stream_url, is_featured) values
  ('BNGHO812', 'camera', 'Main Entrance',  '12th Floor', '12', 'entrance', 'ezviz', 'rtsp://placeholder', true),
  ('BNGHO812', 'camera', 'Kitchen',        '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Warp Zone',      '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Living Room',    '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Hallway',        '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Rooftop',        '12th Floor', '12', 'outdoor',  'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Stairway',       '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Parking',        'Ground',     'G',  'outdoor',  'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Balcony',        '12th Floor', '12', 'outdoor',  'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Workspace',      '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Server Room',    '12th Floor', '12', 'indoor',   'ezviz', 'rtsp://placeholder', false),
  ('BNGHO812', 'camera', 'Back Entrance',  '12th Floor', '12', 'entrance', 'ezviz', 'rtsp://placeholder', false);

-- Seed: BLRxZo WLED lights
insert into iot_devices (operator_code, category, name, location, floor, type, provider) values
  ('BNGHO812', 'light', 'Living Room Strip',  '12th Floor', '12', 'strip', 'wled'),
  ('BNGHO812', 'light', 'Kitchen Strip',      '12th Floor', '12', 'strip', 'wled'),
  ('BNGHO812', 'light', 'Hallway Strip',      '12th Floor', '12', 'strip', 'wled'),
  ('BNGHO812', 'light', 'Entrance Strip',     '12th Floor', '12', 'strip', 'wled'),
  ('BNGHO812', 'light', 'Balcony Strip',      '12th Floor', '12', 'strip', 'wled'),
  ('BNGHO812', 'light', 'Workspace Strip',    '12th Floor', '12', 'strip', 'wled');

-- Seed: BLRxZo PiSignage screens
insert into iot_devices (operator_code, category, name, location, floor, type, provider, resolution) values
  ('BNGHO812', 'screen', 'Entrance Display',  '12th Floor', '12', 'welcome',    'pisignage', '1920x1080'),
  ('BNGHO812', 'screen', 'Kitchen Menu',      '12th Floor', '12', 'menu_board', 'pisignage', '1920x1080'),
  ('BNGHO812', 'screen', 'Living Room',       '12th Floor', '12', 'signage',    'pisignage', '1920x1080'),
  ('BNGHO812', 'screen', 'Hallway',           '12th Floor', '12', 'signage',    'pisignage', '1920x1080'),
  ('BNGHO812', 'screen', 'Workspace',         '12th Floor', '12', 'signage',    'pisignage', '1920x1080'),
  ('BNGHO812', 'screen', 'Cafe Area',         '12th Floor', '12', 'menu_board', 'pisignage', '1920x1080'),
  ('BNGHO812', 'screen', 'Stairway',          '12th Floor', '12', 'signage',    'pisignage', '1920x1080'),
  ('BNGHO812', 'screen', 'Rooftop',           '12th Floor', '12', 'signage',    'pisignage', '1920x1080');

-- Seed: BLRxZo WiFi access points
insert into iot_devices (operator_code, category, name, location, floor, type, provider) values
  ('BNGHO812', 'wifi', 'Main Router',     '12th Floor', '12', 'router',          null),
  ('BNGHO812', 'wifi', 'Mesh Node 1',     '12th Floor', '12', 'mesh_node',       null),
  ('BNGHO812', 'wifi', 'Mesh Node 2',     '12th Floor', '12', 'mesh_node',       null);

-- Seed: BLRxZo Power (UPS, smart plugs, etc.)
insert into iot_devices (operator_code, category, name, location, floor, type, provider) values
  ('BNGHO812', 'power', 'Main UPS',       '12th Floor', '12', 'ups',             null),
  ('BNGHO812', 'power', 'Server UPS',     '12th Floor', '12', 'ups',             null);

-- Note: Update names/locations/counts after Darshan audits actual hardware on-site
