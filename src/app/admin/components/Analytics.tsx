"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, Truck, DollarSign, BarChart3, PieChart,
  Zap, ArrowUp, Calendar, Package
} from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

type Client = {
  client_id: string;
  name: string;
  total_spent: string;
  active_rentals: number;
  joined: string;
};

type FleetAsset = {
  asset_id: string;
  status: string;
  type: string;
};

type ContactRequest = {
  id: number;
  equipment_required: string;
  created_at: string;
};

type Invoice = {
  id: string;
  amount: string;
  issued: string;
  status: string;
};

function parseAED(val: string): number {
  if (!val) return 0;
  const clean = val.replace("AED ", "").trim();
  if (clean.endsWith("M")) return parseFloat(clean) * 1_000_000;
  if (clean.endsWith("K")) return parseFloat(clean) * 1_000;
  return parseInt(clean.replace(/,/g, "")) || 0;
}

function formatAED(val: number): string {
  if (val >= 1_000_000) return `AED ${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `AED ${(val / 1_000).toFixed(0)}K`;
  return `AED ${val.toLocaleString()}`;
}

export default function Analytics() {
  const [clients, setClients] = useState<Client[]>([]);
  const [fleet, setFleet] = useState<FleetAsset[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [resC, resF, resR, resI] = await Promise.all([
          adminFetch("/api/admin/clients", { method: "POST" }),
          adminFetch("/api/admin/fleet", { method: "POST" }),
          adminFetch("/api/admin/requests", { method: "POST" }),
          adminFetch("/api/admin/invoices", { method: "POST" })
        ]);
        if (resC.ok) { const d = await resC.json(); setClients(d.clients || []); }
        if (resF.ok) { const d = await resF.json(); setFleet(d.fleet || []); }
        if (resR.ok) { const d = await resR.json(); setRequests(d.requests || []); }
        if (resI.ok) { const d = await resI.json(); setInvoices(d.invoices || []); }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const totalRevenue = clients.reduce((s, c) => s + parseAED(c.total_spent), 0);
  const deployed    = fleet.filter(f => f.status === "Deployed").length;
  const available   = fleet.filter(f => f.status === "Available").length;
  const maintenance = fleet.filter(f => f.status === "Maintenance").length;
  const totalAssets = fleet.length || 1;
  const utilizationPct = Math.round((deployed / totalAssets) * 100);

  const topClients = [...clients]
    .map(c => ({ ...c, revenue: parseAED(c.total_spent) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
  const maxRevenue = topClients[0]?.revenue || 1;

  // Equipment demand from requests
  const equipmentDemand: Record<string, number> = {};
  requests.forEach(r => {
    const lower = r.equipment_required?.toLowerCase() || "";
    if (lower.includes("excavator")) equipmentDemand["Excavator"] = (equipmentDemand["Excavator"] || 0) + 1;
    else if (lower.includes("forklift")) equipmentDemand["Forklift"] = (equipmentDemand["Forklift"] || 0) + 1;
    else if (lower.includes("crane")) equipmentDemand["Crane"] = (equipmentDemand["Crane"] || 0) + 1;
    else if (lower.includes("truck")) equipmentDemand["Truck"] = (equipmentDemand["Truck"] || 0) + 1;
    else equipmentDemand["Other"] = (equipmentDemand["Other"] || 0) + 1;
  });
  const demandItems = Object.entries(equipmentDemand).sort((a, b) => b[1] - a[1]);
  const maxDemand = demandItems[0]?.[1] || 1;

  // Real Monthly Revenue from Invoices
  const getMonthlyRevenue = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ month: m, value: 0 }));
    
    invoices.forEach(inv => {
      const date = new Date(inv.issued);
      if (date.getFullYear() === currentYear) {
        // Aggregate all invoice amounts (paid or pending) to project revenue
        data[date.getMonth()].value += parseAED(inv.amount);
      }
    });
    return data;
  };
  
  const monthlyData = getMonthlyRevenue();
  const maxMonthly = Math.max(...monthlyData.map(d => d.value), 1);

  // Client growth (by join year)
  const growthByYear: Record<string, number> = {};
  clients.forEach(c => {
    const y = new Date(c.joined).getFullYear().toString();
    growthByYear[y] = (growthByYear[y] || 0) + 1;
  });
  const growthItems = Object.entries(growthByYear).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  const donutData = [
    { label: "Deployed",    value: deployed,    color: "#25D366" },
    { label: "Available",   value: available,   color: "#C5A059" },
    { label: "Maintenance", value: maintenance, color: "#A51A1A" },
  ];
  const total = donutData.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const RADIUS = 60, CX = 80, CY = 80, STROKE = 18;
  const circumference = 2 * Math.PI * RADIUS;

  const kpis = [
    { label: "Total Revenue",   value: formatAED(totalRevenue),  icon: DollarSign, color: "#C5A059",  sub: "All time", trend: "+18%" },
    { label: "Active Clients",  value: clients.length.toString(),          icon: Users,      color: "#25D366",  sub: "Onboarded", trend: "+6%" },
    { label: "Fleet Deployed",  value: `${deployed}/${totalAssets}`,       icon: Truck,      color: "#DFBA73",  sub: "Assets", trend: `${utilizationPct}%` },
    { label: "Avg. Contract",   value: clients.length ? formatAED(Math.round(totalRevenue / clients.length)) : "AED 0", icon: Zap, color: "#7C83FD", sub: "Per client", trend: "+4%" },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
      <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
      <span className="font-bold uppercase tracking-widest text-sm">Loading Analytics…</span>
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white font-orbitron uppercase tracking-tight mb-1">Revenue Analytics</h2>
        <p className="text-gray-400 font-medium text-sm">Financial command center — real-time fleet and revenue intelligence.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-[#111113] border border-white/8 rounded-2xl p-5 relative overflow-hidden group hover:border-white/15 transition-all"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at top right, ${kpi.color}10, transparent 70%)` }} />
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-2xl font-black text-white mb-0.5">{kpi.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly Revenue Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-[#111113] border border-white/8 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-[#7C83FD]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Monthly Revenue Trend (12M)</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-[#25D366] bg-[#25D366]/10 px-2.5 py-1 rounded-full border border-[#25D366]/20">
            <ArrowUp className="w-3 h-3" /> Live DB Sync
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {monthlyData.map((d, i) => {
            const pct = maxMonthly > 1 ? (d.value / maxMonthly) * 100 : 5;
            const isCurrent = i === new Date().getMonth();
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1C23] border border-white/10 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-[10px] font-black text-white">
                  {formatAED(d.value)}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 5)}%` }}
                  transition={{ duration: 0.7, delay: 0.4 + i * 0.04, ease: "easeOut" }}
                  className="w-full rounded-t-md cursor-pointer"
                  style={{ background: isCurrent ? "linear-gradient(180deg, #DFBA73, #C5A059)" : "linear-gradient(180deg, #ffffff18, #ffffff08)", boxShadow: isCurrent ? "0 0 12px #C5A05980" : "none" }}
                />
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isCurrent ? "text-[#C5A059]" : "text-gray-700"}`}>{d.month}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Revenue by Client + Fleet Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Client */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <BarChart3 className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Revenue by Client</h3>
          </div>
          {topClients.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No revenue data yet</div>
          ) : (
            <div className="space-y-3.5">
              {topClients.map((client, i) => {
                const pct = (client.revenue / maxRevenue) * 100;
                const colors = ["#C5A059", "#DFBA73", "#7C83FD", "#25D366", "#FF7C00", "#60A5FA", "#F472B6", "#34D399"];
                return (
                  <motion.div key={client.client_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.06 }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-600 w-4">{i + 1}</span>
                        <span className="text-xs font-bold text-gray-300 truncate max-w-[140px]">{client.name || client.client_id}</span>
                      </div>
                      <span className="text-xs font-black" style={{ color: i === 0 ? "#C5A059" : "#F5F2EB" }}>{client.total_spent || "AED 0"}</span>
                    </div>
                    <div className="h-5 w-full bg-white/5 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.45 + i * 0.06, ease: "easeOut" }}
                        className="h-full rounded-lg relative overflow-hidden"
                        style={{ background: `linear-gradient(90deg, ${colors[i]}cc, ${colors[i]}44)` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Fleet Utilization Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <PieChart className="w-4 h-4 text-[#25D366]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Fleet Utilization</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg viewBox="0 0 160 160" className="w-40 h-40 mb-5 -rotate-90">
                <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#ffffff08" strokeWidth={STROKE} />
                {donutData.map((seg) => {
                  const segLen = (seg.value / total) * circumference;
                  const offset = -(cumulative * circumference) / total;
                  cumulative += seg.value;
                  return (
                    <circle key={seg.label} cx={CX} cy={CY} r={RADIUS} fill="none"
                      stroke={seg.color} strokeWidth={STROKE}
                      strokeDasharray={`${segLen} ${circumference}`}
                      strokeDashoffset={offset} strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 6px ${seg.color}80)` }}
                    />
                  );
                })}
                <text x={CX} y={CY - 7} textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="900" transform={`rotate(90 ${CX} ${CY})`}>{utilizationPct}%</text>
                <text x={CX} y={CY + 13} textAnchor="middle" fill="#6b7280" fontSize="7" fontWeight="700" transform={`rotate(90 ${CX} ${CY})`}>UTILIZATION</text>
              </svg>
            </div>
            <div className="w-full space-y-2">
              {donutData.map(seg => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color, boxShadow: `0 0 5px ${seg.color}80` }} />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{seg.value}</span>
                    <span className="text-[10px] text-gray-600">({Math.round((seg.value / total) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Equipment Demand + Client Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Equipment Demand */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <Package className="w-4 h-4 text-[#FF7C00]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Equipment Demand</h3>
            <span className="text-[10px] text-gray-600 ml-auto">From {requests.length} requests</span>
          </div>
          {demandItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">No request data yet</div>
          ) : (
            <div className="space-y-3">
              {demandItems.map(([label, count], i) => {
                const pct = (count / maxDemand) * 100;
                const colors = ["#FF7C00", "#C5A059", "#DFBA73", "#7C83FD", "#6B7280"];
                return (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-300">{label}</span>
                      <span className="text-xs font-black text-white">{count} <span className="text-gray-600 font-normal">requests</span></span>
                    </div>
                    <div className="h-4 w-full bg-white/5 rounded-md overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.5 + i * 0.06, ease: "easeOut" }}
                        className="h-full rounded-md"
                        style={{ background: `linear-gradient(90deg, ${colors[i] || "#6B7280"}cc, ${colors[i] || "#6B7280"}44)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Client Growth */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#111113] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <Calendar className="w-4 h-4 text-[#7C83FD]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Client Growth by Year</h3>
          </div>
          {growthItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">No client data yet</div>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {growthItems.map(([year, count], i) => {
                const maxG = Math.max(...growthItems.map(g => g[1]));
                const pct = Math.max((count / maxG) * 100, 12);
                return (
                  <div key={year} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1A1C23] border border-white/10 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-[10px] font-black text-white">
                      {count} client{count !== 1 ? "s" : ""}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.55 + i * 0.08, ease: "easeOut" }}
                      className="w-full rounded-t-lg cursor-pointer"
                      style={{ background: `linear-gradient(180deg, #7C83FD, #7C83FD55)`, boxShadow: "0 0 12px #7C83FD40" }}
                    />
                    <span className="text-[9px] font-bold text-gray-600">{year}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Revenue Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="bg-[#111113] border border-white/8 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="w-4 h-4 text-[#7C83FD]" />
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Client Revenue Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["#", "Client", "ID", "Active", "Joined", "Total Revenue", "Share"].map(h => (
                  <th key={h} className={`pb-3 text-[10px] uppercase tracking-widest text-gray-600 font-black ${h === "Total Revenue" || h === "Share" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topClients.map((client, i) => {
                const share = totalRevenue ? Math.round((client.revenue / totalRevenue) * 100) : 0;
                const daysSince = Math.floor((new Date().getTime() - new Date(client.joined).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={client.client_id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3 text-gray-600 font-bold text-xs">{i + 1}</td>
                    <td className="py-3"><span className="text-sm font-bold text-white">{client.name || "—"}</span></td>
                    <td className="py-3"><span className="text-xs font-black text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md">{client.client_id}</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${client.active_rentals > 0 ? "bg-[#25D366]" : "bg-gray-700"}`} />
                        <span className="text-sm text-white font-bold">{client.active_rentals}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-500">{daysSince}d ago</td>
                    <td className="py-3 text-right"><span className={`text-sm font-black ${client.revenue > 0 ? "text-[#C5A059]" : "text-gray-600"}`}>{client.total_spent || "AED 0"}</span></td>
                    <td className="py-3 text-right"><span className="text-xs font-bold text-gray-400">{share}%</span></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td colSpan={5} className="pt-4 text-xs font-black text-gray-400 uppercase tracking-widest">Total</td>
                <td className="pt-4 text-right text-base font-black text-[#C5A059]">{formatAED(totalRevenue)}</td>
                <td className="pt-4 text-right text-xs font-black text-gray-400">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
