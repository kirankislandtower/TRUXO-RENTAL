"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Mail, Phone, Building2, Calendar,
  FileText, X, Briefcase, MapPin, TrendingUp, CheckCircle2,
  Truck, Plus, Loader2, ArrowUpDown, AlertTriangle
} from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

export type Client = {
  client_id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  active_rentals: number;
  total_spent: string;
  joined: string;
};

export type FleetAsset = {
  asset_id: string;
  type: string;
  model: string;
  location: string;
  client_id: string | null;
};

type SortField = "name" | "active_rentals" | "total_spent" | "joined";

function parseAED(val: string): number {
  if (!val) return 0;
  const clean = val.replace("AED ", "").trim();
  if (clean.endsWith("M")) return parseFloat(clean) * 1_000_000;
  if (clean.endsWith("K")) return parseFloat(clean) * 1_000;
  return parseInt(clean.replace(/,/g, "")) || 0;
}

function getHealthScore(client: Client): { score: "High" | "Medium" | "Low"; color: string; bg: string } {
  const revenue = parseAED(client.total_spent);
  const hasActiveRentals = client.active_rentals > 0;
  if (revenue >= 100_000 && hasActiveRentals) return { score: "High", color: "#25D366", bg: "#25D366" };
  if (revenue >= 30_000 || hasActiveRentals) return { score: "Medium", color: "#DFBA73", bg: "#DFBA73" };
  return { score: "Low", color: "#A51A1A", bg: "#A51A1A" };
}

