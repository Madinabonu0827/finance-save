"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, clearToken, ApiError } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Token bo'lmasa boshidanoq "loading" emas — shunda effekt ichida sinxron setState chaqirilmaydi.
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("financeai_token");
  });
  const router = useRouter();

  async function refreshUser() {
    try {
      const data = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
      clearToken();
    }
  }

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("financeai_token") : null;

    // Telegram Mini App ichida ochilgan bo'lsa — initData imzosi orqali avtomatik login.
    // window.Telegram global qiymat telegram-web-app.js skriptidan keladi.
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } } })
      .Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand?.();
    }

    if (!token && tg?.initData) {
      api
        .post<{ token: string; user: User }>("/auth/telegram", { initData: tg.initData })
        .then((data) => {
          setToken(data.token);
          setUser(data.user);
        })
        .catch(() => {
          // Ulangan hisob topilmadi yoki imzo yaroqsiz — oddiy login formasi qoladi.
        })
        .finally(() => setLoading(false));
      return;
    }

    if (!token) return;
    // Sahifa ochilganda saqlangan tokenni tekshirish uchun bitta martalik so'rov — natija
    // keyinroq (promise callback ichida) set qilinadi, effekt tanasida sinxron emas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser().then(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    clearToken();
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

export { ApiError };
