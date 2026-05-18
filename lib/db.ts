import { createClient } from "@libsql/client";

let _client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!_client) {
    const url = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    if (!url) throw new Error("DATABASE_URL is not set");
    _client = createClient({ url, authToken });
  }
  return _client;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type Priority = "high" | "medium" | "low";
export type AlertMode = "opportunistic" | "committed";
export type TripType = "round_trip" | "one_way";
export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface TrackedDestination {
  id: string;
  originAirportCode: string;
  destinationAirportCode: string;
  destinationCity: string | null;
  destinationCountry: string | null;
  tripType: TripType;
  cabinClass: CabinClass;
  departureDateFrom: string | null;
  departureDateTo: string | null;
  returnDateFrom: string | null;
  returnDateTo: string | null;
  returnMinDays: number | null;
  returnMaxDays: number | null;
  maxStops: number | null;
  currencyCode: string;
  locale: string;
  priority: Priority;
  priceThresholdSgd: number | null;
  typicalPriceSgd: number | null;
  alertMode: AlertMode;
  thresholdPercentage: number | null;
  isActive: boolean;
}

export interface PriceRecord {
  id: string;
  trackedDestinationId: string;
  price: number;
  currency: string;
  scannedAt: string;
  departureDate: string | null;
  returnDate: string | null;
}

export interface RouteWithLatestPrice extends TrackedDestination {
  latestPrice: number | null;
  latestScannedAt: string | null;
  score: number | null;
  /** e.g. "exceptional" | "good" | "average" | "expensive" | null */
  valueLabel: string | null;
}

// ── Score calculation ──────────────────────────────────────────────────────

export function calcScore(
  currentPrice: number | null,
  typicalPrice: number | null
): number | null {
  if (!currentPrice || !typicalPrice) return null;
  return Math.min(Math.max(150 - Math.round((currentPrice / typicalPrice) * 100), 0), 100);
}

export function scoreToLabel(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 90) return "exceptional";
  if (score >= 70) return "good";
  if (score >= 40) return "average";
  return "expensive";
}

// ── DB queries ─────────────────────────────────────────────────────────────

function rowToDestination(row: Record<string, unknown>): TrackedDestination {
  return {
    id: String(row.id),
    originAirportCode: String(row.origin_airport_code ?? row.originAirportCode ?? ""),
    destinationAirportCode: String(row.destination_airport_code ?? row.destinationAirportCode ?? ""),
    destinationCity: row.destination_city != null ? String(row.destination_city) : null,
    destinationCountry: row.destination_country != null ? String(row.destination_country) : null,
    tripType: (row.trip_type ?? row.tripType ?? "round_trip") as TripType,
    cabinClass: (row.cabin_class ?? row.cabinClass ?? "economy") as CabinClass,
    departureDateFrom: row.departure_date_from != null ? String(row.departure_date_from) : null,
    departureDateTo: row.departure_date_to != null ? String(row.departure_date_to) : null,
    returnDateFrom: row.return_date_from != null ? String(row.return_date_from) : null,
    returnDateTo: row.return_date_to != null ? String(row.return_date_to) : null,
    returnMinDays: row.return_min_days != null ? Number(row.return_min_days) : null,
    returnMaxDays: row.return_max_days != null ? Number(row.return_max_days) : null,
    maxStops: row.max_stops != null ? Number(row.max_stops) : null,
    currencyCode: String(row.currency_code ?? row.currencyCode ?? "SGD"),
    locale: String(row.locale ?? "en-US"),
    priority: (row.priority ?? "medium") as Priority,
    priceThresholdSgd: row.price_threshold_sgd != null ? Number(row.price_threshold_sgd) : null,
    typicalPriceSgd: row.typical_price_sgd != null ? Number(row.typical_price_sgd) : null,
    alertMode: (row.alert_mode ?? "opportunistic") as AlertMode,
    thresholdPercentage: row.threshold_percentage != null ? Number(row.threshold_percentage) : null,
    isActive: Boolean(row.is_active),
  };
}

export async function getAllRoutes(): Promise<RouteWithLatestPrice[]> {
  const db = getDb();

  // Get all active destinations
  const destResult = await db.execute(
    "SELECT * FROM tracked_destinations WHERE is_active = 1 ORDER BY priority ASC, destination_airport_code ASC"
  );

  // Get latest price for each destination from fare_observations
  // price_amount_minor is in minor units (e.g. 50000 = SGD 500.00)
  const priceResult = await db.execute(`
    SELECT fo.tracked_destination_id,
           fo.price_amount_minor / 100.0 AS price,
           fo.currency_code              AS currency,
           fo.observed_at               AS scanned_at
    FROM fare_observations fo
    INNER JOIN (
      SELECT tracked_destination_id, MAX(observed_at) AS max_observed
      FROM fare_observations
      GROUP BY tracked_destination_id
    ) latest ON fo.tracked_destination_id = latest.tracked_destination_id
             AND fo.observed_at = latest.max_observed
  `);

  const priceMap = new Map<string, { price: number; scannedAt: string }>();
  for (const row of priceResult.rows) {
    priceMap.set(String(row.tracked_destination_id), {
      price: Number(row.price),
      scannedAt: String(row.scanned_at),
    });
  }

  return destResult.rows.map((row) => {
    const dest = rowToDestination(row as Record<string, unknown>);
    const latest = priceMap.get(dest.id) ?? null;
    const score = latest ? calcScore(latest.price, dest.typicalPriceSgd) : null;
    return {
      ...dest,
      latestPrice: latest?.price ?? null,
      latestScannedAt: latest?.scannedAt ?? null,
      score,
      valueLabel: scoreToLabel(score),
    };
  });
}

