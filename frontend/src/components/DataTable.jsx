import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

export function SearchBar({ value, onChange, placeholder = 'ค้นหา...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10 w-full sm:w-72"
      />
    </div>
  )
}

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="btn-ghost p-2 rounded-lg disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn-ghost px-3 py-1.5 rounded-lg text-sm">1</button>
          {start > 2 && <span className="px-1 text-surface-400">...</span>}
        </>
      )}
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            p === currentPage
              ? 'bg-primary-600 text-white shadow-md'
              : 'btn-ghost'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-surface-400">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn-ghost px-3 py-1.5 rounded-lg text-sm">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="btn-ghost p-2 rounded-lg disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export function StatusBadge({ status }) {
  const styles = {
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-danger',
    need_revision: 'badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    planning: 'badge-primary',
    in_progress: 'badge-success',
    on_hold: 'badge-warning',
    completed: 'badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'badge-danger',
    draft: 'badge bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
    sent: 'badge-primary',
    paid: 'badge-success',
    overdue: 'badge-danger',
  }
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    need_revision: 'Need Revision',
    planning: 'Planning',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
  }

  return (
    <span className={styles[status] || 'badge-primary'}>
      {labels[status] || status}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="card p-12 text-center">
      <Icon className="w-12 h-12 text-surface-300 mx-auto mb-3" />
      <h3 className="font-semibold text-lg">{title}</h3>
      {subtitle && <p className="text-sm text-surface-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'ยืนยัน', danger = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm card p-6 animate-scale-in text-center">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-surface-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">ยกเลิก</button>
          <button onClick={onConfirm} className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
