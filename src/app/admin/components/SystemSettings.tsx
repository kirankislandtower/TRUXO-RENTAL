"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Shield, Download, Database, ToggleLeft,
  ToggleRight, Info, LogOut, Mail, Phone, Globe,
  Server, Cpu, HardDrive, Wifi, Check, FileText,
  Truck, Users
} from "lucide-react";

interface SystemSettingsProps {
  onLogout: () => void;
}

type ToggleKey = "emailAlerts" | "newRequestAlerts" | "fleetAlerts" | "weeklyReport" | "maintenanceAlerts";

export default function SystemSettings({ onLogout }: SystemSettingsProps) {
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    emailAlerts: true,
    newRequestAlerts: true,
    fleetAlerts: false,
    weeklyReport: true,
    maintenanceAlerts: true,
  });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("profile");

  const toggle = (key: ToggleKey) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    { id: "profile", label: "Admin Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data & Export", icon: Database },
    { id: "system", label: "System Info", icon: Server },
  ];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white font-orbitron uppercase tracking-tight mb-1">System Settings</h2>
        <p className="text-gray-400 font-medium text-sm">Configure your TRUXO OS environment and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Nav */}
        <div className="lg:col-span-1">
          <div className="bg-[#111113] border border-white/8 rounded-2xl p-3 space-y-1 sticky top-28">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                  activeSection === section.id
                    ? "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <section.icon className="w-4 h-4 flex-shrink-0" />
                {section.label}
              </button>
            ))}
            <div className="pt-3 mt-3 border-t border-white/5">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#A51A1A] hover:bg-[#A51A1A]/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Terminate Session
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">
          <AnimatePresence mode="wait">

            {/* ── PROFILE ── */}
            {activeSection === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                <div className="bg-[#111113] border border-white/8 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-5 flex items-center gap-2"><User className="w-4 h-4" /> Admin Profile</h3>
                  <div className="flex items-start gap-5 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#DFBA73] to-[#C5A059] flex items-center justify-center text-[#111113] font-black text-2xl border-2 border-[#C5A059]/30 flex-shrink-0">
                      AD
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-black text-white mb-1">TRUXO Administrator</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/30 text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Super Admin</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#25D366]/10 border border-[#25D366]/20 text-[10px] font-black text-[#25D366] uppercase tracking-widest">● Active</span>
                      </div>
                      <p className="text-xs text-gray-500">Full system access · All modules enabled</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Email", value: "admin@truxo.ae", icon: Mail },
                      { label: "Phone", value: "+971 50 000 0000", icon: Phone },
                      { label: "Organization", value: "TRUXO Heavy Equipment LLC", icon: Globe },
                      { label: "Location", value: "Dubai, UAE", icon: Globe },
                    ].map(field => (
                      <div key={field.label} className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1 flex items-center gap-1.5"><field.icon className="w-3 h-3" />{field.label}</p>
                        <p className="text-sm font-bold text-white">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeSection === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-[#111113] border border-white/8 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-5 flex items-center gap-2"><Bell className="w-4 h-4" /> Notification Preferences</h3>
                  <div className="space-y-3">
                    {([
                      { key: "emailAlerts", label: "Email Alerts", desc: "Receive all system alerts via email" },
                      { key: "newRequestAlerts", label: "New Request Alerts", desc: "Notify when a new rental request arrives" },
                      { key: "fleetAlerts", label: "Fleet Status Alerts", desc: "Notify on fleet status changes" },
                      { key: "weeklyReport", label: "Weekly Revenue Report", desc: "Automated weekly summary email" },
                      { key: "maintenanceAlerts", label: "Maintenance Reminders", desc: "Asset maintenance schedule alerts" },
                    ] as { key: ToggleKey; label: string; desc: string }[]).map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-[#0A0A0C] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-white">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <button onClick={() => toggle(item.key)} className="flex-shrink-0 ml-4">
                          {toggles[item.key]
                            ? <ToggleRight className="w-8 h-8 text-[#C5A059]" />
                            : <ToggleLeft className="w-8 h-8 text-gray-600" />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSave} className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#111113] font-black text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2">
                    {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Preferences"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── SECURITY ── */}
            {activeSection === "security" && (
              <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                <div className="bg-[#111113] border border-white/8 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-5 flex items-center gap-2"><Shield className="w-4 h-4" /> Security</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-[#0A0A0C] rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-white">Authentication Token</p>
                          <p className="text-xs text-gray-500 mt-0.5">Password sign-in (ADMIN_PASSWORD env var) with a signed, httpOnly session cookie</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#25D366]/10 border border-[#25D366]/20 text-[10px] font-black text-[#25D366]">Active</span>
                      </div>
                    </div>
                    <div className="p-4 bg-[#0A0A0C] rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">Current Session</p>
                          <p className="text-xs text-gray-500 mt-0.5">Signed session cookie, expires after 8 hours or on sign-out</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                      </div>
                    </div>
                    <div className="p-4 bg-[#0A0A0C] rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-white">Supabase Service Role</p>
                          <p className="text-xs text-gray-500 mt-0.5">Server-side only — never exposed to client</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#25D366]/10 border border-[#25D366]/20 text-[10px] font-black text-[#25D366]">Secured</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={onLogout} className="mt-5 w-full py-3 rounded-xl bg-[#A51A1A]/10 border border-[#A51A1A]/20 text-[#A51A1A] font-black text-xs uppercase tracking-widest hover:bg-[#A51A1A]/20 transition-colors flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> Terminate Session
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── DATA & EXPORT ── */}
            {activeSection === "data" && (
              <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-[#111113] border border-white/8 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-5 flex items-center gap-2"><Database className="w-4 h-4" /> Data Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Export Client List", desc: "Download all client records as CSV", icon: Users, color: "#7C83FD", action: "clients" },
                      { label: "Export Fleet Report", desc: "Download fleet asset inventory as CSV", icon: Truck, color: "#C5A059", action: "fleet" },
                      { label: "Export Requests Log", desc: "Download all contact requests as CSV", icon: FileText, color: "#DFBA73", action: "requests" },
                    ].map((item) => (
                      <button key={item.label} className="p-5 bg-[#0A0A0C] border border-white/5 rounded-xl hover:border-white/15 transition-colors text-left group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                          <item.icon className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                        <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest group-hover:text-[#C5A059] transition-colors">
                          <Download className="w-3 h-3" /> Download CSV
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 p-4 bg-[#DFBA73]/5 border border-[#DFBA73]/15 rounded-xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-[#DFBA73] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400">Exports are generated from live Supabase data. Data is processed server-side and never stored in browser memory.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SYSTEM INFO ── */}
            {activeSection === "system" && (
              <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-[#111113] border border-white/8 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-5 flex items-center gap-2"><Server className="w-4 h-4" /> System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "TRUXO OS Version", value: "v2.0.0", icon: Cpu, status: "latest" },
                      { label: "Framework", value: "Next.js 15 (App Router)", icon: Globe, status: null },
                      { label: "Database", value: "Supabase PostgreSQL", icon: Database, status: "online" },
                      { label: "Auth Method", value: "ENV Password + JWT", icon: Shield, status: null },
                      { label: "Deployment", value: "Vercel Edge Network", icon: Server, status: "healthy" },
                      { label: "Region", value: "ME-1 (Dubai)", icon: Wifi, status: null },
                      { label: "Storage", value: "Supabase Object Storage", icon: HardDrive, status: null },
                      { label: "Last Updated", value: new Date().toLocaleDateString("en-AE"), icon: Info, status: null },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 p-3 bg-[#0A0A0C] rounded-xl border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">{item.label}</p>
                          <p className="text-sm font-bold text-white truncate">{item.value}</p>
                        </div>
                        {item.status && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${item.status === "latest" || item.status === "healthy" || item.status === "online" ? "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20" : "bg-gray-800 text-gray-500"}`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
