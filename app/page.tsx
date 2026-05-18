import { redirect } from "next/navigation";

export default function Home({
  searchParams,
}: {
  searchParams: { key?: string; error?: string };
}) {
  // If they have a key, send them straight to dashboard
  if (searchParams.key) {
    redirect(`/dashboard?key=${searchParams.key}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">✈️</div>
        <h1 className="text-3xl font-bold text-white">Flight Radar</h1>
        <p className="text-slate-400 text-sm">
          Personal CP-value flight deal monitor
        </p>
        {searchParams.error === "unauthorized" && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
            Access denied. Please use the correct secret URL.
          </div>
        )}
        <p className="text-slate-500 text-xs">
          Access via your personal dashboard link.
        </p>
      </div>
    </main>
  );
}
