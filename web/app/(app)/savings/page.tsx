"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, PiggyBank, PartyPopper } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { SavingsGoal } from "@/lib/types";
import { formatMoney, formatDate } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState, EmptyState } from "@/components/state-views";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SavingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const [addGoal, setAddGoal] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api
      .get<SavingsGoal[]>("/savings")
      .then((goals) => {
        setGoals(goals);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t("dashboard.loadError")));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    const amount = Number(targetAmount);
    if (!name.trim()) return toast.error(t("savings.enterName"));
    if (!amount || amount <= 0) return toast.error(t("savings.enterValidTarget"));
    setSubmitting(true);
    try {
      await api.post("/savings", { name, targetAmount: amount, deadline: deadline || null });
      toast.success(t("savings.createdToast"));
      setCreateOpen(false);
      setName("");
      setTargetAmount("");
      setDeadline("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddAmount() {
    if (!addGoal) return;
    const amount = Number(addAmount);
    if (!amount || amount <= 0) return toast.error(t("savings.enterValidAmount"));
    setSubmitting(true);
    try {
      const wasCompleted = addGoal.completed;
      const updated = await api.post<SavingsGoal>(`/savings/${addGoal._id}/add`, { amount });
      if (!wasCompleted && updated.completed) {
        toast.success(t("savings.completedToast", { name: addGoal.name }));
      } else {
        toast.success(t("savings.addedToast"));
      }
      setAddGoal(null);
      setAddAmount("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("savings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("savings.subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> {t("savings.newGoal")}
        </Button>
      </div>

      {goals === null && !error && <LoadingState label={t("savings.loading")} />}
      {error && <ErrorState message={error} onRetry={load} />}
      {goals !== null && goals.length === 0 && (
        <EmptyState title={t("savings.emptyTitle")} description={t("savings.emptyDesc")} icon={PiggyBank} />
      )}

      {goals !== null && goals.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <Card key={g._id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{g.name}</span>
                    {g.completed && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <PartyPopper className="h-3.5 w-3.5" /> {t("savings.completed")}
                      </span>
                    )}
                  </div>
                  <Progress
                    value={pct}
                    className={g.completed ? "[&_[data-slot=progress-indicator]]:bg-emerald-500" : ""}
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {formatMoney(g.currentAmount, user?.currency)} / {formatMoney(g.targetAmount, user?.currency)}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  {g.deadline && (
                    <p className="text-xs text-muted-foreground">
                      {t("savings.deadline")} {formatDate(g.deadline)}
                    </p>
                  )}
                  {!g.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddGoal(g);
                        setAddAmount("");
                      }}
                    >
                      <Plus className="h-4 w-4" /> {t("savings.addMoney")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Yangi maqsad yaratish */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("savings.newGoalTitle")}</DialogTitle>
            <DialogDescription>{t("savings.newGoalDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>{t("savings.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("savings.namePlaceholder")} />
            </div>
            <div className="grid gap-2">
              <Label>{t("savings.targetAmount")}</Label>
              <Input
                type="number"
                min={1}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="masalan: 10000000"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("savings.deadlineOptional")}</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pul qo'shish */}
      <Dialog open={!!addGoal} onOpenChange={(o) => !o && setAddGoal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("savings.addToGoal", { name: addGoal?.name || "" })}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>{t("savings.amount")}</Label>
            <Input
              type="number"
              min={1}
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="masalan: 500000"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoal(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddAmount} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
