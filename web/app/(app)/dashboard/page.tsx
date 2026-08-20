"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Mic, Plus, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Transaction } from "@/lib/types";
import { formatMoney, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState, ErrorState } from "@/components/state-views";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";

interface Summary {
  balance: number;
  income: number;
  expense: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"expense" | "income">("expense");

  const load = useCallback(() => {
    setError(null);
    Promise.all([api.get<Transaction[]>("/transactions?limit=10"), api.get<Summary>("/dashboard/summary")])
      .then(([tx, sum]) => {
        setTransactions(tx);
        setSummary(sum);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklab bo'lmadi"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const balance = summary?.balance ?? 0;
  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;

  function openDialog(type: "expense" | "income") {
    setDialogType(type);
    setDialogOpen(true);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div>
        <p className="text-muted-foreground text-sm">Salom, {user?.name}! 👋</p>
        <p className="text-4xl font-bold tracking-tight mt-1">
          {summary === null ? "···" : formatMoney(balance, user?.currency)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Joriy balans</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Daromadlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              +{summary === null ? "···" : formatMoney(income, user?.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Xarajatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-red-600 dark:text-red-400">
              -{summary === null ? "···" : formatMoney(expense, user?.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" variant="destructive" onClick={() => openDialog("expense")}>
          <Plus className="h-4 w-4" /> Xarajat qo&apos;shish
        </Button>
        <Button className="flex-1" onClick={() => openDialog("income")}>
          <Plus className="h-4 w-4" /> Daromad qo&apos;shish
        </Button>
        <Button variant="outline" size="icon" onClick={() => openDialog("expense")} title="Ovozli kiritish">
          <Mic className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <h2 className="font-semibold mb-3">So&apos;nggi amallar</h2>
        {transactions === null && !error && <LoadingState label="Tranzaksiyalar yuklanmoqda..." />}
        {error && <ErrorState message={error} onRetry={load} />}
        {transactions !== null && !error && transactions.length === 0 && (
          <EmptyState
            title="Hozircha tranzaksiya yo'q"
            description="Yuqoridagi tugmalar orqali birinchi xarajat yoki daromadingizni qo'shing"
            icon={TrendingUp}
          />
        )}
        {transactions !== null && transactions.length > 0 && (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <Card key={t._id} className="py-3">
                <CardContent className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                      {t.category?.emoji || "💰"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{t.category?.name || "Boshqa"}</p>
                      <p className="text-xs text-muted-foreground truncate">{formatDateTime(t.date)}</p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold text-sm shrink-0 ${
                      t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatMoney(t.amount, user?.currency)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddTransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultType={dialogType} onSuccess={load} />
    </div>
  );
}
