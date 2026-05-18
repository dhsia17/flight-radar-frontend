"use client";

import { useEffect, useState, useCallback } from "react";
import type { RouteWithLatestPrice, Priority } from "@/lib/db";
import RouteCard from "@/components/RouteCard";
import RouteModal from "@/components/RouteModal";

type Filter = "all" | "good" | "high" | "medium" | "low";

export default function Dashboard() {
  const [routes, setRoutes] = useState<RouteWithLatestPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteWithLatestPrice | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Global date panel state ─────────────────────────────────────────────
  const [datePanelOpen, setDatePanelOpen] = useState(false);
  const [deptFrom, setDeptFrom] = useState("");
  const [deptTo, setDeptTo] = useState("");
  const [returnMin, setReturnMin] = useState("");
  const [returnMax, setReturnMax] = useState("");
  const [dateSaving, setDateSaving] = useState(false);
  const [dateSaveMsg, setDateSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch("/api/routes");
      const data = await res.json();
      const rows: RouteWithLatestPrice[] = data.routes ?? [];
      setRoutes(rows);
      setLastUpdated(new Date());

      // Pre-fill global date panel from first active route (if not already edited)
      if (rows.length > 0 && !deptFrom) {
        const first = rows[0];
        if (first.departureDateFrom) setDeptFrom(first.departureDateFrom);
        if (first.departureDateTo) setDeptTo(first.departureDateTo);
        if (first.returnMinDays) setReturnMin(String(first.returnMinDays));
        if (first.returnMaxDays) setReturnMax(String(first.returnMaxDays));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  async function handleApplyDates() {
    if (!deptFrom || !deptTo) {
      setDateSaveMsg({ ok: false, text: "請填寫出發起訖日期" });
      return;
    }
    if (deptFrom > deptTo) {
      setDateSaveMsg({ ok: false, text: "起始日期不能晚於結束日期" });
      return;
    }
    const minN = returnMin ? parseInt(returnMin, 10) : null;
    const maxN = returnMax ? parseInt(returnMax, 10) : null;
    if (minN && maxN && minN > maxN) {
      setDateSaveMsg({ ok: false, text: "最短停留不能大於最長停留" });
      return;
    }

    setDateSaving(true);
    setDateSaveMsg(null);
    try {
      const res = await fetch("/api/routes/bulk-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureDateFrom: deptFrom,
          departureDateTo: deptTo,
          returnMinDays: minN,
          returnMaxDays: maxN,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDateSaveMsg({ ok: true, text: `✅ 已套用到 ${data.updated} 條航線` });
        await fetchRoutes();
        setTimeout(() => setDatePanelOpen(false), 1200);
      } else {
        setDateSaveMsg({ ok: false, text: data.error ?? "套用失敗" });
      }
    } catch {
      setDateSaveMsg({ ok: false, text: "網路錯誤，請重試" });
    } finally {
      setDateSaving(false);
    }
  }

  const filtered = routes.filter((r) => {
    if (filter === "good") return r.valueLabel === "exceptional" || r.valueLabel === "good";
    if (filter === "high") return r.priority === "high";
    if (filter === "medium") return r.priority === "medium";
    if (filter === "low") return r.priority === "low";
    return true;
  });

  const goodValueCount = routes.filter(
    (r) => r.valueLabel === "exceptional" || r.valueLabel === "good"
  ).length;
  const exceptionalCount = routes.filter((r) => r.valueLabel === "exceptional").length;

  function handleEdit(route: RouteWithLatestPrice) {
    setEditingRoute(route);
    setModalOpen(true);
  }

  function handleAddNew() {
    setEditingRoute(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要移除這條航線嗎？")) return;
    await fetch(`/api/routes/${id}`, { method: "DELETE" });
    fetchRoutes();
  }

  async function handleSave() {
    setModalOpen(false);
    await fetchRoutes();
  }

  const priorityOrder: Priority[] = ["high", "medium", "low"];
  const sortedFiltered = [...filtered].sort((a, b) => {
    const pa = priorityOrder.indexOf(a.priority);
    const pb = priorityOrder.indexOf(b.priority);
    if (pa !== pb) return pa - pb;
    return (b.score ?? -1) - (a.score ?? -1);
  });

  // Derive a short summary of current global date setting
  const globalDateSummary = deptFrom && deptTo
    ? `${deptFrom} → ${deptTo}${returnMin || returnMax ? `，停留 ${returnMin || "?"}–${returnMax || "?"} 天` : ""}`
    : "尚未設定出行日期";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Flight Radar</h1>
              <p className="text-xs text-slate-400">
                SIN 出發 · {routes.length} 條航線
                {lastUpdated && (
                  <> · 更新於 {lastUpdated.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span>+</span> 新增航線
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ── Summary cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="監控中" value={routes.length} icon="🗺️" sub="條航線" />
          <StatCard
            label="現在划算"
            value={goodValueCount}
            icon="💚"
            sub={`${routes.length ? Math.round((goodValueCount / routes.length) * 100) : 0}% 航線`}
            highlight={goodValueCount > 0}
          />
          <StatCard label="超值優惠" value={exceptionalCount} icon="🔥" sub="Exceptional" highlight={exceptionalCount > 0} />
          <StatCard label="高優先" value={routes.filter((r) => r.priority === "high").length} icon="⭐" sub="HIGH 航線" />
        </div>

        {/* ── Global Date Panel ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-sky-800/60 bg-sky-950/30 overflow-hidden">
          {/* Header row — always visible */}
          <button
            onClick={() => { setDatePanelOpen((v) => !v); setDateSaveMsg(null); }}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-sky-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-sm font-semibold text-sky-300">我的出行時間</p>
                <p className="text-xs text-slate-400">{globalDateSummary}</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm">{datePanelOpen ? "▲ 收起" : "▼ 展開設定"}</span>
          </button>

          {/* Expandable form */}
          {datePanelOpen && (
            <div className="px-4 pb-5 pt-1 border-t border-sky-800/40 space-y-4">
              <p className="text-xs text-slate-400 pt-2">
                設定後會立即套用到所有 {routes.length} 條監控航線，掃描時會以此期間查詢機票價格。
              </p>

              {/* Departure range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">📤 最早可出發日</label>
                  <input
                    type="date"
                    value={deptFrom}
                    onChange={(e) => setDeptFrom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">📤 最晚可出發日</label>
                  <input
                    type="date"
                    value={deptTo}
                    onChange={(e) => setDeptTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Return stay duration */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  🔁 旅遊天數（回程會依此自動計算）<span className="text-slate-600 ml-1">— 不填則不限</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="最短"
                    value={returnMin}
                    onChange={(e) => setReturnMin(e.target.value)}
                    className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 text-center"
                  />
                  <span className="text-slate-500 text-sm">～</span>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="最長"
                    value={returnMax}
                    onChange={(e) => setReturnMax(e.target.value)}
                    className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 text-center"
                  />
                  <span className="text-slate-500 text-sm">天</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleApplyDates}
                  disabled={dateSaving}
                  className="flex-1 sm:flex-none bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  {dateSaving ? "套用中..." : "✅ 套用到所有航線"}
                </button>
                <button
                  onClick={() => { setDatePanelOpen(false); setDateSaveMsg(null); }}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  取消
                </button>
                {dateSaveMsg && (
                  <span className={`text-xs ${dateSaveMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {dateSaveMsg.text}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { key: "all", label: "全部", count: routes.length },
              { key: "good", label: "💚 現在划算", count: goodValueCount },
              { key: "high", label: "⭐ 高優先", count: routes.filter((r) => r.priority === "high").length },
              { key: "medium", label: "🔵 中優先", count: routes.filter((r) => r.priority === "medium").length },
              { key: "low", label: "⚪ 低優先", count: routes.filter((r) => r.priority === "low").length },
            ] as { key: Filter; label: string; count: number }[]
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-sky-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          ))}
          <button
            onClick={fetchRoutes}
            className="ml-auto px-3 py-1.5 rounded-full text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
            title="重新整理"
          >
            ↻ 重整
          </button>
        </div>

        {/* ── Route grid ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-3 animate-pulse">✈️</div>
            <p>載入中...</p>
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-3">🌏</div>
            <p>{filter === "good" ? "目前沒有划算航線，繼續等待中..." : "沒有符合條件的航線"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedFiltered.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onEdit={() => handleEdit(route)}
                onDelete={() => handleDelete(route.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <RouteModal
          route={editingRoute}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  sub,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-emerald-900/30 border-emerald-700/50"
          : "bg-slate-800/60 border-slate-700/50"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
