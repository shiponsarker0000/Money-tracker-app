import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  Filter, 
  Plus, 
  FileText, 
  PieChart, 
  Calculator, 
  Wallet, 
  Tag,
  MoreHorizontal,
  Download,
  Upload,
  Trash2,
  Settings as SettingsIcon,
  Star,
  ThumbsUp,
  Mail,
  ImagePlus,
  X,
  ShieldCheck,
  Check,
  Delete,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Save,
  Cloud,
  CloudUpload,
  CloudDownload,
  FolderOpen,
  RefreshCw,
  Database,
  Car,
  Shirt,
  Utensils,
  GraduationCap,
  Users,
  Gift,
  Stethoscope,
  ShoppingBag,
  Phone,
  Bus,
  Sparkles,
  Cpu,
  Tv,
  Share2,
  Trophy,
  Receipt,
  Home,
  Zap,
  Wifi,
  PiggyBank,
  Banknote,
  Laptop,
  Store,
  TrendingUp,
  Medal,
  Ticket,
  Heart,
  RotateCcw,
  PlusCircle,
  Briefcase,
  Terminal,
  Key,
  LineChart as LucideLineChart,
  Award,
  Package,
  Undo,
  HandCoins,
  Building2,
  Smartphone,
  CreditCard,
  Globe,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import CryptoJS from 'crypto-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  saveToFirestore, 
  deleteFromFirestore,
  cleanData,
  OperationType,
  handleFirestoreError
} from './firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  writeBatch,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

const ICON_MAP: Record<string, React.ElementType> = {
  Car, Shirt, Utensils, GraduationCap, Users, Gift, Stethoscope, ShoppingBag, Phone, Bus, Sparkles, Cpu, Tv, Share2, Trophy, Receipt, Home, Zap, Wifi, PiggyBank, MoreHorizontal, Banknote, Laptop, Store, TrendingUp, Medal, Ticket, Heart, RotateCcw, PlusCircle, Briefcase, Terminal, Key, LucideLineChart, Award, Package, Undo, HandCoins, Wallet, Tag, ShieldCheck, Calendar, Clock, Database, RefreshCw, FolderOpen, Cloud, Save, Delete, Check, X, ImagePlus, Mail, ThumbsUp, Star, SettingsIcon, Upload, Download, Filter, Plus, FileText, PieChart, Calculator, Menu, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Building2, Smartphone, CreditCard, Globe, Coins
};

const IconDisplay = ({ icon, customIcon, className, color }: { icon: string, customIcon?: string, className?: string, color?: string }) => {
  if (customIcon) {
    return <img src={customIcon} className={cn("object-cover", className)} alt="Icon" referrerPolicy="no-referrer" />;
  }
  
  const LucideIcon = ICON_MAP[icon];
  if (LucideIcon) {
    return <LucideIcon className={cn(className, color)} />;
  }
  
  return <div className={cn(className, color)}>{icon}</div>;
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Expense {
  id: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  category: string;
  account: string;
  toAccount?: string;
  date: string;
  time: string;
  note: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  customIcon?: string;
}

interface Account {
  id: string;
  name: string;
  initial: number;
  balance: number;
  icon: string;
  customIcon?: string;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: string; // YYYY-MM
}

const INCOME_CATEGORIES: Category[] = [
  { id: 'i1', name: 'Awards', icon: '🏆', color: 'bg-blue-600', type: 'income' },
  { id: 'i2', name: 'Coupons', icon: '🎟️', color: 'bg-red-500', type: 'income' },
  { id: 'i3', name: 'Grants', icon: '🤝', color: 'bg-teal-600', type: 'income' },
  { id: 'i4', name: 'Lottery', icon: '🎫', color: 'bg-red-600', type: 'income' },
  { id: 'i5', name: 'Refunds', icon: '💰', color: 'bg-purple-600', type: 'income' },
  { id: 'i6', name: 'Rental', icon: '🏠', color: 'bg-indigo-600', type: 'income' },
  { id: 'i7', name: 'Salary', icon: '💼', color: 'bg-pink-600', type: 'income' },
  { id: 'i8', name: 'Sale', icon: '🏷️', color: 'bg-green-600', type: 'income' },
];

const EXPENSE_CATEGORIES: Category[] = [
  { id: 'e1', name: 'Baby', icon: '🍼', color: 'bg-orange-800', type: 'expense' },
  { id: 'e2', name: 'Beauty', icon: '💄', color: 'bg-pink-500', type: 'expense' },
  { id: 'e3', name: 'Bills', icon: '📄', color: 'bg-gray-700', type: 'expense' },
  { id: 'e4', name: 'Car', icon: '🚗', color: 'bg-blue-800', type: 'expense' },
  { id: 'e5', name: 'Clothing', icon: '👕', color: 'bg-orange-600', type: 'expense' },
];

const ACCOUNT_ICONS = ['Wallet', 'Building2', 'Smartphone', 'PiggyBank', 'CreditCard', 'TrendingUp', 'ShieldCheck', 'Globe', 'Coins', '💵', '💳', '🏦', '💰', '📱', '💼', '💎'];

const CATEGORY_ICONS = [
  'Car', 'Shirt', 'Utensils', 'GraduationCap', 'Users', 'Gift', 'Stethoscope', 'ShoppingBag', 'Phone', 'Bus', 'Sparkles', 'Cpu', 'Tv', 'ShieldCheck', 'Share2', 'Trophy', 'Receipt', 'Home', 'Zap', 'Wifi', 'PiggyBank', 'MoreHorizontal',
  'Banknote', 'Laptop', 'Store', 'TrendingUp', 'Medal', 'Ticket', 'Heart', 'RotateCcw', 'PlusCircle', 'Briefcase', 'Terminal', 'Key', 'LucideLineChart', 'Award', 'Package', 'Undo', 'HandCoins',
  '🏆', '🎟️', '🤝', '🎫', '💰', '🏠', '💼', '🏷️', '🍼', '💄', '📄', '🚗', '👕', '🍔', '🎬', '🏥', '🎓', '🎁', '💡', '🛠️'
];
const CATEGORY_COLORS = ['bg-blue-600', 'bg-red-500', 'bg-teal-600', 'bg-red-600', 'bg-purple-600', 'bg-indigo-600', 'bg-pink-600', 'bg-green-600', 'bg-orange-800', 'bg-pink-500', 'bg-gray-700', 'bg-blue-800', 'bg-orange-600', 'bg-yellow-600', 'bg-cyan-600'];
const ENCRYPTION_KEY = 'mymoney-secret-key';

interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  accent: string;
  isPro?: boolean;
}

