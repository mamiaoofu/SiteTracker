import { useState, useEffect } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import { SearchBar, Pagination, EmptyState } from '../../components/DataTable'
import { FileText, Receipt, Calculator, TrendingUp, Plus, Edit2, Trash2, Loader2, Eye, Download } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

const tabList = [
  { id: 'invoices', label: 'ใบแจ้งหนี้', icon: FileText, endpoint: '/invoices/' },
  { id: 'receipts', label: 'ใบเสร็จ', icon: Receipt, endpoint: '/receipts/' },
  { id: 'tax', label: 'ภาษี', icon: Calculator, endpoint: '/tax-records/' },
  { id: 'income', label: 'รายรับ', icon: TrendingUp, endpoint: '/incomes/' },
]

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('invoices')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const toast = useToast()

  const currentTab = tabList.find(t => t.id === activeTab)

  useEffect(() => { fetchData() }, [activeTab, search, page])
  useEffect(() => { api.get('/projects/?page_size=100').then(r => setProjects(r.data.results || r.data)).catch(() => {}) }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(currentTab.endpoint, { params: { search, page, page_size: 20 } })
      const items = res.data.results || res.data
      setData(Array.isArray(items) ? items : [])
      if (res.data.count) setTotalPages(Math.ceil(res.data.count / 20))
    } catch {} finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditItem(null)
    setForm(getDefaultForm())
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ ...item })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`${currentTab.endpoint}${editItem.id}/`, form)
      } else {
        await api.post(currentTab.endpoint, form)
      }
      setShowModal(false)
      fetchData()
    } catch { toast.error('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบข้อมูลนี้?')) return
    try { await api.delete(`${currentTab.endpoint}${id}/`); fetchData() } catch { toast.error('ไม่สามารถลบได้') }
  }

  const getDefaultForm = () => {
    const base = { project: projects[0]?.id || '', description: '', date: new Date().toISOString().split('T')[0] }
    switch (activeTab) {
      case 'invoices': return { ...base, invoice_number: '', client_name: '', amount: '', vat_rate: '7.00', wht_rate: '3.00', due_date: '', status: 'draft' }
      case 'receipts': return { ...base, receipt_number: '', payer_name: '', amount: '', payment_method: 'cash' }
      case 'tax': return { ...base, tax_type: 'vat', amount: '', period_start: '', period_end: '', direction: 'payable', is_paid: false }
      case 'income': return { ...base, source: '', amount: '', category: 'construction' }
      default: return base
    }
  }

  const renderFormFields = () => {
    const shared = (
      <>
        <div><label className="label">โปรเจกต์</label><select className="select" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className="label">จำนวนเงิน</label><input className="input" type="number" step="0.01" required value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
      </>
    )

    switch (activeTab) {
      case 'invoices': return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">เลขที่ใบแจ้งหนี้</label><input className="input" required value={form.invoice_number || ''} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></div>
            <div><label className="label">ชื่อลูกค้า</label><input className="input" required value={form.client_name || ''} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
          </div>
          {shared}
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">VAT %</label><input className="input" type="number" step="0.01" value={form.vat_rate || ''} onChange={e => setForm({ ...form, vat_rate: e.target.value })} /></div>
            <div><label className="label">WHT %</label><input className="input" type="number" step="0.01" value={form.wht_rate || ''} onChange={e => setForm({ ...form, wht_rate: e.target.value })} /></div>
            <div><label className="label">สถานะ</label><select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">วันที่</label><input className="input" type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className="label">วันครบกำหนด</label><input className="input" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          {(form.vat_amount || form.wht_amount || form.net_amount) && (
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-surface-500">VAT</span><p className="font-bold">฿{Number(form.vat_amount || 0).toLocaleString()}</p></div>
              <div><span className="text-surface-500">WHT</span><p className="font-bold text-red-500">-฿{Number(form.wht_amount || 0).toLocaleString()}</p></div>
              <div><span className="text-surface-500">สุทธิ</span><p className="font-bold text-primary-600">฿{Number(form.net_amount || 0).toLocaleString()}</p></div>
            </div>
          )}
        </>
      )
      case 'receipts': return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">เลขที่ใบเสร็จ</label><input className="input" required value={form.receipt_number || ''} onChange={e => setForm({ ...form, receipt_number: e.target.value })} /></div>
            <div><label className="label">ผู้ชำระ</label><input className="input" required value={form.payer_name || ''} onChange={e => setForm({ ...form, payer_name: e.target.value })} /></div>
          </div>
          {shared}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">วิธีชำระ</label><select className="select" value={form.payment_method || ''} onChange={e => setForm({ ...form, payment_method: e.target.value })}><option value="cash">เงินสด</option><option value="transfer">โอนเงิน</option><option value="cheque">เช็ค</option></select></div>
            <div><label className="label">วันที่</label><input className="input" type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          </div>
        </>
      )
      case 'tax': return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">ประเภทภาษี</label><select className="select" value={form.tax_type || ''} onChange={e => setForm({ ...form, tax_type: e.target.value })}><option value="vat">VAT</option><option value="wht">WHT</option><option value="corporate">Corporate Tax</option></select></div>
            <div><label className="label">ทิศทาง</label><select className="select" value={form.direction || ''} onChange={e => setForm({ ...form, direction: e.target.value })}><option value="payable">จ่าย</option><option value="receivable">รับ</option></select></div>
          </div>
          {shared}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">งวดเริ่ม</label><input className="input" type="date" value={form.period_start || ''} onChange={e => setForm({ ...form, period_start: e.target.value })} /></div>
            <div><label className="label">งวดสิ้นสุด</label><input className="input" type="date" value={form.period_end || ''} onChange={e => setForm({ ...form, period_end: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_paid || false} onChange={e => setForm({ ...form, is_paid: e.target.checked })} className="w-4 h-4 rounded" /><label className="text-sm">ชำระแล้ว</label></div>
        </>
      )
      case 'income': return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">แหล่งรายรับ</label><input className="input" required value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })} /></div>
            <div><label className="label">หมวดหมู่</label><select className="select" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}><option value="construction">งานก่อสร้าง</option><option value="service">งานบริการ</option><option value="rental">ค่าเช่า</option><option value="other">อื่นๆ</option></select></div>
          </div>
          {shared}
          <div><label className="label">วันที่</label><input className="input" type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        </>
      )
    }
    return null
  }

  const renderTable = () => {
    switch (activeTab) {
      case 'invoices': return (
        <table className="w-full">
          <thead><tr className="border-b border-surface-200 dark:border-surface-700">
            <th className="text-left p-4 text-sm font-semibold text-surface-500">เลขที่</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">ลูกค้า</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-500">จำนวน</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-500">สุทธิ</th>
            <th className="text-center p-4 text-sm font-semibold text-surface-500">สถานะ</th>
            <th className="text-center p-4 text-sm font-semibold text-surface-500">Actions</th>
          </tr></thead>
          <tbody>{data.map(inv => (
            <tr key={inv.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
              <td className="p-4 font-mono text-sm">{inv.invoice_number}</td>
              <td className="p-4 text-sm">{inv.client_name}</td>
              <td className="p-4 text-sm">{inv.project_name}</td>
              <td className="p-4 text-right text-sm">฿{Number(inv.amount).toLocaleString()}</td>
              <td className="p-4 text-right font-bold text-sm text-primary-600">฿{Number(inv.net_amount).toLocaleString()}</td>
              <td className="p-4 text-center"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : inv.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : inv.status === 'sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>{inv.status}</span></td>
              <td className="p-4 text-center"><div className="flex items-center justify-center gap-1">
                <button onClick={() => { setSelectedItem(inv); setShowDetailModal(true) }} className="btn-ghost p-1.5 rounded-lg"><Eye className="w-4 h-4" /></button>
                <button onClick={() => openEdit(inv)} className="btn-ghost p-1.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(inv.id)} className="btn-ghost p-1.5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div></td>
            </tr>
          ))}{data.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-surface-500">ไม่มีข้อมูล</td></tr>}</tbody>
        </table>
      )
      case 'receipts': return (
        <table className="w-full">
          <thead><tr className="border-b border-surface-200 dark:border-surface-700">
            <th className="text-left p-4 text-sm font-semibold text-surface-500">เลขที่</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">ผู้ชำระ</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-500">จำนวน</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">วิธีชำระ</th>
            <th className="text-center p-4 text-sm font-semibold text-surface-500">Actions</th>
          </tr></thead>
          <tbody>{data.map(rc => (
            <tr key={rc.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
              <td className="p-4 font-mono text-sm">{rc.receipt_number}</td>
              <td className="p-4 text-sm">{rc.payer_name}</td>
              <td className="p-4 text-sm">{rc.project_name}</td>
              <td className="p-4 text-right font-bold text-sm">฿{Number(rc.amount).toLocaleString()}</td>
              <td className="p-4"><span className="badge-primary text-xs">{rc.payment_method}</span></td>
              <td className="p-4 text-center"><div className="flex items-center justify-center gap-1">
                <button onClick={() => openEdit(rc)} className="btn-ghost p-1.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(rc.id)} className="btn-ghost p-1.5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div></td>
            </tr>
          ))}{data.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-surface-500">ไม่มีข้อมูล</td></tr>}</tbody>
        </table>
      )
      case 'tax': return (
        <table className="w-full">
          <thead><tr className="border-b border-surface-200 dark:border-surface-700">
            <th className="text-left p-4 text-sm font-semibold text-surface-500">ประเภท</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">ทิศทาง</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-500">จำนวน</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">งวด</th>
            <th className="text-center p-4 text-sm font-semibold text-surface-500">ชำระแล้ว</th>
            <th className="text-center p-4 text-sm font-semibold text-surface-500">Actions</th>
          </tr></thead>
          <tbody>{data.map(tx => (
            <tr key={tx.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
              <td className="p-4"><span className="badge-warning text-xs uppercase">{tx.tax_type}</span></td>
              <td className="p-4 text-sm capitalize">{tx.direction === 'payable' ? '📤 จ่าย' : '📥 รับ'}</td>
              <td className="p-4 text-sm">{tx.project_name}</td>
              <td className="p-4 text-right font-bold text-sm">฿{Number(tx.amount).toLocaleString()}</td>
              <td className="p-4 text-sm text-surface-500">{tx.period_start} ~ {tx.period_end}</td>
              <td className="p-4 text-center">{tx.is_paid ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-surface-400">-</span>}</td>
              <td className="p-4 text-center"><div className="flex items-center justify-center gap-1">
                <button onClick={() => openEdit(tx)} className="btn-ghost p-1.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(tx.id)} className="btn-ghost p-1.5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div></td>
            </tr>
          ))}{data.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-surface-500">ไม่มีข้อมูล</td></tr>}</tbody>
        </table>
      )
      case 'income': return (
        <table className="w-full">
          <thead><tr className="border-b border-surface-200 dark:border-surface-700">
            <th className="text-left p-4 text-sm font-semibold text-surface-500">แหล่งรายรับ</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">หมวดหมู่</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-500">จำนวน</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-500">วันที่</th>
            <th className="text-center p-4 text-sm font-semibold text-surface-500">Actions</th>
          </tr></thead>
          <tbody>{data.map(ic => (
            <tr key={ic.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
              <td className="p-4 text-sm font-medium">{ic.source}</td>
              <td className="p-4"><span className="badge-success text-xs">{ic.category}</span></td>
              <td className="p-4 text-sm">{ic.project_name}</td>
              <td className="p-4 text-right font-bold text-sm text-emerald-600">฿{Number(ic.amount).toLocaleString()}</td>
              <td className="p-4 text-sm text-surface-500">{new Date(ic.date).toLocaleDateString('th-TH')}</td>
              <td className="p-4 text-center"><div className="flex items-center justify-center gap-1">
                <button onClick={() => openEdit(ic)} className="btn-ghost p-1.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(ic.id)} className="btn-ghost p-1.5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div></td>
            </tr>
          ))}{data.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-surface-500">ไม่มีข้อมูล</td></tr>}</tbody>
        </table>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Accounting</h1>
          <p className="text-sm text-surface-500">จัดการบัญชี ใบแจ้งหนี้ ใบเสร็จ ภาษี</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> เพิ่มรายการ</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl overflow-x-auto">
        {tabList.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1); setSearch('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="ค้นหา..." />

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="card overflow-hidden"><div className="overflow-x-auto">{renderTable()}</div></div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}>
        <form onSubmit={handleSave} className="space-y-4">
          {renderFormFields()}
          <div><label className="label">รายละเอียด</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editItem ? 'อัปเดต' : 'บันทึก')}</button>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="รายละเอียดใบแจ้งหนี้">
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-surface-500">เลขที่</span><p className="font-mono font-bold">{selectedItem.invoice_number}</p></div>
              <div><span className="text-surface-500">ลูกค้า</span><p className="font-medium">{selectedItem.client_name}</p></div>
              <div><span className="text-surface-500">จำนวนเงิน</span><p className="font-bold">฿{Number(selectedItem.amount).toLocaleString()}</p></div>
              <div><span className="text-surface-500">สถานะ</span><p className="font-medium capitalize">{selectedItem.status}</p></div>
            </div>
            <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl space-y-2">
              <div className="flex justify-between text-sm"><span className="text-surface-500">VAT ({selectedItem.vat_rate}%)</span><span className="font-medium">+฿{Number(selectedItem.vat_amount || 0).toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">WHT ({selectedItem.wht_rate}%)</span><span className="font-medium text-red-500">-฿{Number(selectedItem.wht_amount || 0).toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 border-surface-200 dark:border-surface-700"><span>สุทธิ</span><span className="text-primary-600">฿{Number(selectedItem.net_amount || 0).toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
