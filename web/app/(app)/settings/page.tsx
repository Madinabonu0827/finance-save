"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  CheckCircle2,
  Download,
  Upload,
  Trash2,
  Info,
  Copy,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Separator } from "@/components/ui/separator";

const CURRENCIES: Record<string, string> = { UZS: "UZS — O'zbek so'mi", USD: "USD — AQSh dollari", EUR: "EUR — Yevro" };
const THEMES: Record<string, string> = { light: "Yorug'", dark: "Qorong'u", system: "Tizim" };
const LANGUAGES: Record<string, string> = { uz: "O'zbek" };

interface TelegramStatus {
  linked: boolean;
  telegramUsername: string | null;
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tgStatus, setTgStatus] = useState<TelegramStatus | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  const loadStatus = useCallback(() => {
    api
      .get<TelegramStatus>("/telegram/status")
      .then(setTgStatus)
      .catch(() => setTgStatus({ linked: false, telegramUsername: null }));
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Ulangandan keyin holatni avtomatik yangilash uchun (bot orqali /start bosilganda) — 4s interval.
  useEffect(() => {
    if (!linkCode || tgStatus?.linked) return;
    const interval = setInterval(loadStatus, 4000);
    return () => clearInterval(interval);
  }, [linkCode, tgStatus?.linked, loadStatus]);

  async function generateCode() {
    setGeneratingCode(true);
    try {
      const res = await api.post<{ code: string }>("/telegram/link-code");
      setLinkCode(res.code);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Kod yaratishda xatolik");
    } finally {
      setGeneratingCode(false);
    }
  }

  function copyCode() {
    if (!linkCode) return;
    navigator.clipboard.writeText(linkCode);
    toast.success("Kod nusxalandi");
  }

  async function updateSetting(field: "currency" | "theme" | "language", value: string) {
    setSavingField(field);
    try {
      await api.patch("/user/settings", { [field]: value });
      await refreshUser();
      if (field === "theme") setTheme(value as "light" | "dark" | "system");
      toast.success("Saqlandi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Saqlashda xatolik");
    } finally {
      setSavingField(null);
    }
  }

  async function handleExport() {
    try {
      const data = await api.get("/user/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Ma'lumotlar yuklab olindi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Eksport qilishda xatolik");
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await api.post<{ message: string }>("/user/import", { transactions: parsed.transactions || [] });
      toast.success(res.message);
    } catch {
      toast.error("Faylni o'qib bo'lmadi — to'g'ri JSON ekanini tekshiring");
    }
  }

  async function handleClearData() {
    setClearing(true);
    try {
      await api.delete("/user/data");
      toast.success("Barcha ma'lumotlar tozalandi");
      setClearOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Sozlamalar</h1>

      {/* Telegramni ulash */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" /> Telegram bot
          </CardTitle>
          <CardDescription>
            Hisobingizni @AIFinanceUzBot ga ulang — tranzaksiyalar va bildirishnomalar real vaqtda sinxronlanadi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tgStatus === null && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {tgStatus?.linked && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Ulangan {tgStatus.telegramUsername ? `(@${tgStatus.telegramUsername})` : ""}
            </div>
          )}
          {tgStatus && !tgStatus.linked && (
            <div className="flex flex-col gap-3">
              {!linkCode ? (
                <Button onClick={generateCode} disabled={generatingCode} className="w-fit">
                  {generatingCode && <Loader2 className="h-4 w-4 animate-spin" />}
                  Telegramni ulash
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Telegramda{" "}
                    <a
                      href="https://t.me/AIFinanceUzBot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      @AIFinanceUzBot
                    </a>{" "}
                    ni oching va quyidagi buyruqni yuboring:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono">/start {linkCode}</code>
                    <Button variant="ghost" size="icon" onClick={copyCode} title="Nusxalash">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Ulanishni kutmoqda...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asosiy sozlamalar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Umumiy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Label>Asosiy valyuta</Label>
            <Select
              value={user?.currency || "UZS"}
              onValueChange={(v) => v && updateSetting("currency", v)}
              disabled={savingField === "currency"}
            >
              <SelectTrigger className="w-44">
                <SelectValue>{(v: string) => CURRENCIES[v] || v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCIES).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <Label>Mavzu</Label>
            <Select
              value={theme}
              onValueChange={(v) => v && updateSetting("theme", v)}
              disabled={savingField === "theme"}
            >
              <SelectTrigger className="w-44">
                <SelectValue>{(v: string) => THEMES[v] || v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(THEMES).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <Label>Til</Label>
            <Select
              value={user?.language || "uz"}
              onValueChange={(v) => v && updateSetting("language", v)}
              disabled={savingField === "language"}
            >
              <SelectTrigger className="w-44">
                <SelectValue>{(v: string) => LANGUAGES[v] || v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGES).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ma'lumotlar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ma&apos;lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="outline" className="w-fit" onClick={handleExport}>
            <Download className="h-4 w-4" /> Ma&apos;lumotlarni eksport qilish (JSON)
          </Button>
          <Button variant="outline" className="w-fit" onClick={handleImportClick}>
            <Upload className="h-4 w-4" /> Zaxiradan tiklash (JSON import)
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          <Separator />
          <Button variant="destructive" className="w-fit" onClick={() => setClearOpen(true)}>
            <Trash2 className="h-4 w-4" /> Barcha ma&apos;lumotlarni tozalash
          </Button>
        </CardContent>
      </Card>

      {/* Ilova haqida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" /> Ilova haqida
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground flex flex-col gap-1">
          <p>Finance AI — shaxsiy moliya ekotizimi. Web va Telegram orqali bitta accountga bog'langan holda ishlaydi.</p>
          <p>Hisob: {user?.email}</p>
        </CardContent>
      </Card>

      <Button variant="ghost" className="w-fit text-muted-foreground" onClick={logout}>
        Chiqish
      </Button>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Barcha ma'lumotlarni tozalash"
        description="Barcha tranzaksiya, byudjet, jamg'arma va takrorlanuvchi to'lovlar butunlay o'chiriladi. Bu amalni orqaga qaytarib bo'lmaydi."
        confirmLabel="Ha, tozalash"
        destructive
        loading={clearing}
        onConfirm={handleClearData}
      />
    </div>
  );
}
