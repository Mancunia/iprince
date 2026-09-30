"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { setAdminSession, checkPasscode } from "@/lib/auth/adminAuth";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMethod, setAuthMethod] = useState<"passcode" | "credentials">("passcode");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (checkPasscode(passcode)) {
        setAdminSession();
        router.push(`/${locale}/admin`);
      } else {
        setError("Invalid security passcode. Use 'iprince-admin-2026' or your custom key.");
        setLoading(false);
      }
    }, 400);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (email.includes("@") && password.length >= 6) {
        setAdminSession({ email, name: "Prince I. (Owner)" });
        router.push(`/${locale}/admin`);
      } else {
        setError("Invalid credentials. Please enter a valid email and password.");
        setLoading(false);
      }
    }, 400);
  };

  const handleQuickDemoAccess = () => {
    setLoading(true);
    setAdminSession();
    setTimeout(() => {
      router.push(`/${locale}/admin`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060E18] via-[#0B192C] to-[#060E18] flex items-center justify-center p-4">
      {/* Decorative Glow */}
      <div className="absolute w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-navy-600/20 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="w-full max-w-md bg-[#0B192C]/90 border border-[#1E293B] shadow-2xl rounded-2xl p-8 backdrop-blur-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-500 to-gold-400 text-navy-950 font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border-2 border-gold-300">
            ♛
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            iPrince Recruiting
          </h1>
          <p className="text-xs text-gold-400 font-semibold tracking-widest uppercase mt-1">
            Owner Command Portal
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Restricted access for administrative and content operations
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#070F1E] p-1 rounded-xl mb-6 border border-[#1E293B]">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("passcode");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMethod === "passcode"
                ? "bg-gold-500 text-navy-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Master Passcode
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("credentials");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMethod === "credentials"
                ? "bg-gold-500 text-navy-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Email & Password
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {authMethod === "passcode" ? (
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Owner Access Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter security passcode..."
                  required
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                <span>Default passcode: <code className="text-gold-400">iprince-admin-2026</code></span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-950 font-bold py-3 rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Enter Command Center →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@iprince-recruiting.de"
                required
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-950 font-bold py-3 rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Sign In to Console →"}
            </button>
          </form>
        )}

        {/* Quick Demo Access Button */}
        <div className="mt-6 pt-6 border-t border-[#1E293B] text-center">
          <button
            type="button"
            onClick={handleQuickDemoAccess}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <span>⚡ 1-Click Instant Owner Login (Demo Mode)</span>
          </button>

          <Link
            href={`/${locale}`}
            className="inline-block text-xs text-slate-400 hover:text-gold-400 mt-4 transition-colors"
          >
            ← Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
