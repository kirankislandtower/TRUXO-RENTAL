"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Truck, Users, Inbox, TrendingUp, Activity, CheckCircle2, Clock,
  AlertTriangle, Plus, ArrowRight, Zap, DollarSign, BarChart3,
  RefreshCw, Package, Calendar, ChevronRight
} from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";
import { parseContactRequest } from "@/lib/contactRequest";

type ContactRequest = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  equipment_required: string;
  created_at: string;
  status?: string;
};

type Client = {
  client_id: string;
  name: string;
  total_spent: string;
  active_rentals: number;
  joined: string;
};

type FleetAsset = {
  asset_id: string;
  type: string;
  model: string;
  status: string;
  client_id: string | null;
  location: string;
};

function parseAED(val: string): number {
  if (!val) return 0;
  const clean = val.replace("AED ", "").trim();
  if (clean.endsWith("M")) return parseFloat(clean) * 1_000_000;
  if (clean.endsWith("K")) return parseFloat(clean) * 1_000;
  return parseInt(clean.replace(/,/g, "")) || 0;
}

function formatAED(val: number): string {
  if (val >= 1_000_000) return `AED ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `AED ${(val / 1_000).toFixed(0)}K`;
  return `AED ${val.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Animated counter hook
function useCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useCounter(value);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

interface OverviewProps {
  onNavigate: (tab: string, filter?: string) => void;
  onViewRequest: (request: ContactRequest) => void;
}

// Loads everything the Overview shows. A section is null when its endpoint failed,
// so the caller can keep whatever it was already showing.
async function fetchOverviewData() {
  const [resReq, resClients, resFleet] = await Promise.all([
    adminFetch("/api/admin/requests", { method: "POST" }),
    adminFetch("/api/admin/clients", { method: "POST" }),
    adminFetch("/api/admin/fleet", { method: "POST" }),
  ]);
  return {
    requests: resReq.ok
      ? ((await resReq.json()).requests || []).map((req: ContactRequest) => parseContactRequest(req)) as ContactRequest[]
      : null,
    clients: resClients.ok ? ((await resClients.json()).clients || []) as Client[] : null,
    fleet: resFleet.ok ? ((await resFleet.json()).fleet || []) as FleetAsset[] : null,
  };
}

export default function Overview({ onNavigate, onViewRequest }: OverviewProps) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [fleet, setFleet] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchOverviewData>>) => {
    if (data.requests) setRequests(data.requests);
    if (data.clients) setClients(data.clients);
    if (data.fleet) setFleet(data.fleet);
  }, []);

  // Refresh button
  const fetchAll = async () => {
    setIsLoading(true);
    try {
      applyData(await fetchOverviewData());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); setLastRefresh(new Date()); }
  };

  // Initial load (isLoading already starts true)
  useEffect(() => {
    let active = true;
    fetchOverviewData()
      .then((data) => { if (active) applyData(data); })
      .catch((e) => console.error(e))
      .finally(() => { if (active) { setIsLoading(false); setLastRefresh(new Date()); } });
    return () => { active = false; };
  }, [applyData]);

  const deployed    = fleet.filter(f => f.status === "Deployed").length;
  const available   = fleet.filter(f => f.status === "Available").length;
  const maintenance = fleet.filter(f => f.status === "Maintenance").length;
  const pending     = requests.filter(r => !r.status || r.status === "Pending").length;
  const totalRevenue = clients.reduce((s, c) => s + parseAED(c.total_spent), 0);
  const recentActivity = [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const topClients = [...clients].sort((a, b) => parseAED(b.total_spent) - parseAED(a.total_spent)).slice(0, 5);
  const maxRevenue = topClients[0] ? parseAED(topClients[0].total_spent) : 1;

  const kpis = [
    { label: "Total Fleet", value: fleet.length, icon: Truck, color: "#C5A059", bg: "#C5A059", sub: "Assets registered", action: () => onNavigate("fleet", "All") },
    { label: "Active Deployments", value: deployed, icon: Activity, color: "#25D366", bg: "#25D366", sub: `${fleet.length > 0 ? Math.round((deployed / fleet.length) * 100) : 0}% utilization`, action: () => onNavigate("fleet", "Deployed") },
    { label: "Pending Requests", value: pending, icon: Inbox, color: "#DFBA73", bg: "#DFBA73", sub: "Needs review", action: () => onNavigate("dispatch", "Pending") },
    { label: "Total Clients", value: clients.length, icon: Users, color: "#7C83FD", bg: "#7C83FD", sub: formatAED(totalRevenue) + " lifetime", action: () => onNavigate("clients") },
  ];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-10 h-10 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
      <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Loading ERP Data…</p>
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-white font-orbitron uppercase tracking-tight mb-1">Command Center</h2>
          <p className="text-gray-400 font-medium text-sm">Executive overview — {new Date().toLocaleDateString("en-AE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111113] border border-white/10 text-gray-400 hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all text-xs font-bold uppercase tracking-widest"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh · {lastRefresh.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" })}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.button
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={kpi.action}
            className="bg-[#111113] border border-white/8 rounded-2xl p-5 text-left relative overflow-hidden group hover:border-white/20 transition-all cursor-pointer"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at top right, ${kpi.bg}12, transparent 65%)` }} />
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${kpi.bg}18`, border: `1px solid ${kpi.bg}35` }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-3xl font-black text-white mb-1 font-orbitron">
              <AnimatedNumber value={kpi.value} />
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">{kpi.label}</p>
            <p className="text-xs text-gray-600">{kpi.sub}</p>
          </motion.button>
        ))}
      </div>

      {/* Fleet Status + Revenue Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Fleet Status Live Pulse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Fleet Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Deployed", value: deployed, color: "#25D366", pct: fleet.length ? (deployed / fleet.length) * 100 : 0 },
              { label: "Available", value: available, color: "#C5A059", pct: fleet.length ? (available / fleet.length) * 100 : 0 },
              { label: "Maintenance", value: maintenance, color: "#A51A1A", pct: fleet.length ? (maintenance / fleet.length) * 100 : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }} />
                    <span className="text-xs font-bold text-gray-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-white">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}88)` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-600 uppercase tracking-widest font-bold">Total Assets</span>
            <span className="text-lg font-black text-white font-orbitron">{fleet.length}</span>
          </div>
        </motion.div>

        {/* Top Clients Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-[#C5A059]" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Top Clients by Revenue</h3>
            </div>
            <button onClick={() => onNavigate("analytics")} className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
              Full Report <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {topClients.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">No revenue data yet</div>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => {
                const rev = parseAED(client.total_spent);
                const pct = maxRevenue ? (rev / maxRevenue) * 100 : 0;
                const colors = ["#C5A059", "#DFBA73", "#7C83FD", "#25D366", "#FF7C00"];
                return (
                  <motion.div key={client.client_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.06 }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-300 truncate max-w-[160px]">{client.name || client.client_id}</span>
                      <span className="text-xs font-black" style={{ color: i === 0 ? "#C5A059" : "#F5F2EB" }}>{client.total_spent || "AED 0"}</span>
                    </div>
                    <div className="h-5 w-full bg-white/5 rounded-md overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.06, ease: "easeOut" }}
                        className="h-full rounded-md flex items-center"
                        style={{ background: `linear-gradient(90deg, ${colors[i]}cc, ${colors[i]}44)` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#7C83FD]" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Activity</h3>
              {pending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#DFBA73]/15 border border-[#DFBA73]/30 text-[10px] font-black text-[#DFBA73]">
                  {pending} Pending
                </span>
              )}
            </div>
            <button onClick={() => onNavigate("dispatch")} className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-600 text-sm">No recent activity</div>
            ) : recentActivity.map((req, i) => {
              const isPending = !req.status || req.status === "Pending";
              const isApproved = req.status === "Approved";
              return (
                <motion.div
                  key={req.id}
                  onClick={() => onViewRequest(req)}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 cursor-pointer transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPending ? "bg-[#DFBA73]/10" : isApproved ? "bg-[#25D366]/10" : "bg-[#A51A1A]/10"}`}>
                    {isPending ? <Clock className="w-4 h-4 text-[#DFBA73]" /> : isApproved ? <CheckCircle2 className="w-4 h-4 text-[#25D366]" /> : <AlertTriangle className="w-4 h-4 text-[#A51A1A]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{req.first_name} {req.last_name}</p>
                    <p className="text-xs text-gray-500 truncate">{req.equipment_required}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-600">{timeAgo(req.created_at)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
          className="bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <Zap className="w-4 h-4 text-[#DFBA73]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Add Fleet Asset", icon: Plus, tab: "fleet", color: "#C5A059", desc: "Register new equipment" },
              { label: "Add New Client", icon: Users, tab: "clients", color: "#7C83FD", desc: "Onboard a client" },
              { label: "View Requests", icon: Inbox, tab: "dispatch", color: "#DFBA73", desc: `${pending} pending review` },
              { label: "Revenue Report", icon: TrendingUp, tab: "analytics", color: "#25D366", desc: "View analytics" },
              { label: "Invoice Center", icon: DollarSign, tab: "invoices", color: "#FF7C00", desc: "Manage invoices" },
              { label: "System Settings", icon: Package, tab: "settings", color: "#A51A1A", desc: "Configure system" },
            ].map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.04 }}
                onClick={() => onNavigate(action.tab)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/3 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-tight">{action.label}</p>
                  <p className="text-[10px] text-gray-600">{action.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System Health Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-[#111113] border border-white/8 rounded-2xl p-4 flex flex-wrap items-center gap-6"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span className="text-xs font-black text-[#25D366] uppercase tracking-widest">All Systems Operational</span>
        </div>
        {[
          { label: "Fleet DB", status: "Online" },
          { label: "Client DB", status: "Online" },
          { label: "API Gateway", status: "Online" },
          { label: "Auth Service", status: "Online" },
        ].map(sys => (
          <div key={sys.label} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
            <span className="text-[10px] text-gray-500 font-bold">{sys.label}</span>
            <span className="text-[10px] text-[#25D366] font-black">{sys.status}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-600">
          <Calendar className="w-3 h-3" />
          Last sync: {lastRefresh.toLocaleTimeString("en-AE")}
        </div>
      </motion.div>
    </div>
  );
}
