"use client";

import { useState, useEffect, useRef } from "react";
import type { RouteWithLatestPrice, Priority, AlertMode, TripType, CabinClass } from "@/lib/db";
import {
  AIRPORTS,
  REGIONS,
  getCountriesForRegion,
  getAirportsForCountry,
  searchAirports,
  findByIata,
} from "@/lib/airports";

interface Props {
  route: RouteWithLatestPrice | null; // null = new route
  onSave: () => void;
  onClose: () => void;
}

type DateMode = "range" | "specific";

interface FormState {
  destinationAirportCode: string;
  priority: Priority;
  alertMode: AlertMode;
  tripType: TripType;
  cabinClass: CabinClass;
  typicalPriceSgd: string;
  thresholdPercentage: string;
  // Date config
  dateMode: DateMode;
  // Range mode
  departureDateFrom: string;
  departureDateTo: string;
  returnMinDays: string;
  returnMaxDays: string;
  // Specific mode
  specificDepartureDate: string;
  specificReturnDate: string;
  maxStops: string;
}

function emptyForm(): FormState {
  return {
    destinationAirportCode: "",
    priority: "medium",
    alertMode: "opportunistic",
    tripType: "round_trip",
    cabinClass: "economy",
    typicalPriceSgd: "",
    thresholdPercentage: "30",
    dateMode: "range",
    departureDateFrom: "",
    departureDateTo: "",
    returnMinDays: "3",
    returnMaxDays: "10",
    specificDepartureDate: "",
    specificReturnDate: "",
    maxStops: "",
  };
}

function routeToForm(route: RouteWithLatestPrice): FormState {
  const hasSpecificDate = !!route.departureDateFrom && !route.departureDateTo;
  return {
    destinationAirportCode: route.destinationAirportCode,
    priority: route.priority,
    alertMode: route.alertMode,
    tripType: route.tripType,
    cabinClass: route.cabinClass,
    typicalPriceSgd: route.typicalPriceSgd?.toString() ?? "",
    thresholdPercentage: route.thresholdPercentage?.toString() ?? "30",
    dateMode: hasSpecificDate ? "specific" : "range",
    departureDateFrom: !hasSpecificDate ? (route.departureDateFrom ?? "") : "",
    departureDateTo: !hasSpecificDate ? (route.departureDateTo ?? "") : "",
    returnMinDays: route.returnMinDays?.toString() ?? "3",
    returnMaxDays: route.returnMaxDays?.toString() ?? "10",
    specificDepartureDate: hasSpecificDate ? (route.departureDateFrom ?? "") : "",
    specificReturnDate: hasSpecificDate ? (route.returnDateFrom ?? "") : "",
    maxStops: route.maxStops?.toString() ?? "",
  };
}

