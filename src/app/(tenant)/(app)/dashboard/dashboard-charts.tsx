"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

export type ExpensesByMonth = { month: string; amount: number; label: string }[];
export type ExpensesByCategory = { category: string; amount: number; name: string }[];
export type SpentVsReceived = { totalSpent: number; totalReceived: number };

const CHART_COLORS = {
  primary: "#0d9488",
  secondary: "#10b981",
  category: ["#f59e0b", "#3b82f6", "#6366f1", "#64748b", "#8b5cf6"],
  area: "#0d9488",
  areaFill: "rgba(13, 148, 136, 0.2)",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function ExpensesByMonthChart({ data }: { data: ExpensesByMonth }) {
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-500">
        No expense data for the last 6 months
      </div>
    );
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.4} />
              <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} stroke="#64748b" width={48} />
          <Tooltip
            formatter={(value: number | undefined) => [value != null ? formatCurrency(value) : "", "Spent"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Area type="monotone" dataKey="amount" stroke={CHART_COLORS.area} strokeWidth={2} fill="url(#expenseArea)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensesByCategoryChart({ data }: { data: ExpensesByCategory }) {
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-500">
        No expenses by category yet
      </div>
    );
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS.category[index % CHART_COLORS.category.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => (value != null ? formatCurrency(value) : "")}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Legend formatter={(value) => value.replace("_", " ")} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpentVsReceivedChart({ data }: { data: SpentVsReceived }) {
  const chartData = [
    { name: "Spent", value: data.totalSpent, fill: "#f59e0b" },
    { name: "Received", value: data.totalReceived, fill: "#10b981" },
  ];
  const hasData = data.totalSpent > 0 || data.totalReceived > 0;
  if (!hasData) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-500">
        No financial data yet
      </div>
    );
  }
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            formatter={(value: number | undefined) => (value != null ? formatCurrency(value) : "")}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
