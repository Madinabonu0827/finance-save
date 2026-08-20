"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Budget, Category } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/state-views";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Row {
  category: Category;
  budget: Budget | null;
}

export default function BudgetPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogCategory, setDialogCategory] = useState<Category | null>(null);
  const [limitInput, setLimitInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([api.get<Category[]>("/categories"), api.get<Budget[]>("/budgets")])
      .then(([cats, buds]) => {
        setCategories(cats);
        setBudgets(buds);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklab bo'lmadi"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openDialog(category: Category, existing: Budget | null) {
    setDialogCategory(category);
    setLimitInput(existing ? String(existing.limit) : "");
  }

  async function handleSave() {
    if (!dialogCategory) return;
    const limit = Number(limitInput);
    if (!limit || limit <= 0) {
      toast.error("Limitni to'g'ri kiriting");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/budgets", { categoryId: dialogCategory._id, limit });
      toast.success("Byudjet limiti saqlandi");
      setDialogCategory(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  const rows: Row[] | null =
    categories && budgets
      ? categories
          .filter((c) => c.type === "expense")
          .map((category) => ({
            category,
            budget: budgets.find((b) => b.category.id === category._id) || null,
          }))
      : null;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Byudjet</h1>
        <p className="text-sm text-muted-foreground mt-1">Har kategoriya uchun oylik xarajat limitini belgilang</p>
      </div>

      {rows === null && !error && <LoadingState label="Byudjet yuklanmoqda..." />}
      {error && <ErrorState message={error} onRetry={load} />}

      {rows !== null && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ category, budget }) => {
            const pct = budget && budget.limit > 0 ? Math.min(100, Math.round((budget.spent / budget.limit) * 100)) : 0;
            const over = budget ? budget.spent >= budget.limit : false;
            const near = budget ? !over && budget.spent / budget.limit >= 0.8 : false;
            return (
              <Card
                key={category._id}
                className="cursor-pointer transition-colors duration-150 hover:border-primary/50"
                onClick={() => openDialog(category, budget)}
              >
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.emoji}</span>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    {over && <span className="text-xs font-medium text-red-600 dark:text-red-400">Limitdan oshdi</span>}
                    {near && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Limitga yaqin</span>}
                  </div>
                  <Progress
                    value={pct}
                    className={
                      over
                        ? "[&_[data-slot=progress-indicator]]:bg-red-500"
                        : near
                          ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
                          : ""
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    {budget
                      ? `${formatMoney(budget.spent, user?.currency)} / ${formatMoney(budget.limit, user?.currency)}`
                      : "0 / Limit yo'q"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!dialogCategory} onOpenChange={(o) => !o && setDialogCategory(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogCategory?.emoji} {dialogCategory?.name} — limit belgilash
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Oylik limit (so&apos;m)</Label>
            <Input
              type="number"
              min={1}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder="masalan: 1000000"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCategory(null)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
