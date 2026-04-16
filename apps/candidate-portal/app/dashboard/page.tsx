"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { 
  LogOut, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  History,
  Calendar,
  ChevronRight,
  User,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        localStorage.removeItem("token");
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchProfile();

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/auth/events`);

    eventSource.onmessage = () => fetchProfile();
    return () => eventSource.close();
  }, []);

  const handleStart = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessment/start-assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      router.push(`${process.env.NEXT_PUBLIC_ASSESSMENT_URL}?token=${data.token}`);
    } catch (err) {
      console.error("Error starting assessment:", err);
    }
  };

  const chartData = useMemo(() => {
    if (!profile?.applications) return [];
    return [...profile.applications]
      .filter((app: any) => app.status === "Evaluated" && app.score)
      .reverse()
      .map((app: any, index: number) => ({
        attempt: `Test ${index + 1}`,
        score: app.score.score,
        date: new Date(app.createdAt).toLocaleDateString()
      }));
  }, [profile]);

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  const lastApp = profile?.applications?.[0];
  const status = lastApp?.status || "Applied";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* 🧭 Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Candidate <span className="text-blue-500 font-black">Portal</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live System Connected</span>
            </div>
            <button 
              onClick={() => { localStorage.removeItem("token"); router.push("/"); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
             <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-slate-400 font-medium">Initializing Dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* 👤 Profile Summary & Status */}
            <section className="lg:col-span-4 space-y-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
                
                <div className="flex items-center gap-5 mb-8">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
                     <User className="text-blue-500 w-8 h-8" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold text-white tracking-tight truncate w-48">{profile?.email}</h2>
                     <p className="text-slate-500 text-sm font-medium italic">Student Profile</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Current Standing</span>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={status} />
                      {lastApp?.score && (
                        <div className="text-right">
                           <span className="text-3xl font-black text-white">{lastApp.score.score}</span>
                           <span className="text-slate-500 text-[10px] font-bold uppercase block -mt-1">Latest Score</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800/50">
                    <AnimatePresence mode="wait">
                      {status === "Applied" || status === "Evaluated" ? (
                        <motion.button
                          key="start"
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          onClick={handleStart}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 group active:scale-[0.98]"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          {status === "Evaluated" ? "Retake Assessment" : "Start Assessment"}
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      ) : (
                        <motion.div
                          key="attempting"
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="w-full bg-slate-800/80 p-5 rounded-2xl ring-1 ring-slate-700/50 text-center"
                        >
                          <div className="flex items-center justify-center gap-3 text-amber-500 font-bold mb-1">
                            <Clock className="w-5 h-5" />
                            <span>Evaluation Pending</span>
                          </div>
                          <p className="text-xs text-slate-500">Your test is being processed. It will update automatically.</p>
                          
                          <button 
                            onClick={async () => {
                              const token = localStorage.getItem("token");
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-assessment`, {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) fetchProfile();
                            }}

                            className="mt-4 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4"
                          >
                            Stuck? Reset & Try Again
                          </button>
                        </motion.div>

                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Tests</span>
                    <p className="text-2xl font-black text-white mt-1">{profile?.applications?.length || 0}</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Peak Performance</span>
                    <p className="text-2xl font-black text-blue-500 mt-1">
                      {profile?.applications ? Math.max(...profile.applications.map((app: any) => app.score?.score || 0), 0) : 0}
                    </p>
                 </div>
              </div>
            </section>

            {/* 📈 Visualization & History */}
            <section className="lg:col-span-8 space-y-8">
              {/* Progress Graph */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                     <TrendingUp className="text-blue-500 w-6 h-6" />
                     <h2 className="text-xl font-bold text-white tracking-tight">Performance Progress</h2>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black tracking-widest uppercase">Visual Trends</div>
                </div>

                {chartData.length > 1 ? (
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis 
                          dataKey="attempt" 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#white', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#3b82f6" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 gap-3 border-2 border-dashed border-slate-800 rounded-2xl">
                     <AlertCircle className="w-10 h-10 opacity-20" />
                     <p className="font-medium text-sm">Take more than one test to unlock progress charts.</p>
                  </div>
                )}
              </motion.div>

              {/* History List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50"
              >
                <div className="flex items-center gap-3 mb-8">
                   <History className="text-slate-400 w-6 h-6" />
                   <h2 className="text-xl font-bold text-white tracking-tight">Assessment History</h2>
                </div>

                <div className="space-y-4">
                  {profile?.applications?.length > 0 ? (
                    profile.applications.map((app: any, i: number) => (
                      <div 
                        key={app.id}
                        className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors group"
                      >
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                             <Calendar className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-white tracking-wide">
                               Test Attempt {profile.applications.length - i}
                             </p>
                             <p className="text-xs text-slate-500 mt-0.5">{new Date(app.createdAt).toLocaleString()}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <SmallStatusBadge status={app.status} />
                            <div className="text-right min-w-[60px]">
                               {app.score ? (
                                 <span className="text-lg font-black text-white">{app.score.score} <span className="text-[10px] text-slate-600">pts</span></span>
                               ) : (
                                 <span className="text-slate-700 text-xs italic">Pending</span>
                               )}
                            </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-600 italic">No historical records found.</div>
                  )}
                </div>
              </motion.div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    Applied: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Ready to Start", icon: Play },
    Attempted: { bg: "bg-amber-500/10", text: "text-amber-500", label: "In Progress", icon: Clock },
    Evaluated: { bg: "bg-green-500/10", text: "text-green-500", label: "Completed", icon: CheckCircle2 },
  };

  const current = configs[status] || configs.Applied;
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-inset ${current.bg} ${current.text} ring-current/20 shadow-sm shadow-black/50`}>
      <Icon className="w-4 h-4 fill-current/20" />
      <span className="text-xs font-black uppercase tracking-wider">{current.label}</span>
    </div>
  );
}

function SmallStatusBadge({ status }: { status: string }) {
  const styles: any = {
    Applied: "border-blue-500/20 text-blue-500",
    Attempted: "border-amber-500/20 text-amber-500",
    Evaluated: "border-green-500/20 text-green-500",
  };
  return (
    <span className={`hidden sm:inline-block px-2 text-[10px] py-0.5 rounded border ${styles[status] || styles.Applied} uppercase font-black tracking-tighter`}>
      {status}
    </span>
  );
}