export default function ClientDirectory({ onTrackAsset }: { onTrackAsset?: (assetId: string) => void } = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [fleet, setFleet] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDesc, setSortDesc] = useState(true);

  // Add Client Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", contact: "", email: "", phone: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await adminFetch("/api/admin/clients", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }

        const resFleet = await adminFetch("/api/admin/fleet", { method: "POST" });
        if (resFleet.ok) {
          const data = await resFleet.json();
          setFleet(data.fleet || []);
        }
      } catch (err) {
        console.error("Failed to fetch clients", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    if (!addForm.name || !addForm.email) { setAddError("Name and Email are required."); return; }
    setIsAdding(true);
    try {
      const res = await adminFetch("/api/admin/clients", {
        method: "PUT",
        body: JSON.stringify({ ...addForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");
      // Refresh client list
      const refreshRes = await adminFetch("/api/admin/clients", { method: "POST" });
      if (refreshRes.ok) { const d = await refreshRes.json(); setClients(d.clients || []); }
      setAddSuccess(`Client created successfully! ID: ${data.client_id}`);
      setAddForm({ name: "", contact: "", email: "", phone: "" });
      setTimeout(() => { setShowAddModal(false); setAddSuccess(""); }, 2000);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsAdding(false);
    }
  };

  const selectedClient = clients.find(c => c.client_id === selectedClientId);

  const sortedClients = [...clients].sort((a, b) => {
    let av: number | string, bv: number | string;
    if (sortField === "total_spent") { av = parseAED(a.total_spent); bv = parseAED(b.total_spent); }
    else if (sortField === "active_rentals") { av = a.active_rentals; bv = b.active_rentals; }
    else if (sortField === "joined") { av = new Date(a.joined).getTime(); bv = new Date(b.joined).getTime(); }
    else { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    if (av < bv) return sortDesc ? 1 : -1;
    if (av > bv) return sortDesc ? -1 : 1;
    return 0;
  });

  const filteredClients = sortedClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else { setSortField(field); setSortDesc(true); }
  };

  const renderSortButton = (field: SortField, label: string) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors ${sortField === field ? "text-[#C5A059]" : "text-gray-600 hover:text-gray-400"}`}
    >
      {label} <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
      <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
      <span className="font-bold uppercase tracking-widest text-sm">Loading Clients…</span>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white font-orbitron uppercase tracking-tight mb-1">Client Directory</h2>
        <p className="text-gray-400 font-medium text-sm">Manage corporate relationships, contracts, and active accounts.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Clients", value: clients.length, color: "#C5A059", icon: Users },
          { label: "Active Accounts", value: clients.filter(c => c.active_rentals > 0).length, color: "#25D366", icon: CheckCircle2 },
          { label: "High Value", value: clients.filter(c => parseAED(c.total_spent) >= 100_000).length, color: "#7C83FD", icon: TrendingUp },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-[#111113] border border-white/8 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-black text-white font-orbitron">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#111113] text-xs font-black uppercase tracking-widest shadow hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Client Table */}
      <div className="bg-[#111113] border border-white/8 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0C] border-b border-white/8">
                <th className="px-6 py-4">
                  {renderSortButton("name", "Company")}
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Contact</th>
                <th className="px-6 py-4">
                  {renderSortButton("active_rentals", "Active Units")}
                </th>
                <th className="px-6 py-4">
                  {renderSortButton("total_spent", "Total Value")}
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Health</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">No clients found</p>
                    {searchQuery && <p className="text-gray-600 text-sm mt-1">Try adjusting your search</p>}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => {
                  const health = getHealthScore(client);
                  return (
                    <motion.tr
                      key={client.client_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/15 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-[#C5A059]" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{client.name}</p>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{client.client_id} · Joined {new Date(client.joined).getFullYear()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-300 font-medium">{client.contact}</p>
                        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={`mailto:${client.email}`} className="text-[#C5A059] hover:text-white transition-colors"><Mail className="w-3.5 h-3.5" /></a>
                          {client.phone && <a href={`tel:${client.phone}`} className="text-[#C5A059] hover:text-white transition-colors"><Phone className="w-3.5 h-3.5" /></a>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${client.active_rentals > 0 ? "bg-[#25D366] shadow-[0_0_6px_#25D36680]" : "bg-gray-700"}`} />
                          <span className="text-white font-black font-orbitron text-sm">{client.active_rentals}</span>
                          <span className="text-xs text-gray-600">units</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#C5A059]">{client.total_spent || "AED 0"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit border" style={{ background: `${health.bg}12`, borderColor: `${health.bg}30` }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: health.color, boxShadow: `0 0 5px ${health.color}80` }} />
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: health.color }}>{health.score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedClientId(client.client_id)}
                          className="text-xs font-bold text-[#C5A059] uppercase tracking-widest hover:text-white transition-colors border border-[#C5A059]/25 px-3.5 py-1.5 rounded-lg hover:bg-[#C5A059]/10 opacity-0 group-hover:opacity-100"
                        >
                          Profile →
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD CLIENT MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setAddError(""); setAddSuccess(""); }}
              className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#111113] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#DFBA73] to-[#C5A059]" />
              <div className="p-6 border-b border-white/8 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-white font-orbitron uppercase tracking-wide">New Client</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Client ID will be auto-generated</p>
                </div>
                <button onClick={() => { setShowAddModal(false); setAddError(""); setAddSuccess(""); }}
                  className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddClient} className="p-6 space-y-4">
                {[
                  { key: "name", label: "Company / Client Name", placeholder: "Emirates Construction LLC", required: true },
                  { key: "contact", label: "Primary Contact Person", placeholder: "Ahmed Al Maktoum", required: false },
                  { key: "email", label: "Email Address", placeholder: "contact@company.ae", required: true },
                  { key: "phone", label: "Phone Number", placeholder: "+971 50 000 0000", required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                      {field.label} {field.required && <span className="text-[#A51A1A]">*</span>}
                    </label>
                    <input
                      type={field.key === "email" ? "email" : field.key === "phone" ? "tel" : "text"}
                      placeholder={field.placeholder}
                      value={addForm[field.key as keyof typeof addForm]}
                      onChange={e => setAddForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      required={field.required}
                      className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors placeholder:text-gray-700"
                    />
                  </div>
                ))}

                {addError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#A51A1A]/10 border border-[#A51A1A]/20">
                    <AlertTriangle className="w-4 h-4 text-[#A51A1A] flex-shrink-0" />
                    <p className="text-xs text-[#A51A1A] font-bold">{addError}</p>
                  </div>
                )}
                {addSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
                    <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                    <p className="text-xs text-[#25D366] font-bold">{addSuccess}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAddModal(false); setAddError(""); setAddSuccess(""); }}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isAdding}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#111113] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                    {isAdding ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Client"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CLIENT PROFILE MODAL ── */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedClientId(null)}
              className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
            />
            <motion.div
              data-lenis-prevent="true"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-[#111113] border border-white/10 shadow-2xl rounded-3xl overflow-y-auto overscroll-contain scrollbar-hide"
            >
              {/* Sticky Header */}
              <div className="p-6 border-b border-white/8 flex justify-between items-start sticky top-0 bg-[#111113]/95 backdrop-blur-md z-10">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/20">
                    <Building2 className="w-7 h-7 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white font-orbitron">{selectedClient.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">ID: <span className="text-[#C5A059]">{selectedClient.client_id}</span></p>
                      {(() => { const h = getHealthScore(selectedClient); return (
                        <span className="px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest" style={{ color: h.color, background: `${h.bg}12`, borderColor: `${h.bg}30` }}>{h.score} Value</span>
                      ); })()}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedClientId(null)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact + Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Primary Contact</h4>
                    <p className="text-base font-bold text-white mb-2">{selectedClient.contact}</p>
                    <div className="space-y-1.5">
                      <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#C5A059] transition-colors"><Mail className="w-3.5 h-3.5" />{selectedClient.email}</a>
                      {selectedClient.phone && <a href={`tel:${selectedClient.phone}`} className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#C5A059] transition-colors"><Phone className="w-3.5 h-3.5" />{selectedClient.phone}</a>}
                    </div>
                  </div>
                  <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Billing Address</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      TRUXO Tower, Office 402<br />Sheikh Zayed Road<br />Dubai, United Arab Emirates
                    </p>
                  </div>
                </div>

                {/* Account Overview */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Account Overview</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4">
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-1">Lifetime Value</p>
                      <p className="text-lg font-black text-[#C5A059]">{selectedClient.total_spent || "AED 0"}</p>
                    </div>
                    <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4">
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-1">Active Rentals</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${selectedClient.active_rentals > 0 ? "bg-[#25D366] shadow-[0_0_6px_#25D36680]" : "bg-gray-700"}`} />
                        <p className="text-lg font-black text-white">{selectedClient.active_rentals}</p>
                      </div>
                    </div>
                    <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4">
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-1">Credit Limit</p>
                      <p className="text-lg font-black text-white">AED 2.5M</p>
                    </div>
                  </div>
                </section>

                {/* Contract Timeline */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Contract Timeline</h4>
                  <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Client Since</p>
                        <p className="text-sm font-bold text-white">{new Date(selectedClient.joined).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Relationship</p>
                        <p className="text-sm font-bold text-[#C5A059]">
                          {Math.floor((new Date().getTime() - new Date(selectedClient.joined).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-[#C5A059] to-[#DFBA73] rounded-full" />
                    </div>
                  </div>
                </section>

                {/* Current Deployments */}
                {selectedClient.active_rentals > 0 && (
                  <section>
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Current Deployments</h4>
                    <div className="space-y-2">
                      {fleet.filter(f => f.client_id === selectedClient.client_id).map(asset => (
                        <div key={asset.asset_id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/8 hover:border-[#C5A059]/25 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                              <Truck className="w-4 h-4 text-[#25D366]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{asset.type} · {asset.model}</p>
                              <p className="text-xs text-gray-500">{asset.location} · #{asset.asset_id}</p>
                            </div>
                          </div>
                          <button onClick={() => onTrackAsset && onTrackAsset(asset.asset_id)}
                            className="text-[10px] font-black text-[#C5A059] hover:text-white uppercase tracking-widest transition-colors border border-[#C5A059]/20 px-3 py-1 rounded-lg hover:bg-[#C5A059]/10">
                            Track
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Documents */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Corporate Documents</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Trade License", status: "Verified", year: null },
                      { name: "Master Service Agreement", status: "Signed", year: "2021" },
                    ].map(doc => (
                      <button key={doc.name} className="p-4 rounded-xl border border-white/8 hover:bg-white/3 text-left transition-colors group">
                        <FileText className="w-5 h-5 text-gray-500 mb-2 group-hover:text-[#C5A059] transition-colors" />
                        <p className="text-xs font-bold text-white">{doc.name}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#25D366]" />{doc.status}{doc.year ? ` ${doc.year}` : ""}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
