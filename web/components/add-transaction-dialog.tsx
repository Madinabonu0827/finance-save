"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, Square, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Category, Transaction } from "@/lib/types";
import { CategoryIcon } from "@/lib/category-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Web Speech API tayyor TypeScript turlariga ega emas — brauzer qo'llab-quvvatlasa ishlaydi (asosan Chrome).
interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
type SpeechRecognitionLike = {
  lang: string;
  onresult: ((e: SpeechRecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

// Joriy UI tiliga qarab ovoz tanish lokali — aniqlik uchun (masalan Toshkent shevasi so'zlashuvi
// "uz-UZ" lokalida yaxshiroq tanilishi kutiladi).
const SPEECH_LOCALE: Record<string, string> = { uz: "uz-UZ", en: "en-US", ru: "ru-RU" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: "expense" | "income";
  onSuccess: () => void;
  editTransaction?: Transaction | null; // berilsa — dialog tahrirlash rejimida ochiladi
  autoStartVoice?: boolean; // true bo'lsa, dialog ochilishi bilan ovoz yozish darhol boshlanadi
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  defaultType,
  onSuccess,
  editTransaction,
  autoStartVoice,
}: Props) {
  const { t, language } = useLanguage();
  const isEditing = !!editTransaction;
  const [type, setType] = useState<"expense" | "income">(defaultType);
  const [quickText, setQuickText] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [parsing, setParsing] = useState(false);
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const autoStartedRef = useRef(false); // shu "ochiq" sessiyada avtomatik boshlanganmi
  const categoryTouchedRef = useRef(false); // foydalanuvchi kategoriyani o'zi tanladimi

  // Dialog har ochilganda (yoki tahrirlanayotgan tranzaksiya almashganda) formani qayta to'ldiradi —
  // React docs'ning "prop o'zgarganda state'ni reset qilish" uchun Effect ishlatish tasdiqlangan
  // holati (https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategoryId(editTransaction.category?._id || "");
      setNote(editTransaction.note || "");
    } else {
      setType(defaultType);
      setAmount("");
      setCategoryId("");
      setNote("");
    }
    setQuickText("");
    setSpeechSupported(!!getSpeechRecognition());
    autoStartedRef.current = false;
    categoryTouchedRef.current = false;
    api
      .get<Category[]>("/categories")
      .then((cats) => setCategories(cats))
      .catch(() => toast.error(t("tx.categoriesLoadError")));
  }, [open, defaultType, editTransaction, t]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredCategories = categories.filter((c) => c.type === type);

  // Kategoriya tanlanmagan bo'lsa (yangi tranzaksiya, foydalanuvchi hali o'zi tanlamagan),
  // turi bo'yicha standart ("Boshqa"/"Boshqa daromad") avtomatik ko'rsatiladi — foydalanuvchi
  // kategoriyani umuman qo'ymasa ham backend aynan shu bilan saqlaydi.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || isEditing || categoryTouchedRef.current || categories.length === 0) return;
    const defaultName = type === "income" ? "Boshqa daromad" : "Boshqa";
    const def = categories.find((c) => c.name === defaultName && c.isDefault);
    if (def) setCategoryId(def._id);
  }, [open, isEditing, type, categories]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function runParse(text: string) {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const result = await api.post<{
        amount: number | null;
        type: "expense" | "income";
        categoryId: string | null;
        confident: boolean;
      }>("/transactions/parse", { text });
      if (result.amount) setAmount(String(result.amount));
      setType(result.type);
      if (result.categoryId) {
        setCategoryId(result.categoryId);
        categoryTouchedRef.current = true;
      }
      setNote(text);
      if (!result.confident) {
        toast.info(t("tx.notConfident"));
      }
    } catch {
      toast.error(t("tx.parseError"));
    } finally {
      setParsing(false);
    }
  }

  function startListening() {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      toast.error(t("tx.speechNotSupported"));
      return;
    }
    recognition.lang = SPEECH_LOCALE[language] || "uz-UZ";
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuickText(transcript);
      runParse(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  // Mikrofon tugmasi bosilib ochilgan bo'lsa (autoStartVoice=true), foydalanuvchi modal ichida
  // yana mic tugmasini bosishi shart bo'lmasin — ovoz yozish darhol o'zi boshlanadi.
  useEffect(() => {
    if (open && autoStartVoice && speechSupported && !isEditing && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoStartVoice, speechSupported, isEditing]);

  async function handleSubmit() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error(t("tx.enterValidAmount"));
      return;
    }
    // Kategoriya ixtiyoriy — tanlanmasa backend turi bo'yicha standart ("Boshqa"/"Boshqa daromad")
    // kategoriyani o'zi qo'yadi.
    setSubmitting(true);
    try {
      if (isEditing && editTransaction) {
        await api.patch(`/transactions/${editTransaction._id}`, { type, amount: numAmount, categoryId, note });
        toast.success(t("tx.updatedToast"));
      } else {
        await api.post("/transactions", { type, amount: numAmount, categoryId, note });
        toast.success(type === "expense" ? t("tx.addedExpenseToast") : t("tx.addedIncomeToast"));
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editTransaction) return;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${editTransaction._id}`);
      toast.success(t("tx.deletedToast"));
      setDeleteOpen(false);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("tx.editTitle") : type === "expense" ? t("tx.addExpenseTitle") : t("tx.addIncomeTitle")}
          </DialogTitle>
          <DialogDescription>{isEditing ? t("tx.editDesc") : t("tx.addDesc")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!isEditing && (
            <div className="grid gap-2">
              <Label>{t("tx.quickEntry")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("tx.quickPlaceholder")}
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  onBlur={() => runParse(quickText)}
                />
                {speechSupported && (
                  <Button
                    type="button"
                    size="icon"
                    variant={listening ? "destructive" : "outline"}
                    onClick={listening ? () => setListening(false) : startListening}
                    title={t("dashboard.voiceInput")}
                  >
                    {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {parsing && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> {t("tx.detecting")}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("tx.type")}</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as "expense" | "income")}>
                <SelectTrigger>
                  <SelectValue>{(v: string) => (v === "income" ? t("tx.typeIncome") : t("tx.typeExpense"))}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">{t("tx.typeExpense")}</SelectItem>
                  <SelectItem value="income">{t("tx.typeIncome")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("tx.amount")}</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("tx.category")}</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                if (v) {
                  categoryTouchedRef.current = true;
                  setCategoryId(v);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")}>
                  {(v: string) => {
                    const c = categories.find((cat) => cat._id === v);
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
                {filteredCategories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    <CategoryIcon name={c.name} className="h-4 w-4 shrink-0" /> {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t("tx.note")}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className={isEditing ? "sm:justify-between" : undefined}>
          {isEditing && (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> {t("common.delete")}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title={t("tx.deleteConfirmTitle")}
      description={t("tx.deleteConfirmDesc")}
      confirmLabel={t("common.delete")}
      destructive
      loading={deleting}
      onConfirm={handleDelete}
    />
    </>
  );
}
