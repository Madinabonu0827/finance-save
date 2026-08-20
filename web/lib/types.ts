export interface User {
  _id: string;
  name: string;
  email: string;
  currency: string;
  theme: "light" | "dark" | "system";
  language: string;
}

export interface Category {
  _id: string;
  name: string;
  emoji: string;
  type: "expense" | "income";
  isDefault: boolean;
}

export interface Transaction {
  _id: string;
  type: "expense" | "income";
  amount: number;
  category: Category;
  note: string;
  source: "web" | "telegram" | "voice";
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: { id: string; name: string; emoji: string };
  limit: number;
  spent: number;
  month: string;
}

export interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  completed: boolean;
}

export interface RecurringPayment {
  _id: string;
  name: string;
  amount: number;
  category: Category;
  dayOfMonth: number;
  active: boolean;
}

export interface Notification {
  _id: string;
  type: "budget_80" | "budget_100" | "savings_goal_reached" | "recurring_payment";
  title: string;
  message: string;
  sentToTelegram: boolean;
  read: boolean;
  createdAt: string;
}
