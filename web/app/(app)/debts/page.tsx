"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, HandCoins, Trash2, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Debt } from "@/lib/types";
import { formatMoney, formatDate } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/state-views";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type DebtType = "borrowed" | "lent";

function isOverdue(debt: Debt): boolean {
  return !!debt.dueDate && debt.status === "pending" && new Date(debt.dueDate) < new Date();
}

export default function DebtsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [debts, setDebts] = useState<Debt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DebtType>("borrowed");

  const [createOpen, setCreateOpen] = useState(false);
  const [type, setType] = useState<DebtType>("borrowed");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    api
      .get<Debt[]>("/debts")
      .then((data) => {
        setDebts(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t("dashboard.loadError")));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate(defaultType: DebtType) {
    setType(defaultType);
    setPersonName("");
    setAmount("");
    setDueDate("");
    setNote("");
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!personName.trim()) return toast.error(t("debts.enterPersonName"));
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return toast.error(t("debts.enterValidAmount"));
    setSubmitting(true);
    try {
      await api.post("/debts", { type, personName, amount: numAmount, dueDate: dueDate || null, note });
      toast.success(t("debts.createdToast"));
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid(debt: Debt) {
    setPayingId(debt._id);
    try {
      await api.post(`/debts/${debt._id}/paid`);
      toast.success(t("debts.paidToast"));
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setPayingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/debts/${deleteTarget._id}`);
      toast.success(t("common.deleted"));
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setDeleting(false);
    }
  }

  const filtered = (debts ?? []).filter((d) => d.type === tab);
  const totalIOwe = (debts ?? [])
    .filter((d) => d.type === "borrowed" && d.status === "pending")
    .reduce((s, d) => s + d.amount, 0);
  const totalOwedToMe = (debts ?? [])
    .filter((d) => d.type === "lent" && d.status === "pending")
    .reduce((s, d) => s + d.amount, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("debts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("debts.subtitle")}</p>
        </div>
        <Button onClick={() => openCreate(tab)}>
          <Plus className="h-4 w-4" /> {t("debts.new")}
        </Button>
      </div>

      {debts === null && !error && <LoadingState label={t("debts.loading")} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {debts !== null && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">{t("debts.totalIOwe")}</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400 mt-1">
                  {formatMoney(totalIOwe, user?.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">{t("debts.totalOwedToMe")}</p>
                <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatMoney(totalOwedToMe, user?.currency)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={(v) => v && setTab(v as DebtType)}>
            <TabsList>
              <TabsTrigger value="borrowed">{t("debts.iOwe")}</TabsTrigger>
              <TabsTrigger value="lent">{t("debts.owedToMe")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length === 0 && (
            <EmptyState
              title={tab === "borrowed" ? t("debts.emptyIOweTitle") : t("debts.emptyOwedTitle")}
              description={tab === "borrowed" ? t("debts.emptyIOweDesc") : t("debts.emptyOwedDesc")}
              icon={HandCoins}
            />
          )}

          {filtered.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((debt) => {
                const overdue = isOverdue(debt);
                const isPaid = debt.status === "paid";
                return (
                  <Card key={debt._id} className={isPaid ? "opacity-60" : undefined}>
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{debt.personName}</span>
                        {isPaid ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t("debts.paidBadge")}
                          </span>
                        ) : overdue ? (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                            {t("debts.overdue")}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-lg font-semibold">{formatMoney(debt.amount, user?.currency)}</p>
                      {debt.note && <p className="text-sm text-muted-foreground truncate">{debt.note}</p>}
                      <p className="text-xs text-muted-foreground">
                        {isPaid
                          ? debt.paidAt && t("debts.paidOn", { date: formatDate(debt.paidAt) })
                          : debt.dueDate
                            ? t("debts.dueOn", { date: formatDate(debt.dueDate) })
                            : t("debts.noDueDate")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {!isPaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleMarkPaid(debt)}
                            disabled={payingId === debt._id}
                          >
                            {payingId === debt._id && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t("debts.markPaid")}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => setDeleteTarget(debt)}
                          title={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("debts.newTitle")}</DialogTitle>
            <DialogDescription>{t("debts.newDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>{t("debts.type")}</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as DebtType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string) => (v === "lent" ? t("debts.typeLent") : t("debts.typeBorrowed"))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrowed">{t("debts.typeBorrowed")}</SelectItem>
                  <SelectItem value="lent">{t("debts.typeLent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("debts.personName")}</Label>
              <Input
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={t("debts.personNamePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("debts.amount")}</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="grid gap-2">
              <Label>{t("debts.dueDateOptional")}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("debts.note")}</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("debts.deleteConfirmTitle")}
        description={t("debts.deleteConfirmDesc")}
        confirmLabel={t("common.delete")}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
