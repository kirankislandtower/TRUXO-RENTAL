import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Search, Filter, Activity, Wrench, CheckCircle2, X, FileText, BarChart3, ActivitySquare, MapPin, ChevronDown, Download, Eye, Upload, Trash2, Edit2, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";
import { parseAssetData } from "@/lib/fleetAsset";

export type FleetAsset = {
  asset_id: string;
  type: string;
  model: string;
  status: string;
  client_id: string | null;
  location: string;
  hours: number;
  image?: string | null;
  daily_rent?: number;
  hourly_rate?: number;
};

// Only what the per-asset revenue total needs from an invoice row.
type InvoiceSummary = { equipment?: string | null; amount?: string | number | null };

export type Client = {
  client_id: string;
  name: string;
};

export default function FleetTracking({ activeAssetId, setActiveAssetId, initialFilter = "All" }: { activeAssetId?: string | null, setActiveAssetId?: (id: string | null) => void, initialFilter?: string } = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localAssetId, setLocalAssetId] = useState<string | null>(null);
  const [fleet, setFleet] = useState<FleetAsset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedClientToAssign, setSelectedClientToAssign] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ asset_id: "", brand: "", name: "", image: "", daily_rent: "", hourly_rate: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [editAssetForm, setEditAssetForm] = useState({ asset_id: "", brand: "", name: "", image: "", daily_rent: "", hourly_rate: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        if (isEdit) {
          setEditAssetForm(prev => ({ ...prev, image: data.url }));
        } else {
          setNewAsset(prev => ({ ...prev, image: data.url }));
        }
      } else {
        alert(`Image upload failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed: network error");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const selectedAssetId = activeAssetId !== undefined ? activeAssetId : localAssetId;
  const setSelectedAssetId = setActiveAssetId || setLocalAssetId;

  const [showDocs, setShowDocs] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [resFleet, resClients, resInvoices] = await Promise.all([
          adminFetch("/api/admin/fleet", { method: "POST" }),
          adminFetch("/api/admin/clients", { method: "POST" }),
          adminFetch("/api/admin/invoices", { method: "POST" })
        ]);

        if (resFleet.ok) {
          const data = await resFleet.json();
          setFleet(data.fleet || []);
        }

        if (resClients.ok) {
          const data = await resClients.json();
          setClients(data.clients || []);
        }

        if (resInvoices.ok) {
          const data = await resInvoices.json();
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error("Failed to fetch", err);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedClientToAssign || !selectedAssetId) return;
    setIsSubmittingAssign(true);
    try {
      const res = await adminFetch("/api/admin/fleet", {
        method: "PATCH",
        body: JSON.stringify({ asset_id: selectedAssetId, client_id: selectedClientToAssign })
      });
      if (res.ok) {
        setFleet(prev => prev.map(f => f.asset_id === selectedAssetId ? { ...f, status: 'Deployed', client_id: selectedClientToAssign, location: 'Client Job Site' } : f));
        setIsAssigning(false);
        setSelectedClientToAssign("");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to assign asset: ${data.error || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to assign asset: network error");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Closing must reset the per-asset panels, otherwise the next asset you open
  // inherits the previous one's half-open edit form or assign picker.
  const closeAssetModal = () => {
    setSelectedAssetId(null);
    setIsEditingAsset(false);
    setIsAssigning(false);
    setSelectedClientToAssign("");
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const generatedAssetId = `AST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const finalAsset = { ...newAsset, asset_id: generatedAssetId };
      const res = await adminFetch("/api/admin/fleet", {
        method: "PUT",
        body: JSON.stringify({ ...finalAsset, type: finalAsset.brand, model: `${finalAsset.brand}||${finalAsset.name}||${finalAsset.image}`, image: finalAsset.image })
      });
      if (res.ok) {
        // Mirror what the server stored (it defaults location/hours/rates), so the
        // new card has every field the list and search rely on.
        const created: FleetAsset = {
          asset_id: generatedAssetId,
          type: newAsset.brand,
          model: `${newAsset.brand}||${newAsset.name}||${newAsset.image}`,
          image: newAsset.image,
          status: 'Available',
          client_id: null,
          location: 'Main Depot',
          hours: 0,
          daily_rent: parseInt(newAsset.daily_rent) || 1200,
          hourly_rate: parseInt(newAsset.hourly_rate) || 350,
        };
        setFleet(prev => [created, ...prev]);
        setShowAddModal(false);
        setNewAsset({ asset_id: "", brand: "", name: "", image: "", daily_rent: "", hourly_rate: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to add asset: ${data.error || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;
    setIsSavingEdit(true);
    try {
      const res = await adminFetch("/api/admin/fleet", {
        method: "PATCH",
        body: JSON.stringify({
          action: "edit_details",
          old_asset_id: selectedAssetId,
          ...editAssetForm, type: editAssetForm.brand, model: `${editAssetForm.brand}||${editAssetForm.name}||${editAssetForm.image}`
        })
      });
      if (res.ok) {
        setFleet(prev => prev.map(f => f.asset_id === selectedAssetId ? { 
          ...f, 
          ...editAssetForm,
          type: editAssetForm.brand,
          model: `${editAssetForm.brand}||${editAssetForm.name}||${editAssetForm.image}`,
          daily_rent: parseInt(editAssetForm.daily_rent as string) || 1200, 
          hourly_rate: parseInt(editAssetForm.hourly_rate as string) || 350 
        } : f));
        if (editAssetForm.asset_id !== selectedAssetId) {
          setSelectedAssetId(editAssetForm.asset_id);
        }
        setIsEditingAsset(false);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to edit asset: ${data.error || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteAsset = async (asset_id: string) => {
    setIsDeleting(true);
    try {
      const res = await adminFetch("/api/admin/fleet", {
        method: "DELETE",
        body: JSON.stringify({ asset_id })
      });
      if (res.ok) {
        setFleet(prev => prev.filter(f => f.asset_id !== asset_id));
        if (selectedAssetId === asset_id) closeAssetModal();
        setDeleteConfirmAsset(null);
      } else {
        alert("Failed to delete asset");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (asset_id: string, new_status: string) => {
    setIsChangingStatus(true);
    try {
      const res = await adminFetch("/api/admin/fleet", {
        method: "PATCH",
        body: JSON.stringify({ asset_id, new_status })
      });
      if (res.ok) {
        setFleet(prev => prev.map(f => {
          if (f.asset_id !== asset_id) return f;
          if (new_status === 'Available') return { ...f, status: 'Available', client_id: null, location: 'Main Depot' };
          return { ...f, status: new_status };
        }));
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const selectedAsset = fleet.find(a => a.asset_id === selectedAssetId);

  const calculateTotalRevenue = (assetId: string) => {
    return invoices
      .filter(inv => inv.equipment && inv.equipment.includes(assetId))
      .reduce((sum, inv) => {
        const numAmount = parseInt(String(inv.amount).replace(/[^0-9]/g, "")) || 0;
        return sum + numAmount;
      }, 0);
  };

  const filteredFleet = fleet.filter(asset => {
    const matchesSearch = asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "All") return matchesSearch;
    return matchesSearch && asset.status === activeFilter;
  });

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-white font-orbitron uppercase tracking-tight mb-2">Fleet Command Center</h2>
        <p className="text-gray-400 font-medium">Real-time status and deployment tracking of all heavy assets.</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Assets", filterValue: "All", value: fleet.length.toString(), icon: Truck, color: "#FFFFFF" },
          { label: "Deployed", filterValue: "Deployed", value: fleet.filter(a => a.status === 'Deployed').length.toString(), icon: Activity, color: "#25D366" },
          { label: "Available", filterValue: "Available", value: fleet.filter(a => a.status === 'Available').length.toString(), icon: CheckCircle2, color: "#C5A059" },
          { label: "In Maintenance", filterValue: "Maintenance", value: fleet.filter(a => a.status === 'Maintenance').length.toString(), icon: Wrench, color: "#A51A1A" },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            onClick={() => setActiveFilter(stat.filterValue)}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`cursor-pointer bg-[#111113] border ${activeFilter === stat.filterValue ? 'border-[#C5A059]' : 'border-white/10 hover:border-white/20'} rounded-2xl p-5 flex items-center gap-4 shadow-lg transition-colors`}
          >
            <div className="w-12 h-12 rounded-full bg-[#1A1C23] flex items-center justify-center border border-white/5">
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-white font-orbitron">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by ID, Model, or Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            {showFilterMenu && (
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
            )}
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="relative z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#111113] border border-white/10 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Filter className="w-4 h-4" /> {activeFilter === "All" ? "Filter" : activeFilter}
            </button>
            
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-[#1A1C23] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30"
                >
                  {["All", "Available", "Deployed", "Maintenance"].map(status => (
                    <button
                      key={status}
                      onClick={() => { setActiveFilter(status); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors ${activeFilter === status ? 'text-[#C5A059]' : 'text-gray-400'}`}
                    >
                      {status}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/50 text-[#C5A059] hover:bg-[#C5A059] hover:text-[#12131A] transition-colors text-xs font-black uppercase tracking-wider"
          >
            + Add Asset
          </button>
        </div>
      </div>

      {/* Fleet Grid */}
      {filteredFleet.length === 0 ? (
        <div className="p-10 text-center text-gray-500 bg-[#111113]/50 rounded-2xl border border-white/10">
          No equipment found matching &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFleet.map((asset, i) => (
            <motion.div 
              key={asset.asset_id}
              onClick={() => setSelectedAssetId(asset.asset_id)}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="bg-[#111113]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#C5A059]/30 transition-all group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -z-10 group-hover:bg-[#C5A059]/5 transition-colors" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[#C5A059] font-black text-lg font-orbitron uppercase">{parseAssetData(asset).brand}</p>
                  <p className="text-sm text-gray-400 font-bold capitalize">{parseAssetData(asset).name}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  asset.status === 'Deployed' ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20' : 
                  asset.status === 'Available' ? 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20' :
                  'bg-[#A51A1A]/10 text-[#A51A1A] border-[#A51A1A]/20'
                }`}>
                  {asset.status}
                </div>
              </div>

              <div className="space-y-2 mt-6 border-t border-white/5 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-widest">Daily Rent</span>
                  <span className="text-[#25D366] font-bold">{asset.daily_rent ? asset.daily_rent.toLocaleString() : "1,200"} AED</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-widest">Per Hour</span>
                  <span className="text-white font-bold">{asset.hourly_rate ? asset.hourly_rate.toLocaleString() : "350"} AED</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Centered Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeAssetModal}
              className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
            />
            
            {/* Centered Panel */}
            <motion.div 
              data-lenis-prevent="true"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl max-h-[90vh] bg-[#111113] border border-white/10 shadow-2xl rounded-3xl overflow-y-auto overscroll-contain scrollbar-hide"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111113]/90 backdrop-blur-md z-10">
                <div>
                  <h3 className="text-2xl font-black text-white font-orbitron uppercase">{parseAssetData(selectedAsset).brand}</h3>
                  <p className="text-sm text-[#C5A059] font-bold capitalize">{parseAssetData(selectedAsset).name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    setIsEditingAsset(true);
                    const pData = parseAssetData(selectedAsset);
                    setEditAssetForm({
                      asset_id: selectedAsset.asset_id,
                      brand: pData.brand,
                      name: pData.name,
                      image: pData.image,
                      daily_rent: selectedAsset.daily_rent?.toString() || "1200",
                      hourly_rate: selectedAsset.hourly_rate?.toString() || "350"
                    });
                  }} className="p-2 rounded-full hover:bg-[#C5A059]/10 text-[#C5A059] transition-colors group">
                    <Edit2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => setDeleteConfirmAsset(selectedAsset.asset_id)} className="p-2 rounded-full hover:bg-[#A51A1A]/10 text-[#A51A1A] transition-colors group">
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={closeAssetModal} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {isEditingAsset ? (
                <form onSubmit={handleEditAsset} className="p-6 space-y-4">

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Brand</label>
                    <input required type="text" value={editAssetForm.brand} onChange={e => setEditAssetForm({...editAssetForm, brand: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name / Model</label>
                    <input required type="text" value={editAssetForm.name} onChange={e => setEditAssetForm({...editAssetForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Image</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="/images/asset.jpg or URL" value={editAssetForm.image} onChange={e => setEditAssetForm({...editAssetForm, image: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                      <label className="flex items-center justify-center px-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors shrink-0">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, true)} />
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" /> : <Upload className="w-4 h-4 text-gray-400" />}
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Daily Rent (AED)</label>
                      <input required type="number" min="0" value={editAssetForm.daily_rent} onChange={e => setEditAssetForm({...editAssetForm, daily_rent: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Per Hour (AED)</label>
                      <input required type="number" min="0" value={editAssetForm.hourly_rate} onChange={e => setEditAssetForm({...editAssetForm, hourly_rate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setIsEditingAsset(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl uppercase tracking-widest transition-colors">
                      Cancel
                    </button>
                    <button disabled={isSavingEdit} type="submit" className="flex-1 py-4 bg-[#C5A059] hover:bg-[#b08d4a] text-[#12131A] font-black rounded-xl uppercase tracking-widest transition-colors disabled:opacity-50">
                      {isSavingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 pb-24 space-y-8">
                {/* Status Card with Action Buttons */}
                <div className="bg-[#1A1C23] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedAsset.status === 'Deployed' ? 'bg-[#25D366]/20 text-[#25D366]' : selectedAsset.status === 'Available' ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-[#A51A1A]/20 text-[#A51A1A]'}`}>
                      <ActivitySquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Current Status</p>
                      <p className="text-lg font-bold text-white">{selectedAsset.status}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAsset.status === 'Deployed' && (
                      <button
                        onClick={() => handleStatusChange(selectedAsset.asset_id, 'Available')}
                        disabled={isChangingStatus}
                        className="flex-1 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-black uppercase tracking-widest hover:bg-[#25D366]/20 transition-colors disabled:opacity-50"
                      >
                        ↩ Mark as Returned
                      </button>
                    )}
                    {selectedAsset.status === 'Available' && (
                      <button
                        onClick={() => handleStatusChange(selectedAsset.asset_id, 'Maintenance')}
                        disabled={isChangingStatus}
                        className="flex-1 py-2.5 rounded-xl bg-[#A51A1A]/10 border border-[#A51A1A]/30 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-[#A51A1A]/20 transition-colors disabled:opacity-50"
                      >
                        🔧 Send to Maintenance
                      </button>
                    )}
                    {selectedAsset.status === 'Maintenance' && (
                      <button
                        onClick={() => handleStatusChange(selectedAsset.asset_id, 'Available')}
                        disabled={isChangingStatus}
                        className="flex-1 py-2.5 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-black uppercase tracking-widest hover:bg-[#C5A059]/20 transition-colors disabled:opacity-50"
                      >
                        ✅ Mark as Available
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignment */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs uppercase tracking-widest font-black text-gray-400 flex items-center gap-2"><MapPin className="w-4 h-4" /> Assignment</h4>
                    {selectedAsset.status === 'Available' && (
                      <button
                        onClick={() => setIsAssigning(!isAssigning)}
                        className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] font-black uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-[#C5A059]/30 transition-colors"
                      >
                        {isAssigning ? "Cancel" : "Assign Asset"}
                      </button>
                    )}
                  </div>

                  {isAssigning ? (
                    <div className="bg-[#1A1C23]/80 rounded-xl p-5 border border-[#C5A059]/30">
                      <p className="text-sm text-gray-300 font-medium mb-3">Select a Client for Deployment:</p>
                      <select
                        value={selectedClientToAssign}
                        onChange={(e) => setSelectedClientToAssign(e.target.value)}
                        className="w-full bg-[#111113] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C5A059]/50 mb-4"
                      >
                        <option value="">-- Choose Client --</option>
                        {clients.map(c => (
                          <option key={c.client_id} value={c.client_id}>{c.name} ({c.client_id})</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={!selectedClientToAssign || isSubmittingAssign}
                        className="w-full py-3 bg-[#C5A059] hover:bg-[#b08d4a] text-[#12131A] font-black rounded-lg uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmittingAssign ? "Assigning..." : "Confirm Assignment"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-[#1A1C23]/50 rounded-xl p-4 border border-white/5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Assigned Client</span>
                        <span className="text-white font-bold">
                          {selectedAsset.client_id
                            ? clients.find(c => c.client_id === selectedAsset.client_id)?.name ?? selectedAsset.client_id
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Location</span>
                        <span className="text-white font-bold">{selectedAsset.location}</span>
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-widest font-black text-gray-400 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Financials</h4>
                  <div className="bg-gradient-to-br from-[#DFBA73]/10 to-[#C5A059]/5 border border-[#C5A059]/20 rounded-xl p-5 flex justify-between items-center">
                    <p className="text-sm text-gray-300 font-bold uppercase tracking-widest">Total Billed Revenue</p>
                    <p className="text-xl font-black text-[#25D366]">AED {calculateTotalRevenue(selectedAsset.asset_id).toLocaleString()}</p>
                  </div>
                </section>
                
                {/* Documents */}
                <section>
                  <button 
                    onClick={() => setShowDocs(!showDocs)}
                    className="w-full py-4 px-5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold text-sm flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> View Registration & Documents</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDocs ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showDocs && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-3">
                          {/* Document Item 1 */}
                          <div className="bg-[#1A1C23] border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#A51A1A]/10 flex items-center justify-center border border-[#A51A1A]/20">
                                <FileText className="w-5 h-5 text-[#A51A1A]" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">RTA Registration (Mulkiya)</p>
                                <p className="text-xs text-gray-500">Expires: Oct 12, 2026</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 mr-2">Valid</span>
                              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                            </div>
                          </div>

                          {/* Document Item 2 */}
                          <div className="bg-[#1A1C23] border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/20">
                                <FileText className="w-5 h-5 text-[#C5A059]" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">Comprehensive Insurance</p>
                                <p className="text-xs text-[#C5A059]">Expiring in 14 Days</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 mr-2">Soon</span>
                              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Upload className="w-4 h-4" /></button>
                              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111113] border border-white/10 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1A1C23]">
                <h3 className="text-xl font-black text-white uppercase tracking-widest">Add New Equipment</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAsset} className="p-6 space-y-4">

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Brand</label>
                  <input required type="text" placeholder="e.g. CAT" value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name / Model</label>
                  <input required type="text" placeholder="e.g. D8T Bulldozer" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Image</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="/images/asset.jpg or URL" value={newAsset.image} onChange={e => setNewAsset({...newAsset, image: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                    <label className="flex items-center justify-center px-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors shrink-0">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, false)} />
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" /> : <Upload className="w-4 h-4 text-gray-400" />}
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Daily Rent (AED)</label>
                    <input required type="number" min="0" value={newAsset.daily_rent} onChange={e => setNewAsset({...newAsset, daily_rent: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Per Hour (AED)</label>
                    <input required type="number" min="0" value={newAsset.hourly_rate} onChange={e => setNewAsset({...newAsset, hourly_rate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#C5A059]/50 focus:outline-none" />
                  </div>
                </div>

                <button disabled={isAdding} type="submit" className="w-full mt-4 py-4 bg-[#C5A059] hover:bg-[#b08d4a] text-[#12131A] font-black rounded-xl uppercase tracking-widest transition-colors disabled:opacity-50">
                  {isAdding ? "Adding..." : "Add to Fleet"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmAsset && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteConfirmAsset(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm bg-[#111113] border border-[#A51A1A]/40 shadow-[0_0_60px_rgba(165,26,26,0.3)] rounded-3xl overflow-hidden"
            >
              {/* Red accent top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[#A51A1A] via-red-500 to-[#A51A1A]" />

              <div className="p-8 flex flex-col items-center text-center">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-[#A51A1A]/10 border border-[#A51A1A]/30 flex items-center justify-center mb-5">
                  <Trash2 className="w-9 h-9 text-[#A51A1A]" />
                </div>

                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Confirm Deletion</h3>
                <p className="text-gray-400 text-sm mb-1">You are about to permanently remove</p>
                <p className="text-[#C5A059] font-black text-lg tracking-widest mb-1">#{deleteConfirmAsset}</p>
                <p className="text-gray-500 text-xs mb-8">This action cannot be undone. The asset will be removed from your fleet database.</p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteConfirmAsset(null)}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(deleteConfirmAsset)}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl bg-[#A51A1A] hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting...</>
                    ) : (
                      <><Trash2 className="w-4 h-4" /> Delete</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
