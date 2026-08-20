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
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer } from "@/components/ui/chart";
import { LoadingState, ErrorState, EmptyState } from "@/components/state-views";
import { CategoryIcon } from "@/lib/category-icons";

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
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [type, setType] = useState<"expense" | "income">("expense");

  const load = useCallback(() => {
    api
      .get<Transaction[]>("/transactions")
      .then((tx) => {
        setTransactions(tx);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t("dashboard.loadError")));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (transactions ?? []).filter((tx) => tx.type === type && withinPeriod(tx.date, period)),
    [transactions, type, period]
  );

  const allFilteredForPeriod = useMemo(
    () => (transactions ?? []).filter((tx) => withinPeriod(tx.date, period)),
    [transactions, period]
  );

  const income = allFilteredForPeriod.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
  const expense = allFilteredForPeriod.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
  const balance = income - expense;

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    filtered.forEach((tx) => {
      const key = tx.category?._id || "boshqa";
      const existing = map.get(key);
      if (existing) {
        existing.amount += tx.amount;
      } else {
        map.set(key, { name: tx.category?.name || "Boshqa", amount: tx.amount });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const total = byCategory.reduce((s, c) => s + c.amount, 0);
  const isDark = resolvedTheme === "dark";

  // "Top xarajatlar" Xarajat/Daromad tab holatidan qat'i nazar doim xarajatlarni ko'rsatadi.
  const topExpenses = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    allFilteredForPeriod
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const key = tx.category?._id || "boshqa";
        const existing = map.get(key);
        if (existing) existing.amount += tx.amount;
        else map.set(key, { name: tx.category?.name || "Boshqa", amount: tx.amount });
      });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [allFilteredForPeriod]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("stats.title")}</h1>
        <Tabs value={period} onValueChange={(v) => v && setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="week">{t("stats.week")}</TabsTrigger>
            <TabsTrigger value="month">{t("stats.month")}</TabsTrigger>
            <TabsTrigger value="year">{t("stats.year")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {transactions === null && !error && <LoadingState label={t("stats.loading")} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {transactions !== null && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="px-3">
                <p className="text-xs text-muted-foreground">{t("stats.income")}</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatMoney(income, user?.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3">
                <p className="text-xs text-muted-foreground">{t("stats.expense")}</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">
                  -{formatMoney(expense, user?.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3">
                <p className="text-xs text-muted-foreground">{t("stats.balance")}</p>
                <p className="text-sm font-semibold mt-1">{formatMoney(balance, user?.currency)}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={type} onValueChange={(v) => v && setType(v as "expense" | "income")}>
            <TabsList>
              <TabsTrigger value="expense">{t("stats.expenses")}</TabsTrigger>
              <TabsTrigger value="income">{t("stats.incomes")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardContent>
              <h2 className="font-semibold mb-3">
                {t("stats.distribution", { type: type === "expense" ? t("stats.expenses") : t("stats.incomes") })}
              </h2>
              {byCategory.length === 0 ? (
                <EmptyState title={t("stats.noData")} icon={PieChartIcon} />
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
                          <span className="truncate flex items-center gap-1.5">
                            <CategoryIcon name={c.name} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {c.name}
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
              <h2 className="font-semibold mb-3">{t("stats.topExpenses")}</h2>
              {topExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("stats.noExpenses")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {topExpenses.slice(0, 5).map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm py-1">
                      <span className="flex items-center gap-1.5">
                        <CategoryIcon name={c.name} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {c.name}
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