export default function RouteModal({ route, onSave, onClose }: Props) {
  const isEdit = !!route;
  const [form, setForm] = useState<FormState>(isEdit ? routeToForm(route!) : emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Airport search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"search" | "dropdown">("dropdown");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const searchResults = searchQuery.length >= 1 ? searchAirports(searchQuery) : [];
  const selectedAirport = findByIata(form.destinationAirportCode);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function selectAirport(iata: string) {
    set("destinationAirportCode", iata);
    setSearchQuery("");
    setSelectedCountry("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.destinationAirportCode) {
      setError("請選擇目的地");
      return;
    }
    setSaving(true);
    setError("");

    const airport = findByIata(form.destinationAirportCode);
    const typical = parseFloat(form.typicalPriceSgd) || null;
    const thresholdPct = parseFloat(form.thresholdPercentage) || null;
    const thresholdSgd = typical && thresholdPct
      ? Math.round(typical * (1 - thresholdPct / 100))
      : null;

    const body = {
      id: route?.id,
      originAirportCode: "SIN",
      destinationAirportCode: form.destinationAirportCode,
      destinationCity: airport?.city_zh ?? airport?.city_en ?? null,
      destinationCountry: airport?.country_zh ?? airport?.country_en ?? null,
      tripType: form.tripType,
      cabinClass: form.cabinClass,
      currencyCode: "SGD",
      locale: "en-US",
      priority: form.priority,
      alertMode: form.alertMode,
      typicalPriceSgd: typical,
      priceThresholdSgd: thresholdSgd,
      thresholdPercentage: thresholdPct,
      maxStops: form.maxStops !== "" ? parseInt(form.maxStops) : null,
      // Dates
      departureDateFrom:
        form.dateMode === "range"
          ? form.departureDateFrom || null
          : form.specificDepartureDate || null,
      departureDateTo:
        form.dateMode === "range" ? form.departureDateTo || null : null,
      returnDateFrom:
        form.dateMode === "specific" ? form.specificReturnDate || null : null,
      returnDateTo: null,
      returnMinDays:
        form.dateMode === "range" && form.returnMinDays
          ? parseInt(form.returnMinDays)
          : null,
      returnMaxDays:
        form.dateMode === "range" && form.returnMaxDays
          ? parseInt(form.returnMaxDays)
          : null,
    };

    try {
      const url = isEdit ? `/api/routes/${route!.id}` : "/api/routes";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      onSave();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold">
            {isEdit ? `✏️ 編輯：${selectedAirport?.city_zh ?? route!.destinationAirportCode}` : "➕ 新增航線"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Section 1: Destination ── */}
          <Section title="🌏 目的地">
            {/* Selected airport display */}
            {selectedAirport && (
              <div className="flex items-center gap-3 bg-sky-900/30 border border-sky-700/50 rounded-lg px-3 py-2 mb-3">
                <div>
                  <div className="font-medium text-sky-300">
                    {selectedAirport.city_zh} ({selectedAirport.iata})
                  </div>
                  <div className="text-xs text-slate-400">
                    {selectedAirport.country_zh} · {selectedAirport.region}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("destinationAirportCode", "")}
                  className="ml-auto text-slate-500 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {!selectedAirport && (
              <>
                {/* Toggle search mode */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSearchMode("search")}
                    className={`flex-1 py-1.5 text-sm rounded-lg ${searchMode === "search" ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400"}`}
                  >
                    🔍 搜尋
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode("dropdown")}
                    className={`flex-1 py-1.5 text-sm rounded-lg ${searchMode === "dropdown" ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400"}`}
                  >
                    📋 下拉選單
                  </button>
                </div>

                {searchMode === "search" ? (
                  /* Freetext search */
                  <div className="relative">
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="輸入城市、國家、或 IATA 代碼（中/英皆可）"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                      autoFocus
                    />
                    {searchResults.length > 0 && (
                      <ul className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg overflow-hidden z-10 shadow-xl">
                        {searchResults.map((a) => (
                          <li key={a.iata}>
                            <button
                              type="button"
                              onClick={() => selectAirport(a.iata)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm flex items-center gap-2"
                            >
                              <span className="font-mono text-sky-400 text-xs w-8 shrink-0">
                                {a.iata}
                              </span>
                              <div>
                                <span className="font-medium">{a.city_zh}</span>
                                <span className="text-slate-400 ml-1">
                                  {a.city_en}
                                </span>
                                <span className="text-slate-500 text-xs ml-1">
                                  · {a.country_zh}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  /* Hierarchical dropdown: Region → Country → City */
                  <div className="space-y-2">
                    {/* Region */}
                    <Select
                      label="地區"
                      value={selectedRegion}
                      onChange={(v) => {
                        setSelectedRegion(v);
                        setSelectedCountry("");
                        set("destinationAirportCode", "");
                      }}
                      options={[
                        { value: "", label: "選擇地區..." },
                        ...REGIONS.map((r) => ({ value: r, label: r })),
                      ]}
                    />
                    {/* Country */}
                    {selectedRegion && (
                      <Select
                        label="國家"
                        value={selectedCountry}
                        onChange={(v) => {
                          setSelectedCountry(v);
                          set("destinationAirportCode", "");
                        }}
                        options={[
                          { value: "", label: "選擇國家..." },
                          ...getCountriesForRegion(selectedRegion).map((c) => ({
                            value: c.en,
                            label: `${c.zh} ${c.en}`,
                          })),
                        ]}
                      />
                    )}
                    {/* City/Airport */}
                    {selectedCountry && (
                      <Select
                        label="城市/機場"
                        value={form.destinationAirportCode}
                        onChange={(v) => set("destinationAirportCode", v)}
                        options={[
                          { value: "", label: "選擇城市..." },
                          ...getAirportsForCountry(selectedCountry).map((a) => ({
                            value: a.iata,
                            label: `${a.city_zh} (${a.iata})`,
                          })),
                        ]}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </Section>

          {/* ── Section 2: Priority & Alert ── */}
          <Section title="⚙️ 優先度與通知">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">優先度</label>
                <div className="flex flex-col gap-1.5">
                  {(["high", "medium", "low"] as Priority[]).map((p) => (
                    <RadioBtn
                      key={p}
                      selected={form.priority === p}
                      onClick={() => set("priority", p)}
                      label={
                        p === "high" ? "⭐ 高 (每2天掃)" :
                        p === "medium" ? "🔵 中 (每10天掃)" :
                        "⚪ 低 (手動)"
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">通知模式</label>
                <div className="flex flex-col gap-1.5">
                  <RadioBtn
                    selected={form.alertMode === "opportunistic"}
                    onClick={() => set("alertMode", "opportunistic")}
                    label="👀 伺機（只降價通知）"
                  />
                  <RadioBtn
                    selected={form.alertMode === "committed"}
                    onClick={() => set("alertMode", "committed")}
                    label="📌 已計劃（漲價也提醒）"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  台灣航線建議用「伺機」，只在出現特價時通知
                </p>
              </div>
            </div>
          </Section>

          {/* ── Section 3: Price Threshold ── */}
          <Section title="💰 價格設定">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  典型價格 (SGD)
                </label>
                <input
                  type="number"
                  value={form.typicalPriceSgd}
                  onChange={(e) => set("typicalPriceSgd", e.target.value)}
                  placeholder="例：280"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">用來計算評分基準</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  通知閾值（低於均價 %）
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={form.thresholdPercentage}
                    onChange={(e) => set("thresholdPercentage", e.target.value)}
                    placeholder="30"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
                </div>
                {form.typicalPriceSgd && form.thresholdPercentage && (
                  <p className="text-xs text-emerald-400 mt-1">
                    ≈ 低於 S$
                    {Math.round(
                      parseFloat(form.typicalPriceSgd) *
                        (1 - parseFloat(form.thresholdPercentage) / 100)
                    )}{" "}
                    時通知
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* ── Section 4: Date Configuration ── */}
          <Section title="📅 日期設定">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => set("dateMode", "range")}
                className={`flex-1 py-1.5 text-sm rounded-lg ${
                  form.dateMode === "range"
                    ? "bg-slate-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                🗓️ 出發區間
              </button>
              <button
                type="button"
                onClick={() => set("dateMode", "specific")}
                className={`flex-1 py-1.5 text-sm rounded-lg ${
                  form.dateMode === "specific"
                    ? "bg-slate-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                📌 指定日期
              </button>
            </div>

            {form.dateMode === "range" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">最早出發日</label>
                    <input
                      type="date"
                      value={form.departureDateFrom}
                      onChange={(e) => set("departureDateFrom", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">最晚出發日</label>
                    <input
                      type="date"
                      value={form.departureDateTo}
                      onChange={(e) => set("departureDateTo", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">最少停留天數</label>
                    <input
                      type="number"
                      min={1}
                      value={form.returnMinDays}
                      onChange={(e) => set("returnMinDays", e.target.value)}
                      placeholder="3"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">最多停留天數</label>
                    <input
                      type="number"
                      min={1}
                      value={form.returnMaxDays}
                      onChange={(e) => set("returnMaxDays", e.target.value)}
                      placeholder="10"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">出發日期</label>
                  <input
                    type="date"
                    value={form.specificDepartureDate}
                    onChange={(e) => set("specificDepartureDate", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">回程日期</label>
                  <input
                    type="date"
                    value={form.specificReturnDate}
                    onChange={(e) => set("specificReturnDate", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}
          </Section>

          {/* ── Section 5: Advanced ── */}
          <Section title="🔧 進階設定">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">行程類型</label>
                <Select
                  value={form.tripType}
                  onChange={(v) => set("tripType", v as TripType)}
                  options={[
                    { value: "round_trip", label: "來回票" },
                    { value: "one_way", label: "單程票" },
                  ]}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">艙等</label>
                <Select
                  value={form.cabinClass}
                  onChange={(v) => set("cabinClass", v as CabinClass)}
                  options={[
                    { value: "economy", label: "經濟艙" },
                    { value: "premium_economy", label: "豪華經濟艙" },
                    { value: "business", label: "商務艙" },
                    { value: "first", label: "頭等艙" },
                  ]}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  最多轉機次數
                </label>
                <Select
                  value={form.maxStops}
                  onChange={(v) => set("maxStops", v)}
                  options={[
                    { value: "", label: "不限" },
                    { value: "0", label: "直飛" },
                    { value: "1", label: "最多1次" },
                    { value: "2", label: "最多2次" },
                  ]}
                />
              </div>
            </div>
          </Section>

          {/* Error */}
          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {saving ? "儲存中..." : isEdit ? "儲存修改" : "新增航線"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Helper UI components ───────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <div>
      {label && <label className="text-xs text-slate-400 mb-1 block">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RadioBtn({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
        selected
          ? "bg-sky-500/20 border border-sky-500/60 text-sky-300"
          : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600"
      }`}
    >
      {label}
    </button>
  );
}
