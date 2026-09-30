"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { getAdminSession, clearAdminSession, AdminUser } from "@/lib/auth/adminAuth";
import { cmsService } from "@/lib/services/cmsService";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname?.includes("/admin/login");

  useEffect(() => {
    const session = getAdminSession();
    setUser(session);

    if (!session && !isLoginPage) {
      router.push(`/${locale}/admin/login`);
    } else {
      setLoading(false);
      // Load badge counts
      const subs = cmsService.getSubmissions();
      const newSubs = subs.filter((s) => s.status === "new").length;
      setUnreadCount(newSubs);

      const revs = cmsService.getReviews();
      const pendRevs = revs.filter((r) => r.status === "pending").length;
      setPendingReviewsCount(pendRevs);
    }
  }, [pathname, isLoginPage, locale, router]);

  const handleLogout = () => {
    clearAdminSession();
    router.push(`/${locale}/admin/login`);
  };

  // On login page, render children without sidebar shell
  if (isLoginPage) {
    return <div className="min-h-screen bg-[#060E18] text-white">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E18] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400 font-medium tracking-wide">Loading Sovereign Admin Console...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      href: `/${locale}/admin`,
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      exact: true,
    },
    {
      href: `/${locale}/admin/content`,
      label: "Site Content CMS",
      badge: "App Pages",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/categories`,
      label: "Blog Categories",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/blogs`,
      label: "Blog Articles",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/submissions`,
      label: "Form Submissions",
      badgeCount: unreadCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/reviews`,
      label: "Reviews & Ratings",
      badgeCount: pendingReviewsCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B192C] border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500 text-navy-950 font-bold flex items-center justify-center text-sm">
            iP
          </div>
          <span className="font-bold text-white text-sm">iPrince Admin</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded text-gray-300 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileSidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-72 bg-[#0B192C] border-r border-[#1E293B] flex-shrink-0 z-40`}
      >
        <div className="p-6 flex flex-col h-full justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#1E293B]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 font-black flex items-center justify-center shadow-lg text-lg">
                ♛
              </div>
              <div>
                <h1 className="font-bold text-white leading-tight tracking-wide text-base">
                  iPrince Recruiting
                </h1>
                <p className="text-xs text-gold-400 font-semibold tracking-wider uppercase">
                  Owner Command Center
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-gold-500/20 to-transparent text-gold-400 border-l-3 border-gold-500 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-gold-400" : "text-slate-400"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {item.badgeCount}
                      </span>
                    ) : item.badge ? (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Quick Link */}
          <div className="mt-8 pt-6 border-t border-[#1E293B] space-y-4">
            <Link
              href={`/${locale}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 rounded-lg transition-colors border border-white/10"
            >
              <span>View Public Live Site</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <div className="flex items-center justify-between bg-[#070F1E] p-3 rounded-xl border border-[#1E293B]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  PI
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{user?.name || "Owner"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || "admin@iprince.de"}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0B192C]/80 backdrop-blur border-b border-[#1E293B] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-400/10 px-2.5 py-1 rounded-md border border-gold-400/20">
              Sovereign Administration
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">Status: Secure Online Mode</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/admin/blogs/new`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-950 text-xs font-bold px-3.5 py-2 rounded-lg shadow transition-all"
            >
              <span>+ New Blog Post</span>
            </Link>

            <Link
              href={`/${locale}/admin/submissions`}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Form Submissions"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0B192C]" />
              )}
            </Link>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
