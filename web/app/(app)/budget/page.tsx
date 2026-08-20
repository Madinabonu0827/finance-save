"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Budget, Category, RecurringPayment } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/state-views";
import { CategoryIcon } from "@/lib/category-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Row {
  category: Category;
  budget: Budget | null;
}

export default function BudgetPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [recurring, setRecurring] = useState<RecurringPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogCategory, setDialogCategory] = useState<Category | null>(null);
  const [limitInput, setLimitInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [recurringOpen, setRecurringOpen] = useState(false);
  const [rName, setRName] = useState("");
  const [rAmount, setRAmount] = useState("");
  const [rCategoryId, setRCategoryId] = useState("");
  const [rDay, setRDay] = useState("1");
  const [rSubmitting, setRSubmitting] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get<Category[]>("/categories"),
      api.get<Budget[]>("/budgets"),
      api.get<RecurringPayment[]>("/recurring"),
    ])
      .then(([cats, buds, rec]) => {
        setCategories(cats);
        setBudgets(buds);
        setRecurring(rec);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t("dashboard.loadError")));
  }, [t]);

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
      toast.error(t("budget.enterValidLimit"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/budgets", { categoryId: dialogCategory._id, limit });
      toast.success(t("budget.limitSavedToast"));
      setDialogCategory(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  function openRecurringDialog() {
    setRName("");
    setRAmount("");
    setRCategoryId("");
    setRDay("1");
    setRecurringOpen(true);
  }

  async function handleCreateRecurring() {
    const amount = Number(rAmount);
    const day = Number(rDay);
    if (!rName.trim()) return toast.error(t("budget.enterName"));
    if (!amount || amount <= 0) return toast.error(t("budget.enterValidAmount"));
    if (!rCategoryId) return toast.error(t("budget.selectCategory"));
    if (!day || day < 1 || day > 28) return toast.error(t("budget.dayRangeError"));
    setRSubmitting(true);
    try {
      await api.post("/recurring", { name: rName, amount, categoryId: rCategoryId, dayOfMonth: day });
      toast.success(t("budget.recurringAddedToast"));
      setRecurringOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setRSubmitting(false);
    }
  }

  async function handleDeleteRecurring(id: string) {
    try {
      await api.delete(`/recurring/${id}`);
      toast.success(t("common.deleted"));
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    }
  }

  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

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
        <h1 className="text-2xl font-bold tracking-tight">{t("budget.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("budget.subtitle")}</p>
      </div>

      {rows === null && !error && <LoadingState label={t("budget.loading")} />}
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
                      <CategoryIcon name={category.name} className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    {over && <span className="text-xs font-medium text-red-600 dark:text-red-400">{t("budget.over")}</span>}
                    {near && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t("budget.near")}</span>}
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
                      : `0 / ${t("budget.noLimit")}`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {rows !== null && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> {t("budget.recurring")}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("budget.recurringDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={openRecurringDialog}>
              <Plus className="h-4 w-4" /> {t("common.add")}
            </Button>
          </div>

          {recurring === null && <LoadingState label={t("common.loading")} />}
          {recurring !== null && recurring.length === 0 && (
            <EmptyState title={t("budget.recurringEmpty")} icon={RefreshCw} />
          )}
          {recurring !== null && recurring.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {recurring.map((r) => (
                <Card key={r._id}>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon name={r.category.name} className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("budget.recurringDay", { day: r.dayOfMonth })} · {formatMoney(r.amount, user?.currency)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteRecurring(r._id)}
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("budget.recurringAdd")}</DialogTitle>
            <DialogDescription>{t("budget.recurringAddDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>{t("budget.name")}</Label>
              <Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder={t("budget.namePlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t("budget.amount")}</Label>
                <Input type="number" min={1} value={rAmount} onChange={(e) => setRAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label>{t("budget.dayOfMonth")}</Label>
                <Input type="number" min={1} max={28} value={rDay} onChange={(e) => setRDay(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("budget.category")}</Label>
              <Select value={rCategoryId} onValueChange={(v) => v && setRCategoryId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.select")}>
                    {(v: string) => {
                      const c = expenseCategories.find((cat) => cat._id === v);
                      return c ? (
                        <span className="flex items-center gap-1.5">
                          <CategoryIcon name={c.name} className="h-4 w-4 shrink-0" /> {c.name}
                        </span>
                      ) : (
                        t("common.select")
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      <CategoryIcon name={c.name} className="h-4 w-4 shrink-0" /> {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecurringOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateRecurring} disabled={rSubmitting}>
              {rSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogCategory} onOpenChange={(o) => !o && setDialogCategory(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CategoryIcon name={dialogCategory?.name} className="h-4 w-4" />
              {dialogCategory?.name} — {t("budget.setLimit")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>{t("budget.monthlyLimit")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
