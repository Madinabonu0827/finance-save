"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, Square } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: "expense" | "income";
  onSuccess: () => void;
}

export function AddTransactionDialog({ open, onOpenChange, defaultType, onSuccess }: Props) {
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

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setQuickText("");
    setAmount("");
    setCategoryId("");
    setNote("");
    setSpeechSupported(!!getSpeechRecognition());
    api
      .get<Category[]>("/categories")
      .then((cats) => setCategories(cats))
      .catch(() => toast.error("Kategoriyalarni yuklab bo'lmadi"));
  }, [open, defaultType]);

  const filteredCategories = categories.filter((c) => c.type === type);

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
      if (result.categoryId) setCategoryId(result.categoryId);
      setNote(text);
      if (!result.confident) {
        toast.info("Summani aniq tushunmadim — summa va kategoriyani tekshirib, o'zingiz to'g'irlang.");
      }
    } catch {
      toast.error("Matnni tahlil qilib bo'lmadi, qo'lda kiriting");
    } finally {
      setParsing(false);
    }
  }

  function startListening() {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      toast.error("Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi");
      return;
    }
    recognition.lang = "uz-UZ";
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

  async function handleSubmit() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Summani to'g'ri kiriting");
      return;
    }
    if (!categoryId) {
      toast.error("Kategoriyani tanlang");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/transactions", { type, amount: numAmount, categoryId, note });
      toast.success(type === "expense" ? "Xarajat qo'shildi" : "Daromad qo'shildi");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === "expense" ? "Xarajat qo'shish" : "Daromad qo'shish"}</DialogTitle>
          <DialogDescription>Tez kiritish uchun matn yozing yoki ovozli ayting, keyin tekshirib saqlang.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Tezkor kiritish (ixtiyoriy)</Label>
            <div className="flex gap-2">
              <Input
                placeholder='Masalan: "taksiga 20 ming"'
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
                  title="Ovozli kiritish"
                >
                  {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {parsing && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Aniqlanmoqda...
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Turi</Label>
              <Select value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
                <SelectTrigger>
                  <SelectValue>{(v: string) => (v === "income" ? "Daromad" : "Xarajat")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Xarajat</SelectItem>
                  <SelectItem value="income">Daromad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Summa</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Kategoriya</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Tanlang">
                  {(v: string) => {
                    const c = categories.find((cat) => cat._id === v);
                    return c ? `${c.emoji} ${c.name}` : "Tanlang";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.emoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Izoh (ixtiyoriy)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
