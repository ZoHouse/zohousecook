-- Zomaps: cultures + pois tables for the /@handle map feature.
-- Source-of-truth for cultures lives in CAS (api.io.zo.xyz/api/v1/cas/cultures/);
-- this table is a denormalized copy keyed by the same UUIDs to preserve referential
-- integrity if/when the systems converge.

create extension if not exists postgis;

-- ============================================================================
-- cultures (28 canonical Zo cultures, mirrored from CAS as of 2026-05-04)
-- ============================================================================
create table cultures (
  id          uuid primary key,
  key         text unique not null,
  name        text not null,
  icon        text,
  created_at  timestamptz default now()
);

insert into cultures (id, key, name, icon) values
  ('1ba8c831-8eda-4539-9ea2-0c605098d96b', '64xzo',                '64xZo',                'https://proxy.cdn.zo.xyz/profile/culture/64xzo.png'),
  ('52919d49-9235-46d5-a37f-cacce9858cfd', 'bip666',               'BIP666',               'https://proxy.cdn.zo.xyz/profile/culture/bip666.jpeg'),
  ('796a2c60-cdd7-4444-bae4-b2f878c8b4a8', 'business',             'Business',             'https://proxy.cdn.zo.xyz/profile/culture/business.png'),
  ('1647cde3-d0a7-4c74-a9eb-19622e5ba838', 'catanxzo',             'CatanxZo',             'https://proxy.cdn.zo.xyz/profile/culture/catanxzo.png'),
  ('af8c4f4a-b57b-474c-ba50-6e27d6f80e78', 'design',               'Design',               'https://proxy.cdn.zo.xyz/profile/culture/design.png'),
  ('151c5aed-66c0-49a2-8335-af5ca3463bd5', 'duh',                  'duh',                  'https://proxy.cdn.zo.xyz/profile/culture/duh.png'),
  ('b0ab26ca-cad9-4999-aa61-120eef1d4cf2', 'fifa',                 'FIFA',                 'https://proxy.cdn.zo.xyz/profile/culture/fifa.png'),
  ('ac633112-7dac-4202-9b99-c6029bbcd4c0', 'follow-your-heart',    'Follow Your Heart',    'https://proxy.cdn.zo.xyz/profile/culture/follow-your-heart.png'),
  ('bd0892ef-2ab9-4bf1-876b-0d98e6dadd86', 'food',                 'Food',                 'https://proxy.cdn.zo.xyz/profile/culture/food.png'),
  ('ed16f511-5426-4543-b15e-5035b09d0290', 'fortnite',             'Fortnite',             'https://proxy.cdn.zo.xyz/profile/culture/fortnite.png'),
  ('c8e286e1-04b4-4938-802f-2fd8269d2cb9', 'games',                'Games',                'https://proxy.cdn.zo.xyz/profile/culture/games.png'),
  ('c4721521-b43f-4b22-b8e8-d77b9de3e464', 'health-fitness',       'Health & Fitness',     'https://proxy.cdn.zo.xyz/profile/culture/health-fitness.png'),
  ('5cba1a7e-aa57-4406-b263-6ccb3f7b9095', 'heritage',             'Heritage',             'https://proxy.cdn.zo.xyz/profile/culture/heritage.png'),
  ('9911ee72-13d4-44aa-a793-ee2adab268d4', 'home-lifestyle',       'Home & Lifestyle',     'https://proxy.cdn.zo.xyz/profile/culture/home-lifestyle.png'),
  ('6fcb5fdf-ae04-4dd8-a1a8-095d06a47bc7', 'law-order',            'Law & Order',          'https://proxy.cdn.zo.xyz/profile/culture/law-order.png'),
  ('30266ab8-4c7a-46cb-960e-830a4d4d0117', 'literature',           'Literature',           'https://proxy.cdn.zo.xyz/profile/culture/literature.png'),
  ('8a25e645-82c0-42ca-b983-5e6df6058206', 'music-entertainment',  'Music & Entertainment','https://proxy.cdn.zo.xyz/profile/culture/music-entertainment.png'),
  ('fd91888a-11d0-4738-9579-7840c9d12c92', 'nature-wildlife',      'Nature & Wildlife',    'https://proxy.cdn.zo.xyz/profile/culture/nature-wildlife.png'),
  ('ad28f34c-afdf-4a5f-99ff-1e750f5e6e03', 'open-calls',           'Open Calls',           'https://proxy.cdn.zo.xyz/profile/culture/open-calls.png'),
  ('cdfcd59d-e6dd-44c3-8246-1ac8d03fe9d7', 'photography',          'Photography',          'https://proxy.cdn.zo.xyz/profile/culture/photography.png'),
  ('2543f196-7cbb-401d-aa78-6b58832e4c04', 'pickleballxzo',        'PickleballxZo',        'https://proxy.cdn.zo.xyz/profile/culture/pickleballxzo.png'),
  ('50ca3199-e8c6-4e43-b252-145e1aa16d3a', 'pokerxzo',             'PokerxZo',             'https://proxy.cdn.zo.xyz/profile/culture/pokerxzo.png'),
  ('3109c681-635e-48da-938a-d29ee3046889', 'science-technology',   'Science & Technology', 'https://proxy.cdn.zo.xyz/profile/culture/science-technology.png'),
  ('15e34324-8fe8-4eeb-bfad-e3d5bacc6a66', 'spirituality',         'Spirituality',         'https://proxy.cdn.zo.xyz/profile/culture/spirituality.png'),
  ('3e5f24cb-4023-43ed-a4e6-c8b4e7301d5b', 'sports',               'Sports',               'https://proxy.cdn.zo.xyz/profile/culture/sports.png'),
  ('12fd472f-c13f-4c46-a34e-77396582c95d', 'studio',               'Studio',               'https://proxy.cdn.zo.xyz/profile/culture/studio.png'),
  ('ce37ab7a-6214-4ca8-a46a-072e583726b2', 'tv-cinema',            'Television & Cinema',  'https://proxy.cdn.zo.xyz/profile/culture/tv-cinema.png'),
  ('e8ccc66b-280e-4c1d-bc10-82dc5aa4f674', 'travel-adventure',     'Travel & Adventure',   'https://proxy.cdn.zo.xyz/profile/culture/travel-adventure.png');

