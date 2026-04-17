import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Receipt, DollarSign, Download } from 'lucide-react'

export default function AccountantDashboard() {
  const [activeTab, setActiveTab] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState('')
  const [projects, setProjects] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [eRes, pRes, prRes] = await Promise.all([
        api.get('/expenses/'),
        api.get('/payments/'),
        api.get('/projects/'),
      ])
      setExpenses(eRes.data.results || eRes.data)
      setPayments(pRes.data.results || pRes.data)
      setProjects(prRes.data.results || prRes.data)
    } catch {} finally { setLoading(false) }
  }

  const exportCSV = (data, filename) => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(d => Object.values(d).join(','))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}.csv`; a.click()
  }

  const filtered = (data) => filterProject ? data.filter(d => String(d.project) === filterProject) : data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finance Overview</h1>
          <p className="text-sm text-surface-500">ดูข้อมูลค่าใช้จ่ายและการชำระเงิน</p>
        </div>
        <div className="flex gap-2">
          <select className="select w-auto" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">ทุกโปรเจกต์</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => exportCSV(filtered(activeTab === 'expenses' ? expenses : payments), activeTab)} className="btn-primary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {[
          { id: 'expenses', label: 'ค่าใช้จ่าย', icon: Receipt },
          { id: 'payments', label: 'การชำระเงิน', icon: DollarSign },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
                  <th className="text-left p-4 text-sm font-semibold text-surface-500">ประเภท</th>
                  <th className="text-right p-4 text-sm font-semibold text-surface-500">จำนวน</th>
                  <th className="text-left p-4 text-sm font-semibold text-surface-500">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {filtered(activeTab === 'expenses' ? expenses : payments).map(item => (
                  <tr key={item.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                    <td className="p-4 text-sm font-medium">{item.project_name}</td>
                    <td className="p-4"><span className={`badge ${(item.expense_type || item.payment_type) === 'labor' ? 'badge-success' : 'badge-warning'}`}>{item.expense_type || item.payment_type}</span></td>
                    <td className="p-4 text-right font-semibold">฿{Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-sm text-surface-500">{new Date(item.date).toLocaleDateString('th-TH')}</td>
                  </tr>
                ))}
                {filtered(activeTab === 'expenses' ? expenses : payments).length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-surface-500">ไม่มีข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