export async function getRoute(id: string): Promise<TrackedDestination | null> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM tracked_destinations WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToDestination(result.rows[0] as Record<string, unknown>);
}

export interface UpsertRouteInput {
  id?: string;
  originAirportCode: string;
  destinationAirportCode: string;
  destinationCity?: string;
  destinationCountry?: string;
  tripType: TripType;
  cabinClass: CabinClass;
  departureDateFrom?: string;
  departureDateTo?: string;
  returnDateFrom?: string;
  returnDateTo?: string;
  returnMinDays?: number;
  returnMaxDays?: number;
  maxStops?: number | null;
  currencyCode: string;
  locale: string;
  priority: Priority;
  priceThresholdSgd?: number | null;
  typicalPriceSgd?: number | null;
  alertMode: AlertMode;
  thresholdPercentage?: number | null;
}

export async function upsertRoute(input: UpsertRouteInput): Promise<string> {
  const db = getDb();
  const id = input.id ?? crypto.randomUUID();

  await db.execute({
    sql: `
      INSERT INTO tracked_destinations (
        id, origin_airport_code, destination_airport_code,
        destination_city, destination_country,
        trip_type, cabin_class,
        departure_date_from, departure_date_to,
        return_date_from, return_date_to,
        return_min_days, return_max_days,
        max_stops, currency_code, locale,
        priority, price_threshold_sgd, typical_price_sgd,
        alert_mode, threshold_percentage,
        is_active
      ) VALUES (
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        1
      )
      ON CONFLICT(id) DO UPDATE SET
        origin_airport_code = excluded.origin_airport_code,
        destination_airport_code = excluded.destination_airport_code,
        destination_city = excluded.destination_city,
        destination_country = excluded.destination_country,
        trip_type = excluded.trip_type,
        cabin_class = excluded.cabin_class,
        departure_date_from = excluded.departure_date_from,
        departure_date_to = excluded.departure_date_to,
        return_date_from = excluded.return_date_from,
        return_date_to = excluded.return_date_to,
        return_min_days = excluded.return_min_days,
        return_max_days = excluded.return_max_days,
        max_stops = excluded.max_stops,
        currency_code = excluded.currency_code,
        locale = excluded.locale,
        priority = excluded.priority,
        price_threshold_sgd = excluded.price_threshold_sgd,
        typical_price_sgd = excluded.typical_price_sgd,
        alert_mode = excluded.alert_mode,
        threshold_percentage = excluded.threshold_percentage,
        is_active = 1
    `,
    args: [
      id,
      input.originAirportCode,
      input.destinationAirportCode,
      input.destinationCity ?? null,
      input.destinationCountry ?? null,
      input.tripType,
      input.cabinClass,
      input.departureDateFrom ?? null,
      input.departureDateTo ?? null,
      input.returnDateFrom ?? null,
      input.returnDateTo ?? null,
      input.returnMinDays ?? null,
      input.returnMaxDays ?? null,
      input.maxStops ?? null,
      input.currencyCode,
      input.locale,
      input.priority,
      input.priceThresholdSgd ?? null,
      input.typicalPriceSgd ?? null,
      input.alertMode,
      input.thresholdPercentage ?? null,
    ],
  });

  return id;
}

export async function deactivateRoute(id: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "UPDATE tracked_destinations SET is_active = 0 WHERE id = ?",
    args: [id],
  });
}

export async function runMigrations(): Promise<void> {
  const db = getDb();
  const migrations = [
    `ALTER TABLE tracked_destinations ADD COLUMN alert_mode TEXT NOT NULL DEFAULT 'opportunistic'`,
    `ALTER TABLE tracked_destinations ADD COLUMN threshold_percentage REAL`,
    `ALTER TABLE tracked_destinations ADD COLUMN return_min_days INTEGER`,
    `ALTER TABLE tracked_destinations ADD COLUMN return_max_days INTEGER`,
  ];
  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch (e) {
      const msg = String(e).toLowerCase();
      if (msg.includes("duplicate column") || msg.includes("already exists")) continue;
      throw e;
    }
  }
}
