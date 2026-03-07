import { modules, getModule } from '@/lib/modules';
import { demoData } from '@/lib/demo-data';
import { getSupabaseAdmin, hasSupabase } from '@/lib/supabase';
import { safeNumber, safeString } from '@/lib/utils';
import type { ChartPoint, ModuleSlug, RecordShape } from '@/lib/types';

function sheetRowsFromDemo(slug: ModuleSlug): RecordShape[] {
  const module = modules.find((item) => item.slug === slug);
  if (!module) return [];
  const raw = (demoData as Record<string, Record<string, unknown>[]>)[module.workbookSheet] ?? [];
  return raw.map((row, index) => {
    const normalized: RecordShape = { id: `demo-${slug}-${index + 1}` };
    for (const column of module.columns) {
      const exact = row[column.label];
      const alt = row[column.key];
      normalized[column.key] = (exact ?? alt ?? null) as string | number | null;
    }
    return normalized;
  });
}

export async function getRows(slug: ModuleSlug) {
  const module = getModule(slug);
  if (!module) return [];
  if (!hasSupabase()) return sheetRowsFromDemo(slug);

  const supabase = getSupabaseAdmin();
  if (!supabase) return sheetRowsFromDemo(slug);
  const { data, error } = await supabase.from(module.table).select('*').order(module.columns[0].key, { ascending: false });
  if (error || !data) return sheetRowsFromDemo(slug);
  return data as RecordShape[];
}

const MONTH_ORDER = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const FINANCE_NATURES = ['Income','Expense','Savings','Frass','Debt','Emergency Fund'] as const;

export type YearlySummaryRow = {
  month: string;
  Income: number;
  Expense: number;
  Savings: number;
  Frass: number;
  Debt: number;
  'Emergency Fund': number;
  net: number;
};

export async function getDashboardData() {
  const [finance, lifestyle, skills, work, travel, wishlist] = await Promise.all(
    modules.map((module) => getRows(module.slug)),
  );

  const financeByMonthMap = new Map<string, number>();
  let income = 0;
  let expense = 0;
  let savings = 0;

  // Yearly summary: keyed by month name
  const yearlyMap = new Map<string, Record<string, number>>();
  MONTH_ORDER.forEach((m) => yearlyMap.set(m, { Income: 0, Expense: 0, Savings: 0, Frass: 0, Debt: 0, 'Emergency Fund': 0 }));

  finance.forEach((row) => {
    const month = safeString(row.month) || 'Unknown';
    const amount = safeNumber(row.amount);
    const nature = safeString(row.financial_nature).trim();
    const natureLower = nature.toLowerCase();
    financeByMonthMap.set(month, (financeByMonthMap.get(month) ?? 0) + amount);
    if (natureLower === 'income') income += amount;
    if (natureLower === 'expense' || natureLower === 'frass' || natureLower === 'debt') expense += amount;
    if (natureLower === 'savings' || natureLower === 'emergency fund') savings += amount;

    if (yearlyMap.has(month)) {
      const entry = yearlyMap.get(month)!;
      const key = FINANCE_NATURES.find(
        (n) => n.toLowerCase() === nature.toLowerCase()
      );
      if (key) entry[key] = (entry[key] ?? 0) + amount;
    }
  });

  const yearlySummary: YearlySummaryRow[] = MONTH_ORDER.map((month) => {
    const e = yearlyMap.get(month)!;
    const net = e['Income'] - e['Expense'] - e['Debt'] - e['Frass'];
    return { month, Income: e['Income'], Expense: e['Expense'], Savings: e['Savings'], Frass: e['Frass'], Debt: e['Debt'], 'Emergency Fund': e['Emergency Fund'], net } as YearlySummaryRow;
  });

  const workStatusMap = new Map<string, number>();
  let actualIncome = 0;
  let workExpense = 0;
  work.forEach((row) => {
    const status = safeString(row.status) || 'Unknown';
    workStatusMap.set(status, (workStatusMap.get(status) ?? 0) + 1);
    actualIncome += safeNumber(row.actual_income);
    workExpense += safeNumber(row.expense);
  });

  const lifestyleHabits: ChartPoint[] = [
    'prayers_praises','gym','smoking','drinking','skincare','haircare','hand_feet_care','journal'
  ].map((key) => ({
    label: key.replace(/_/g, ' '),
    value: lifestyle.reduce((sum, row) => sum + safeNumber(row[key]), 0),
  }));

  const travelStatusMap = new Map<string, number>();
  let travelBudget = 0;
  let travelEstimate = 0;
  travel.forEach((row) => {
    const status = safeString(row.status) || 'Unknown';
    travelStatusMap.set(status, (travelStatusMap.get(status) ?? 0) + 1);
    travelBudget += safeNumber(row.budget);
    travelEstimate += safeNumber(row.estimated_cost);
  });

  const wishlistPriorityMap = new Map<string, number>();
  let targetBudget = 0;
  let expectedPrice = 0;
  wishlist.forEach((row) => {
    const priority = safeString(row.priority) || 'Unknown';
    wishlistPriorityMap.set(priority, (wishlistPriorityMap.get(priority) ?? 0) + 1);
    targetBudget += safeNumber(row.target_budget);
    expectedPrice += safeNumber(row.expected_price);
  });

  const skillHours = skills.reduce((sum, row) => sum + safeNumber(row.hours_invested), 0);

  return {
    stats: {
      income,
      balance: income - expense,
      savings,
      workNet: actualIncome - workExpense,
      travelBuffer: travelBudget - travelEstimate,
      wishlistGap: targetBudget - expectedPrice,
      skillHours,
    },
    charts: {
      financeByMonth: Array.from(financeByMonthMap.entries()).map(([label, value]) => ({ label, value })),
      workStatuses: Array.from(workStatusMap.entries()).map(([label, value]) => ({ label, value })),
      lifestyleHabits,
      travelStatuses: Array.from(travelStatusMap.entries()).map(([label, value]) => ({ label, value })),
      wishlistPriorities: Array.from(wishlistPriorityMap.entries()).map(([label, value]) => ({ label, value })),
    },
    yearlySummary,
  };
}