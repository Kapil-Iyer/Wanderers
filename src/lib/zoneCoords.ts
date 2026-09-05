/**
 * Campus zone → coordinate lookup.
 *
 * Lives outside MapOverlay so that callers which only need to know whether a
 * location is placeable (home page cards deciding whether to show a Map
 * button) don't have to pull in the map bundle.
 */

export type ZoneCoords = { lat: number; lng: number };

export const ZONE_COORDS: Record<string, ZoneCoords> = {
  // ── Academic / indoor ──────────────────────────────────────────────────
  PAC:                        { lat: 43.4738, lng: -80.5468 },
  "PAC Courts":               { lat: 43.4736, lng: -80.5470 },
  "PAC Pool":                 { lat: 43.4740, lng: -80.5465 },
  "PAC Gym":                  { lat: 43.4738, lng: -80.5468 },
  SLC:                        { lat: 43.4718, lng: -80.5442 },
  "SLC Atrium":               { lat: 43.4720, lng: -80.5438 },
  "SLC Game Room":            { lat: 43.4718, lng: -80.5442 },
  "SLC Turnkey Desk":         { lat: 43.4717, lng: -80.5444 },
  "Bomber Bar (SLC)":         { lat: 43.4716, lng: -80.5446 },
  DC:                         { lat: 43.4725, lng: -80.5430 },
  "DC Library 2nd Floor":     { lat: 43.4725, lng: -80.5430 },
  "Dana Porter Library":      { lat: 43.4709, lng: -80.5430 },
  MC:                         { lat: 43.4724, lng: -80.5421 },
  "MC Study Hall":            { lat: 43.4724, lng: -80.5421 },
  EV3:                        { lat: 43.4729, lng: -80.5418 },
  "EV3 Atrium":               { lat: 43.4729, lng: -80.5418 },
  // ── Outdoor campus ────────────────────────────────────────────────────
  "Peter Russell Rock Garden":{ lat: 43.4672, lng: -80.5415 },
  "Columbia Fields":          { lat: 43.4755, lng: -80.5480 },
  "Columbia Lake":            { lat: 43.4700, lng: -80.5558 },
  "REV Quad":                 { lat: 43.4699, lng: -80.5537 },
  "Village 1 Rec Room":       { lat: 43.4700, lng: -80.5492 },
  // ── Off-campus / uptown ───────────────────────────────────────────────
  "Chatime Waterloo":         { lat: 43.4730, lng: -80.5395 },
  "Pizza Nova Uptown":        { lat: 43.4660, lng: -80.5222 },
  "Waterloo Park Entrance":   { lat: 43.4677, lng: -80.5218 },
  "Conestoga Mall":           { lat: 43.4990, lng: -80.5225 },
  "Uptown Waterloo":          { lat: 43.4645, lng: -80.5180 },
  "Laurel Creek":             { lat: 43.4700, lng: -80.5500 },
};

/**
 * Campus events carry a room-level string ("PAC Main Gym", "SLC Great Hall")
 * while the table is keyed by building, so fall back to the leading token.
 */
export function resolveZoneCoords(zone?: string | null): ZoneCoords | null {
  if (!zone) return null;
  const trimmed = zone.trim();
  const exact = ZONE_COORDS[trimmed];
  if (exact) return exact;
  const building = trimmed.split(/[\s,·]+/)[0];
  return ZONE_COORDS[building] ?? null;
}
