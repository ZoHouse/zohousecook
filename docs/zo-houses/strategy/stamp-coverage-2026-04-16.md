# Zo Destination Stamp Coverage — 2026-04-16

**Source:** `cdn.zostel.com/destination/<slug>/stamp/colored/<Name>.svg`
**Universe:** 151 active destinations (`status=1`) in `zoworld_destination` on zo-nsfp RDS
**Hit rate:** 36 / 151 = **24%**

Sweep methodology: lowercase-hyphen slug + title-cased hyphenated filename, HEAD request to CDN. 200 = stamp art exists, 403 = bucket key missing (text fallback renders in `DestinationStamp.tsx`).

## Hit (36) — real stamp art exists

Bangalore · Barot · Bir · Chitkul · Coorg · Dalhousie · Delhi · Gangtok · Goa · Gokarna · Jaipur · Jaisalmer · Jodhpur · Kathmandu · Kochi · Kodaikanal · Kullu · Leh · Manali · Mukteshwar · Mumbai · Munnar · Mussoorie · Mysore · Ooty · Panchgani · Pokhara · Pushkar · Rishikesh · Shimla · Spiti · Tirthan · Udaipur · Vagamon · Varkala · Wayanad

## Miss (115) — needs stamp art (ordered by priority)

### Critical — live user-hit destinations
These are popular Zostel destinations that frequent Zo citizens stay at; stamps render as text fallback today.

Bengaluru · Dharamshala · Kasol · Mcleodganj · Pune · Lonavala · Nainital · Srinagar · Shillong · Hyderabad · Aurangabad · Jibhi · Kalimpong · Old Manali · Ernakulam · Visakhapatnam (Vizag) · Pahalgam · Tabo

### Indian long-tail (low-traffic destinations, lower urgency)

Banikhet · Bhor · Bundi · Burwa · Chamba · Chamera · Cheog · Dharamkot · Dobhi · Fagu · Harabhag · Jim Corbett · Joginder Nagar · Kareri · Kasar Devi · Kibber · Kolad · Kotkhai · Lahaul · Laida · Mandi · Mashobra · Mohanchatti · Naggar · Narkanda · New-Delhi · North India · Pangan · Pedong · Pulga · Rakchham · Ramgarh · Rashil · Rinchenpong · Sainj · Sangla · Shangarh · Shoja · Sissu · Theog · Vashisht

### International — zero coverage today

Amsterdam · Auckland · Bali · Bangkok · Barcelona · Berlin · Bitcoin City · Bogota · Buenos Aires · Cairo · Cape Town · Dubai · Helsinki · Ho Chi Minh · Hong Kong · Istanbul · Italy · Kuala Lumpur · Lagos · Las Vegas · Lisbon · Ljubljana · London · Los Angeles · Madeira · Manila · Melbourne · Mexico City · Miami · Montreal · Moscow · New York · Paris · Phuket · Pisa · Prague · San Francisco · Santiago de Chile · Sao Paulo · Seattle · Seoul · Shanghai · Singapore · Stockholm · Tallinn · Tel Aviv · Tokyo · Toronto · Vancouver · Warsaw · Zurich

### Garbage / test seeds — should be cleaned up in DB

These entries are marked `status=1` in `zoworld_destination` but are stale test data from early seed scripts. They'll render as text placeholders on anyone unfortunate enough to have one attached.

`ss` · `test` · `testing` · `test new design 1` · `Test final Zud` · `Testing Zud again and again`

Recommend one of:
1. `UPDATE zoworld_destination SET status=0 WHERE name IN (...)` (soft-delete)
2. Apply a name-regex filter at the API layer before passing to `destinationNames`

## Alias map (shipped in `apps/website/src/lib/passport/stampUrl.ts`)

Three canonical-name remaps applied at `stampUrlFor()` before slugifying:

| Received | Remapped to | Why |
|---|---|---|
| `Bengaluru` | `Bangalore` | Samurai's own hometown — Zostel returns "Bengaluru" but stamp art lives at `/bangalore/` |
| `New-Delhi` | `Delhi` | Alternate spelling of the same destination |
| `Old-Manali` | `Manali` | Sub-area, uses Manali stamp |

Additional aliases can be added to `DESTINATION_ALIASES` without touching the component.
