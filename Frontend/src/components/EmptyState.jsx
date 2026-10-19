import React from "react";
import Icon from "./Icons";
import { Link } from "react-router-dom";

export function EmptyState({ icon = "file-text", title = "No items found", description = "There are no records to display at this time.", actionLabel, actionTo, onAction, className = "" }) {
  return (
    <div className={`text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-xs ${className}`}>
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
        <Icon name={icon} className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow transition-all"
        >
          <Icon name="plus" className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow transition-all"
        >
          <Icon name="plus" className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800" />
      ))}
    </div>
  );
}

export default EmptyState;
