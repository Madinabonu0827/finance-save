"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Wallet,
  PiggyBank,
  HandCoins,
  Sparkles,
  Settings,
  LogOut,
  Wallet as LogoIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/statistics", label: t("nav.statistics"), icon: PieChart },
    { href: "/budget", label: t("nav.budget"), icon: Wallet },
    { href: "/savings", label: t("nav.savings"), icon: PiggyBank },
    { href: "/debts", label: t("nav.debts"), icon: HandCoins },
    { href: "/ai", label: t("nav.ai"), icon: Sparkles },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r bg-card">
        <div className="flex items-center gap-2 px-5 h-16 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LogoIcon className="h-4 w-4" />
          </div>
          <span className="font-semibold">Finance AI</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <span className="text-sm font-medium truncate">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} title={t("nav.logout")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center justify-between h-14 px-4 border-b bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LogoIcon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm">Finance AI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">{children}</main>

        {/* Mobile bottom nav — icon-only, 7 items eng tor ekranda ham sig'ishi uchun */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 grid grid-cols-7 border-t bg-card">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {active && <span className="h-1 w-1 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