-- ============================================================================
-- pois (Airtable Quests + Foursquare POIs, normalised to a single row per place)
-- ============================================================================
create table pois (
  id              uuid primary key default gen_random_uuid(),

  -- provenance (forensics + dedup; not user-facing)
  source          text not null check (source in ('airtable', 'foursquare')),
  source_ref      text,                          -- airtable rec_id or fsq_place_id

  -- core identity
  name            text not null,
  description     text,
  location        geography(point, 4326) not null,

  -- geographic context
  destination     text,
  country         text,
  state           text,

  -- single resolved culture (drives marker color + sticker)
  culture_id      uuid not null references cultures(id),
  culture_key     text not null,                  -- denormalised for client speed
  fsq_category    text,                           -- preserved if from FSQ

  -- media
  pictures        text[] default '{}',            -- CDN URLs only (not Airtable signed URLs)
  hero_picture    text,                           -- first picture, or null → fall back to culture sticker

  -- airtable-only enrichment (nullable for FSQ rows)
  quest_master            text,
  nearest_airport         text,
  airport_distance_km     numeric,
  nearest_railway         text,
  railway_distance_km     numeric,
  nearest_bus             text,
  bus_distance_km         numeric,
  money_required          text,

  is_event        boolean default false,
  event_start     timestamptz,
  event_end       timestamptz,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index pois_location_gix    on pois using gist (location);
create index pois_culture_key_idx on pois (culture_key);
create index pois_destination_idx on pois (destination);
create index pois_source_idx      on pois (source);
create index pois_is_event_idx    on pois (is_event) where is_event = true;
