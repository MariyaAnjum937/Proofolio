import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icons";

export function StatCard({ label, value, icon, to, variant = "default", className = "" }) {
  const variantStyles = {
    default: {
      border: "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
      valueColor: "text-slate-900 dark:text-slate-100"
    },
    pending: {
      border: "border-amber-200/80 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20",
      iconBg: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
      valueColor: "text-amber-800 dark:text-amber-300"
    },
    verified: {
      border: "border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
      valueColor: "text-emerald-800 dark:text-emerald-300"
    },
    rejected: {
      border: "border-rose-200/80 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20",
      iconBg: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
      valueColor: "text-rose-800 dark:text-rose-300"
    }
  };

  const style = variantStyles[variant] || variantStyles.default;
  const content = (
    <div className={`p-5 bg-white dark:bg-slate-900 rounded-xl border ${style.border} shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between ${className}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${style.valueColor}`}>{value}</p>
      </div>
      {icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Icon name={icon} className="w-6 h-6" />
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}

export default StatCard;
