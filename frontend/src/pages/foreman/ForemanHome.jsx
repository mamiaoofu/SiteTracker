import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import {
  CalendarDays, TrendingUp, FolderKanban, Camera, Users, Package,
  ArrowRight, ChevronRight, Briefcase
} from 'lucide-react'

export default function ForemanHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [todayExpense, setTodayExpense] = useState(0)
  const [stats, setStats] = useState({ daily_logs: 0, labor_logs: 0, material_logs: 0 })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [dashRes, projRes] = await Promise.all([
        api.get('/dashboard/summary/'),
        api.get('/projects/?page_size=6'),
      ])
      setTodayExpense(dashRes.data.today_expenses || 0)
      setStats(dashRes.data.today || { daily_logs: 0, labor_logs: 0, material_logs: 0 })
      setProjects(projRes.data.results || projRes.data || [])
    } catch {} finally { setLoading(false) }
  }

  const quickLinks = [
    { icon: Camera, label: 'ถ่ายรูป', subtitle: 'Daily Log', to: '/foreman/daily-log/add', color: 'from-blue-500 to-blue-600' },
    { icon: Users, label: 'แรงงาน', subtitle: 'Labor', to: '/foreman/labor', color: 'from-emerald-500 to-emerald-600' },
    { icon: Package, label: 'วัสดุ', subtitle: 'Material', to: '/foreman/material/add', color: 'from-orange-500 to-orange-600' },
  ]

  const listCards = [
    { icon: FolderKanban, label: 'โปรเจกต์', count: projects.length, to: '/foreman/projects', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { icon: Camera, label: 'Daily Logs', count: stats.daily_logs, to: '/foreman/daily-log', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { icon: Users, label: 'Labor Logs', count: stats.labor_logs, to: '/foreman/labor', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { icon: Package, label: 'Material Logs', count: stats.material_logs, to: '/foreman/material', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="card p-5 bg-gradient-to-r from-primary-600 to-accent-600 text-white border-0">
        <div className="flex items-center gap-2 mb-1 opacity-80">
          <CalendarDays className="w-4 h-4" />
          <span className="text-sm">{new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <h1 className="text-xl font-bold">สวัสดี, {user?.first_name || user?.username}!</h1>
        <p className="text-sm opacity-80 mt-1">พร้อมบันทึกหน้างานวันนี้</p>
      </div>

      {/* Quick Add */}
      <div className="grid grid-cols-3 gap-3">
        {quickLinks.map(q => (
          <button key={q.to} onClick={() => navigate(q.to)}
            className="card p-3 flex flex-col items-center gap-2 hover:shadow-lg transition-all active:scale-95">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${q.color} flex items-center justify-center shadow-md`}>
              <q.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold">{q.label}</span>
          </button>
        ))}
      </div>

      {/* Today Expense */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-surface-500">ค่าใช้จ่ายวันนี้</p>
          <p className="text-2xl font-bold gradient-text">฿{todayExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary-600" />
        </div>
      </div>

      {/* Browse Lists */}
      <div>
        <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider px-1 mb-3">ดูข้อมูล</h2>
        <div className="grid grid-cols-2 gap-3">
          {listCards.map(card => (
            <button key={card.to} onClick={() => navigate(card.to)}
              className="card p-4 text-left hover:shadow-md transition-all active:scale-[0.98]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-sm">{card.label}</p>
              <p className="text-xs text-surface-500">{card.count} วันนี้</p>
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider px-1">โปรเจกต์</h2>
            <button onClick={() => navigate('/foreman/projects')} className="text-xs text-primary-600 font-medium flex items-center gap-1">ดูทั้งหมด <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 3).map(p => (
              <button key={p.id} onClick={() => navigate(`/foreman/projects/${p.id}`)}
                className="w-full card p-3 flex items-center gap-3 text-left hover:shadow-md transition-all active:scale-[0.98]">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-surface-500">{p.location || 'ไม่ระบุสถานที่'}</p>
                </div>
                {p.progress !== undefined && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-primary-600">{p.progress}%</span>
                    <div className="w-16 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full mt-1">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                )}
                <ArrowRight className="w-4 h-4 text-surface-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
