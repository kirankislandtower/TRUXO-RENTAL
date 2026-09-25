"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, LogOut, Loader2, Mail, Inbox, LayoutDashboard,
  Truck, Settings, Bell, MoreVertical, CheckCircle2, Users,
  Activity, Clock, Trash2, X, BarChart3, AlertTriangle,
  Receipt, Eye, Phone
} from "lucide-react";
import FleetTracking from "./components/FleetTracking";
import ClientDirectory from "./components/ClientDirectory";
import Analytics from "./components/Analytics";
import Overview from "./components/Overview";
import SystemSettings from "./components/SystemSettings";
import Invoices from "./components/Invoices";
import { adminFetch, ADMIN_UNAUTHORIZED_EVENT } from "@/lib/adminFetch";
import { parseContactRequest } from "@/lib/contactRequest";

type DispatchFilter = "All" | "Pending" | "Approved" | "Rejected";

type ActiveTab = "overview" | "dispatch" | "fleet" | "clients" | "analytics" | "invoices" | "settings";

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

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [searchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [fleetAssetId, setFleetAssetId] = useState<string | null>(null);
  const [initialFleetFilter, setInitialFleetFilter] = useState("All");
  const [dispatchFilter, setDispatchFilter] = useState<DispatchFilter>("All");
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [lastReadPendingCount, setLastReadPendingCount] = useState(0);

  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (tab: ActiveTab, filter?: string) => {
    setActiveTab(tab);
    if (tab === "fleet") setInitialFleetFilter(filter || "All");
    if (tab === "dispatch") setDispatchFilter((filter as DispatchFilter | undefined) ?? "All");
  };

  // Toast system
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const handleTrackAsset = (assetId: string) => {
    setActiveTab("fleet");
    setFleetAssetId(assetId);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await adminFetch("/api/admin/requests", {
        method: "DELETE",
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setRequests(prev => prev.filter(req => req.id !== id));
        showToast("success", "Request deleted successfully.");
      } else {
        const errData = await res.json();
        showToast("error", "Error: " + errData.error);
      }
    } catch (err: unknown) {
      showToast("error", "Network Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setActiveDropdown(null);
    }
  };

  // Resolves true only when the server confirmed the change, so callers can
  // hold back the customer notification until the approval really happened.
  const handleApprove = async (id: number): Promise<boolean> => {
    try {
      const res = await adminFetch("/api/admin/requests", {
        method: "PATCH",
        body: JSON.stringify({ id, status: "Approved" })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: "Approved" } : req));
        showToast(
          "success",
          data.client_created
            ? `Request approved. Client account ${data.client_id} created.`
            : `Request approved. Existing client ${data.client_id} linked.`
        );
        return true;
      }
      showToast("error", data.error || "Approval failed.");
      return false;
    } catch (err: unknown) {
      showToast("error", "Network Error: " + (err instanceof Error ? err.message : String(err)));
      return false;
    } finally {
      setActiveDropdown(null);
    }
  };

  const handleReject = async (id: number): Promise<boolean> => {
    try {
      const res = await adminFetch("/api/admin/requests", {
        method: "PATCH",
        body: JSON.stringify({ id, status: "Rejected" })
      });
      if (res.ok) {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: "Rejected" } : req));
        showToast("info", "Request rejected.");
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      showToast("error", errData.error || "Rejection failed.");
      return false;
    } catch (err: unknown) {
      showToast("error", "Network Error: " + (err instanceof Error ? err.message : String(err)));
      return false;
    } finally {
      setActiveDropdown(null);
    }
  };

  // Approve/reject, then open the customer's email or WhatsApp draft only if it
  // worked. A blank tab is opened synchronously (inside the click) so popup
  // blockers allow it, then pointed at the message once the API call succeeds.
  const decideAndNotify = async (
    req: ContactRequest,
    decision: "Approve" | "Reject",
    channel: "email" | "whatsapp"
  ) => {
    const draft = window.open("", "_blank");
    const succeeded = decision === "Approve" ? await handleApprove(req.id) : await handleReject(req.id);
    if (!succeeded) {
      draft?.close();
      return;
    }
    const url = channel === "email" ? getEmailUrl(req, decision) : getWhatsAppUrl(req, decision);
    if (draft) draft.location.href = url;
    else window.open(url, "_blank");
  };

  const getWhatsAppUrl = (req: ContactRequest, type: 'Reply' | 'Approve' | 'Reject') => {
    let msg = `Hi ${req.first_name},\n\n`;

    if (type === 'Approve') {
      msg += `Good news from TRUXO! Your equipment request for:\n"${req.equipment_required}"\nhas been approved.\n\nOur team will be in touch shortly with the next steps.`;
    } else if (type === 'Reject') {
      msg += `Thank you for reaching out to TRUXO. Unfortunately, we are unable to fulfill your equipment request for:\n"${req.equipment_required}"\nat this time.\n\nPlease let us know if you have any other requirements.`;
    } else {
      msg += `This is the TRUXO Team regarding your equipment request for:\n"${req.equipment_required}"\n\n`;
    }

    msg += `\n\nBest regards,\nThe TRUXO Team\n🌐 Visit us at: https://truxo.ae`;
    return `https://wa.me/${(req.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
  };

  const getEmailUrl = (req: ContactRequest, type: 'Reply' | 'Approve' | 'Reject') => {
    let subject = "Update on your TRUXO Equipment Request";
    let body = `Hello ${req.first_name},\n\n`;

    if (type === 'Approve') {
      subject = "TRUXO Request Approved!";
      body += `Good news from TRUXO! Your equipment request for "${req.equipment_required}" has been approved.\n\nOur team will be in touch shortly with the next steps.`;
    } else if (type === 'Reject') {
      subject = "TRUXO Request Update";
      body += `Thank you for reaching out to TRUXO. Unfortunately, we are unable to fulfill your equipment request for "${req.equipment_required}" at this time.\n\nPlease let us know if you have any other requirements.`;
    } else {
      body += `This is the TRUXO Team regarding your equipment request for "${req.equipment_required}":\n\n`;
    }

    body += `\n\nBest regards,\nThe TRUXO Team\nadmin@truxo.ae\n🌐 Visit us at: https://truxo.ae`;

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(req.email)}&cc=admin@truxo.ae&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleEmailClient = (req: ContactRequest, type: 'Reply' | 'Approve' | 'Reject') => {
    window.open(getEmailUrl(req, type), '_blank');
  };

  // Fetches the dispatch requests, or null when the API refuses (no valid session
  // cookie -> 401). That makes it double as the "am I signed in?" check.
  const fetchRequests = async (): Promise<ContactRequest[] | null> => {
    const res = await fetch("/api/admin/requests", { method: "POST", credentials: "same-origin" });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.requests || []).map((req: ContactRequest) => parseContactRequest(req));
  };

  const loadRequests = async (): Promise<boolean> => {
    const loaded = await fetchRequests();
    if (!loaded) return false;
    setRequests(loaded);
    setIsAuthenticated(true);
    return true;
  };

  // Restore an existing session (httpOnly cookie) after a refresh.
  useEffect(() => {
    let active = true;
    fetchRequests()
      .then((loaded) => {
        if (!active || !loaded) return;
        setRequests(loaded);
        setIsAuthenticated(true);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Any admin API call that comes back 401 (session expired) lands here.
  useEffect(() => {
    const onUnauthorized = () => {
      setIsAuthenticated(false);
      setRequests([]);
      setLoginError("Your session has expired. Please sign in again.");
    };
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");

      setPassword("");
      if (!(await loadRequests())) throw new Error("Signed in, but the dashboard data could not be loaded.");
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
    setIsAuthenticated(false);
    setPassword("");
    setRequests([]);
  };

  const filteredRequests = requests.filter(req => {
    const matchSearch =
      req.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.equipment_required.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      dispatchFilter === "All" ||
      (dispatchFilter === "Pending" && (!req.status || req.status === "Pending")) ||
      req.status === dispatchFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = requests.filter(r => !r.status || r.status === "Pending").length;
  const unreadCount = Math.max(0, pendingCount - lastReadPendingCount);

  // ── NAV ITEMS ─────────────────────────────────────────────────────────────
  const navGroups = [
    {
      label: "Business",
      items: [
        { id: "overview",  label: "Overview",    icon: LayoutDashboard, badge: null },
        { id: "dispatch",  label: "Dispatch",     icon: Inbox,           badge: pendingCount > 0 ? pendingCount : null },
        { id: "fleet",     label: "Fleet",         icon: Truck,           badge: null },
        { id: "clients",   label: "Clients",       icon: Users,           badge: null },
        { id: "analytics", label: "Analytics",     icon: BarChart3,       badge: null },
        { id: "invoices",  label: "Invoices",       icon: Receipt,         badge: null },
      ]
    },
    {
      label: "System",
      items: [
        { id: "settings",  label: "Settings",       icon: Settings,        badge: null },
      ]
    }
  ];

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </main>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 mb-6 mx-auto">
            <Lock className="w-5 h-5 text-zinc-300" />
          </div>

          <h1 className="text-xl font-semibold text-zinc-100 text-center tracking-tight mb-1">TRUXO OS</h1>
          <p className="text-zinc-400 text-sm text-center mb-8">Sign in to the ERP platform</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Access Token</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]/50 transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-500 font-medium">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 mt-2 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Authenticate</>}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Lock className="w-3 h-3" />
            <span>Secured by Supabase</span>
          </div>
        </motion.div>
      </main>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN ERP DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex">

      {/* ── TOAST SYSTEM ── */}
      <div className="fixed top-6 right-6 z-[200] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto min-w-[260px] max-w-xs ${
                toast.type === "success" ? "bg-emerald-950/50 border-emerald-900/50 text-emerald-400" :
                toast.type === "error"   ? "bg-red-950/50 border-red-900/50 text-red-400" :
                                           "bg-zinc-900 border-zinc-800 text-zinc-300"
              }`}
            >
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {toast.type === "error"   && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              {toast.type === "info"    && <Activity className="w-4 h-4 flex-shrink-0" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:flex w-64 bg-zinc-950 border-r border-zinc-800 flex-col sticky top-0 h-screen z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100 leading-none">TRUXO OS</h1>
              <p className="text-xs text-zinc-500 mt-1">Enterprise Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-zinc-500 px-2 mb-2">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as ActiveTab)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md font-medium text-sm transition-colors ${
                        isActive
                          ? "bg-zinc-800/50 text-zinc-100"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs font-medium bg-[#C5A059] text-white rounded-full px-2 py-0.5 flex-shrink-0">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium text-sm flex-shrink-0">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">Administrator</p>
              <p className="text-xs text-zinc-500">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 px-8 py-4 flex items-center justify-between">
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400">
              {navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) setLastReadPendingCount(pendingCount);
                }}
                className="relative z-20 p-2 rounded-md hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#C5A059] flex items-center justify-center text-[10px] font-bold text-[#111113]">
                    {unreadCount}
                  </span>
                )}
                <Bell className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-[#111113] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30"
                  >
                    <div className="p-4 border-b border-white/5 bg-[#1A1C23]">
                      <h3 className="text-white font-orbitron font-bold text-sm tracking-wide">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {requests.filter(r => !r.status || r.status === "Pending").length > 0 ? (
                        requests.filter(r => !r.status || r.status === "Pending").slice(0, 5).map(req => (
                          <div 
                            key={req.id} 
                            onClick={() => { handleNavigate("dispatch", "Pending"); setShowNotifications(false); }}
                            className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-white text-sm font-medium">{req.first_name} {req.last_name}</p>
                              <span className="text-xs text-gray-500">{timeAgo(req.created_at)}</span>
                            </div>
                            <p className="text-gray-400 text-xs line-clamp-1">Requested: {req.equipment_required}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">
                          No new notifications
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-white/5 bg-[#1A1C23]">
                      <button 
                        onClick={() => { handleNavigate("dispatch"); setShowNotifications(false); }}
                        className="w-full text-center text-xs text-[#C5A059] hover:text-white font-bold uppercase tracking-widest transition-colors"
                      >
                        View All
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Overview
                    onNavigate={(tab, filter) => handleNavigate(tab as ActiveTab, filter)}
                    onViewRequest={(req) => {
                      setSelectedRequest(req);
                      handleNavigate("dispatch");
                    }}
                  />
                </motion.div>
              )}

              {/* ── DISPATCH ── */}
              {activeTab === "dispatch" && (
                <motion.div key="dispatch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {activeDropdown !== null && (
                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                  )}
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-1">Dispatch Console</h2>
                    <p className="text-zinc-400 text-sm">Manage incoming rental requests and client onboarding.</p>
                  </div>

                  {/* KPI Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: "Total Inquiries", value: requests.length, icon: Activity, trend: "All time" },
                      { label: "Pending Review",  value: pendingCount,   icon: Clock,    trend: "Requires action", highlight: pendingCount > 0 },
                      { label: "Approved Clients",value: requests.filter(r => r.status === "Approved").length, icon: CheckCircle2, trend: "Accounts active" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-lg ${kpi.highlight ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'bg-zinc-800 text-zinc-400'}`}>
                            <kpi.icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-zinc-500">{kpi.trend}</span>
                        </div>
                        <p className="text-2xl font-semibold text-zinc-100 mb-1">{kpi.value}</p>
                        <p className="text-sm font-medium text-zinc-400">{kpi.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Filter Tabs + Table */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                      {(["All", "Pending", "Approved", "Rejected"] as const).map(f => (
                        <button key={f} onClick={() => setDispatchFilter(f)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            dispatchFilter === f 
                              ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {f}
                          {f === "Pending" && pendingCount > 0 && <span className="ml-2 text-xs bg-zinc-700 px-1.5 py-0.5 rounded-md">{pendingCount}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto min-h-[320px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/50">
                            {["Date", "Client Name", "Contact Email", "Equipment Request", "Status", ""].map(h => (
                              <th key={h} className="px-6 py-3 text-xs font-medium text-zinc-500 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {filteredRequests.length === 0 ? (
                              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <td colSpan={6} className="px-6 py-24 text-center">
                                  <Inbox className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                                  <p className="text-zinc-300 font-medium">No requests found</p>
                                  <p className="text-zinc-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                                </td>
                              </motion.tr>
                            ) : filteredRequests.map((req) => (
                              <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                                onClick={() => setSelectedRequest(req)}
                                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {new Date(req.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <p className="font-medium text-zinc-200 text-sm">{req.first_name} {req.last_name}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <p className="text-sm text-zinc-400">{req.email}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-400 max-w-[200px] truncate">{req.equipment_required}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    req.status === "Approved"  ? "bg-emerald-500/10 text-emerald-400" :
                                    req.status === "Rejected"  ? "bg-red-500/10 text-red-400" :
                                                                 "bg-amber-500/10 text-amber-400"
                                  }`}>
                                    {req.status || "Pending Review"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right relative">
                                  <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === req.id ? null : req.id); }}
                                    className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  <AnimatePresence>
                                    {activeDropdown === req.id && (
                                      <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }} transition={{ duration: 0.15 }}
                                        className="absolute right-12 top-8 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px] py-1"
                                      >
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); setActiveDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                                          <Eye className="w-4 h-4" /> View Details
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(req.id); setActiveDropdown(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── REQUEST DETAILS MODAL ── */}
                  <AnimatePresence>
                    {selectedRequest && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={() => setSelectedRequest(null)} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
                        />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                        >
                          <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
                            <div>
                              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Request #{selectedRequest.id}</p>
                              <h3 className="text-xl font-bold text-zinc-100">{selectedRequest.first_name} {selectedRequest.last_name}</h3>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-1">Email Address</p>
                                <p className="text-sm font-medium text-zinc-200">{selectedRequest.email}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-1">Phone (WhatsApp)</p>
                                <p className="text-sm font-medium text-zinc-200">{selectedRequest.phone || "Not provided"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-1">Address / Site Location</p>
                                <p className="text-sm font-medium text-zinc-200">{selectedRequest.address || "Not provided"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-1">Date Submitted</p>
                                <p className="text-sm font-medium text-zinc-200">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs font-medium text-zinc-500 mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                                        selectedRequest.status === "Approved"  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                        selectedRequest.status === "Rejected"  ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                                                     "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      }`}>
                                  {selectedRequest.status || "Pending Review"}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-2">Equipment Required / Message</p>
                              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap">
                                {selectedRequest.equipment_required}
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
                              <button onClick={() => {
                                const msg = `Hi ${selectedRequest.first_name},\n\nThis is the TRUXO Team. We received your dispatch request for:\n"${selectedRequest.equipment_required}"\n\nOur team is reviewing your requirements and will get back to you shortly.\n\nBest regards,\nThe TRUXO Team\n🌐 Visit us at: https://truxo.ae`;
                                window.open(`https://wa.me/${(selectedRequest.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                              }} className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4" /> Message on WhatsApp
                              </button>
                              <button onClick={() => handleEmailClient(selectedRequest, 'Reply')} className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
                                <Mail className="w-4 h-4" /> Reply to Client (CC Admin)
                              </button>
                              
                              {selectedRequest.status !== "Approved" && selectedRequest.status !== "Rejected" && (
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                  <button onClick={() => { decideAndNotify(selectedRequest, 'Approve', 'email'); setSelectedRequest(null); }} className="py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                                    <Mail className="w-3 h-3" /> Approve (Email)
                                  </button>
                                  <button onClick={() => { decideAndNotify(selectedRequest, 'Approve', 'whatsapp'); setSelectedRequest(null); }} className="py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                                    <Phone className="w-3 h-3" /> Approve (WA)
                                  </button>
                                  
                                  <button onClick={() => { decideAndNotify(selectedRequest, 'Reject', 'email'); setSelectedRequest(null); }} className="py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2">
                                    <Mail className="w-3 h-3" /> Reject (Email)
                                  </button>
                                  <button onClick={() => { decideAndNotify(selectedRequest, 'Reject', 'whatsapp'); setSelectedRequest(null); }} className="py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2">
                                    <Phone className="w-3 h-3" /> Reject (WA)
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {deleteConfirmId !== null && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative z-10">
                          <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                              <Trash2 className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Request?</h3>
                            <p className="text-sm text-zinc-400 mb-6">
                              Are you sure you want to delete this request? This action cannot be undone and it will be permanently removed from the system.
                            </p>
                            <div className="flex gap-3 w-full">
                              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-widest transition-colors">
                                Cancel
                              </button>
                              <button onClick={() => { handleDelete(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest transition-colors">
                                Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── OTHER TABS ── */}
              {activeTab === "fleet" && (
                <motion.div key="fleet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <FleetTracking activeAssetId={fleetAssetId} setActiveAssetId={setFleetAssetId} initialFilter={initialFleetFilter} />
                </motion.div>
              )}
              {activeTab === "clients" && (
                <motion.div key="clients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <ClientDirectory onTrackAsset={handleTrackAsset} />
                </motion.div>
              )}
              {activeTab === "analytics" && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Analytics />
                </motion.div>
              )}
              {activeTab === "invoices" && (
                <motion.div key="invoices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Invoices />
                </motion.div>
              )}
              {activeTab === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <SystemSettings onLogout={handleLogout} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pt-3 pb-8 px-6 flex justify-around items-center">
          {[
            { id: "overview",  icon: LayoutDashboard, label: "Home" },
            { id: "dispatch",  icon: Inbox,           label: "Dispatch", badge: pendingCount },
            { id: "fleet",     icon: Truck,            label: "Fleet" },
            { id: "clients",   icon: Users,            label: "Clients" },
            { id: "analytics", icon: BarChart3,        label: "Reports" },
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id as ActiveTab)} className="flex flex-col items-center gap-1 relative">
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#C5A059] text-white text-[9px] font-medium flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-zinc-100" : "text-zinc-500"}`} />
                <span className={`text-[10px] font-medium ${isActive ? "text-zinc-100" : "text-zinc-500"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </main>
  );
}
