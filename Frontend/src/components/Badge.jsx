import React from "react";
import Icon from "./Icons";

export function StatusBadge({ status, className = "" }) {
  const normalized = (status || "pending").toLowerCase().trim();

  if (normalized === "verified" || normalized === "approved" || normalized === "completed") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ${className}`}>
        <Icon name="check-circle" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="capitalize">{normalized === "verified" ? "Verified" : normalized === "approved" ? "Approved" : "Completed"}</span>
      </span>
    );
  }

  if (normalized === "rejected" || normalized === "cancelled") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 ${className}`}>
        <Icon name="x-circle" className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span className="capitalize">{normalized === "rejected" ? "Rejected" : "Cancelled"}</span>
      </span>
    );
  }

  if (normalized === "in_progress") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 ${className}`}>
        <Icon name="clock" className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>In Progress</span>
      </span>
    );
  }

  // Default: Pending / Scheduled
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 ${className}`}>
      <Icon name="clock" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      <span className="capitalize">{normalized === "pending" ? "Pending Review" : normalized === "scheduled" ? "Scheduled" : normalized}</span>
    </span>
  );
}

export function RoleBadge({ role, className = "" }) {
  const normalized = (role || "").toLowerCase().trim();
  let colorStyles = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  if (normalized === "admin") {
    colorStyles = "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60";
  } else if (normalized === "faculty") {
    colorStyles = "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60";
  } else if (normalized === "student") {
    colorStyles = "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colorStyles} uppercase tracking-wider ${className}`}>
      {role || "User"}
    </span>
  );
}

export function CategoryBadge({ category, className = "" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}>
      {category}
    </span>
  );
}

export default StatusBadge;
