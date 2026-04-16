"use client";

import { useEffect, useState, useMemo } from "react";

export default function EmployerDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [mounted, setMounted] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/candidates`);
      const d = await res.json();

      setData(d);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();

    // 📡 Real-time Updates via SSE
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/auth/events`);

    
    eventSource.onmessage = (event) => {
      console.log("Real-time update received:", event.data);
      fetchData();
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection failed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.email.toLowerCase().includes(searchTerm.toLowerCase());
      const latestApp = item.applications?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())?.[0];
      const status = latestApp?.status || "Applied";
      const matchesFilter = filterStatus === "All" || status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = data.length;
    const evaluated = data.filter(c => c.applications?.some((a: any) => a.status === "Evaluated")).length;
    const attempted = data.filter(c => c.applications?.some((a: any) => a.status === "Attempted")).length;
    const avgScore = data.reduce((sum, c) => {
      const latestScore = c.scores?.[c.scores.length - 1]?.score;
      return latestScore ? sum + latestScore : sum;
    }, 0) / (evaluated || 1);
    return { total, evaluated, attempted, avgScore: Math.round(avgScore * 10) / 10 };
  }, [data]);

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Employer <span className="text-blue-500 font-black">Dashboard</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl hover:bg-slate-800/50 transition-all flex items-center gap-2 group disabled:opacity-50 text-slate-300"
            >
              <svg 
                className={`w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live System Connected</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Candidates" value={stats.total} />
          <StatCard label="Evaluated" value={stats.evaluated} color="text-green-500" />
          <StatCard label="In Progress" value={stats.attempted} color="text-amber-500" />
          <StatCard label="Avg. Score" value={stats.avgScore} color="text-blue-500" />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Search */}
          <div className="lg:col-span-1 relative">
            <input 
              type="text" 
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all"
            />
            <svg 
              className="w-5 h-5 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filters */}
          <div className="lg:col-span-2 flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {["All", "Applied", "Attempted", "Evaluated"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  filterStatus === status 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" 
                    : "bg-slate-900/50 text-slate-400 border border-slate-800/50 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/30 rounded-3xl border border-slate-800/50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Latest Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Attempts</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Best Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium">Loading candidates...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((candidate) => {
                  const sortedApps = [...(candidate.applications || [])].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  const latestApp = sortedApps[0];
                  const latestStatus = latestApp?.status || "Applied";
                  const totalAttempts = sortedApps.length;
                  const bestScore = candidate.scores?.length > 0 
                    ? Math.max(...candidate.scores.map((s: any) => s.score)) 
                    : null;

                  return (
                    <tr key={candidate.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-blue-500 font-bold text-sm group-hover:border-blue-500/30 transition-colors">
                            {candidate.email[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-200">{candidate.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={latestStatus} />
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-400">{totalAttempts}</span>
                      </td>
                      <td className="px-6 py-5 text-slate-500 text-sm">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {bestScore !== null ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="text-lg font-black text-white">{bestScore} <span className="text-[10px] text-slate-600 font-normal">pts</span></span>
                          </div>
                        ) : (
                          <span className="text-slate-700 italic text-sm">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-600 italic">
                    No candidates match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color = "text-white" }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
      <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Applied: "border-blue-500/20 text-blue-500 bg-blue-500/10",
    Attempted: "border-amber-500/20 text-amber-500 bg-amber-500/10",
    Evaluated: "border-green-500/20 text-green-500 bg-green-500/10",
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${styles[status] || styles.Applied}`}>
      {status}
    </span>
  );
}