const THEMES: Theme[] = [
  { id: 'original', name: 'Original Green', primary: '#1B4332', secondary: '#E9E9D0', bg: '#FDFDF0', accent: '#2D6A4F' },
  { id: 'ocean', name: 'Ocean Blue', primary: '#1E3A8A', secondary: '#DBEAFE', bg: '#F0F9FF', accent: '#3B82F6', isPro: true },
  { id: 'rose', name: 'Rose Pink', primary: '#881337', secondary: '#FFE4E6', bg: '#FFF1F2', accent: '#F43F5E', isPro: true },
  { id: 'sunset', name: 'Sunset Glow', primary: '#7C2D12', secondary: '#FFEDD5', bg: '#FFF7ED', accent: '#F97316', isPro: true },
  { id: 'midnight', name: 'Midnight Dark', primary: '#F8FAFC', secondary: '#1E293B', bg: '#0F172A', accent: '#38BDF8', isPro: true },
  { id: 'forest', name: 'Deep Forest', primary: '#064E3B', secondary: '#D1FAE5', bg: '#F0FDF4', accent: '#10B981', isPro: true },
  { id: 'lavender', name: 'Lavender Mist', primary: '#4C1D95', secondary: '#EDE9FE', bg: '#F5F3FF', accent: '#8B5CF6', isPro: true },
  { id: 'gold', name: 'Luxury Gold', primary: '#713F12', secondary: '#FEF9C3', bg: '#FFFBEB', accent: '#EAB308', isPro: true },
  { id: 'mint', name: 'Fresh Mint', primary: '#065F46', secondary: '#CCFBF1', bg: '#F0FDFA', accent: '#14B8A6', isPro: true },
  { id: 'coffee', name: 'Warm Coffee', primary: '#451A03', secondary: '#FFEDD5', bg: '#FFF7ED', accent: '#92400E', isPro: true },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'records' | 'analysis' | 'budgets' | 'accounts' | 'categories'>('records');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 'a1', name: 'Cash', initial: 0, balance: 0, icon: 'Wallet' },
    { id: 'a2', name: 'Bank', initial: 0, balance: 0, icon: 'Building2' },
    { id: 'a3', name: 'Mobile Banking', initial: 0, balance: 0, icon: 'Smartphone' },
    { id: 'a4', name: 'Savings/FDR', initial: 0, balance: 0, icon: 'PiggyBank' },
    { id: 'a5', name: 'Credit Card', initial: 0, balance: 0, icon: 'CreditCard' },
  ]);

  const [incomeCategories, setIncomeCategories] = useState<Category[]>([
    { id: 'i1', name: 'Salary (বেতন)', icon: 'Banknote', color: 'bg-green-600', type: 'income' },
    { id: 'i2', name: 'Freelancing (ফ্রিল্যান্সিং)', icon: 'Laptop', color: 'bg-blue-600', type: 'income' },
    { id: 'i3', name: 'Business (ব্যবসা)', icon: 'Store', color: 'bg-orange-600', type: 'income' },
    { id: 'i4', name: 'Rental Income (ভাড়া)', icon: 'Home', color: 'bg-indigo-600', type: 'income' },
    { id: 'i5', name: 'Investments/Stocks (বিনিয়োগ)', icon: 'TrendingUp', color: 'bg-teal-600', type: 'income' },
    { id: 'i6', name: 'Bonus (বোনাস)', icon: 'Gift', color: 'bg-pink-600', type: 'income' },
    { id: 'i7', name: 'Scholarship/Awards (পুরস্কার)', icon: 'Medal', color: 'bg-yellow-600', type: 'income' },
    { id: 'i8', name: 'Lottery (লটারি)', icon: 'Ticket', color: 'bg-red-600', type: 'income' },
    { id: 'i9', name: 'Gifts (উপহার)', icon: 'Heart', color: 'bg-rose-600', type: 'income' },
    { id: 'i10', name: 'Refunds (ফেরত পাওয়া অর্থ)', icon: 'RotateCcw', color: 'bg-purple-600', type: 'income' },
    { id: 'i11', name: 'Sale of Assets (সম্পদ বিক্রি)', icon: 'Tag', color: 'bg-emerald-600', type: 'income' },
    { id: 'i12', name: 'Other Income (অন্যান্য)', icon: 'PlusCircle', color: 'bg-gray-600', type: 'income' },
  ]);

  const [expenseCategories, setExpenseCategories] = useState<Category[]>([
    { id: 'e1', name: 'Car', icon: 'Car', color: 'bg-blue-800', type: 'expense' },
    { id: 'e2', name: 'Cloth', icon: 'Shirt', color: 'bg-orange-600', type: 'expense' },
    { id: 'e3', name: 'Food', icon: 'Utensils', color: 'bg-red-500', type: 'expense' },
    { id: 'e4', name: 'Education', icon: 'GraduationCap', color: 'bg-indigo-700', type: 'expense' },
    { id: 'e5', name: 'Family', icon: 'Users', color: 'bg-teal-600', type: 'expense' },
    { id: 'e6', name: 'Gift', icon: 'Gift', color: 'bg-pink-500', type: 'expense' },
    { id: 'e7', name: 'Health', icon: 'Stethoscope', color: 'bg-red-600', type: 'expense' },
    { id: 'e8', name: 'Shopping', icon: 'ShoppingBag', color: 'bg-purple-600', type: 'expense' },
    { id: 'e9', name: 'Telephone', icon: 'Phone', color: 'bg-blue-600', type: 'expense' },
    { id: 'e10', name: 'Transportation', icon: 'Bus', color: 'bg-yellow-600', type: 'expense' },
    { id: 'e11', name: 'Beauty', icon: 'Sparkles', color: 'bg-pink-400', type: 'expense' },
    { id: 'e12', name: 'Electronics', icon: 'Cpu', color: 'bg-gray-700', type: 'expense' },
    { id: 'e13', name: 'Entertainment', icon: 'Tv', color: 'bg-indigo-500', type: 'expense' },
    { id: 'e14', name: 'Insurance', icon: 'ShieldCheck', color: 'bg-blue-700', type: 'expense' },
    { id: 'e15', name: 'Social', icon: 'Share2', color: 'bg-sky-500', type: 'expense' },
    { id: 'e16', name: 'Sport', icon: 'Trophy', color: 'bg-yellow-700', type: 'expense' },
    { id: 'e17', name: 'Tax', icon: 'Receipt', color: 'bg-red-800', type: 'expense' },
    { id: 'e18', name: 'Housing/Rent', icon: 'Home', color: 'bg-amber-800', type: 'expense' },
    { id: 'e19', name: 'Utilities/Bills', icon: 'Zap', color: 'bg-yellow-500', type: 'expense' },
    { id: 'e20', name: 'Internet', icon: 'Wifi', color: 'bg-blue-500', type: 'expense' },
    { id: 'e21', name: 'Savings', icon: 'PiggyBank', color: 'bg-green-700', type: 'expense' },
    { id: 'e22', name: 'Other', icon: 'MoreHorizontal', color: 'bg-gray-500', type: 'expense' },
  ]);
  
  const [isNoteFocused, setIsNoteFocused] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculator and Selector States
  const [calculatorInput, setCalculatorInput] = useState('0');
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [isToAccountSelectorOpen, setIsToAccountSelectorOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  
  // New Settings States
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [currencyPosition, setCurrencyPosition] = useState<'start' | 'end'>('start');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [uiMode, setUiMode] = useState<'system' | 'light' | 'dark'>('system');
  const [passcode, setPasscode] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [isPasscodeSetupOpen, setIsPasscodeSetupOpen] = useState(false);
  const [passcodeSetupMode, setPasscodeSetupMode] = useState<'set' | 'disable'>('set');
  const [passcodeSetupStep, setPasscodeSetupStep] = useState<1 | 2>(1);
  const [tempPasscode, setTempPasscode] = useState('');
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

  // Firebase Auth & Sync States
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync Data from Firestore
  useEffect(() => {
    if (!user || !isAuthReady) return;

    setIsSyncing(true);

    // Sync Expenses
    const unsubExpenses = onSnapshot(
      query(collection(db, `users/${user.uid}/expenses`), orderBy('date', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as Expense);
        if (data.length > 0) setExpenses(data);
        setIsSyncing(false);
        setLastSynced(new Date());
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/expenses`)
    );

    // Sync Accounts
    const unsubAccounts = onSnapshot(
      collection(db, `users/${user.uid}/accounts`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as Account);
        if (data.length > 0) setAccounts(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/accounts`)
    );

    // Sync Categories
    const unsubIncomeCats = onSnapshot(
      query(collection(db, `users/${user.uid}/categories`), where('type', '==', 'income')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as Category);
        if (data.length > 0) setIncomeCategories(data);
      }
    );

    const unsubExpenseCats = onSnapshot(
      query(collection(db, `users/${user.uid}/categories`), where('type', '==', 'expense')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as Category);
        if (data.length > 0) setExpenseCategories(data);
      }
    );

    // Sync Settings
    const unsubSettings = onSnapshot(
      doc(db, `users/${user.uid}/settings/main`),
      (snapshot) => {
        if (snapshot.exists()) {
          const s = snapshot.data();
          if (s.currencySymbol) setCurrencySymbol(s.currencySymbol);
          if (s.currencyPosition) setCurrencyPosition(s.currencyPosition);
          if (s.decimalPlaces !== undefined) setDecimalPlaces(s.decimalPlaces);
          if (s.uiMode) setUiMode(s.uiMode);
          if (s.passcode) setPasscode(s.passcode);
          if (s.reminderEnabled !== undefined) setReminderEnabled(s.reminderEnabled);
          if (s.currentThemeId) {
            const theme = THEMES.find(t => t.id === s.currentThemeId);
            if (theme) setCurrentTheme(theme);
          }
        }
      }
    );

    // Sync Budgets
    const unsubBudgets = onSnapshot(
      collection(db, `users/${user.uid}/budgets`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as Budget);
        if (data.length > 0) setBudgets(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/budgets`)
    );

    return () => {
      unsubExpenses();
      unsubAccounts();
      unsubIncomeCats();
      unsubExpenseCats();
      unsubSettings();
      unsubBudgets();
    };
  }, [user, isAuthReady]);

  // Save Settings to Firestore (Debounced)
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const saveSettings = async () => {
      setIsSyncing(true);
      try {
        await saveToFirestore(`users/${user.uid}/settings/main`, {
          currencySymbol,
          currencyPosition,
          decimalPlaces,
          uiMode,
          passcode,
          reminderEnabled,
          currentThemeId: currentTheme.id
        });
        setIsSyncing(false);
        setLastSynced(new Date());
      } catch (err) {
        console.error("Error saving settings to Firestore", err);
      }
    };

    const timer = setTimeout(saveSettings, 2000);
    return () => clearTimeout(timer);
  }, [user, isAuthReady, currencySymbol, currencyPosition, decimalPlaces, uiMode, passcode, reminderEnabled, currentTheme]);

  // Firebase Sync Logic
  const handleSyncLocalToCloud = async () => {
    if (!user) {
      showNotification('Please login first', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      
      // Sync Expenses
      expenses.forEach(expense => {
        const ref = doc(db, `users/${user.uid}/expenses`, expense.id);
        batch.set(ref, { ...cleanData(expense), updatedAt: serverTimestamp() }, { merge: true });
      });

      // Sync Accounts
      accounts.forEach(account => {
        const ref = doc(db, `users/${user.uid}/accounts`, account.id);
        batch.set(ref, { ...cleanData(account), updatedAt: serverTimestamp() }, { merge: true });
      });

      // Sync Categories
      [...incomeCategories, ...expenseCategories].forEach(category => {
        const ref = doc(db, `users/${user.uid}/categories`, category.id);
        batch.set(ref, { ...cleanData(category), updatedAt: serverTimestamp() }, { merge: true });
      });

      // Sync Budgets
      budgets.forEach(budget => {
        const ref = doc(db, `users/${user.uid}/budgets`, budget.id);
        batch.set(ref, { ...cleanData(budget), updatedAt: serverTimestamp() }, { merge: true });
      });

      // Sync Settings
      const settingsRef = doc(db, `users/${user.uid}/settings/main`);
      batch.set(settingsRef, {
        ...cleanData({
          currencySymbol,
          currencyPosition,
          decimalPlaces,
          uiMode,
          passcode,
          reminderEnabled,
          currentThemeId: currentTheme.id,
        }),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      setLastSynced(new Date());
      showNotification('Local data synced to cloud successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      showNotification('Failed to sync local data to cloud.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Currency List (Common Currencies)
  const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'TWD', symbol: 'NT$', name: 'Taiwan New Dollar' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
    { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
    { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'AED', symbol: 'DH', name: 'UAE Dirham' },
    { code: 'COP', symbol: 'COL$', name: 'Colombian Peso' },
    { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'RON', symbol: 'L', name: 'Romanian Leu' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'ARS', symbol: 'ARS$', name: 'Argentine Peso' },
    { code: 'IQD', symbol: 'ID', name: 'Iraqi Dinar' },
    { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
    { code: 'QAR', symbol: 'QR', name: 'Qatari Rial' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
    { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
    { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar' },
    { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
    { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
    { code: 'ALL', symbol: 'L', name: 'Albanian Lek' },
    { code: 'AMD', symbol: '֏', name: 'Armenian Dram' },
    { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder' },
    { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza' },
    { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin' },
    { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
    { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark' },
    { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar' },
    { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
    { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar' },
    { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
    { code: 'BMD', symbol: 'BD$', name: 'Bermudian Dollar' },
    { code: 'BND', symbol: 'B$', name: 'Brunei Dollar' },
    { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano' },
    { code: 'BSD', symbol: 'B$', name: 'Bahamian Dollar' },
    { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum' },
    { code: 'BWP', symbol: 'P', name: 'Botswanan Pula' },
    { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
    { code: 'BZE', symbol: 'BZ$', name: 'Belize Dollar' },
    { code: 'CDF', symbol: 'FC', name: 'Congolese Franc' },
    { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón' },
    { code: 'CUP', symbol: '$MN', name: 'Cuban Peso' },
    { code: 'CVE', symbol: 'Esc', name: 'Cape Verdean Escudo' },
    { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
    { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
    { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa' },
    { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' },
    { code: 'FKP', symbol: '£', name: 'Falkland Islands Pound' },
    { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
    { code: 'GIP', symbol: '£', name: 'Gibraltar Pound' },
    { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi' },
    { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' },
    { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal' },
    { code: 'GYD', symbol: 'GY$', name: 'Guyanese Dollar' },
    { code: 'HNL', symbol: 'L', name: 'Honduran Lempira' },
    { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
    { code: 'HTG', symbol: 'G', name: 'Haitian Gourde' },
    { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
    { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
    { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar' },
    { code: 'KGS', symbol: 'лв', name: 'Kyrgystani Som' },
    { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
    { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' },
    { code: 'KYD', symbol: 'CI$', name: 'Cayman Islands Dollar' },
    { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
    { code: 'LAK', symbol: '₭', name: 'Laotian Kip' },
    { code: 'LBP', symbol: 'L£', name: 'Lebanese Pound' },
    { code: 'LRD', symbol: 'L$', name: 'Liberian Dollar' },
    { code: 'LSL', symbol: 'L', name: 'Lesotho Loti' },
    { code: 'LYD', symbol: 'LD', name: 'Libyan Dinar' },
    { code: 'MDL', symbol: 'L', name: 'Moldovan Leu' },
    { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' },
    { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar' },
    { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
    { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik' },
    { code: 'MOP', symbol: 'MOP$', name: 'Macanese Pataca' },
    { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya' },
    { code: 'MUR', symbol: 'Rs', name: 'Mauritian Rupee' },
    { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
    { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
    { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
    { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar' },
    { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba' },
    { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
    { code: 'OMR', symbol: 'RO', name: 'Omani Rial' },
    { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa' },
    { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol' },
    { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina' },
    { code: 'PYG', symbol: 'Gs', name: 'Paraguayan Guarani' },
    { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc' },
    { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar' },
    { code: 'SCR', symbol: 'Rs', name: 'Seychellois Rupee' },
    { code: 'SDG', symbol: 'S£', name: 'Sudanese Pound' },
    { code: 'SHP', symbol: '£', name: 'Saint Helena Pound' },
    { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone' },
    { code: 'SOS', symbol: 'S', name: 'Somali Shilling' },
    { code: 'SRD', symbol: 'Sr$', name: 'Surinamese Dollar' },
    { code: 'SSP', symbol: '£', name: 'South Sudanese Pound' },
    { code: 'STN', symbol: 'Db', name: 'São Tomé & Príncipe Dobra' },
    { code: 'SYP', symbol: '£', name: 'Syrian Pound' },
    { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni' },
    { code: 'TJS', symbol: 'SM', name: 'Tajikistani Somoni' },
    { code: 'TMT', symbol: 'T', name: 'Turkmenistani Manat' },
    { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar' },
    { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga' },
    { code: 'TTD', symbol: 'TT$', name: 'Trinidad & Tobago Dollar' },
    { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
    { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
    { code: 'UZS', symbol: 'лв', name: 'Uzbekistani Som' },
    { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolívar' },
    { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu' },
    { code: 'WST', symbol: 'WS$', name: 'Samoan Tala' },
    { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
    { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar' },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
    { code: 'XPF', symbol: 'CFP', name: 'CFP Franc' },
    { code: 'YER', symbol: '﷼', name: 'Yemeni Rial' },
    { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
    { code: 'ZWL', symbol: '$', name: 'Zimbabwean Dollar' },
  ];

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
    c.symbol.includes(currencySearchQuery)
  );
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly' | '3month' | '6month' | 'Year'>('Monthly');
  const [analysisMode, setAnalysisMode] = useState<'Expense overview' | 'Income overview' | 'Expense flow' | 'Income flow' | 'Account analysis' | 'Budget analysis'>('Expense overview');
  const [showTotal, setShowTotal] = useState(true);
  const [carryOver, setCarryOver] = useState(false);
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '',
    initial: 0,
    icon: ACCOUNT_ICONS[0]
  });

  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    icon: CATEGORY_ICONS[0],
    color: '',
    type: 'expense'
  });

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    amount: 0,
    type: 'expense',
    category: expenseCategories[0]?.name || '',
    account: accounts[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    note: '',
    description: ''
  });

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    category: '',
    amount: 0,
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  // Apply theme and UI mode
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-secondary', currentTheme.secondary);
    root.style.setProperty('--theme-bg', currentTheme.bg);
    root.style.setProperty('--theme-accent', currentTheme.accent);
    localStorage.setItem('mymoney_theme', JSON.stringify(currentTheme));

    // UI Mode Logic
    if (uiMode === 'dark') {
      root.classList.add('dark');
    } else if (uiMode === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    localStorage.setItem('mymoney_ui_mode', uiMode);
  }, [currentTheme, uiMode]);

  // Load initial data and settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('mymoney_theme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        const found = THEMES.find(t => t.id === theme.id);
        if (found) setCurrentTheme(found);
      } catch (e) {
        console.error('Failed to parse saved theme', e);
      }
    }

    const savedUiMode = localStorage.getItem('mymoney_ui_mode');
    if (savedUiMode) setUiMode(savedUiMode as any);

    const savedCurrency = localStorage.getItem('mymoney_currency');
    if (savedCurrency) setCurrencySymbol(savedCurrency);

    const savedCurrencyPos = localStorage.getItem('mymoney_currency_pos');
    if (savedCurrencyPos) setCurrencyPosition(savedCurrencyPos as any);

    const savedDecimals = localStorage.getItem('mymoney_decimals');
    if (savedDecimals) setDecimalPlaces(Number(savedDecimals));

    const savedPasscode = localStorage.getItem('mymoney_passcode');
    const savedSecurity = localStorage.getItem('mymoney_security_enabled');
    if (savedSecurity === 'true' && savedPasscode && savedPasscode !== 'null' && savedPasscode.length >= 4) {
      setPasscode(savedPasscode);
      setSecurityEnabled(true);
      setIsLocked(true);
      setIsPasscodeModalOpen(true);
    } else if (savedPasscode) {
      setPasscode(savedPasscode);
    }

    const savedReminder = localStorage.getItem('mymoney_reminder');
    if (savedReminder) setReminderEnabled(savedReminder === 'true');

    const savedExpenses = localStorage.getItem('mymoney_data');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (e) {
        console.error('Failed to parse saved expenses', e);
      }
    }

    const savedAccounts = localStorage.getItem('mymoney_accounts');
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts));
      } catch (e) {
        console.error('Failed to parse saved accounts', e);
      }
    }

    const savedIncomeCats = localStorage.getItem('mymoney_income_cats');
    if (savedIncomeCats) {
      try {
        setIncomeCategories(JSON.parse(savedIncomeCats));
      } catch (e) {
        console.error('Failed to parse saved income categories', e);
      }
    }

    const savedExpenseCats = localStorage.getItem('mymoney_expense_cats');
    if (savedExpenseCats) {
      try {
        setExpenseCategories(JSON.parse(savedExpenseCats));
      } catch (e) {
        console.error('Failed to parse saved expense categories', e);
      }
    }

    const savedBudgets = localStorage.getItem('mymoney_budgets');
    if (savedBudgets) {
      try {
        setBudgets(JSON.parse(savedBudgets));
      } catch (e) {
        console.error('Failed to parse saved budgets', e);
      }
    }
  }, []);

  // Helper: Format Amount
  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toFixed(decimalPlaces);
    if (currencyPosition === 'start') {
      return `${currencySymbol}${formatted}`;
    }
    return `${formatted}${currencySymbol}`;
  };

  // Notification Logic
  useEffect(() => {
    if (!reminderEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // 10:00 AM, 2:30 PM (14:30), 8:00 PM (20:00)
      const reminderTimes = [
        { h: 10, m: 0 },
        { h: 14, m: 30 },
        { h: 20, m: 0 }
      ];

      const isReminderTime = reminderTimes.some(t => t.h === hours && t.m === minutes);
      
      if (isReminderTime) {
        // Show toast notification
        showNotification("Time to add your daily expenses! 💸", "success");
        
        // Also try browser notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("MyMoney Reminder", {
            body: "Don't forget to record your expenses for today!",
            icon: "/favicon.ico"
          });
        }
      }
    };

    // Request permission on enable
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminderEnabled]);

  useEffect(() => {
    localStorage.setItem('mymoney_data', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('mymoney_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('mymoney_income_cats', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('mymoney_expense_cats', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('mymoney_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('mymoney_currency', currencySymbol);
  }, [currencySymbol]);

  useEffect(() => {
    localStorage.setItem('mymoney_currency_pos', currencyPosition);
  }, [currencyPosition]);

  useEffect(() => {
    localStorage.setItem('mymoney_decimals', String(decimalPlaces));
  }, [decimalPlaces]);

  useEffect(() => {
    localStorage.setItem('mymoney_ui_mode', uiMode);
  }, [uiMode]);

  useEffect(() => {
    if (passcode === null) {
      localStorage.removeItem('mymoney_passcode');
    } else {
      localStorage.setItem('mymoney_passcode', passcode);
    }
  }, [passcode]);

  useEffect(() => {
    localStorage.setItem('mymoney_security_enabled', String(securityEnabled));
  }, [securityEnabled]);

  useEffect(() => {
    localStorage.setItem('mymoney_reminder', String(reminderEnabled));
  }, [reminderEnabled]);

  // Update account balances based on expenses
  const getAccountBalance = (accountName: string) => {
    const account = accounts.find(a => a.name === accountName);
    if (!account) return 0;
    
    const relevantExpenses = expenses.filter(e => e.account === accountName || e.toAccount === accountName);
    const income = relevantExpenses.filter(e => (e.type === 'income' && e.account === accountName) || (e.type === 'transfer' && e.toAccount === accountName)).reduce((acc, curr) => acc + curr.amount, 0);
    const expense = relevantExpenses.filter(e => (e.type === 'expense' && e.account === accountName) || (e.type === 'transfer' && e.account === accountName)).reduce((acc, curr) => acc + curr.amount, 0);
    
    return account.initial + income - expense;
  };

  const handleCalculatorClick = (value: string) => {
    if (value === 'back') {
      if (calculatorInput.length === 1) {
        setCalculatorInput('0');
        setNewExpense(prev => ({ ...prev, amount: 0 }));
      } else {
        const newVal = calculatorInput.slice(0, -1);
        setCalculatorInput(newVal);
        try {
          const result = eval(newVal.replace(/×/g, '*').replace(/÷/g, '/'));
          if (!isNaN(result) && isFinite(result)) {
            setNewExpense(prev => ({ ...prev, amount: Number(result) || 0 }));
          }
        } catch { /* incomplete expression */ }
      }
      return;
    }
    if (value === '=') {
      try {
        const result = eval(calculatorInput.replace(/×/g, '*').replace(/÷/g, '/'));
        if (!isNaN(result) && isFinite(result)) {
          setCalculatorInput(String(result));
          setNewExpense(prev => ({ ...prev, amount: Number(result) || 0 }));
        }
      } catch {
        showNotification('Invalid expression', 'error');
      }
      return;
    }
    
    setCalculatorInput(prev => {
      const next = prev === '0' && !['+', '-', '×', '÷', '.'].includes(value) ? value : prev + value;
      try {
        const result = eval(next.replace(/×/g, '*').replace(/÷/g, '/'));
        if (!isNaN(result) && isFinite(result)) {
          setNewExpense(prevExp => ({ ...prevExp, amount: Number(result) || 0 }));
        }
      } catch { /* incomplete expression */ }
      return next;
    });
  };

  const handleAddExpense = () => {
    if (!newExpense.amount || newExpense.amount <= 0) return;

    const accountName = newExpense.account || (accounts[0]?.name || '');
    const currentBalance = getAccountBalance(accountName);

    if (newExpense.type === 'expense' && currentBalance < Number(newExpense.amount)) {
      showNotification('Insufficient balance', 'error');
      return;
    }

    if (newExpense.type === 'transfer' && currentBalance < Number(newExpense.amount)) {
      showNotification('Insufficient balance', 'error');
      return;
    }
    
    const expense: Expense = {
      id: newExpense.id || Math.random().toString(36).substr(2, 9),
      amount: Number(newExpense.amount),
      type: (newExpense.type as any) || 'expense',
      category: newExpense.category || (newExpense.type === 'income' ? incomeCategories[0]?.name : (newExpense.type === 'transfer' ? 'Transfer' : expenseCategories[0]?.name)),
      account: newExpense.account || (accounts[0]?.name || ''),
      toAccount: newExpense.toAccount,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      time: newExpense.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      note: newExpense.note || '',
      description: newExpense.description || ''
    };

    if (newExpense.id) {
      setExpenses(expenses.map(e => e.id === newExpense.id ? expense : e));
      if (user) saveToFirestore(`users/${user.uid}/expenses/${expense.id}`, expense);
      showNotification('Record updated successfully!');
    } else {
      setExpenses([expense, ...expenses]);
      if (user) saveToFirestore(`users/${user.uid}/expenses/${expense.id}`, expense);
      showNotification('Record saved successfully!');
    }

    setIsAddModalOpen(false);
    setCalculatorInput('0');
    setNewExpense({
      amount: 0,
      type: 'expense',
      category: expenseCategories[0]?.name || '',
      account: accounts[0]?.name || '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      note: '',
      description: ''
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.name) return;

    const category: Category = {
      id: editingCategory?.id || Math.random().toString(36).substr(2, 9),
      name: newCategory.name,
      icon: newCategory.icon || '',
      color: newCategory.color || '',
      type: newCategory.type as 'income' | 'expense',
      customIcon: newCategory.customIcon
    };

    if (category.type === 'income') {
      if (editingCategory) {
        setIncomeCategories(incomeCategories.map(c => c.id === editingCategory.id ? category : c));
      } else {
        setIncomeCategories([...incomeCategories, category]);
      }
    } else {
      if (editingCategory) {
        setExpenseCategories(expenseCategories.map(c => c.id === editingCategory.id ? category : c));
      } else {
        setExpenseCategories([...expenseCategories, category]);
      }
    }
    if (user) saveToFirestore(`users/${user.uid}/categories/${category.id}`, category);

    showNotification(`Category ${editingCategory ? 'updated' : 'added'} successfully!`);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string, type: 'income' | 'expense') => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const catToDelete = categories.find(c => c.id === id);
    
    if (catToDelete && expenses.some(e => e.category === catToDelete.name)) {
      showNotification('Cannot delete category with existing records.', 'error');
      return;
    }

    if (type === 'income') {
      setIncomeCategories(incomeCategories.filter(c => c.id !== id));
    } else {
      setExpenseCategories(expenseCategories.filter(c => c.id !== id));
    }
    if (user) deleteFromFirestore(`users/${user.uid}/categories/${id}`);
    showNotification('Category deleted successfully!');
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
    setNewCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleAddAccount = () => {
    if (!newAccount.name) return;

    const account: Account = {
      id: editingAccount?.id || Math.random().toString(36).substr(2, 9),
      name: newAccount.name,
      initial: Number(newAccount.initial) || 0,
      balance: 0, // Balance is calculated dynamically
      icon: newAccount.icon || ACCOUNT_ICONS[0],
      customIcon: newAccount.customIcon
    };

    if (editingAccount) {
      setAccounts(accounts.map(a => a.id === editingAccount.id ? account : a));
      if (user) saveToFirestore(`users/${user.uid}/accounts/${account.id}`, account);
      showNotification('Account updated successfully!');
    } else {
      setAccounts([...accounts, account]);
      if (user) saveToFirestore(`users/${user.uid}/accounts/${account.id}`, account);
      showNotification('Account added successfully!');
    }

    setIsAccountModalOpen(false);
    setEditingAccount(null);
    setNewAccount({ name: '', initial: 0, icon: ACCOUNT_ICONS[0] });
  };

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.amount) return;

    const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const budget: Budget = {
      id: editingBudget?.id || Math.random().toString(36).substr(2, 9),
      category: newBudget.category,
      amount: Number(newBudget.amount),
      period
    };

    if (editingBudget) {
      setBudgets(budgets.map(b => b.id === editingBudget.id ? budget : b));
      if (user) saveToFirestore(`users/${user.uid}/budgets/${budget.id}`, budget);
      showNotification('Budget updated successfully!');
    } else {
      // Check if budget already exists for this category and period
      if (budgets.some(b => b.category === budget.category && b.period === period)) {
        showNotification('Budget already exists for this category.', 'error');
        return;
      }
      setBudgets([...budgets, budget]);
      if (user) saveToFirestore(`users/${user.uid}/budgets/${budget.id}`, budget);
      showNotification('Budget set successfully!');
    }

    setIsBudgetModalOpen(false);
    setEditingBudget(null);
    setNewBudget({ category: '', amount: 0 });
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
    if (user) deleteFromFirestore(`users/${user.uid}/budgets/${id}`);
    showNotification('Budget deleted successfully!');
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleDeleteAccount = (id: string) => {
    const accountToDelete = accounts.find(a => a.id === id);
    if (accountToDelete && expenses.some(e => e.account === accountToDelete.name)) {
      showNotification('Cannot delete account with existing records.', 'error');
      return;
    }
    setAccounts(accounts.filter(a => a.id !== id));
    if (user) deleteFromFirestore(`users/${user.uid}/accounts/${id}`);
    showNotification('Account deleted successfully!');
  };

  const handleEditAccountClick = (account: Account) => {
    setEditingAccount(account);
    setNewAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    if (user) deleteFromFirestore(`users/${user.uid}/expenses/${id}`);
    setIsDetailsModalOpen(false);
    showNotification('Record deleted successfully!');
  };

  const handleEditClick = (expense: Expense) => {
    setNewExpense(expense);
    setCalculatorInput(String(expense.amount));
    setIsDetailsModalOpen(false);
    setIsAddModalOpen(true);
  };

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBackup = () => {
    const data = {
      expenses,
      accounts,
      incomeCategories,
      expenseCategories,
      budgets,
      settings: {
        currencySymbol,
        currencyPosition,
        decimalPlaces,
        uiMode,
        passcode,
        reminderEnabled,
        currentThemeId: currentTheme.id
      }
    };
    const dataString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mymoney_backup_${new Date().toISOString().split('T')[0]}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSidebarOpen(false);
    setIsManagementModalOpen(false);
    showNotification('Full backup downloaded successfully!');
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      showNotification('No records to export.', 'error');
      return;
    }

    const headers = ['Date', 'Time', 'Type', 'Category', 'Account', 'Amount', 'Note', 'Description'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(e => [
        e.date,
        e.time,
        e.type,
        e.category,
        e.account,
        e.amount,
        `"${(e.note || '').replace(/"/g, '""')}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mymoney_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSidebarOpen(false);
    showNotification('Records exported to CSV successfully!');
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const bytes = CryptoJS.AES.decrypt(content, ENCRYPTION_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        const parsed = JSON.parse(decryptedData);
        
        if (parsed.expenses && Array.isArray(parsed.expenses)) {
          setExpenses(parsed.expenses);
          if (parsed.accounts) setAccounts(parsed.accounts);
          if (parsed.incomeCategories) setIncomeCategories(parsed.incomeCategories);
          if (parsed.expenseCategories) setExpenseCategories(parsed.expenseCategories);
          if (parsed.budgets) setBudgets(parsed.budgets);
          
          if (parsed.settings) {
            const s = parsed.settings;
            if (s.currencySymbol) setCurrencySymbol(s.currencySymbol);
            if (s.currencyPosition) setCurrencyPosition(s.currencyPosition);
            if (s.decimalPlaces !== undefined) setDecimalPlaces(s.decimalPlaces);
            if (s.uiMode) setUiMode(s.uiMode);
            if (s.passcode) setPasscode(s.passcode);
            if (s.reminderEnabled !== undefined) setReminderEnabled(s.reminderEnabled);
            if (s.currentThemeId) {
              const found = THEMES.find(t => t.id === s.currentThemeId);
              if (found) setCurrentTheme(found);
            }
          }
          
          setIsSidebarOpen(false);
          setIsManagementModalOpen(false);
          showNotification('All data restored successfully!');
        } else if (Array.isArray(parsed)) {
          // Fallback for old backup format which was just an array of expenses
          setExpenses(parsed);
          setIsSidebarOpen(false);
          setIsManagementModalOpen(false);
          showNotification('Records restored successfully!');
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        showNotification('Failed to restore backup. Invalid file or key.', 'error');
      }
    };
    reader.readAsText(file);
    setIsSidebarOpen(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="bg-gray-300/80 px-0.5 rounded">{part}</span> 
            : part
        )}
      </>
    );
  };

  const filteredExpenses = expenses.filter(e => {
    if (isSearchOpen && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        (e.note && e.note.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query))
      );
    }

    const d = new Date(e.date);
    const today = new Date(currentDate);
    
    if (viewMode === 'Daily') {
      return d.toDateString() === today.toDateString();
    } else if (viewMode === 'Weekly') {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);
      return d >= firstDayOfWeek && d <= lastDayOfWeek;
    } else if (viewMode === 'Monthly') {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    } else if (viewMode === '3month') {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 2);
      threeMonthsAgo.setDate(1);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      return d >= threeMonthsAgo && d <= today;
    } else if (viewMode === '6month') {
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      return d >= sixMonthsAgo && d <= today;
    } else if (viewMode === 'Year') {
      return d.getFullYear() === today.getFullYear();
    }
    return false;
  });

  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const totalIncome = filteredExpenses.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredExpenses.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  const getPreviousBalance = () => {
    if (!carryOver) return 0;
    
    const today = new Date(currentDate);
    let startDate: Date;
    
    if (viewMode === 'Daily') {
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
    } else if (viewMode === 'Weekly') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (viewMode === 'Monthly') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (viewMode === '3month') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 2);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (viewMode === '6month') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 5);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (viewMode === 'Year') {
      startDate = new Date(today.getFullYear(), 0, 1);
    } else {
      return 0;
    }

    const previousExpenses = expenses.filter(e => new Date(e.date) < startDate);
    const prevIncome = previousExpenses.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const prevExpense = previousExpenses.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const initialBalance = accounts.reduce((acc, curr) => acc + curr.initial, 0);
    
    return initialBalance + prevIncome - prevExpense;
  };

  const totalBalance = (carryOver ? getPreviousBalance() : 0) + totalIncome - totalExpense;

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center">
      <div className="w-full max-w-2xl min-h-screen bg-app-bg text-app-green font-sans pb-20 overflow-x-hidden shadow-2xl relative">
        {/* Header */}
        {!isLocked && (
        <header className="px-4 py-3 flex justify-between items-center bg-[#FDFDF0] sticky top-0 z-30">
          {!isSearchOpen ? (
            <>
              <button onClick={() => setIsSidebarOpen(true)} className="p-1">
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex-1 flex flex-col items-center">
                <h1 className="text-2xl font-script font-bold">MyMoney</h1>
                {isSyncing && (
                  <div className="flex items-center gap-1 text-[10px] opacity-50">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </div>
                )}
                {!isSyncing && lastSynced && (
                  <span className="text-[10px] opacity-40">Synced at {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
              <button onClick={() => setIsSearchOpen(true)} className="p-1">
                <Search className="w-6 h-6" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-1">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input 
                  type="text" 
                  placeholder="Search note..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-app-green/5 border border-app-green/10 rounded-xl pl-10 pr-10 py-2 text-sm focus:ring-1 focus:ring-app-green/20 outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* Sidebar Drawer */}
      {!isLocked && (
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-app-bg z-50 shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-[#1B4332]/10">
                  <div className="flex items-center gap-3 mb-2">
                    {user ? (
                      <img src={user.photoURL || ''} alt="Avatar" className="w-10 h-10 rounded-full border border-app-green/20" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-app-green/10 flex items-center justify-center">
                        <Wallet className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <h2 className="text-xl font-script font-bold truncate">{user ? user.displayName : 'MyMoney'}</h2>
                      <p className="text-[10px] opacity-50 truncate">{user ? user.email : '4.4-free'}</p>
                    </div>
                  </div>
                  {user ? (
                    <button 
                      onClick={() => { logout(); setIsSidebarOpen(false); }}
                      className="w-full py-2 bg-red-500/10 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all"
                    >
                      Logout
                    </button>
                  ) : (
                    <button 
                      onClick={() => { loginWithGoogle(); setIsSidebarOpen(false); }}
                      className="w-full py-2 bg-app-green text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-app-green/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Login with Google
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto py-4">
                  <SidebarItem icon={<SettingsIcon className="w-5 h-5" />} label="Preferences" onClick={() => { setIsPreferencesOpen(true); setIsSidebarOpen(false); }} />
                  
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider opacity-40 mt-2">Management</div>
                  <SidebarItem icon={<Database className="w-5 h-5" />} label="Data Management" onClick={() => { setIsManagementModalOpen(true); setIsSidebarOpen(false); }} />
                  <SidebarItem icon={<Download className="w-5 h-5" />} label="Export records (CSV)" onClick={handleExportCSV} />
                  <SidebarItem icon={<Trash2 className="w-5 h-5" />} label="Delete & Reset" onClick={() => { 
                    setIsResetModalOpen(true);
                    setIsSidebarOpen(false);
                  }} />

                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider opacity-40 mt-2">Application</div>
                  <SidebarItem icon={<Star className="w-5 h-5 text-yellow-600" />} label="Themes (Pro)" onClick={() => { setIsThemeModalOpen(true); setIsSidebarOpen(false); }} />
                  <SidebarItem icon={<ThumbsUp className="w-5 h-5" />} label="Like MyMoney" />
                  <SidebarItem icon={<Mail className="w-5 h-5" />} label="Feedback" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Preferences Page */}
      <AnimatePresence>
        {isPreferencesOpen && (
          <div className="fixed inset-0 bg-black/40 z-[60] flex justify-center items-center">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-2xl h-full bg-app-bg flex flex-col shadow-2xl"
            >
            <header className="px-4 py-3 flex items-center gap-4 border-b border-[#1B4332]/10">
              <button onClick={() => setIsPreferencesOpen(false)}>
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-medium">Preferences</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <SettingsSection title="Appearance">
                <SettingsItem label="Theme (Pro version)" sublabel={currentTheme.name} onClick={() => setIsThemeModalOpen(true)} />
              </SettingsSection>
              <SettingsSection title="UI mode">
                <div className="flex gap-2 p-1 bg-app-green/5 rounded-xl">
                  {(['system', 'light', 'dark'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setUiMode(mode)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize",
                        uiMode === mode ? "bg-white shadow-sm text-app-green" : "opacity-50"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </SettingsSection>
              <SettingsSection title="Currency sign">
                <button 
                  onClick={() => setIsCurrencyModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 bg-app-green/5 rounded-2xl hover:bg-app-green/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-app-green/10">
                      {currencySymbol}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">Select Currency</p>
                      <p className="text-[10px] opacity-50">Choose from 150+ currencies</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-30" />
                </button>
              </SettingsSection>
              <SettingsSection title="Currency position">
                <div className="flex gap-2 p-1 bg-app-green/5 rounded-xl">
                  {(['start', 'end'] as const).map(pos => (
                    <button 
                      key={pos}
                      onClick={() => {
                        setCurrencyPosition(pos);
                        localStorage.setItem('mymoney_currency_pos', pos);
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize",
                        currencyPosition === pos ? "bg-white shadow-sm text-app-green" : "opacity-50"
                      )}
                    >
                      {pos === 'start' ? 'At start' : 'At end'}
                    </button>
                  ))}
                </div>
              </SettingsSection>
              <SettingsSection title="Decimal places">
                <div className="flex gap-2 p-1 bg-app-green/5 rounded-xl">
                  {[0, 1, 2].map(num => (
                    <button 
                      key={num}
                      onClick={() => {
                        setDecimalPlaces(num);
                        localStorage.setItem('mymoney_decimals', String(num));
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        decimalPlaces === num ? "bg-white shadow-sm text-app-green" : "opacity-50"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </SettingsSection>
              <SettingsSection title="Security">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-sm font-medium">Passcode protection</p>
                      <p className="text-[10px] opacity-50">Requires a Passcode to enter app</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (!passcode) {
                          setPasscodeSetupMode('set');
                          setPasscodeSetupStep(1);
                          setPasscodeAttempt('');
                          setTempPasscode('');
                          setIsPasscodeSetupOpen(true);
                        } else {
                          setSecurityEnabled(!securityEnabled);
                        }
                      }}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors",
                        securityEnabled ? "bg-app-green" : "bg-gray-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        securityEnabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                  {passcode && (
                    <button 
                      onClick={() => {
                        setPasscodeSetupMode('disable');
                        setPasscodeSetupStep(1);
                        setPasscodeAttempt('');
                        setIsPasscodeSetupOpen(true);
                      }}
                      className="text-xs font-bold text-red-600 uppercase tracking-wider"
                    >
                      Change or Remove Passcode
                    </button>
                  )}
                </div>
              </SettingsSection>
              <SettingsSection title="Data Management">
                <button 
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors text-red-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-red-100">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">Delete & Reset</p>
                      <p className="text-[10px] opacity-50">Clear all data and settings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-30" />
                </button>
              </SettingsSection>
              <SettingsSection title="Notification">
                <div className="flex justify-between items-center py-2">
                  <p className="text-sm">Remind everyday</p>
                  <button 
                    onClick={() => {
                      setReminderEnabled(!reminderEnabled);
                      localStorage.setItem('mymoney_reminder', String(!reminderEnabled));
                    }}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      reminderEnabled ? "bg-app-green" : "bg-gray-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                      reminderEnabled ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              </SettingsSection>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className={cn("flex-1", isLocked && "hidden")}>
        <AnimatePresence mode="wait">
          {activeTab === 'records' && (
            <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Date Selector */}
              <div className="flex items-center justify-between px-4 py-2">
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (viewMode === 'Daily') {
                    d.setDate(d.getDate() - 1);
                  } else if (viewMode === 'Weekly') {
                    d.setDate(d.getDate() - 7);
                  } else if (viewMode === '3month') {
                    d.setMonth(d.getMonth() - 3);
                  } else if (viewMode === '6month') {
                    d.setMonth(d.getMonth() - 6);
                  } else if (viewMode === 'Year') {
                    d.setFullYear(d.getFullYear() - 1);
                  } else {
                    d.setMonth(d.getMonth() - 1);
                  }
                  setCurrentDate(d);
                }} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
                <span className="font-bold text-sm text-app-green">
                  {(() => {
                    if (viewMode === 'Daily') return currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                    if (viewMode === 'Year') return currentDate.getFullYear().toString();
                    if (viewMode === 'Weekly') {
                      const start = new Date(currentDate);
                      start.setDate(currentDate.getDate() - currentDate.getDay());
                      const end = new Date(start);
                      end.setDate(start.getDate() + 6);
                      return `${start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
                    }
                    if (viewMode === '3month' || viewMode === '6month') {
                      const months = viewMode === '3month' ? 2 : 5;
                      const start = new Date(currentDate);
                      start.setMonth(currentDate.getMonth() - months);
                      return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
                    }
                    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  })()}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    if (viewMode === 'Daily') {
                      d.setDate(d.getDate() + 1);
                    } else if (viewMode === 'Weekly') {
                      d.setDate(d.getDate() + 7);
                    } else if (viewMode === '3month') {
                      d.setMonth(d.getMonth() + 3);
                    } else if (viewMode === '6month') {
                      d.setMonth(d.getMonth() + 6);
                    } else if (viewMode === 'Year') {
                      d.setFullYear(d.getFullYear() + 1);
                    } else {
                      d.setMonth(d.getMonth() + 1);
                    }
                    setCurrentDate(d);
                  }} className="p-1"><ChevronRight className="w-6 h-6" /></button>
                  <button onClick={() => setIsFilterModalOpen(true)} className="p-1 ml-1"><Filter className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Search Info */}
              {isSearchOpen && searchQuery.trim() !== '' && (
                <div className="px-4 py-2 border-b border-[#1B4332]/5">
                  <p className="text-center text-xs opacity-50">Total {filteredExpenses.length} matches found</p>
                </div>
              )}

              {/* Summary Bar */}
              {showTotal && (
                <div className="grid grid-cols-3 px-6 py-4 text-center border-b border-app-green/5">
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Expense</p>
                    <p className="text-sm font-bold text-red-700">{formatAmount(totalExpense)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Income</p>
                    <p className="text-sm font-bold text-green-700">{formatAmount(totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Total</p>
                    <p className={cn("text-sm font-bold", totalBalance >= 0 ? "text-green-700" : "text-red-700")}>
                      {formatAmount(totalBalance)}
                    </p>
                  </div>
                </div>
              )}

              {/* Content */}
              {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 px-12 text-center opacity-40">
                  <div className="w-20 h-20 border-2 border-app-green rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="w-12 h-1 bg-app-green absolute top-4 left-4" />
                    <div className="w-12 h-1 bg-app-green absolute top-8 left-4" />
                    <div className="w-8 h-1 bg-app-green absolute top-12 left-4" />
                    <div className="absolute -bottom-2 -right-2 bg-app-bg p-1">
                      <div className="w-6 h-6 border-2 border-app-green rounded-full flex items-center justify-center font-bold">!</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">No record in this period. Tap + to add new expense or income.</p>
                </div>
              ) : (
                <div className="pb-4">
                  {sortedDates.map(date => (
                    <div key={date} className="mb-2">
                      <div className="px-4 py-2 border-t border-app-green/20">
                        <p className="text-xs font-bold text-app-green">{formatDateHeader(date)}</p>
                      </div>
                      <div className="">
                        {groupedExpenses[date].map(e => (
                          <div 
                            key={e.id} 
                            onClick={() => { setSelectedExpense(e); setIsDetailsModalOpen(true); }}
                            className="px-4 py-3 active:bg-app-green/5 transition-colors cursor-pointer border-b border-app-green/5 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                {(() => {
                                  if (e.type === 'transfer') {
                                    return (
                                      <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#1E40AF] text-white shadow-sm">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                          <path d="M17 7l-5 5 5 5M7 7l5 5-5 5" />
                                        </svg>
                                      </div>
                                    );
                                  }
                                  const cat = e.type === 'income' 
                                    ? incomeCategories.find(c => c.name === e.category) 
                                    : expenseCategories.find(c => c.name === e.category);
                                  return (
                                    <IconDisplay 
                                      icon={cat?.icon || (e.type === 'income' ? '💰' : '💸')} 
                                      customIcon={cat?.customIcon}
                                      className={cn(
                                        "w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-sm",
                                        cat?.color || "bg-gray-200 text-white"
                                      )}
                                    />
                                  );
                                })()}
                                <div>
                                  <p className="font-bold text-[15px] text-app-green">{e.note || (e.type === 'transfer' ? 'Transfer' : e.category)}</p>
                                  <div className="flex items-center gap-1 text-[11px] opacity-60 mt-0.5">
                                    {(() => {
                                      const acc = accounts.find(a => a.name === e.account);
                                      if (e.type === 'transfer') {
                                        const toAcc = accounts.find(a => a.name === e.toAccount);
                                        return (
                                          <div className="flex items-center gap-1">
                                            <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                              <IconDisplay icon={acc?.icon || '💰'} customIcon={acc?.customIcon} className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center" />
                                              <span className="text-[10px]">{e.account}</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 mx-0.5" />
                                            <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                              <IconDisplay icon={toAcc?.icon || '💰'} customIcon={toAcc?.customIcon} className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center" />
                                              <span className="text-[10px]">{e.toAccount}</span>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                          <IconDisplay icon={acc?.icon || '💰'} customIcon={acc?.customIcon} className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center" />
                                          <span className="text-[10px]">{e.account}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <p className={cn("font-bold text-[15px]", e.type === 'income' ? "text-green-700" : e.type === 'transfer' ? "text-blue-800" : "text-red-700")}>
                                {e.type === 'income' ? '' : e.type === 'transfer' ? '' : '-'}{formatAmount(e.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-4">
              {/* Date Selector */}
              <div className="flex items-center justify-between px-4 py-2">
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (viewMode === 'Daily') {
                    d.setDate(d.getDate() - 1);
                  } else if (viewMode === 'Weekly') {
                    d.setDate(d.getDate() - 7);
                  } else if (viewMode === '3month') {
                    d.setMonth(d.getMonth() - 3);
                  } else if (viewMode === '6month') {
                    d.setMonth(d.getMonth() - 6);
                  } else if (viewMode === 'Year') {
                    d.setFullYear(d.getFullYear() - 1);
                  } else {
                    d.setMonth(d.getMonth() - 1);
                  }
                  setCurrentDate(d);
                }} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
                <span className="font-bold text-sm text-app-green">
                  {(() => {
                    if (viewMode === 'Daily') return currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                    if (viewMode === 'Year') return currentDate.getFullYear().toString();
                    if (viewMode === 'Weekly') {
                      const start = new Date(currentDate);
                      start.setDate(currentDate.getDate() - currentDate.getDay());
                      const end = new Date(start);
                      end.setDate(start.getDate() + 6);
                      return `${start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
                    }
                    if (viewMode === '3month' || viewMode === '6month') {
                      const months = viewMode === '3month' ? 2 : 5;
                      const start = new Date(currentDate);
                      start.setMonth(currentDate.getMonth() - months);
                      return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
                    }
                    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  })()}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    if (viewMode === 'Daily') {
                      d.setDate(d.getDate() + 1);
                    } else if (viewMode === 'Weekly') {
                      d.setDate(d.getDate() + 7);
                    } else if (viewMode === '3month') {
                      d.setMonth(d.getMonth() + 3);
                    } else if (viewMode === '6month') {
                      d.setMonth(d.getMonth() + 6);
                    } else if (viewMode === 'Year') {
                      d.setFullYear(d.getFullYear() + 1);
                    } else {
                      d.setMonth(d.getMonth() + 1);
                    }
                    setCurrentDate(d);
                  }} className="p-1"><ChevronRight className="w-6 h-6" /></button>
                  <button onClick={() => setIsFilterModalOpen(true)} className="p-1 ml-1"><Filter className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Summary Bar */}
              {showTotal && (
                <div className="grid grid-cols-3 px-6 py-4 text-center border-b border-app-green/5">
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Expense</p>
                    <p className="text-sm font-medium text-red-700">{formatAmount(totalExpense)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Income</p>
                    <p className="text-sm font-medium text-green-700">{formatAmount(totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Balance</p>
                    <p className="text-sm font-medium text-app-green">{formatAmount(totalBalance)}</p>
                  </div>
                </div>
              )}

              {/* Analysis Mode Selector */}
              <div className="px-6 py-4">
                <div className="relative">
                  <select 
                    value={analysisMode}
                    onChange={(e) => setAnalysisMode(e.target.value as any)}
                    className="w-full bg-white border-2 border-app-green rounded-lg px-10 py-3 text-sm font-bold uppercase tracking-widest text-center appearance-none focus:outline-none text-app-green"
                  >
                    <option value="Expense overview">Expense overview</option>
                    <option value="Income overview">Income overview</option>
                    <option value="Expense flow">Expense flow</option>
                    <option value="Income flow">Income flow</option>
                    <option value="Account analysis">Account analysis</option>
                    <option value="Budget analysis">Budget analysis</option>
                  </select>
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronLeft className="w-5 h-5 rotate-270 text-app-green" />
                  </div>
                </div>
              </div>

              {/* Charts and Data */}
              {(() => {
                const isIncome = analysisMode === 'Income overview' || analysisMode === 'Income flow';
                const isFlow = analysisMode === 'Expense flow' || analysisMode === 'Income flow';
                const isAccount = analysisMode === 'Account analysis';
                const isBudget = analysisMode === 'Budget analysis';

                if (isBudget) {
                  const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                  const monthlyBudgets = budgets.filter(b => b.period === period);
                  const monthExpenses = expenses.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                  });

                  return (
                    <div className="p-6 space-y-6">
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-app-green/10">
                        <h3 className="text-sm font-bold mb-4">Monthly Budget Progress</h3>
                        <div className="space-y-6">
                          {monthlyBudgets.length === 0 ? (
                            <div className="text-center py-10 opacity-40">
                              <Calculator className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-xs font-bold">No budgets set for this month</p>
                              <button 
                                onClick={() => setActiveTab('budgets')}
                                className="mt-4 text-app-green text-xs font-bold underline"
                              >
                                Set Budgets
                              </button>
                            </div>
                          ) : (
                            monthlyBudgets.map(budget => {
                              const cat = expenseCategories.find(c => c.name === budget.category);
                              const spent = monthExpenses
                                .filter(e => e.type === 'expense' && e.category === budget.category)
                                .reduce((acc, curr) => acc + curr.amount, 0);
                              const percent = Math.min((spent / budget.amount) * 100, 100);
                              const isOver = spent > budget.amount;

                              return (
                                <div key={budget.id} className="space-y-2">
                                  <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{cat?.icon || '📁'}</span>
                                      <span className="text-xs font-bold">{budget.category}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold opacity-40 uppercase">Spent / Budget</p>
                                      <p className={cn("text-xs font-bold", isOver ? "text-red-600" : "text-app-green")}>
                                        {formatAmount(spent)} / {formatAmount(budget.amount)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="h-2 bg-app-green/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percent}%` }}
                                      className={cn(
                                        "h-full rounded-full",
                                        isOver ? "bg-red-500" : "bg-app-green"
                                      )}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isFlow) {
                  // Flow Line Chart
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  
                  const flowData = filteredExpenses
                    .filter(e => e.type === (analysisMode === 'Income flow' ? 'income' : 'expense'))
                    .reduce((acc, e) => {
                      const date = e.date;
                      acc[date] = (acc[date] || 0) + e.amount;
                      return acc;
                    }, {} as Record<string, number>);

                  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    return {
                      day,
                      date: dateStr,
                      displayDate: new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                      amount: flowData[dateStr] || 0
                    };
                  });

                  // Calendar logic
                  const firstDayOfMonth = new Date(year, month, 1).getDay();
                  const calendarDays = [];
                  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
                  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

                  return (
                    <div className="px-4 space-y-8">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isIncome ? '#10B981' : '#EF4444'} stopOpacity={0.1}/>
                                <stop offset="95%" stopColor={isIncome ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#1B4332" opacity={0.1} />
                            <XAxis 
                              dataKey="displayDate" 
                              fontSize={9} 
                              axisLine={false} 
                              tickLine={false} 
                              interval={Math.floor(daysInMonth / 5)}
                              tick={{ fill: '#1B4332', opacity: 0.6 }}
                            />
                            <YAxis 
                              fontSize={9} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#1B4332', opacity: 0.6 }}
                              tickFormatter={(val) => `${currencyPosition === 'start' ? currencySymbol : ''}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}${currencyPosition === 'end' ? currencySymbol : ''}`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#FDFDF0', border: '1px solid #1B433210', borderRadius: '8px' }}
                              itemStyle={{ color: isIncome ? '#10B981' : '#EF4444' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="amount" 
                              stroke={isIncome ? '#10B981' : '#EF4444'} 
                              fillOpacity={1} 
                              fill="url(#colorAmount)" 
                              strokeWidth={2}
                              dot={{ r: 2, fill: isIncome ? '#10B981' : '#EF4444', strokeWidth: 0 }}
                              activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Calendar View */}
                      <div className="pb-10">
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-app-green opacity-80">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </h3>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-[10px] font-bold opacity-40 py-2 border-b border-[#1B4332]/10">
                              {day}
                            </div>
                          ))}
                          {calendarDays.map((day, idx) => {
                            const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                            const hasData = dateStr && flowData[dateStr] > 0;
                            
                            return (
                              <div key={idx} className="aspect-square flex flex-col items-center justify-center relative border-b border-r border-[#1B4332]/5">
                                {day && (
                                  <>
                                    <span className={cn(
                                      "text-[10px] font-medium",
                                      day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
                                        ? "text-app-green font-bold"
                                        : "opacity-40"
                                    )}>
                                      {day}
                                    </span>
                                    {hasData && (
                                      <div className={cn(
                                        "w-1 h-1 rounded-full mt-1",
                                        isIncome ? "bg-green-500" : "bg-red-500"
                                      )} />
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isAccount) {
                  // Account Analysis Grouped Bar Chart
                  const accountData = accounts.map(acc => {
                    const accExpenses = filteredExpenses.filter(e => e.account === acc.name || e.toAccount === acc.name);
                    const income = accExpenses.filter(e => (e.type === 'income' && e.account === acc.name) || (e.type === 'transfer' && e.toAccount === acc.name)).reduce((sum, e) => sum + e.amount, 0);
                    const expense = accExpenses.filter(e => (e.type === 'expense' && e.account === acc.name) || (e.type === 'transfer' && e.account === acc.name)).reduce((sum, e) => sum + e.amount, 0);
                    return {
                      name: acc.name,
                      income,
                      expense,
                      icon: acc.icon
                    };
                  }).filter(d => d.income > 0 || d.expense > 0);

                  if (accountData.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 opacity-40 text-center">
                        <Calculator className="w-16 h-16 mb-4" />
                        <p className="text-sm">No data for this period.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="px-4 space-y-8">
                      {/* Bar Chart */}
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={accountData} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1B4332" opacity={0.05} />
                            <XAxis 
                              dataKey="name" 
                              fontSize={9} 
                              axisLine={false} 
                              tickLine={false} 
                              angle={-45} 
                              textAnchor="end"
                              interval={0}
                              tick={{ fill: '#1B4332', opacity: 0.6 }}
                            />
                            <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#1B4332', opacity: 0.6 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#FDFDF0', border: '1px solid #1B433210', borderRadius: '8px' }}
                            />
                            <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                            <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[2, 2, 0, 0]} barSize={12} />
                            <Bar dataKey="income" name="Income" fill="#10B981" radius={[2, 2, 0, 0]} barSize={12} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Account List */}
                      <div className="space-y-4 pb-10">
                        {accountData.map((item) => {
                          const acc = accounts.find(a => a.name === item.name);
                          return (
                            <div key={item.name} className="flex items-center gap-4 border-b border-[#1B4332]/5 pb-4">
                              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm shrink-0 border border-[#1B4332]/10 overflow-hidden">
                                <IconDisplay icon={item.icon} customIcon={acc?.customIcon} className="w-full h-full flex items-center justify-center" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate text-app-green">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold opacity-60">This period:</span>
                                  <div className="flex items-center gap-1">
                                    <div className="px-1.5 py-0.5 border border-red-200 rounded text-[10px] font-bold text-red-700 bg-red-50">
                                      -{formatAmount(item.expense)}
                                    </div>
                                    <div className="px-1.5 py-0.5 border border-green-200 rounded text-[10px] font-bold text-green-700 bg-green-50">
                                      {formatAmount(item.income)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Overview (Pie Chart)
                const type = isIncome ? 'income' : 'expense';
                const dataMap = filteredExpenses
                  .filter(e => e.type === type)
                  .reduce((acc, e) => {
                    const key = e.category;
                    acc[key] = (acc[key] || 0) + e.amount;
                    return acc;
                  }, {} as Record<string, number>);

                const total = (Object.values(dataMap) as number[]).reduce((a: number, b: number) => a + b, 0);
                const chartData = Object.keys(dataMap).map(key => {
                  const val = dataMap[key] as number;
                  return {
                    name: key,
                    value: val,
                    percent: total > 0 ? (val / total) * 100 : 0
                  };
                }).sort((a, b) => b.value - a.value);

                if (chartData.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40 text-center">
                      <Calculator className="w-16 h-16 mb-4" />
                      <p className="text-sm">No data for this period.</p>
                    </div>
                  );
                }

                const COLORS = isIncome 
                  ? ['#10B981', '#34D399', '#059669', '#6EE7B7', '#047857', '#A7F3D0', '#065F46', '#D1FAE5', '#064E3B', '#ECFDF5']
                  : ['#EF4444', '#F87171', '#DC2626', '#FCA5A5', '#B91C1C', '#FECACA', '#991B1B', '#FEE2E2', '#7F1D1D', '#FFF1F2'];

                return (
                  <div className="px-4 space-y-8">
                    {/* Donut Chart */}
                    <div className="flex items-center justify-center h-64 relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-[10px] font-bold uppercase opacity-50">{isAccount ? 'Accounts' : isIncome ? 'Income' : 'Expenses'}</p>
                        <p className="text-xl font-bold">{formatAmount(total)}</p>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => {
                              const cat = isAccount 
                                ? accounts.find(a => a.name === entry.name)
                                : (isIncome ? incomeCategories : expenseCategories).find(c => c.name === entry.name);
                              
                              // Use category color if it's a hex/color string, otherwise fallback to COLORS array
                              const color = (cat?.color && !cat.color.startsWith('bg-')) 
                                ? cat.color 
                                : COLORS[index % COLORS.length];

                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#FDFDF0', border: '1px solid #1B433210', borderRadius: '8px' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend/List */}
                    <div className="space-y-6 pb-10">
                      {chartData.map((item, index) => {
                        const cat = isAccount 
                          ? accounts.find(a => a.name === item.name)
                          : (isIncome ? incomeCategories : expenseCategories).find(c => c.name === item.name);
                        
                        const color = (cat?.color && !cat.color.startsWith('bg-')) 
                          ? cat.color 
                          : COLORS[index % COLORS.length];

                        return (
                          <div key={item.name} className="flex items-center gap-4">
                            <IconDisplay 
                              icon={isAccount ? (cat as any)?.icon : (cat?.icon || '💸')} 
                              customIcon={cat?.customIcon}
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0",
                                cat?.icon ? "bg-app-green/10 text-app-green" : "bg-gray-200"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-sm truncate">{item.name}</p>
                                <p className={cn("font-bold text-sm", isIncome ? "text-blue-800" : "text-red-700")}>
                                  {isIncome ? '' : '-'}{formatAmount(item.value)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 bg-app-green/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.percent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full rounded-full" 
                                    style={{ backgroundColor: color }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold opacity-60 w-10 text-right">{item.percent.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'budgets' && (
            <motion.div key="budgets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    d.setFullYear(d.getFullYear() - 1);
                    setCurrentDate(d);
                  }} className="p-1 opacity-60 hover:opacity-100 transition-opacity"><ChevronsLeft className="w-5 h-5" /></button>
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentDate(d);
                  }} className="p-1"><ChevronLeft className="w-5 h-5" /></button>
                </div>
                <span className="font-medium text-sm">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentDate(d);
                  }} className="p-1"><ChevronRight className="w-5 h-5" /></button>
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    d.setFullYear(d.getFullYear() + 1);
                    setCurrentDate(d);
                  }} className="p-1 opacity-60 hover:opacity-100 transition-opacity"><ChevronsRight className="w-5 h-5" /></button>
                </div>
              </div>

              {(() => {
                const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                const monthlyBudgets = budgets.filter(b => b.period === period);
                
                // Use all expenses for the month, not just filtered ones
                const monthExpenses = expenses.filter(e => {
                  const d = new Date(e.date);
                  return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                });

                const totalBudgetAmount = monthlyBudgets.reduce((acc, curr) => acc + curr.amount, 0);
                const totalSpentInBudgetedCategories = monthlyBudgets.reduce((acc, budget) => {
                  const spent = monthExpenses
                    .filter(e => e.type === 'expense' && e.category === budget.category)
                    .reduce((a, c) => a + c.amount, 0);
                  return acc + spent;
                }, 0);

                if (monthlyBudgets.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40 text-center">
                      <Calculator className="w-16 h-16 mb-4" />
                      <p className="text-sm">No budgets set for this month.<br/>Tap + to set a budget.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Total Budget Summary */}
                    <div className="bg-app-green text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Total Budget Status</p>
                        <div className="flex justify-between items-end">
                          <h2 className="text-3xl font-bold">{formatAmount(totalSpentInBudgetedCategories)} <span className="text-sm font-normal opacity-60">/ {formatAmount(totalBudgetAmount)}</span></h2>
                          <p className="text-sm font-bold">{Math.min((totalSpentInBudgetedCategories / totalBudgetAmount) * 100, 100).toFixed(0)}%</p>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((totalSpentInBudgetedCategories / totalBudgetAmount) * 100, 100)}%` }}
                            className="h-full bg-white rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold px-2">Category Budgets</h3>
                      {monthlyBudgets.map(budget => {
                      const cat = expenseCategories.find(c => c.name === budget.category);
                      const spent = monthExpenses
                        .filter(e => e.type === 'expense' && e.category === budget.category)
                        .reduce((acc, curr) => acc + curr.amount, 0);
                      
                      const percent = Math.min((spent / budget.amount) * 100, 100);
                      const isOver = spent > budget.amount;

                      return (
                        <div 
                          key={budget.id} 
                          onClick={() => {
                            setEditingBudget(budget);
                            setNewBudget(budget);
                            setIsBudgetModalOpen(true);
                          }}
                          className="bg-[#F9F9E0] border border-[#1B4332]/10 p-4 rounded-2xl space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm overflow-hidden",
                                cat?.icon ? "bg-app-green/10 text-app-green" : (cat?.color || "bg-gray-200")
                              )}>
                                <IconDisplay icon={cat?.icon || '💸'} customIcon={cat?.customIcon} className="w-full h-full flex items-center justify-center" />
                              </div>
                              <span className="font-bold text-sm">{budget.category}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold">{formatAmount(spent)} / {formatAmount(budget.amount)}</p>
                              <p className={cn("text-[10px] font-bold uppercase", isOver ? "text-red-600" : "opacity-40")}>
                                {isOver ? 'Over Budget' : `${(budget.amount - spent).toFixed(0)} Left`}
                              </p>
                            </div>
                          </div>
                          <div className="h-2 bg-app-green/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              className={cn("h-full rounded-full", isOver ? "bg-red-500" : "bg-app-green")}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div key="accounts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-6">
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold">Overall</h3>
                  <button 
                    onClick={() => { setEditingAccount(null); setNewAccount({ name: '', initial: 0, icon: ACCOUNT_ICONS[0] }); setIsAccountModalOpen(true); }}
                    className="flex items-center gap-1 text-[10px] font-bold bg-app-green text-white px-3 py-1.5 rounded-full"
                  >
                    <Plus className="w-3 h-3" /> Add Account
                  </button>
                </div>
                <div className="bg-[#F9F9E0] border border-[#1B4332]/20 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2 border-b border-[#1B4332]/10">
                    <div className="p-4 text-center border-r border-[#1B4332]/10">
                      <p className="text-[10px] uppercase font-bold opacity-50">Expense so far</p>
                      <p className="text-red-700 font-medium">-{formatAmount(totalExpense)}</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[10px] uppercase font-bold opacity-50">Income so far</p>
                      <p className="text-green-700 font-medium">{formatAmount(totalIncome)}</p>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-[10px] uppercase font-bold opacity-50">Total Balance</p>
                    <p className="font-bold text-lg">{formatAmount(totalBalance)}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold mb-3">Accounts</h3>
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="bg-[#F9F9E0] border border-[#1B4332]/20 p-4 rounded-xl flex items-center gap-4 relative">
                      <div className="w-12 h-12 bg-white border border-[#1B4332]/10 rounded-lg flex items-center justify-center text-2xl overflow-hidden">
                        <IconDisplay icon={acc.icon} customIcon={acc.customIcon} className="w-full h-full flex items-center justify-center" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{acc.name}</p>
                        <p className="text-[10px] opacity-50">Initial: {formatAmount(acc.initial)}</p>
                        <p className="text-[10px] opacity-50">Balance: {formatAmount(getAccountBalance(acc.name))}</p>
                      </div>
                      <div className="relative group">
                        <button className="p-2 opacity-40 hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[#1B4332]/10 rounded-lg shadow-xl py-1 z-10 hidden group-focus-within:block">
                          <button 
                            onClick={() => handleEditAccountClick(acc)}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#1B4332]/5 flex items-center gap-2"
                          >
                            <SettingsIcon className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-red-50 text-red-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-8">
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold">Income categories</h3>
                </div>
                <div className="space-y-1">
                  {incomeCategories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-4 py-2 border-b border-[#1B4332]/5">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm overflow-hidden", 
                        cat.icon ? "bg-[#1B4332]/10 text-[#1B4332]" : (cat.color || "bg-gray-200")
                      )}>
                        <IconDisplay icon={cat.icon} customIcon={cat.customIcon} className="w-full h-full flex items-center justify-center" />
                      </div>
                      <span className="flex-1 font-medium">{cat.name}</span>
                      <div className="relative group">
                        <button className="p-2 opacity-40 hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[#1B4332]/10 rounded-lg shadow-xl py-1 z-10 hidden group-focus-within:block">
                          <button 
                            onClick={() => handleEditCategoryClick(cat)}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#1B4332]/5 flex items-center gap-2"
                          >
                            <SettingsIcon className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id, 'income')}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-red-50 text-red-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold">Expense categories</h3>
                </div>
                <div className="space-y-1">
                  {expenseCategories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-4 py-2 border-b border-[#1B4332]/5">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm overflow-hidden", 
                        cat.icon ? "bg-[#1B4332]/10 text-[#1B4332]" : (cat.color || "bg-gray-200")
                      )}>
                        <IconDisplay icon={cat.icon} customIcon={cat.customIcon} className="w-full h-full flex items-center justify-center" />
                      </div>
                      <span className="flex-1 font-medium">{cat.name}</span>
                      <div className="relative group">
                        <button className="p-2 opacity-40 hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[#1B4332]/10 rounded-lg shadow-xl py-1 z-10 hidden group-focus-within:block">
                          <button 
                            onClick={() => handleEditCategoryClick(cat)}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#1B4332]/5 flex items-center gap-2"
                          >
                            <SettingsIcon className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id, 'expense')}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-red-50 text-red-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      {!isLocked && (
        <button 
          onClick={() => {
            if (activeTab === 'categories') {
              setEditingCategory(null);
              setNewCategory({ 
                name: '', 
                icon: CATEGORY_ICONS[0], 
                color: '', 
                type: 'expense' 
              });
              setIsCategoryModalOpen(true);
            } else if (activeTab === 'accounts') {
              setEditingAccount(null);
              setNewAccount({ 
                name: '', 
                initial: 0, 
                icon: ACCOUNT_ICONS[0] 
              });
              setIsAccountModalOpen(true);
            } else if (activeTab === 'budgets') {
              setEditingBudget(null);
              setNewBudget({ 
                category: expenseCategories[0]?.name || '', 
                amount: 0 
              });
              setIsBudgetModalOpen(true);
            } else {
              setIsAddModalOpen(true);
            }
          }}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#E9E9D0] border border-[#1B4332]/20 rounded-full flex items-center justify-center shadow-lg z-20 active:scale-95 transition-transform"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Bottom Navigation */}
      {!isLocked && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center">
          <nav className="w-full max-w-2xl bg-[#FDFDF0] border-t border-[#1B4332]/10 px-2 py-2 flex justify-between items-center shadow-2xl">
            <NavButton active={activeTab === 'records'} onClick={() => setActiveTab('records')} icon={<FileText className="w-5 h-5" />} label="Records" />
            <NavButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<PieChart className="w-5 h-5" />} label="Analysis" />
            <NavButton active={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} icon={<Calculator className="w-5 h-5" />} label="Budgets" />
            <NavButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<Wallet className="w-5 h-5" />} label="Accounts" />
            <NavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Tag className="w-5 h-5" />} label="Categories" />
          </nav>
        </div>
      )}

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={cn(
              "fixed bottom-28 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-[100] text-sm font-bold flex items-center gap-2",
              notification.type === 'success' ? "bg-app-green text-white" : "bg-red-700 text-white"
            )}
          >
            {notification.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[70] bg-black/40 flex justify-center items-center">
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              className="w-full max-w-2xl h-full bg-[#FDFDF0] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-4 shrink-0">
                <button onClick={() => setIsAddModalOpen(false)} className="flex items-center gap-2 text-app-green font-bold text-sm uppercase tracking-wider">
                  <X className="w-5 h-5" /> CANCEL
                </button>
                <button onClick={handleAddExpense} className="flex items-center gap-2 text-app-green font-bold text-sm uppercase tracking-wider">
                  <Check className="w-5 h-5" /> SAVE
                </button>
              </div>

              {/* Tabs */}
              <div className="flex justify-center items-center gap-4 py-6 shrink-0">
                {(['income', 'expense', 'transfer'] as const).map((type, idx) => (
                  <React.Fragment key={type}>
                    <button 
                      onClick={() => setNewExpense({...newExpense, type: type, category: type === 'transfer' ? 'Transfer' : (type === 'income' ? incomeCategories[0]?.name : expenseCategories[0]?.name)})}
                      className={cn(
                        "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] transition-all",
                        newExpense.type === type ? "text-app-green" : "opacity-30"
                      )}
                    >
                      {newExpense.type === type && <Check className="w-4 h-4" />}
                      {type}
                    </button>
                    {idx < 2 && <span className="opacity-20 text-app-green">|</span>}
                  </React.Fragment>
                ))}
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-2 gap-4 px-4 mb-4 shrink-0">
                <div className="space-y-1">
                  <p className="text-center text-[10px] font-bold uppercase opacity-40 tracking-widest">Account</p>
                  <button 
                    onClick={() => setIsAccountSelectorOpen(true)}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-white border border-app-green/20 rounded-2xl shadow-sm active:scale-95 transition-transform"
                  >
                    <Wallet className="w-5 h-5 opacity-60" />
                    <span className="text-sm font-bold truncate">{newExpense.account || 'Select'}</span>
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-center text-[10px] font-bold uppercase opacity-40 tracking-widest">
                    {newExpense.type === 'transfer' ? 'To Account' : 'Category'}
                  </p>
                  <button 
                    onClick={() => newExpense.type === 'transfer' ? setIsToAccountSelectorOpen(true) : setIsCategorySelectorOpen(true)}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-white border border-app-green/20 rounded-2xl shadow-sm active:scale-95 transition-transform"
                  >
                    {newExpense.type === 'transfer' ? <ArrowRight className="w-5 h-5 opacity-60" /> : <Tag className="w-5 h-5 opacity-60" />}
                    <span className="text-sm font-bold truncate">
                      {newExpense.type === 'transfer' ? (newExpense.toAccount || 'Select') : (newExpense.category || 'Select')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="px-4 mb-4 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <label className="text-[10px] font-bold uppercase opacity-40 tracking-widest ml-1">Notes</label>
                  {isNoteFocused && (
                    <button 
                      onClick={() => {
                        setIsNoteFocused(false);
                        (document.activeElement as HTMLElement)?.blur();
                      }}
                      className="text-[10px] font-bold text-app-green uppercase tracking-widest bg-app-green/10 px-3 py-1 rounded-full"
                    >
                      Done
                    </button>
                  )}
                </div>
                <textarea 
                  placeholder="What was this for?"
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({...newExpense, note: e.target.value})}
                  onFocus={() => setIsNoteFocused(true)}
                  onBlur={() => {
                    // Small delay to allow clicking the "Done" button
                    setTimeout(() => setIsNoteFocused(false), 100);
                  }}
                  className="w-full flex-1 bg-[#FFFBEB] border border-app-green/20 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-app-green/20 focus:border-app-green outline-none resize-none shadow-inner transition-all"
                />
              </div>

              {/* Amount Display */}
              {!isNoteFocused && (
                <div className="px-6 py-4 flex items-center justify-between gap-4 border-t border-app-green/10 bg-white shrink-0 animate-in slide-in-from-bottom duration-300">
                  <div className="flex-1 text-right overflow-hidden">
                    <div className="text-5xl font-bold text-app-green truncate tracking-tight">
                      {calculatorInput}
                    </div>
                  </div>
                  <button onClick={() => handleCalculatorClick('back')} className="p-3 bg-app-green/5 rounded-2xl active:scale-90 transition-transform hover:bg-app-green/10">
                    <Delete className="w-8 h-8 text-app-green/60" />
                  </button>
                </div>
              )}

              {/* Calculator Keypad */}
              {!isNoteFocused && (
                <div className="grid grid-cols-4 gap-[1px] bg-app-green/10 shrink-0 border-t border-app-green/10 animate-in slide-in-from-bottom duration-300">
                  {[
                    { label: '+', val: '+' }, { label: '7', val: '7' }, { label: '8', val: '8' }, { label: '9', val: '9' },
                    { label: '-', val: '-' }, { label: '4', val: '4' }, { label: '5', val: '5' }, { label: '6', val: '6' },
                    { label: '×', val: '×' }, { label: '1', val: '1' }, { label: '2', val: '2' }, { label: '3', val: '3' },
                    { label: '÷', val: '÷' }, { label: '0', val: '0' }, { label: '.', val: '.' }, { label: '=', val: '=' }
                  ].map((btn, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleCalculatorClick(btn.val)}
                      className={cn(
                        "h-16 text-xl font-bold transition-all active:bg-app-green/20",
                        ['+', '-', '×', '÷'].includes(btn.val) || btn.val === '=' ? "bg-[#719686] text-white hover:bg-[#5f7d70]" : "bg-white text-app-green hover:bg-gray-50"
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex border-t border-app-green/10 bg-white shrink-0">
                <button 
                  onClick={() => setIsDatePickerOpen(true)}
                  className="flex-1 py-4 text-xs font-bold border-r border-app-green/10 uppercase tracking-widest opacity-60 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-3 h-3" />
                  {new Date(newExpense.date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </button>
                <div className="w-[1px] bg-app-green/10" />
                <button 
                  onClick={() => setIsTimePickerOpen(true)}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest opacity-60 flex items-center justify-center gap-2"
                >
                  <Clock className="w-3 h-3" />
                  {newExpense.time}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Selector Modal */}
      <AnimatePresence>
        {isAccountSelectorOpen && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAccountSelectorOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#FDFDF0] rounded-t-[32px] p-6 shadow-2xl flex flex-col max-h-[70vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Select Account</h2>
                <button onClick={() => setIsAccountSelectorOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto space-y-2">
                {accounts.map(a => (
                  <button 
                    key={a.id}
                    onClick={() => {
                      setNewExpense({...newExpense, account: a.name});
                      setIsAccountSelectorOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                      newExpense.account === a.name ? "bg-app-green text-white shadow-md" : "bg-app-green/5 hover:bg-app-green/10"
                    )}
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl overflow-hidden">
                      <IconDisplay icon={a.icon} customIcon={a.customIcon} className="w-full h-full flex items-center justify-center" />
                    </div>
                    <span className="font-bold">{a.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* To Account Selector Modal */}
      <AnimatePresence>
        {isToAccountSelectorOpen && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsToAccountSelectorOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#FDFDF0] rounded-t-[32px] p-6 shadow-2xl flex flex-col max-h-[70vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Transfer To</h2>
                <button onClick={() => setIsToAccountSelectorOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto space-y-2">
                {accounts.map(a => (
                  <button 
                    key={a.id}
                    onClick={() => {
                      setNewExpense({...newExpense, toAccount: a.name});
                      setIsToAccountSelectorOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                      newExpense.toAccount === a.name ? "bg-app-green text-white shadow-md" : "bg-app-green/5 hover:bg-app-green/10"
                    )}
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl overflow-hidden">
                      <IconDisplay icon={a.icon} customIcon={a.customIcon} className="w-full h-full flex items-center justify-center" />
                    </div>
                    <span className="font-bold">{a.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Selector Modal */}
      <AnimatePresence>
        {isCategorySelectorOpen && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategorySelectorOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#FDFDF0] rounded-t-[32px] p-6 shadow-2xl flex flex-col max-h-[70vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Select Category</h2>
                <button onClick={() => setIsCategorySelectorOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto space-y-2">
                {(newExpense.type === 'income' ? incomeCategories : expenseCategories).map(c => (
                  <button 
                    key={c.id}
                    onClick={() => {
                      setNewExpense({...newExpense, category: c.name});
                      setIsCategorySelectorOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                      newExpense.category === c.name ? "bg-app-green text-white shadow-md" : "bg-app-green/5 hover:bg-app-green/10"
                    )}
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl overflow-hidden">
                      <IconDisplay icon={c.icon} customIcon={c.customIcon} className="w-full h-full flex items-center justify-center" />
                    </div>
                    <span className="font-bold">{c.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {isDatePickerOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDatePickerOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xs bg-[#FDFDF0] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Select Date</h2>
                <button onClick={() => setIsDatePickerOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <input 
                type="date" 
                value={newExpense.date} 
                onChange={(e) => {
                  setNewExpense({...newExpense, date: e.target.value});
                  setIsDatePickerOpen(false);
                }}
                className="w-full bg-app-green/5 border-none rounded-xl p-4 text-sm font-bold focus:ring-1 focus:ring-app-green"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Time Picker Modal */}
      <AnimatePresence>
        {isTimePickerOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTimePickerOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xs bg-[#FDFDF0] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Select Time</h2>
                <button onClick={() => setIsTimePickerOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <input 
                type="time" 
                value={newExpense.time} 
                onChange={(e) => {
                  setNewExpense({...newExpense, time: e.target.value});
                  setIsTimePickerOpen(false);
                }}
                className="w-full bg-app-green/5 border-none rounded-xl p-4 text-sm font-bold focus:ring-1 focus:ring-app-green"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Modal */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAccountModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-[#FDFDF0] rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col border border-app-green/10">
              <div className="flex justify-between items-center mb-6 shrink-0 border-b border-app-green/5 pb-4">
                <h2 className="text-xl font-bold text-app-green">{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
                <button onClick={() => setIsAccountModalOpen(false)} className="p-2 bg-app-green/5 rounded-full hover:bg-app-green/10 transition-colors"><X className="w-5 h-5 text-app-green" /></button>
              </div>

              <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar py-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Account Name</label>
                  <input type="text" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="w-full bg-white border border-app-green/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-app-green/20 focus:border-app-green outline-none transition-all" placeholder="e.g. Bank Account" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Initial Balance</label>
                  <input type="number" value={newAccount.initial || ''} onChange={(e) => setNewAccount({ ...newAccount, initial: Number(e.target.value) })} className="w-full bg-white border border-app-green/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-app-green/20 focus:border-app-green outline-none transition-all" placeholder="0.00" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Custom Icon (Image/Link)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newAccount.customIcon || ''} 
                      onChange={(e) => setNewAccount({ ...newAccount, customIcon: e.target.value })} 
                      className="flex-1 bg-white border border-app-green/10 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-app-green/20 focus:border-app-green outline-none transition-all" 
                      placeholder="Paste image link here" 
                    />
                    <label className="bg-app-green/10 p-4 rounded-2xl cursor-pointer hover:bg-app-green/20 transition-colors flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-app-green" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewAccount({ ...newAccount, customIcon: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {newAccount.customIcon && (
                    <div className="mt-3 p-3 bg-app-green/5 rounded-2xl flex items-center justify-between border border-app-green/10">
                      <div className="flex items-center gap-3">
                        <img src={newAccount.customIcon} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-bold text-app-green/60 uppercase">Preview</span>
                      </div>
                      <button onClick={() => setNewAccount({ ...newAccount, customIcon: '' })} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Icon</label>
                  <div className="grid grid-cols-4 gap-4 p-1">
                    {ACCOUNT_ICONS.map((icon, idx) => {
                      const bgColors = [
                        'bg-blue-50 text-blue-600 border-blue-100',
                        'bg-green-50 text-green-600 border-green-100',
                        'bg-purple-50 text-purple-600 border-purple-100',
                        'bg-orange-50 text-orange-600 border-orange-100',
                        'bg-pink-50 text-pink-600 border-pink-100',
                        'bg-teal-50 text-teal-600 border-teal-100',
                        'bg-indigo-50 text-indigo-600 border-indigo-100',
                        'bg-red-50 text-red-600 border-red-100',
                      ];
                      const colorClass = bgColors[idx % bgColors.length];
                      
                      return (
                        <button 
                          key={icon} 
                          onClick={() => setNewAccount({ ...newAccount, icon })}
                          className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm border",
                            newAccount.icon === icon 
                              ? "bg-app-green text-white shadow-lg scale-110 border-app-green" 
                              : `${colorClass} hover:scale-105`
                          )}
                        >
                          <IconDisplay icon={icon} className="w-6 h-6" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button onClick={handleAddAccount} className="w-full bg-app-green text-white py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all hover:bg-app-green/90">
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-[#FDFDF0] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Display options</h2>
                <button onClick={() => setIsFilterModalOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-3 block tracking-widest">View Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Daily', 'Weekly', 'Monthly', '3month', '6month', 'Year'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode as any)}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold transition-all border",
                          viewMode === mode 
                            ? "bg-app-green text-white border-app-green shadow-md" 
                            : "bg-white text-app-green border-app-green/10 hover:bg-app-green/5"
                        )}
                      >
                        {mode === '3month' ? '3 Months' : mode === '6month' ? '6 Months' : mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1B4332]/5 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold">Show Total</p>
                    <p className="text-[10px] opacity-50">Display summary bar</p>
                  </div>
                  <button 
                    onClick={() => setShowTotal(!showTotal)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      showTotal ? "bg-app-green" : "bg-gray-300"
                    )}
                  >
                    <motion.div 
                      animate={{ x: showTotal ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1B4332]/5 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold">Carry Over</p>
                    <p className="text-[10px] opacity-50">Include previous balance</p>
                  </div>
                  <button 
                    onClick={() => setCarryOver(!carryOver)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      carryOver ? "bg-app-green" : "bg-gray-300"
                    )}
                  >
                    <motion.div 
                      animate={{ x: carryOver ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <button 
                  onClick={() => setIsFilterModalOpen(false)}
                  className="w-full bg-app-green text-white py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform mt-4"
                >
                  Apply Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Theme Modal (Pro) */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsThemeModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} className="relative w-full max-w-md bg-app-bg rounded-t-[40px] sm:rounded-[40px] p-6 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    Themes <span className="text-[10px] bg-yellow-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Pro</span>
                  </h2>
                  <p className="text-xs opacity-50">Personalize your MyMoney experience</p>
                </div>
                <button onClick={() => setIsThemeModalOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4 pb-6">
                  {THEMES.map(theme => (
                    <button 
                      key={theme.id}
                      onClick={() => {
                        setCurrentTheme(theme);
                        showNotification(`${theme.name} theme applied!`);
                      }}
                      className={cn(
                        "relative group p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-3",
                        currentTheme.id === theme.id 
                          ? "border-app-green bg-white shadow-xl scale-[1.02]" 
                          : "border-transparent bg-white/50 hover:bg-white hover:shadow-lg"
                      )}
                    >
                      <div 
                        className="w-full aspect-video rounded-2xl shadow-inner flex flex-col p-2 gap-1"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="w-1/2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                        <div className="w-3/4 h-2 rounded-full opacity-20" style={{ backgroundColor: theme.primary }} />
                        <div className="mt-auto flex justify-between items-center">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accent }} />
                          <div className="w-8 h-3 rounded-full" style={{ backgroundColor: theme.secondary }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-app-green">{theme.name}</span>
                      {currentTheme.id === theme.id && (
                        <div className="absolute -top-2 -right-2 bg-app-green text-white p-1 rounded-full shadow-lg">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-app-green/10 shrink-0">
                <button 
                  onClick={() => setIsThemeModalOpen(false)}
                  className="w-full bg-app-green text-white py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-app-bg rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col border border-app-green/10">
              <div className="flex justify-between items-center mb-6 shrink-0 border-b border-app-green/5 pb-4">
                <h2 className="text-xl font-bold text-app-green">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 bg-app-green/5 rounded-full hover:bg-app-green/10 transition-colors"><X className="w-5 h-5 text-app-green" /></button>
              </div>

              <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar py-2">
                <div className="flex gap-2 p-1.5 bg-app-green/5 rounded-2xl">
                  <button onClick={() => setNewCategory({...newCategory, type: 'expense'})} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all", newCategory.type === 'expense' ? "bg-white text-app-green shadow-sm" : "text-app-green/40")}>Expense</button>
                  <button onClick={() => setNewCategory({...newCategory, type: 'income'})} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all", newCategory.type === 'income' ? "bg-white text-app-green shadow-sm" : "text-app-green/40")}>Income</button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Category Name</label>
                  <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full bg-white border border-app-green/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-app-green/20 focus:border-app-green outline-none transition-all" placeholder="e.g. Food & Drinks" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Custom Icon (Image/Link)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCategory.customIcon || ''} 
                      onChange={(e) => setNewCategory({ ...newCategory, customIcon: e.target.value })} 
                      className="flex-1 bg-white border border-app-green/10 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-app-green/20 focus:border-app-green outline-none transition-all" 
                      placeholder="Paste image link here" 
                    />
                    <label className="bg-app-green/10 p-4 rounded-2xl cursor-pointer hover:bg-app-green/20 transition-colors flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-app-green" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewCategory({ ...newCategory, customIcon: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {newCategory.customIcon && (
                    <div className="mt-3 p-3 bg-app-green/5 rounded-2xl flex items-center justify-between border border-app-green/10">
                      <div className="flex items-center gap-3">
                        <img src={newCategory.customIcon} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-bold text-app-green/60 uppercase">Preview</span>
                      </div>
                      <button onClick={() => setNewCategory({ ...newCategory, customIcon: '' })} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Icon (Clears Color)</label>
                  <div className="grid grid-cols-5 gap-3 p-1">
                    {CATEGORY_ICONS.map((icon, idx) => {
                      const bgColors = [
                        'bg-red-50 text-red-600 border-red-100',
                        'bg-blue-50 text-blue-600 border-blue-100',
                        'bg-green-50 text-green-600 border-green-100',
                        'bg-purple-50 text-purple-600 border-purple-100',
                        'bg-orange-50 text-orange-600 border-orange-100',
                        'bg-pink-50 text-pink-600 border-pink-100',
                        'bg-teal-50 text-teal-600 border-teal-100',
                        'bg-indigo-50 text-indigo-600 border-indigo-100',
                      ];
                      const colorClass = bgColors[idx % bgColors.length];
                      
                      return (
                        <button 
                          key={icon} 
                          onClick={() => setNewCategory({ ...newCategory, icon, color: '' })}
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm border",
                            newCategory.icon === icon 
                              ? "bg-app-green text-white shadow-lg scale-110 border-app-green" 
                              : `${colorClass} hover:scale-105`
                          )}
                        >
                          <IconDisplay icon={icon} className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-app-green/50 tracking-widest ml-1">Color (Clears Icon)</label>
                  <div className="grid grid-cols-5 gap-3 p-1">
                    {CATEGORY_COLORS.map(color => (
                      <button 
                        key={color} 
                        onClick={() => setNewCategory({ ...newCategory, color, icon: '' })}
                        className={cn(
                          "w-12 h-12 rounded-full transition-all border-4",
                          color,
                          newCategory.color === color ? "border-app-green scale-110 shadow-lg" : "border-white shadow-sm"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button onClick={handleAddCategory} className="w-full bg-app-green text-white py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all hover:bg-app-green/90">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Budget Modal */}
      <AnimatePresence>
        {isBudgetModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBudgetModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-[#FDFDF0] rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-bold">{editingBudget ? 'Edit Budget' : 'Set Budget'}</h2>
                <button onClick={() => setIsBudgetModalOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Category</label>
                  <select 
                    value={newBudget.category} 
                    onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })} 
                    className="w-full bg-app-green/5 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-app-green"
                  >
                    {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Monthly Budget Amount</label>
                  <input 
                    type="number" 
                    value={newBudget.amount || ''} 
                    onChange={(e) => setNewBudget({ ...newBudget, amount: Number(e.target.value) })} 
                    className="w-full bg-app-green/5 border-none rounded-xl p-4 text-2xl font-bold focus:ring-1 focus:ring-app-green" 
                    placeholder="0.00" 
                    autoFocus 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 shrink-0">
                {editingBudget && (
                  <button 
                    onClick={() => handleDeleteBudget(editingBudget.id)} 
                    className="flex-1 bg-red-50 text-red-700 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    Delete
                  </button>
                )}
                <button 
                  onClick={handleAddBudget} 
                  className="flex-[2] bg-app-green text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
                >
                  {editingBudget ? 'Update Budget' : 'Set Budget'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Currency Selection Modal */}
      <AnimatePresence>
        {isCurrencyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCurrencyModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#FDFDF0] rounded-t-[32px] p-6 shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Select Currency</h2>
                <button onClick={() => setIsCurrencyModalOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  type="text" 
                  placeholder="Search currency or country..." 
                  value={currencySearchQuery}
                  onChange={(e) => setCurrencySearchQuery(e.target.value)}
                  className="w-full bg-app-green/5 border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-1 focus:ring-app-green"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {filteredCurrencies.map(c => (
                  <button 
                    key={c.code}
                    onClick={() => {
                      setCurrencySymbol(c.symbol);
                      localStorage.setItem('mymoney_currency', c.symbol);
                      setIsCurrencyModalOpen(false);
                      setCurrencySearchQuery('');
                      showNotification(`Currency set to ${c.name} (${c.symbol})`);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                      currencySymbol === c.symbol ? "bg-app-green text-white shadow-md" : "hover:bg-app-green/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                        currencySymbol === c.symbol ? "bg-white/20" : "bg-app-green/10 text-app-green"
                      )}>
                        {c.symbol}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{c.name}</p>
                        <p className="text-[10px] opacity-50 uppercase tracking-widest">{c.code}</p>
                      </div>
                    </div>
                    {currencySymbol === c.symbol && <ShieldCheck className="w-5 h-5" />}
                  </button>
                ))}
                {filteredCurrencies.length === 0 && (
                  <div className="py-10 text-center opacity-40">
                    <p>No currencies found matching "{currencySearchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Passcode Setup Modal */}
      <AnimatePresence>
        {isPasscodeSetupOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-app-bg">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="w-full max-w-xs flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-app-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-10 h-10 text-app-green" />
                </div>
                <h2 className="text-2xl font-bold">
                  {passcodeSetupMode === 'disable' ? 'Disable Passcode' : 
                   passcodeSetupStep === 1 ? 'Set Passcode' : 'Confirm Passcode'}
                </h2>
                <p className="text-sm opacity-50">
                  {passcodeSetupMode === 'disable' ? 'Enter current PIN to disable' :
                   passcodeSetupStep === 1 ? 'Enter 4-6 digit PIN' : 'Re-enter your PIN'}
                </p>
              </div>

              <div className="flex gap-3 h-4 items-center">
                {Array.from({ length: Math.max(passcodeAttempt.length, 4) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-3 h-3 rounded-full border-2 border-app-green transition-all",
                      passcodeAttempt.length > i ? "bg-app-green" : "bg-transparent"
                    )} 
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'cancel', 0, 'del'].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (num === 'del') {
                        setPasscodeAttempt(prev => prev.slice(0, -1));
                      } else if (num === 'cancel') {
                        setIsPasscodeSetupOpen(false);
                        setPasscodeAttempt('');
                      } else if (typeof num === 'number') {
                        if (passcodeAttempt.length < 6) {
                          const newAttempt = passcodeAttempt + num;
                          setPasscodeAttempt(newAttempt);
                        }
                      }
                    }}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all active:bg-app-green/20",
                      num === 'cancel' ? "text-red-500 text-xs uppercase" : "bg-app-green/5"
                    )}
                  >
                    {num === 'del' ? <Delete className="w-6 h-6" /> : num}
                  </button>
                ))}
              </div>

              <button 
                disabled={passcodeAttempt.length < 4}
                onClick={() => {
                  if (passcodeSetupMode === 'disable') {
                    if (passcodeAttempt === passcode) {
                      setPasscode(null);
                      setSecurityEnabled(false);
                      setIsLocked(false);
                      localStorage.removeItem('mymoney_passcode');
                      localStorage.setItem('mymoney_security_enabled', 'false');
                      setIsPasscodeSetupOpen(false);
                      showNotification('Passcode disabled');
                    } else {
                      showNotification('Incorrect passcode!', 'error');
                      setPasscodeAttempt('');
                    }
                  } else {
                    if (passcodeSetupStep === 1) {
                      setTempPasscode(passcodeAttempt);
                      setPasscodeAttempt('');
                      setPasscodeSetupStep(2);
                    } else {
                      if (passcodeAttempt === tempPasscode) {
                        setPasscode(passcodeAttempt);
                        setSecurityEnabled(true);
                        localStorage.setItem('mymoney_passcode', passcodeAttempt);
                        localStorage.setItem('mymoney_security_enabled', 'true');
                        setIsPasscodeSetupOpen(false);
                        showNotification('Passcode set successfully!');
                      } else {
                        showNotification('Passcodes do not match!', 'error');
                        setPasscodeAttempt('');
                        setPasscodeSetupStep(1);
                      }
                    }
                  }
                }}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all",
                  passcodeAttempt.length >= 4 ? "bg-app-green text-white shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {passcodeSetupMode === 'disable' ? 'Confirm Disable' : 
                 passcodeSetupStep === 1 ? 'Next' : 'Set Passcode'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Management Modal */}
      <AnimatePresence>
        {isManagementModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsManagementModalOpen(false)} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-md bg-app-bg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-app-green/10 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-app-green/10 rounded-xl">
                    <Database className="w-6 h-6 text-app-green" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Data Management</h2>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest">Backup & Restore</p>
                  </div>
                </div>
                <button onClick={() => setIsManagementModalOpen(false)} className="p-2 hover:bg-app-green/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Local Backup Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                    <FolderOpen className="w-3 h-3" /> Local Storage
                  </h3>
                  
                  <div className="bg-white rounded-2xl p-4 border border-app-green/10 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold">Backup Folder</p>
                        <p className="text-[10px] opacity-50">Local storage</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={handleBackup}
                        className="flex flex-col items-center gap-2 p-4 bg-app-green/5 rounded-2xl hover:bg-app-green/10 transition-all active:scale-95"
                      >
                        <CloudUpload className="w-6 h-6 text-app-green" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Backup File</span>
                      </button>
                      
                      <div className="relative">
                        <button 
                          className="w-full flex flex-col items-center gap-2 p-4 bg-app-green/5 rounded-2xl hover:bg-app-green/10 transition-all active:scale-95"
                        >
                          <CloudDownload className="w-6 h-6 text-app-green" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Restore Data</span>
                        </button>
                        <input 
                          type="file" 
                          accept=".enc" 
                          onChange={handleRestore} 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Cloud Backup Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                    <Cloud className="w-3 h-3" /> Firebase Cloud Sync
                  </h3>

                  <div className="bg-white rounded-2xl p-4 border border-app-green/10 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          user ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                        )}>
                          <Cloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Cloud Status</p>
                          <p className="text-[10px] opacity-50">
                            {user ? 'Connected & Syncing' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={user ? logout : loginWithGoogle}
                        className={cn(
                          "px-4 py-2 text-xs font-bold rounded-xl transition-colors",
                          user ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        )}
                      >
                        {user ? 'Logout' : 'Login'}
                      </button>
                    </div>

                    {user && (
                      <div className="pt-4 border-t border-app-green/5 space-y-4">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="opacity-50 uppercase tracking-widest">Last Sync:</span>
                          <span className="font-bold">{lastSynced ? lastSynced.toLocaleString() : 'Never'}</span>
                        </div>

                        <button 
                          disabled={isSyncing}
                          onClick={handleSyncLocalToCloud}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-app-green text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                          Upload Local Data to Cloud
                        </button>
                        
                        <p className="text-[9px] text-center opacity-40 italic">
                          * Data is automatically synced in real-time when online.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              
              <div className="p-6 bg-app-green/5 border-t border-app-green/10">
                <p className="text-[10px] text-center opacity-50 leading-relaxed">
                  Your data is encrypted locally before being uploaded to Google Drive. Only you can access your backup files.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPasscodeModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-app-bg">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="w-full max-w-xs flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-app-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-10 h-10 text-app-green" />
                </div>
                <h2 className="text-2xl font-bold">Enter Passcode</h2>
                <p className="text-sm opacity-50">MyMoney is locked</p>
              </div>

              <div className="flex gap-3 h-4 items-center">
                {Array.from({ length: Math.max(passcodeAttempt.length, passcode?.length || 4) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-3 h-3 rounded-full border-2 border-app-green transition-all",
                      passcodeAttempt.length > i ? "bg-app-green" : "bg-transparent"
                    )} 
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (num === 'del') {
                        setPasscodeAttempt(prev => prev.slice(0, -1));
                      } else if (typeof num === 'number') {
                        if (passcodeAttempt.length < 6) {
                          const newAttempt = passcodeAttempt + num;
                          setPasscodeAttempt(newAttempt);
                          if (newAttempt === passcode) {
                            setIsLocked(false);
                            setIsPasscodeModalOpen(false);
                            setPasscodeAttempt('');
                          } else if (newAttempt.length >= (passcode?.length || 4)) {
                            // If it reaches the length of stored passcode and doesn't match
                            if (newAttempt.length === (passcode?.length || 4)) {
                               showNotification('Incorrect passcode!', 'error');
                               setPasscodeAttempt('');
                            }
                          }
                        }
                      }
                    }}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all active:bg-app-green/20",
                      num === '' ? "invisible" : "bg-app-green/5"
                    )}
                  >
                    {num === 'del' ? <Delete className="w-6 h-6" /> : num}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResetModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xs bg-white rounded-[32px] p-8 shadow-2xl text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset All Data?</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">This will permanently delete all your records, accounts, and categories. This action cannot be undone.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setExpenses([]); 
                    setAccounts([
                      { id: 'a1', name: 'Cash', initial: 0, balance: 0, icon: '💵' },
                      { id: 'a2', name: 'Card', initial: 0, balance: 0, icon: '💳' },
                      { id: 'a3', name: 'Savings', initial: 0, balance: 0, icon: '🐷' },
                    ]);
                    setBudgets([]);
                    setIncomeCategories(INCOME_CATEGORIES);
                    setExpenseCategories(EXPENSE_CATEGORIES);
                    setPasscode(null);
                    setSecurityEnabled(false);
                    localStorage.clear();
                    setIsResetModalOpen(false);
                    setIsPreferencesOpen(false);
                    showNotification('All data has been reset.', 'success');
                    window.location.reload(); // Reload to ensure clean state
                  }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all"
                >
                  Yes, Reset Everything
                </button>
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedExpense && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-app-bg rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  {(() => {
                    const cat = selectedExpense.type === 'income' 
                      ? incomeCategories.find(c => c.name === selectedExpense.category) 
                      : expenseCategories.find(c => c.name === selectedExpense.category);
                    return (
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm",
                        cat?.icon ? "bg-app-green/10 text-app-green" : (cat?.color || "bg-gray-200")
                      )}>
                        {cat?.icon || (!cat ? (selectedExpense.type === 'income' ? '💰' : '💸') : '')}
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-xl font-bold">{selectedExpense.category}</h2>
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-wider">{selectedExpense.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(selectedExpense)} className="p-2 bg-app-green/5 rounded-full text-app-green hover:bg-app-green/10"><SettingsIcon className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteExpense(selectedExpense.id)} className="p-2 bg-red-50 rounded-full text-red-700 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 bg-app-green/5 rounded-full"><X className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center py-4 bg-app-green/5 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Amount</p>
                  <p className={cn("text-3xl font-bold", selectedExpense.type === 'income' ? "text-green-700" : "text-red-700")}>
                    {selectedExpense.type === 'income' ? '+' : selectedExpense.type === 'transfer' ? '' : '-'}{formatAmount(selectedExpense.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedExpense.type === 'transfer' ? (
                    <>
                      <DetailItem label="From Account" value={selectedExpense.account} />
                      <DetailItem label="To Account" value={selectedExpense.toAccount || ''} />
                    </>
                  ) : (
                    <DetailItem label="Account" value={selectedExpense.account} />
                  )}
                  <DetailItem label="Date" value={selectedExpense.date} />
                  <DetailItem label="Time" value={selectedExpense.time} />
                </div>

                {selectedExpense.note && (
                  <div className="pt-4 border-t border-app-green/10">
                    <label className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Note</label>
                    <p className="text-sm italic text-app-green/80 bg-app-green/5 p-3 rounded-xl">"{selectedExpense.note}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase opacity-40 mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SidebarItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-app-green/5 transition-colors">
      <span className="opacity-70">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SettingsSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SettingsItem({ label, sublabel, onClick }: { label: string, sublabel?: string, onClick?: () => void }) {
  return (
    <div className="py-2 cursor-pointer active:opacity-60 transition-opacity" onClick={onClick}>
      <p className="text-sm font-medium">{label}</p>
      {sublabel && <p className="text-[10px] opacity-50">{sublabel}</p>}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 flex-1 transition-all", active ? "text-app-green" : "opacity-30")}>
      <div className={cn("p-1 rounded-lg transition-all", active && "bg-app-green/10")}>{icon}</div>
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}
