"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { chartColor } from "@/lib/chart-colors";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer } from "@/components/ui/chart";
import { LoadingState, ErrorState, EmptyState } from "@/components/state-views";

type Period = "week" | "month" | "year";

function withinPeriod(dateStr: string, period: Period): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }
  if (period === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return date.getFullYear() === now.getFullYear();
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [type, setType] = useState<"expense" | "income">("expense");

  const load = useCallback(() => {
    setError(null);
    api
      .get<Transaction[]>("/transactions")
      .then(setTransactions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklab bo'lmadi"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (transactions ?? []).filter((t) => t.type === type && withinPeriod(t.date, period)),
    [transactions, type, period]
  );

  const allFilteredForPeriod = useMemo(
    () => (transactions ?? []).filter((t) => withinPeriod(t.date, period)),
    [transactions, period]
  );

  const income = allFilteredForPeriod.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = allFilteredForPeriod.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; amount: number }>();
    filtered.forEach((t) => {
      const key = t.category?._id || "boshqa";
      const existing = map.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        map.set(key, { name: t.category?.name || "Boshqa", emoji: t.category?.emoji || "💰", amount: t.amount });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const total = byCategory.reduce((s, c) => s + c.amount, 0);
  const isDark = resolvedTheme === "dark";

  // "Top xarajatlar" Xarajat/Daromad tab holatidan qat'i nazar doim xarajatlarni ko'rsatadi.
  const topExpenses = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; amount: number }>();
    allFilteredForPeriod
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.category?._id || "boshqa";
        const existing = map.get(key);
        if (existing) existing.amount += t.amount;
        else map.set(key, { name: t.category?.name || "Boshqa", emoji: t.category?.emoji || "💰", amount: t.amount });
      });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [allFilteredForPeriod]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Statistika</h1>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="week">Hafta</TabsTrigger>
            <TabsTrigger value="month">Oy</TabsTrigger>
            <TabsTrigger value="year">Yil</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {transactions === null && !error && <LoadingState label="Statistika yuklanmoqda..." />}
      {error && <ErrorState message={error} onRetry={load} />}

      {transactions !== null && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="px-3">
                <p className="text-xs text-muted-foreground">Daromad</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatMoney(income, user?.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3">
                <p className="text-xs text-muted-foreground">Xarajat</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">
                  -{formatMoney(expense, user?.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3">
                <p className="text-xs text-muted-foreground">Balans</p>
                <p className="text-sm font-semibold mt-1">{formatMoney(balance, user?.currency)}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
            <TabsList>
              <TabsTrigger value="expense">Xarajatlar</TabsTrigger>
              <TabsTrigger value="income">Daromadlar</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardContent>
              <h2 className="font-semibold mb-3">
                {type === "expense" ? "Xarajatlar" : "Daromadlar"} taqsimoti
              </h2>
              {byCategory.length === 0 ? (
                <EmptyState
                  title="Ushbu davrda ma'lumot mavjud emas"
                  icon={PieChartIcon}
                />
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0" style={{ width: 220, height: 220 }}>
                  <ChartContainer config={{}} className="w-full h-full aspect-auto">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="90%"
                        paddingAngle={2}
                        strokeWidth={2}
                        stroke={isDark ? "#1a1a19" : "#fcfcfb"}
                        isAnimationActive={false}
                      >
                        {byCategory.map((c, i) => (
                          <Cell key={c.name} fill={chartColor(i, isDark)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [formatMoney(Number(value), user?.currency), String(name)]}
                        contentStyle={{
                          background: isDark ? "#1a1a19" : "#fcfcfb",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ChartContainer>
                  </div>
                  <div className="flex-1 w-full flex flex-col gap-2">
                    {byCategory.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: chartColor(i, isDark) }}
                          />
                          <span className="truncate">
                            {c.emoji} {c.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground shrink-0 ml-2">
                          {total > 0 ? Math.round((c.amount / total) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="font-semibold mb-3">Top xarajatlar</h2>
              {topExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ushbu davrda xarajatlar mavjud emas</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {topExpenses.slice(0, 5).map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm py-1">
                      <span>
                        {c.emoji} {c.name}
                      </span>
                      <span className="font-medium">{formatMoney(c.amount, user?.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
