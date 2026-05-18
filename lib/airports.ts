// Hierarchical airport data: Region → Country → City/Airport
// Supports Chinese, English, and IATA lookup

export interface Airport {
  iata: string;
  city_en: string;
  city_zh: string;
  country_en: string;
  country_zh: string;
  region: string; // "東亞" | "東南亞" | "南亞" | "大洋洲" | "其他"
}

export const AIRPORTS: Airport[] = [
  // ── East Asia 東亞 ────────────────────────────────────────────────────────
  { iata: "TPE", city_en: "Taipei",       city_zh: "台北",   country_en: "Taiwan",      country_zh: "台灣",   region: "東亞" },
  { iata: "RMQ", city_en: "Taichung",     city_zh: "台中",   country_en: "Taiwan",      country_zh: "台灣",   region: "東亞" },
  { iata: "KHH", city_en: "Kaohsiung",   city_zh: "高雄",   country_en: "Taiwan",      country_zh: "台灣",   region: "東亞" },
  { iata: "HKG", city_en: "Hong Kong",   city_zh: "香港",   country_en: "Hong Kong",   country_zh: "香港",   region: "東亞" },
  { iata: "NRT", city_en: "Tokyo (Narita)",  city_zh: "東京（成田）", country_en: "Japan", country_zh: "日本", region: "東亞" },
  { iata: "HND", city_en: "Tokyo (Haneda)",  city_zh: "東京（羽田）", country_en: "Japan", country_zh: "日本", region: "東亞" },
  { iata: "KIX", city_en: "Osaka",        city_zh: "大阪",   country_en: "Japan",       country_zh: "日本",   region: "東亞" },
  { iata: "ICN", city_en: "Seoul",        city_zh: "首爾",   country_en: "South Korea", country_zh: "韓國",   region: "東亞" },
  { iata: "KMG", city_en: "Kunming",      city_zh: "昆明",   country_en: "China",       country_zh: "中國",   region: "東亞" },
  { iata: "XMN", city_en: "Xiamen",       city_zh: "廈門",   country_en: "China",       country_zh: "中國",   region: "東亞" },
  { iata: "CAN", city_en: "Guangzhou",    city_zh: "廣州",   country_en: "China",       country_zh: "中國",   region: "東亞" },
  { iata: "SZX", city_en: "Shenzhen",     city_zh: "深圳",   country_en: "China",       country_zh: "中國",   region: "東亞" },
  { iata: "PVG", city_en: "Shanghai",     city_zh: "上海",   country_en: "China",       country_zh: "中國",   region: "東亞" },
  { iata: "PEK", city_en: "Beijing",      city_zh: "北京",   country_en: "China",       country_zh: "中國",   region: "東亞" },
  { iata: "CTU", city_en: "Chengdu",      city_zh: "成都",   country_en: "China",       country_zh: "中國",   region: "東亞" },

  // ── Southeast Asia 東南亞 ──────────────────────────────────────────────────
  { iata: "BKK", city_en: "Bangkok (Suvarnabhumi)", city_zh: "曼谷（素萬那普）", country_en: "Thailand",  country_zh: "泰國",   region: "東南亞" },
  { iata: "DMK", city_en: "Bangkok (Don Mueang)",   city_zh: "曼谷（廊曼）",     country_en: "Thailand",  country_zh: "泰國",   region: "東南亞" },
  { iata: "HKT", city_en: "Phuket",       city_zh: "普吉島", country_en: "Thailand",    country_zh: "泰國",   region: "東南亞" },
  { iata: "CNX", city_en: "Chiang Mai",   city_zh: "清邁",   country_en: "Thailand",    country_zh: "泰國",   region: "東南亞" },
  { iata: "KBV", city_en: "Krabi",        city_zh: "甲米",   country_en: "Thailand",    country_zh: "泰國",   region: "東南亞" },
  { iata: "SGN", city_en: "Ho Chi Minh City", city_zh: "胡志明市", country_en: "Vietnam", country_zh: "越南", region: "東南亞" },
  { iata: "HAN", city_en: "Hanoi",        city_zh: "河內",   country_en: "Vietnam",     country_zh: "越南",   region: "東南亞" },
  { iata: "DAD", city_en: "Da Nang",      city_zh: "峴港",   country_en: "Vietnam",     country_zh: "越南",   region: "東南亞" },
  { iata: "PQC", city_en: "Phu Quoc",     city_zh: "富國島", country_en: "Vietnam",     country_zh: "越南",   region: "東南亞" },
  { iata: "DPS", city_en: "Bali",         city_zh: "峇里島", country_en: "Indonesia",   country_zh: "印尼",   region: "東南亞" },
  { iata: "CGK", city_en: "Jakarta",      city_zh: "雅加達", country_en: "Indonesia",   country_zh: "印尼",   region: "東南亞" },
  { iata: "KUL", city_en: "Kuala Lumpur", city_zh: "吉隆坡", country_en: "Malaysia",    country_zh: "馬來西亞", region: "東南亞" },
  { iata: "LGK", city_en: "Langkawi",     city_zh: "蘭卡威", country_en: "Malaysia",    country_zh: "馬來西亞", region: "東南亞" },
  { iata: "MNL", city_en: "Manila",       city_zh: "馬尼拉", country_en: "Philippines", country_zh: "菲律賓", region: "東南亞" },
  { iata: "CEB", city_en: "Cebu",         city_zh: "宿霧",   country_en: "Philippines", country_zh: "菲律賓", region: "東南亞" },
  { iata: "PPS", city_en: "Puerto Princesa", city_zh: "公主港", country_en: "Philippines", country_zh: "菲律賓", region: "東南亞" },
  { iata: "REP", city_en: "Siem Reap",    city_zh: "暹粒",   country_en: "Cambodia",    country_zh: "柬埔寨", region: "東南亞" },
  { iata: "PNH", city_en: "Phnom Penh",   city_zh: "金邊",   country_en: "Cambodia",    country_zh: "柬埔寨", region: "東南亞" },
  { iata: "VTE", city_en: "Vientiane",    city_zh: "永珍",   country_en: "Laos",        country_zh: "寮國",   region: "東南亞" },
  { iata: "LPQ", city_en: "Luang Prabang", city_zh: "龍坡邦", country_en: "Laos",       country_zh: "寮國",   region: "東南亞" },
  { iata: "RGN", city_en: "Yangon",       city_zh: "仰光",   country_en: "Myanmar",     country_zh: "緬甸",   region: "東南亞" },
  { iata: "MDL", city_en: "Mandalay",     city_zh: "曼德勒", country_en: "Myanmar",     country_zh: "緬甸",   region: "東南亞" },

  // ── South Asia 南亞 ────────────────────────────────────────────────────────
  { iata: "MLE", city_en: "Maldives (Malé)", city_zh: "馬爾地夫", country_en: "Maldives",   country_zh: "馬爾地夫", region: "南亞" },
  { iata: "CMB", city_en: "Colombo",      city_zh: "可倫坡", country_en: "Sri Lanka",   country_zh: "斯里蘭卡", region: "南亞" },
  { iata: "DEL", city_en: "Delhi",        city_zh: "德里",   country_en: "India",       country_zh: "印度",   region: "南亞" },
  { iata: "BOM", city_en: "Mumbai",       city_zh: "孟買",   country_en: "India",       country_zh: "印度",   region: "南亞" },
  { iata: "KTM", city_en: "Kathmandu",    city_zh: "加德滿都", country_en: "Nepal",     country_zh: "尼泊爾", region: "南亞" },

  // ── Oceania 大洋洲 ─────────────────────────────────────────────────────────
  { iata: "SYD", city_en: "Sydney",       city_zh: "雪梨",   country_en: "Australia",   country_zh: "澳洲",   region: "大洋洲" },
  { iata: "MEL", city_en: "Melbourne",    city_zh: "墨爾本", country_en: "Australia",   country_zh: "澳洲",   region: "大洋洲" },
  { iata: "BNE", city_en: "Brisbane",     city_zh: "布里斯本", country_en: "Australia", country_zh: "澳洲",   region: "大洋洲" },
  { iata: "PER", city_en: "Perth",        city_zh: "伯斯",   country_en: "Australia",   country_zh: "澳洲",   region: "大洋洲" },
  { iata: "AKL", city_en: "Auckland",     city_zh: "奧克蘭", country_en: "New Zealand", country_zh: "紐西蘭", region: "大洋洲" },
];

// ── Derived lookup structures ──────────────────────────────────────────────

/** All unique regions in display order */
export const REGIONS = ["東亞", "東南亞", "南亞", "大洋洲"] as const;

/** Get countries within a region */
export function getCountriesForRegion(region: string) {
  const seen = new Set<string>();
  const result: { en: string; zh: string }[] = [];
  for (const a of AIRPORTS) {
    if (a.region !== region) continue;
    const key = a.country_en;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ en: a.country_en, zh: a.country_zh });
    }
  }
  return result;
}

/** Get airports within a country */
export function getAirportsForCountry(countryEn: string) {
  return AIRPORTS.filter((a) => a.country_en === countryEn);
}

/** Search by IATA, English, or Chinese (partial match, case-insensitive) */
export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().includes(q) ||
      a.city_en.toLowerCase().includes(q) ||
      a.city_zh.includes(query.trim()) ||
      a.country_en.toLowerCase().includes(q) ||
      a.country_zh.includes(query.trim())
  ).slice(0, 10);
}

/** Find a single airport by IATA */
export function findByIata(iata: string): Airport | undefined {
  return AIRPORTS.find((a) => a.iata.toUpperCase() === iata.toUpperCase());
}
