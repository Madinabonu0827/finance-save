import { createElement } from "react";
import {
  FaUtensils,
  FaCar,
  FaHome,
  FaBriefcaseMedical,
  FaGamepad,
  FaTshirt,
  FaGraduationCap,
  FaBoxOpen,
  FaMoneyBillWave,
  FaWallet,
} from "react-icons/fa";
import { IconType } from "react-icons";

// Kategoriya nomi → react-icons komponenti. Backend/bot xabarlarida emoji ishlatishda davom
// etadi (Telegram matnida faqat emoji ko'rsatish mumkin), lekin Web UI'da chiroyli ikonlar
// ishlatiladi — CLAUDE.md UI/UX standartiga mos ("tayyor dizayn tizimi" prinsipiga muvofiq).
const CATEGORY_ICON_MAP: Record<string, IconType> = {
  Ovqat: FaUtensils,
  Transport: FaCar,
  "Uy-joy": FaHome,
  "Sog'liq": FaBriefcaseMedical,
  "Ko'ngilochar": FaGamepad,
  Kiyim: FaTshirt,
  "Ta'lim": FaGraduationCap,
  Boshqa: FaBoxOpen,
  "Boshqa daromad": FaBoxOpen,
  Maosh: FaMoneyBillWave,
};

export function getCategoryIcon(categoryName: string | undefined | null): IconType {
  if (!categoryName) return FaWallet;
  return CATEGORY_ICON_MAP[categoryName] || FaWallet;
}

export function CategoryIcon({ name, className }: { name: string | undefined | null; className?: string }) {
  // JSX (<Icon />) o'rniga createElement — ESLint'ning "render paytida komponent yaratish"
  // qoidasi dinamik icon-map naqshini soxta-pozitiv sifatida ushlab qolmasligi uchun.
  return createElement(getCategoryIcon(name), { className });
}
