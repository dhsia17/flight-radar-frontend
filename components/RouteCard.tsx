"use client";

import type { RouteWithLatestPrice } from "@/lib/db";
import { findByIata } from "@/lib/airports";

interface Props {
  route: RouteWithLatestPrice;
  onEdit: () => void;
  onDelete: () => void;
}

const PRIORITY_CONFIG = {
  high:   { label: "HIGH",   dot: "bg-amber-400",  text: "text-amber-400" },
  medium: { label: "MED",    dot: "bg-sky-400",     text: "text-sky-400" },
  low:    { label: "LOW",    dot: "bg-slate-500",   text: "text-slate-400" },
};

const SCORE_CONFIG = {
  exceptional: { label: "超值 🔥", cls: "bg-emerald-500 text-white" },
  good:        { label: "划算 💚", cls: "bg-green-500 text-white" },
  average:     { label: "普通",    cls: "bg-amber-500 text-white" },
  expensive:   { label: "偏貴",    cls: "bg-red-500 text-white" },
};

const ALERT_MODE_LABEL = {
  opportunistic: "伺機",
  committed:     "已計劃",
};

export default function RouteCard({ route, onEdit, onDelete }: Props) {
  const destAirport = findByIata(route.destinationAirportCode);
  const cityName = destAirport?.city_zh ?? route.destinationCity ?? route.destinationAirportCode;
  const countryName = destAirport?.country_zh ?? route.destinationCountry ?? "";
  const priorityCfg = PRIORITY_CONFIG[route.priority];
  const scoreEntry = route.valueLabel ? SCORE_CONFIG[route.valueLabel as keyof typeof SCORE_CONFIG] : null;

  const isGoodDeal = route.valueLabel === "exceptional" || route.valueLabel === "good";

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 hover:border-slate-600 ${
        isGoodDeal
          ? "bg-slate-800 border-emerald-700/60 shadow-emerald-900/30 shadow-lg"
          : "bg-slate-800/70 border-slate-700/50"
      }`}
    >
      {/* Good deal banner */}
      {route.valueLabel === "exceptional" && (
        <div className="absolute -top-2 left-3 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          🔥 超值好價
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── Top row: destination + priority ── */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-lg leading-tight">{cityName}</div>
            <div className="text-xs text-slate-400">{countryName}</div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${priorityCfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
              {priorityCfg.label}
            </span>
            <span className="text-xs text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded">
              {route.destinationAirportCode}
            </span>
          </div>
        </div>

        {/* ── Price section ── */}
        <div className="flex items-end justify-between">
          <div>
            {route.latestPrice != null ? (
              <>
                <div className="text-2xl font-bold text-white">
                  S${route.latestPrice.toFixed(0)}
                </div>
                {route.typicalPriceSgd && (
                  <div className="text-xs text-slate-400">
                    均價 S${route.typicalPriceSgd} ·{" "}
                    {route.latestPrice < route.typicalPriceSgd ? (
                      <span className="text-emerald-400">
                        低 {Math.round((1 - route.latestPrice / route.typicalPriceSgd) * 100)}%
                      </span>
                    ) : (
                      <span className="text-red-400">
                        高 {Math.round((route.latestPrice / route.typicalPriceSgd - 1) * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-500 text-sm">尚無價格資料</div>
            )}
          </div>

          {/* Score badge */}
          {route.score != null && (
            <div className="text-right">
              <div
                className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  scoreEntry?.cls ?? "bg-slate-600 text-slate-300"
                }`}
              >
                {scoreEntry?.label ?? `${route.score}分`}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{route.score}/100</div>
            </div>
          )}
        </div>

        {/* ── Score bar ── */}
        {route.score != null && (
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                route.score >= 90
                  ? "bg-emerald-500"
                  : route.score >= 70
                  ? "bg-green-400"
                  : route.score >= 40
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{ width: `${route.score}%` }}
            />
          </div>
        )}

        {/* ── Meta info ── */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          {route.thresholdPercentage != null && (
            <span title="低於均價多少才通知">
              🔔 -{route.thresholdPercentage}%
            </span>
          )}
          <span title="通知模式">
            {route.alertMode === "committed" ? "📌" : "👀"}{" "}
            {ALERT_MODE_LABEL[route.alertMode]}
          </span>
          {route.departureDateFrom && (
            <span>
              📅 {route.departureDateFrom}
              {route.departureDateTo ? ` ~ ${route.departureDateTo}` : ""}
            </span>
          )}
          {route.returnMinDays != null && (
            <span>↩ {route.returnMinDays}{route.returnMaxDays ? `-${route.returnMaxDays}` : ""}天</span>
          )}
          {route.latestScannedAt && (
            <span className="text-slate-600 ml-auto">
              掃描: {new Date(route.latestScannedAt).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}
            </span>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-1 border-t border-slate-700/50">
          <button
            onClick={onEdit}
            className="flex-1 text-xs py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            ✏️ 設定
          </button>
          <button
            onClick={onDelete}
            className="text-xs py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition-colors"
          >
            移除
          </button>
        </div>
      </div>
    </div>
  );
}
