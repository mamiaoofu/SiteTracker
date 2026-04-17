import { useState, useEffect } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import { SearchBar, StatusBadge, Pagination, EmptyState } from '../../components/DataTable'
import { Receipt, DollarSign, Plus, Loader2, Download, Check, X, Eye, RotateCcw } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reviewNotes, setReviewNotes] = useState('')
  const [paymentForm, setPaymentForm] = useState({
    project: '', amount: '', payment_type: 'labor', method: 'cash',
    description: '', date: new Date().toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => { fetchData() }, [search, filterProject, filterStatus, page, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { search, page, page_size: 20 }
      if (filterProject) params.project = filterProject
      if (filterStatus && activeTab === 'expenses') params.status = filterStatus

      const [eRes, pRes, prRes] = await Promise.all([
        api.get('/expenses/', { params }),
        api.get('/payments/', { params: { search, page, page_size: 20, ...(filterProject ? { project: filterProject } : {}) } }),
        api.get('/projects/?page_size=100'),
      ])

      const eData = eRes.data.results || eRes.data
      const pData = pRes.data.results || pRes.data
      setExpenses(Array.isArray(eData) ? eData : [])
      setPayments(Array.isArray(pData) ? pData : [])
      setProjects(prRes.data.results || prRes.data)

      const count = activeTab === 'expenses' ? eRes.data.count : pRes.data.count
      if (count) setTotalPages(Math.ceil(count / 20))

      if (prRes.data.results?.length > 0 && !paymentForm.project) {
        setPaymentForm(f => ({ ...f, project: prRes.data.results[0].id }))
      }
    } catch {} finally { setLoading(false) }
  }

  const handleCreatePayment = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/payments/', paymentForm)
      setShowPaymentModal(false)
      fetchData()
    } catch { toast.error('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleApprove = async (id) => {
    try {
      await api.post(`/expenses/${id}/approve/`, { notes: reviewNotes })
      setShowDetailModal(false)
      setReviewNotes('')
      fetchData()
    } catch { toast.error('ไม่สามารถอนุมัติได้') }
  }

  const handleReject = async (id) => {
    try {
      await api.post(`/expenses/${id}/reject/`, { notes: reviewNotes })
      setShowDetailModal(false)
      setReviewNotes('')
      fetchData()
    } catch { toast.error('ไม่สามารถปฏิเสธได้') }
  }

  const handleRequestRevision = async (id) => {
    try {
      await api.post(`/expenses/${id}/request_revision/`, { notes: reviewNotes })
      setShowDetailModal(false)
      setReviewNotes('')
      fetchData()
    } catch { toast.error('เกิดข้อผิดพลาด') }
  }

  const exportCSV = (data, filename) => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(d => Object.values(d).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(','))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const viewDetail = (expense) => {
    setSelectedExpense(expense)
    setReviewNotes('')
    setShowDetailModal(true)
  }

  const tabs = [
    { id: 'expenses', label: 'ค่าใช้จ่าย', icon: Receipt },
    { id: 'payments', label: 'การชำระเงิน', icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-sm text-surface-500">จัดการการเงิน</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(activeTab === 'expenses' ? expenses : payments, activeTab)} className="btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> บันทึกชำระ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="ค้นหา..." />
        <select className="select w-auto" value={filterProject} onChange={e => { setFilterProject(e.target.value); setPage(1) }}>
          <option value="">ทุกโปรเจกต์</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {activeTab === 'expenses' && (
          <select className="select w-auto" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">ทุกสถานะ</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="need_revision">Need Revision</option>
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
                    <th className="text-left p-4 text-sm font-semibold text-surface-500">ประเภท</th>
                    <th className="text-right p-4 text-sm font-semibold text-surface-500">จำนวน</th>
                    <th className="text-left p-4 text-sm font-semibold text-surface-500">วันที่</th>
                    {activeTab === 'expenses' && <th className="text-center p-4 text-sm font-semibold text-surface-500">สถานะ</th>}
                    {activeTab === 'payments' && <th className="text-left p-4 text-sm font-semibold text-surface-500">วิธีชำระ</th>}
                    <th className="text-center p-4 text-sm font-semibold text-surface-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'expenses' ? expenses : payments).map(item => (
                    <tr key={item.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="p-4 text-sm font-medium">{item.project_name}</td>
                      <td className="p-4">
                        <span className={`badge ${(item.expense_type || item.payment_type) === 'labor' ? 'badge-success' : (item.expense_type || item.payment_type) === 'material' ? 'badge-warning' : 'badge-primary'}`}>
                          {item.expense_type || item.payment_type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold">฿{Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-sm text-surface-500">{new Date(item.date).toLocaleDateString('th-TH')}</td>
                      {activeTab === 'expenses' && (
                        <td className="p-4 text-center"><StatusBadge status={item.status} /></td>
                      )}
                      {activeTab === 'payments' && (
                        <td className="p-4"><span className="badge-primary">{item.method}</span></td>
                      )}
                      <td className="p-4 text-center">
                        {activeTab === 'expenses' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => viewDetail(item)} className="btn-ghost p-1.5 rounded-lg" title="ดูรายละเอียด"><Eye className="w-4 h-4" /></button>
                            {item.status === 'pending' && (
                              <>
                                <button onClick={() => handleApprove(item.id)} className="btn-ghost p-1.5 rounded-lg text-emerald-500" title="อนุมัติ"><Check className="w-4 h-4" /></button>
                                <button onClick={() => handleReject(item.id)} className="btn-ghost p-1.5 rounded-lg text-red-500" title="ปฏิเสธ"><X className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => viewDetail(item)} className="btn-ghost p-1.5 rounded-lg"><Eye className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'expenses' ? expenses : payments).length === 0 && (
                    <tr><td colSpan={6} className="p-12 text-center text-surface-500">ไม่มีข้อมูล</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Expense Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="รายละเอียดค่าใช้จ่าย">
        {selectedExpense && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-surface-500">โปรเจกต์</span><p className="font-medium">{selectedExpense.project_name}</p></div>
              <div><span className="text-xs text-surface-500">ประเภท</span><p className="font-medium capitalize">{selectedExpense.expense_type || selectedExpense.payment_type}</p></div>
              <div><span className="text-xs text-surface-500">จำนวนเงิน</span><p className="font-bold text-lg">฿{Number(selectedExpense.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p></div>
              <div><span className="text-xs text-surface-500">วันที่</span><p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString('th-TH')}</p></div>
              {selectedExpense.status && (
                <div><span className="text-xs text-surface-500">สถานะ</span><div className="mt-1"><StatusBadge status={selectedExpense.status} /></div></div>
              )}
              {selectedExpense.method && (
                <div><span className="text-xs text-surface-500">วิธีชำระ</span><p className="font-medium capitalize">{selectedExpense.method}</p></div>
              )}
            </div>
            {selectedExpense.description && (
              <div><span className="text-xs text-surface-500">รายละเอียด</span><p className="text-sm mt-1">{selectedExpense.description}</p></div>
            )}
            {selectedExpense.images?.length > 0 && (
              <div>
                <span className="text-xs text-surface-500">ใบเสร็จ</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedExpense.images.map(img => (
                    <img key={img.id} src={img.image} alt="receipt" className="rounded-xl w-full h-32 object-cover" />
                  ))}
                </div>
              </div>
            )}
            {selectedExpense.reviewed_by_name && (
              <div className="pt-3 border-t border-surface-200 dark:border-surface-700">
                <span className="text-xs text-surface-500">ตรวจสอบโดย: {selectedExpense.reviewed_by_name}</span>
                {selectedExpense.review_notes && <p className="text-sm mt-1">{selectedExpense.review_notes}</p>}
              </div>
            )}
            {/* Approval actions */}
            {selectedExpense.status === 'pending' && (
              <div className="pt-4 border-t border-surface-200 dark:border-surface-700 space-y-3">
                <div>
                  <label className="label">หมายเหตุ (ไม่บังคับ)</label>
                  <input className="input" placeholder="เพิ่มหมายเหตุ..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleApprove(selectedExpense.id)} className="btn-success text-sm"><Check className="w-4 h-4" /> อนุมัติ</button>
                  <button onClick={() => handleRequestRevision(selectedExpense.id)} className="btn-secondary text-sm"><RotateCcw className="w-4 h-4" /> แก้ไข</button>
                  <button onClick={() => handleReject(selectedExpense.id)} className="btn-danger text-sm"><X className="w-4 h-4" /> ปฏิเสธ</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="บันทึกชำระเงิน">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div><label className="label">โปรเจกต์</label><select className="select" value={paymentForm.project} onChange={e => setPaymentForm({ ...paymentForm, project: e.target.value })}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label">จำนวนเงิน</label><input className="input" type="number" required value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">ประเภท</label><select className="select" value={paymentForm.payment_type} onChange={e => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}><option value="labor">ค่าแรง</option><option value="material">ค่าวัสดุ</option><option value="other">อื่นๆ</option></select></div>
            <div><label className="label">วิธีชำระ</label><select className="select" value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}><option value="cash">เงินสด</option><option value="transfer">โอนเงิน</option><option value="cheque">เช็ค</option></select></div>
          </div>
          <div><label className="label">วันที่</label><input className="input" type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} /></div>
          <div><label className="label">รายละเอียด</label><input className="input" placeholder="หมายเหตุ..." value={paymentForm.description} onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึกชำระเงิน'}</button>
        </form>
      </Modal>
    </div>
  )
}
