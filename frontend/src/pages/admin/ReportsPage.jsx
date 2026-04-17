import { useState, useEffect } from 'react'
import api from '../../api/client'
import { SearchBar, Pagination } from '../../components/DataTable'
import { BarChart3, FileDown, Filter, Users, Briefcase, DollarSign, Loader2 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

const reportTypes = [
  { id: 'project', label: 'รายงานโปรเจกต์', icon: Briefcase, endpoint: '/reports/project/' },
  { id: 'finance', label: 'รายงานการเงิน', icon: DollarSign, endpoint: '/reports/finance/' },
  { id: 'worker', label: 'รายงานแรงงาน', icon: Users, endpoint: '/reports/worker/' },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('project')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [projects, setProjects] = useState([])
  const [filterProject, setFilterProject] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const toast = useToast()

  useEffect(() => { api.get('/projects/?page_size=100').then(r => setProjects(r.data.results || r.data)).catch(() => {}) }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const report = reportTypes.find(r => r.id === selectedReport)
      const params = {}
      if (filterProject) params.project = filterProject
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await api.get(report.endpoint, { params })
      setData(res.data)
    } catch { toast.error('ไม่สามารถโหลดรายงานได้') }
    finally { setLoading(false) }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { type: selectedReport }
      if (filterProject) params.project = filterProject
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await api.get('/reports/export/', { params, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${selectedReport}_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('ไม่สามารถ Export ได้') }
    finally { setExporting(false) }
  }

  const renderProjectReport = () => {
    if (!data?.projects) return null
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4"><p className="text-xs text-surface-500">โปรเจกต์ทั้งหมด</p><p className="text-2xl font-bold">{data.total_projects}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">Active</p><p className="text-2xl font-bold text-emerald-600">{data.active_projects}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">งบประมาณรวม</p><p className="text-2xl font-bold">฿{Number(data.total_budget || 0).toLocaleString()}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">ค่าใช้จ่ายรวม</p><p className="text-2xl font-bold text-red-600">฿{Number(data.total_expenses || 0).toLocaleString()}</p></div>
        </div>
        {/* Project Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
                <th className="text-center p-4 text-sm font-semibold text-surface-500">สถานะ</th>
                <th className="text-right p-4 text-sm font-semibold text-surface-500">งบประมาณ</th>
                <th className="text-right p-4 text-sm font-semibold text-surface-500">ค่าใช้จ่าย</th>
                <th className="text-center p-4 text-sm font-semibold text-surface-500">คนงาน</th>
                <th className="text-center p-4 text-sm font-semibold text-surface-500">Progress</th>
              </tr></thead>
              <tbody>{data.projects.map((p, i) => (
                <tr key={i} className="border-b border-surface-100 dark:border-surface-800">
                  <td className="p-4 font-medium text-sm">{p.name}</td>
                  <td className="p-4 text-center"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-surface-100 text-surface-600'}`}>{p.status}</span></td>
                  <td className="p-4 text-right text-sm">฿{Number(p.budget || 0).toLocaleString()}</td>
                  <td className="p-4 text-right text-sm font-bold text-red-600">฿{Number(p.total_expenses || 0).toLocaleString()}</td>
                  <td className="p-4 text-center text-sm">{p.worker_count || 0}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{p.progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderFinanceReport = () => {
    if (!data) return null
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4"><p className="text-xs text-surface-500">ค่าใช้จ่ายรวม</p><p className="text-2xl font-bold text-red-600">฿{Number(data.total_expenses || 0).toLocaleString()}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">การชำระเงินรวม</p><p className="text-2xl font-bold text-emerald-600">฿{Number(data.total_payments || 0).toLocaleString()}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">รายรับรวม</p><p className="text-2xl font-bold text-blue-600">฿{Number(data.total_income || 0).toLocaleString()}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">กำไร/ขาดทุน</p><p className={`text-2xl font-bold ${(data.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>฿{Number(data.profit || 0).toLocaleString()}</p></div>
        </div>
        {data.by_type && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">ค่าใช้จ่ายตามประเภท</h3>
            <div className="space-y-3">
              {data.by_type.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{t.expense_type || t.type}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-40 h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${data.total_expenses ? (t.total / data.total_expenses * 100) : 0}%` }} />
                    </div>
                    <span className="text-sm font-bold w-28 text-right">฿{Number(t.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderWorkerReport = () => {
    if (!data?.workers) return null
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card p-4"><p className="text-xs text-surface-500">คนงานทั้งหมด</p><p className="text-2xl font-bold">{data.total_workers}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">Active</p><p className="text-2xl font-bold text-emerald-600">{data.active_workers}</p></div>
          <div className="card p-4"><p className="text-xs text-surface-500">ค่าแรงรวม</p><p className="text-2xl font-bold text-orange-600">฿{Number(data.total_labor_cost || 0).toLocaleString()}</p></div>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left p-4 text-sm font-semibold text-surface-500">ชื่อ</th>
                <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
                <th className="text-left p-4 text-sm font-semibold text-surface-500">บทบาท</th>
                <th className="text-right p-4 text-sm font-semibold text-surface-500">ค่าแรง/วัน</th>
                <th className="text-center p-4 text-sm font-semibold text-surface-500">วันทำงาน</th>
                <th className="text-right p-4 text-sm font-semibold text-surface-500">รวม</th>
              </tr></thead>
              <tbody>{data.workers.map((w, i) => (
                <tr key={i} className="border-b border-surface-100 dark:border-surface-800">
                  <td className="p-4 font-medium text-sm">{w.name}</td>
                  <td className="p-4 text-sm text-surface-500">{w.project_name || '-'}</td>
                  <td className="p-4 text-sm capitalize">{w.role || '-'}</td>
                  <td className="p-4 text-right text-sm">฿{Number(w.daily_wage || 0).toLocaleString()}</td>
                  <td className="p-4 text-center text-sm">{w.days_worked || 0}</td>
                  <td className="p-4 text-right font-bold text-sm">฿{Number(w.total_cost || 0).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-surface-500">รายงานและสถิติ</p>
        </div>
        <button onClick={handleExport} disabled={exporting || !data} className="btn-primary">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Export Excel
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map(rt => (
          <button key={rt.id} onClick={() => { setSelectedReport(rt.id); setData(null) }}
            className={`card p-4 text-left transition-all ${selectedReport === rt.id ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${selectedReport === rt.id ? 'bg-primary-100 dark:bg-primary-800' : 'bg-surface-100 dark:bg-surface-800'}`}>
                <rt.icon className={`w-5 h-5 ${selectedReport === rt.id ? 'text-primary-600' : 'text-surface-500'}`} />
              </div>
              <span className={`font-medium ${selectedReport === rt.id ? 'text-primary-700 dark:text-primary-300' : ''}`}>{rt.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-surface-500" /><span className="font-medium text-sm">ตัวกรอง</span></div>
        <div className="flex flex-wrap gap-3">
          <select className="select w-auto" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">ทุกโปรเจกต์</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" className="input w-auto" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="จาก" />
          <input type="date" className="input w-auto" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="ถึง" />
          <button onClick={fetchReport} className="btn-primary"><BarChart3 className="w-4 h-4" /> สร้างรายงาน</button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : data ? (
        <>
          {selectedReport === 'project' && renderProjectReport()}
          {selectedReport === 'finance' && renderFinanceReport()}
          {selectedReport === 'worker' && renderWorkerReport()}
        </>
      ) : (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">เลือกประเภทรายงาน แล้วกด "สร้างรายงาน"</p>
        </div>
      )}
    </div>
  )
}
