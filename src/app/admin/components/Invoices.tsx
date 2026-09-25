"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Eye, Download, FileText, CheckCircle2,
  Clock, AlertCircle, X, Building2, Receipt, AlertTriangle,
  Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { adminFetch } from "@/lib/adminFetch";

type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

type Invoice = {
  id: string;
  client: string;
  client_id: string;
  equipment: string;
  amount: string;
  issued: string;
  due: string;
  status: InvoiceStatus;
  items: { desc: string; qty: number; rate: string; total: string }[];
};

type Client = {
  client_id: string;
  name: string;
};

type FleetAsset = {
  asset_id: string;
  type: string;
  model: string;
  status: string;
  client_id: string | null;
  location: string;
};

const statusConfig: Record<InvoiceStatus, { color: string; bg: string; icon: React.ElementType }> = {
  Paid:    { color: "#25D366", bg: "#25D366", icon: CheckCircle2 },
  Pending: { color: "#DFBA73", bg: "#DFBA73", icon: Clock },
  Overdue: { color: "#A51A1A", bg: "#A51A1A", icon: AlertCircle },
  Draft:   { color: "#6B7280", bg: "#6B7280", icon: FileText },
};

// Loads everything the Invoices tab shows. A section is null when its endpoint failed.
async function fetchInvoiceData() {
  const [resInv, resCli, resFleet] = await Promise.all([
    adminFetch("/api/admin/invoices", { method: "POST" }),
    adminFetch("/api/admin/clients", { method: "POST" }),
    adminFetch("/api/admin/fleet", { method: "POST" })
  ]);
  return {
    invoices: resInv.ok ? ((await resInv.json()).invoices || []) as Invoice[] : null,
    clients: resCli.ok ? ((await resCli.json()).clients || []) as Client[] : null,
    fleet: resFleet.ok ? ((await resFleet.json()).fleet || []) as FleetAsset[] : null,
  };
}

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "All">("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [fleet, setFleet] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Invoice Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({ client_id: "", equipment: "", amount: "", dueDays: "30" });
  const [addError, setAddError] = useState("");

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchInvoiceData>>) => {
    if (data.invoices) setInvoices(data.invoices);
    if (data.clients) setClients(data.clients);
    if (data.fleet) setFleet(data.fleet);
  }, []);

  const refresh = () => fetchInvoiceData().then(applyData).catch((e) => console.error(e));

  useEffect(() => {
    let active = true;
    fetchInvoiceData()
      .then((data) => { if (active) applyData(data); })
      .catch((e) => console.error(e))
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [applyData]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.client_id || !addForm.equipment || !addForm.amount) {
      setAddError("Please fill all fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const client = clients.find(c => c.client_id === addForm.client_id);
      if (!client) throw new Error("Client not found");

      // Auto format AED
      const numAmount = addForm.amount.replace(/[^0-9]/g, "");
      const finalAmount = `AED ${parseInt(numAmount).toLocaleString()}`;
      
      const due = new Date(Date.now() + parseInt(addForm.dueDays) * 24 * 60 * 60 * 1000).toISOString();

      const items = [{
        desc: addForm.equipment,
        qty: 1,
        rate: finalAmount,
        total: finalAmount
      }];

      const res = await adminFetch("/api/admin/invoices", {
        method: "PUT",
        body: JSON.stringify({
          client_name: client.name,
          client_id: client.client_id,
          equipment: addForm.equipment,
          amount: finalAmount,
          issued: new Date().toISOString(),
          due,
          items
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");
      
      setShowAddModal(false);
      setAddForm({ client_id: "", equipment: "", amount: "", dueDays: "30" });
      refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await adminFetch("/api/admin/invoices", {
        method: "PATCH",
        body: JSON.stringify({ id, status: "Paid" })
      });
      if (res.ok) {
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "Paid" } : inv));
        setSelectedInvoice(prev => prev && prev.id === id ? { ...prev, status: "Paid" } : prev);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(197, 160, 89); // #C5A059
    doc.text("TRUXO OS", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("INVOICE", 14, 26);
    
    // Invoice Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #: ${invoice.id}`, 140, 20);
    doc.text(`Issued: ${new Date(invoice.issued).toLocaleDateString("en-AE")}`, 140, 26);
    doc.text(`Due: ${new Date(invoice.due).toLocaleDateString("en-AE")}`, 140, 32);
    doc.text(`Status: ${invoice.status}`, 140, 38);
    
    // Client Info
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.client, 14, 51);
    doc.text(`ID: ${invoice.client_id}`, 14, 57);
    
    const tableData = (invoice.items || []).map(item => [
      item.desc,
      item.qty.toString(),
      item.rate,
      item.total
    ]);
    
    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Qty', 'Rate', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [197, 160, 89] },
      styles: { fontSize: 10, cellPadding: 5 },
      foot: [['', '', 'Total', invoice.amount]],
      footStyles: { fillColor: [245, 242, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
    
    doc.save(`${invoice.id}.pdf`);
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "All" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPaid    = invoices.filter(i => i.status === "Paid").length;
  const totalPending = invoices.filter(i => i.status === "Pending").length;
  const totalOverdue = invoices.filter(i => i.status === "Overdue").length;
  const totalValue   = invoices.length;

  const kpis = [
    { label: "Total Invoices", value: totalValue, color: "#C5A059", icon: Receipt },
    { label: "Paid", value: totalPaid, color: "#25D366", icon: CheckCircle2 },
    { label: "Pending", value: totalPending, color: "#DFBA73", icon: Clock },
    { label: "Overdue", value: totalOverdue, color: "#A51A1A", icon: AlertCircle },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
      <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
      <span className="font-bold uppercase tracking-widest text-sm">Loading Invoices…</span>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white font-orbitron uppercase tracking-tight mb-1">Invoice Center</h2>
          <p className="text-gray-400 font-medium text-sm">Billing management, contract tracking and payment status.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#111113] text-xs font-black uppercase tracking-widest shadow hover:scale-105 transition-transform flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-[#111113] border border-white/8 rounded-2xl p-5 relative overflow-hidden group hover:border-white/15 transition-all"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at top right, ${kpi.color}10, transparent 70%)` }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-black text-white font-orbitron">{kpi.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text" placeholder="Search invoices..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["All", "Paid", "Pending", "Overdue", "Draft"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s as InvoiceStatus | "All")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-[#C5A059] text-[#111113]" : "bg-[#111113] border border-white/10 text-gray-500 hover:text-white"}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111113] border border-white/8 rounded-2xl overflow-hidden min-h-[300px]">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <Receipt className="w-12 h-12 mb-3 text-gray-700" />
            <p className="font-bold text-lg text-white">No invoices found</p>
            <p className="text-sm mt-1">Create your first invoice to populate this list.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest">
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0C] border-b border-white/8">
                  {["Invoice #", "Client", "Equipment", "Amount", "Due Date", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#C5A059] font-orbitron whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((inv, i) => {
                    const cfg = statusConfig[inv.status];
                    return (
                      <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer group"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-white font-orbitron">{inv.id}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">Issued {new Date(inv.issued).toLocaleDateString("en-AE")}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#C5A059]/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white whitespace-nowrap">{inv.client}</p>
                              <p className="text-[10px] text-gray-600">{inv.client_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-gray-400 max-w-[160px] truncate">{inv.equipment}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-[#C5A059] whitespace-nowrap">{inv.amount}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-gray-300 whitespace-nowrap">{new Date(inv.due).toLocaleDateString("en-AE")}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit border" style={{ background: `${cfg.bg}12`, borderColor: `${cfg.bg}30` }}>
                            {React.createElement(cfg.icon as React.ElementType, { className: "w-3 h-3", style: { color: cfg.color } })}
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>{inv.status}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button className="text-xs font-bold text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE INVOICE MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#111113] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/8 flex justify-between items-center bg-[#0A0A0C]">
                <h3 className="text-lg font-black text-white font-orbitron uppercase tracking-wide">Generate Invoice</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Select Client *</label>
                  <select
                    value={addForm.client_id}
                    onChange={(e) => setAddForm({ ...addForm, client_id: e.target.value })}
                    required
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                  >
                    <option value="" disabled>Choose a client</option>
                    {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.name} ({c.client_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Equipment / Asset *</label>
                  <select
                    value={addForm.equipment} onChange={(e) => setAddForm({ ...addForm, equipment: e.target.value })}
                    required className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                  >
                    <option value="" disabled>Choose an asset</option>
                    {fleet.map(f => {
                      const typeParts = (f.type || '').split('||');
                      const modelParts = (f.model || '').split('||');
                      
                      const cleanType = typeParts[0] || '';
                      const cleanModel = modelParts[0] || '';
                      
                      let displayName = cleanType;
                      if (cleanModel && cleanModel !== cleanType) {
                        displayName = displayName ? `${displayName} ${cleanModel}` : cleanModel;
                      }
                      
                      const category = modelParts[1] || typeParts[1];
                      const categoryStr = category ? ` - ${category}` : '';
                      
                      const cleanValue = `${displayName}${categoryStr} (${f.asset_id})`.trim();
                      
                      return (
                        <option key={f.asset_id} value={cleanValue}>
                          {displayName}{categoryStr} {f.client_id ? `(Assigned)` : '(Available)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Amount (AED) *</label>
                    <input
                      type="number" placeholder="180000"
                      value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                      required className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Due Terms</label>
                    <select
                      value={addForm.dueDays} onChange={(e) => setAddForm({ ...addForm, dueDays: e.target.value })}
                      className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                    >
                      <option value="15">Net 15</option>
                      <option value="30">Net 30</option>
                      <option value="60">Net 60</option>
                    </select>
                  </div>
                </div>
                
                {addError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#A51A1A]/10 border border-[#A51A1A]/20">
                    <AlertTriangle className="w-4 h-4 text-[#A51A1A] flex-shrink-0" />
                    <p className="text-xs text-[#A51A1A] font-bold">{addError}</p>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#111113] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : "Generate Invoice"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── INVOICE DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-[#111113] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/8 flex justify-between items-start bg-[#0A0A0C]">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Invoice</p>
                  <h3 className="text-2xl font-black text-white font-orbitron">{selectedInvoice.id}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {(() => { const cfg = statusConfig[selectedInvoice.status]; return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ background: `${cfg.bg}12`, borderColor: `${cfg.bg}30` }}>
                      {React.createElement(cfg.icon as React.ElementType, { className: "w-3.5 h-3.5", style: { color: cfg.color } })}
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.color }}>{selectedInvoice.status}</span>
                    </div>
                  ); })()}
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1">Billed To</p>
                    <p className="text-sm font-bold text-white">{selectedInvoice.client}</p>
                    <p className="text-xs text-gray-500">{selectedInvoice.client_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1">Payment Due</p>
                    <p className="text-sm font-bold text-white">{new Date(selectedInvoice.due).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-3">Line Items</p>
                  <div className="bg-[#0A0A0C] rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-2.5 text-[9px] uppercase tracking-widest text-gray-600 font-black">Description</th>
                          <th className="px-4 py-2.5 text-[9px] uppercase tracking-widest text-gray-600 font-black text-center">Qty</th>
                          <th className="px-4 py-2.5 text-[9px] uppercase tracking-widest text-gray-600 font-black text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedInvoice.items || []).map((item, i) => (
                          <tr key={i} className="border-b border-white/5 last:border-0">
                            <td className="px-4 py-3">
                              <p className="text-xs font-bold text-white">{item.desc}</p>
                              <p className="text-[10px] text-gray-600 mt-0.5">{item.rate}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-bold text-gray-400">{item.qty}</td>
                            <td className="px-4 py-3 text-right text-xs font-black text-[#C5A059]">{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-white/10">
                          <td colSpan={2} className="px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">Total</td>
                          <td className="px-4 py-3 text-right text-base font-black text-[#C5A059]">{selectedInvoice.amount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleExportPDF(selectedInvoice)} className="flex-1 py-2.5 rounded-xl bg-[#111113] border border-[#C5A059]/30 text-[#C5A059] font-black text-xs uppercase tracking-widest hover:bg-[#C5A059]/10 transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  {selectedInvoice.status === "Pending" && (
                    <button onClick={() => handleMarkPaid(selectedInvoice.id)} className="flex-1 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-black text-xs uppercase tracking-widest hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
