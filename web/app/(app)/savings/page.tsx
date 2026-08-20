"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, PiggyBank, PartyPopper } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { SavingsGoal } from "@/lib/types";
import { formatMoney, formatDate } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
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
    setError(null);
    api
      .get<SavingsGoal[]>("/savings")
      .then(setGoals)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklab bo'lmadi"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    const amount = Number(targetAmount);
    if (!name.trim()) return toast.error("Nomini kiriting");
    if (!amount || amount <= 0) return toast.error("Maqsad summani to'g'ri kiriting");
    setSubmitting(true);
    try {
      await api.post("/savings", { name, targetAmount: amount, deadline: deadline || null });
      toast.success("Jamg'arma maqsadi yaratildi");
      setCreateOpen(false);
      setName("");
      setTargetAmount("");
      setDeadline("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Yaratishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddAmount() {
    if (!addGoal) return;
    const amount = Number(addAmount);
    if (!amount || amount <= 0) return toast.error("Summani to'g'ri kiriting");
    setSubmitting(true);
    try {
      const wasCompleted = addGoal.completed;
      const updated = await api.post<SavingsGoal>(`/savings/${addGoal._id}/add`, { amount });
      if (!wasCompleted && updated.completed) {
        toast.success(`🎉 Tabriklaymiz! "${addGoal.name}" maqsadiga yetdingiz!`);
      } else {
        toast.success("Mablag' qo'shildi");
      }
      setAddGoal(null);
      setAddAmount("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jamg&apos;arma maqsadlari</h1>
          <p className="text-sm text-muted-foreground mt-1">Nimaga pul yig&apos;ayotganingizni kuzatib boring</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Yangi maqsad
        </Button>
      </div>

      {goals === null && !error && <LoadingState label="Jamg'armalar yuklanmoqda..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {goals !== null && goals.length === 0 && (
        <EmptyState
          title="Hozircha jamg'arma maqsadi yo'q"
          description="Yangi maqsad yarating — masalan, noutbuk yoki sayohat uchun"
          icon={PiggyBank}
        />
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
                        <PartyPopper className="h-3.5 w-3.5" /> Bajarildi
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
                  {g.deadline && <p className="text-xs text-muted-foreground">Muddat: {formatDate(g.deadline)}</p>}
                  {!g.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddGoal(g);
                        setAddAmount("");
                      }}
                    >
                      <Plus className="h-4 w-4" /> Pul qo&apos;shish
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
            <DialogTitle>Yangi jamg&apos;arma maqsadi</DialogTitle>
            <DialogDescription>Nima uchun pul yig&apos;ayotganingizni belgilang</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>Nomi</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Yangi noutbuk" />
            </div>
            <div className="grid gap-2">
              <Label>Maqsad summa (so&apos;m)</Label>
              <Input
                type="number"
                min={1}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="masalan: 10000000"
              />
            </div>
            <div className="grid gap-2">
              <Label>Muddat (ixtiyoriy)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pul qo'shish */}
      <Dialog open={!!addGoal} onOpenChange={(o) => !o && setAddGoal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>&quot;{addGoal?.name}&quot;ga pul qo&apos;shish</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Summa (so&apos;m)</Label>
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
              Bekor qilish
            </Button>
            <Button onClick={handleAddAmount} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Qo&apos;shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
