-- =============================================================================
-- POI data cleanup pass — applied 2026-05-04
-- =============================================================================
-- Run via: psql "$DB_URL" -f scripts/05-clean-pois.sql
-- All operations are idempotent; safe to re-run.

\timing on
\pset border 2

begin;

-- -----------------------------------------------------------------------------
-- 1. Country: trim whitespace, empty → null, normalize synonyms & typos
-- -----------------------------------------------------------------------------

\echo --- Step 1a: trim whitespace
update pois set country = trim(country) where country <> trim(country);

\echo --- Step 1b: empty string → null
update pois set country = null where country = '';

\echo --- Step 1c: normalize synonyms
update pois set country = case country
  when 'USA'           then 'United States of America'
  when 'Macau'         then 'Macao'
  when 'Korea, South'  then 'South Korea'
  when 'London'        then 'United Kingdom'  -- 30 rows wrong: London is a city
  when 'Infia'         then 'India'           -- typo
  else country
end
where country in ('USA', 'Macau', 'Korea, South', 'London', 'Infia');

-- -----------------------------------------------------------------------------
-- 2. FSQ country backfill from destination (uses Airtable destination→country map)
-- -----------------------------------------------------------------------------

\echo --- Step 2: backfill FSQ country from Airtable destination map
-- Build the map: each destination → most common non-null country among Airtable rows.
with dest_country as (
  select destination, country, count(*) as n,
         row_number() over (partition by destination order by count(*) desc) as rk
  from pois
  where source = 'airtable' and country is not null and destination is not null
  group by destination, country
),
canonical_dest_country as (
  select destination, country from dest_country where rk = 1
)
update pois p
set country = cdc.country
from canonical_dest_country cdc
where p.country is null
  and p.destination is not null
  and p.destination = cdc.destination;

-- -----------------------------------------------------------------------------
-- 3. Placeholder names: rewrite to be useful on the map UI
-- -----------------------------------------------------------------------------

\echo --- Step 3: rewrite placeholder/empty names
update pois set name = coalesce(
  case
    when destination is not null then 'A spot in ' || destination
    when country     is not null then 'A spot in ' || country
    else 'Untitled spot'
  end,
  'Untitled spot'
)
where name in ('', '(unnamed)', '?', 'N/A');

-- -----------------------------------------------------------------------------
-- 4. Touch updated_at for the cleanup audit trail
-- -----------------------------------------------------------------------------
update pois set updated_at = now()
where country is not null
  and updated_at < now() - interval '1 minute';

commit;

-- =============================================================================
-- VERIFY
-- =============================================================================

\echo
\echo === Country distribution after cleanup (top 30) ===
select country, count(*) as n from pois group by country order by n desc nulls last limit 30;

\echo
\echo === Distinct country count ===
select count(distinct country) as distinct_countries,
       count(*) filter (where country is null) as still_null
from pois;

\echo
\echo === Placeholder names remaining ===
select count(*) as still_unnamed from pois where name in ('', '(unnamed)', '?', 'N/A');

\echo
\echo === Sample of rewritten names ===
select name, destination, country from pois where name like 'A spot in %' limit 5;
