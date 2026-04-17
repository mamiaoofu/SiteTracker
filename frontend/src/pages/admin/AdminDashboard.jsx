import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import {
  TrendingUp, TrendingDown, FolderKanban, DollarSign,
  Camera, Users, Package, HardHat, Clock, AlertTriangle
} from 'lucide-react'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/summary/').then(res => setData(res.data)).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'ค่าใช้จ่ายทั้งหมด',
      value: `฿${data.total_expenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'ชำระแล้ว',
      value: `฿${data.total_payments.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'ค้างชำระ',
      value: `฿${data.outstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'โปรเจกต์ที่ Active',
      value: data.active_projects,
      icon: FolderKanban,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-surface-500">ภาพรวมการจัดการงานก่อสร้าง</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Info Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => navigate('/admin/workers')}>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.total_workers || 0}</p>
            <p className="text-xs text-surface-500">คนงานทั้งหมด</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => navigate('/admin/finance')}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.pending_expenses || 0}</p>
            <p className="text-xs text-surface-500">รอการอนุมัติ</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">฿{data.today_expenses.toLocaleString('th-TH', { minimumFractionDigits: 0 })}</p>
            <p className="text-xs text-surface-500">ค่าใช้จ่ายวันนี้</p>
          </div>
        </div>
      </div>

      {/* Today's Activity & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">กิจกรรมวันนี้</h3>
          <div className="space-y-3">
            {[
              { icon: Camera, label: 'Daily Logs', value: data.today.daily_logs, color: 'text-blue-500' },
              { icon: Users, label: 'Labor Logs', value: data.today.labor_logs, color: 'text-emerald-500' },
              { icon: Package, label: 'Material Logs', value: data.today.material_logs, color: 'text-orange-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">สัดส่วนค่าใช้จ่าย</h3>
          <div className="space-y-4">
            {[
              { label: 'ค่าแรง', value: data.expenses_by_type.labor, color: 'bg-emerald-500' },
              { label: 'ค่าวัสดุ', value: data.expenses_by_type.material, color: 'bg-orange-500' },
            ].map((item, i) => {
              const total = data.total_expenses || 1
              const pct = ((item.value / total) * 100).toFixed(1)
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">฿{item.value.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
