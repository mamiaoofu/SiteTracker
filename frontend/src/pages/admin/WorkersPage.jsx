import { useState, useEffect } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import { SearchBar, Pagination, EmptyState } from '../../components/DataTable'
import { Plus, HardHat, Loader2, Edit, Trash2 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

export default function WorkersPage() {
  const [workers, setWorkers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWorker, setEditingWorker] = useState(null)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', daily_rate: '', role: '', project: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const fetchWorkers = async () => {
    try {
      const params = { search, page, page_size: 20 }
      if (filterProject) params.project = filterProject
      const res = await api.get('/workers/', { params })
      const data = res.data.results || res.data
      setWorkers(Array.isArray(data) ? data : [])
      if (res.data.count) setTotalPages(Math.ceil(res.data.count / 20))
    } catch {} finally { setLoading(false) }
  }

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/?page_size=100')
      setProjects(res.data.results || res.data)
    } catch {}
  }

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { fetchWorkers() }, [search, page, filterProject])

  const openEdit = (worker) => {
    setEditingWorker(worker)
    setForm({
      name: worker.name, phone: worker.phone || '', daily_rate: worker.daily_rate,
      role: worker.role || '', project: worker.project || ''
    })
    setShowModal(true)
  }

  const openCreate = () => {
    setEditingWorker(null)
    setForm({ name: '', phone: '', daily_rate: '', role: '', project: '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, project: form.project || null }
      if (editingWorker) {
        await api.patch(`/workers/${editingWorker.id}/`, payload)
      } else {
        await api.post('/workers/', payload)
      }
      setShowModal(false)
      fetchWorkers()
    } catch { toast.error('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบคนงานนี้?')) return
    try {
      await api.delete(`/workers/${id}/`)
      fetchWorkers()
    } catch { toast.error('ไม่สามารถลบได้') }
  }

  const handleToggleActive = async (worker) => {
    try {
      await api.patch(`/workers/${worker.id}/`, { is_active: !worker.is_active })
      fetchWorkers()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workers</h1>
          <p className="text-sm text-surface-500">จัดการคนงาน</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> เพิ่มคนงาน</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="ค้นหาชื่อ, เบอร์โทร..." />
        <select className="select w-auto" value={filterProject} onChange={e => { setFilterProject(e.target.value); setPage(1) }}>
          <option value="">ทุกโปรเจกต์</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : workers.length === 0 ? (
        <EmptyState icon={HardHat} title="ยังไม่มีคนงาน" subtitle="กดปุ่มด้านบนเพื่อเพิ่มคนงาน" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left p-4 text-sm font-semibold text-surface-500">ชื่อ</th>
                    <th className="text-left p-4 text-sm font-semibold text-surface-500">ตำแหน่ง</th>
                    <th className="text-left p-4 text-sm font-semibold text-surface-500">โปรเจกต์</th>
                    <th className="text-left p-4 text-sm font-semibold text-surface-500">โทรศัพท์</th>
                    <th className="text-right p-4 text-sm font-semibold text-surface-500">ค่าแรง/วัน</th>
                    <th className="text-center p-4 text-sm font-semibold text-surface-500">สถานะ</th>
                    <th className="text-center p-4 text-sm font-semibold text-surface-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(worker => (
                    <tr key={worker.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-700 dark:text-primary-400">{worker.name[0]}</span>
                          </div>
                          <span className="font-medium">{worker.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-surface-500">{worker.role || '-'}</td>
                      <td className="p-4 text-sm">
                        {worker.project_name ? (
                          <span className="badge-primary">{worker.project_name}</span>
                        ) : (
                          <span className="text-surface-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-surface-500">{worker.phone || '-'}</td>
                      <td className="p-4 text-right font-semibold">฿{Number(worker.daily_rate).toLocaleString('th-TH')}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleToggleActive(worker)} className={`badge cursor-pointer ${worker.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {worker.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(worker)} className="btn-ghost p-1.5 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(worker.id)} className="btn-ghost p-1.5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingWorker ? 'แก้ไขคนงาน' : 'เพิ่มคนงาน'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">ชื่อ-นามสกุล</label><input className="input" placeholder="เช่น สมชาย ใจดี" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">ตำแหน่ง</label><input className="input" placeholder="เช่น ช่างปูน, ช่างไฟฟ้า" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div><label className="label">โปรเจกต์</label><select className="select" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })}><option value="">-- ไม่ระบุ --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label">เบอร์โทร</label><input className="input" type="tel" placeholder="08X-XXX-XXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">ค่าแรงรายวัน (บาท)</label><input className="input" type="number" placeholder="0" value={form.daily_rate} onChange={e => setForm({ ...form, daily_rate: e.target.value })} required /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingWorker ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มคนงาน')}</button>
        </form>
      </Modal>
    </div>
  )
}
