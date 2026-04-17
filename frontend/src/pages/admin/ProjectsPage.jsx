import { useState, useEffect } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import { SearchBar, StatusBadge, Pagination, EmptyState } from '../../components/DataTable'
import {
  Plus, FolderKanban, MapPin, Loader2, Edit, Trash2, Users,
  DollarSign, Camera, BarChart3, ArrowLeft
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectDetail, setProjectDetail] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [form, setForm] = useState({
    name: '', description: '', location: '', status: 'planning',
    budget: '', start_date: '', end_date: '', progress: 0
  })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/', { params: { search, page, page_size: 12 } })
      const data = res.data.results || res.data
      setProjects(Array.isArray(data) ? data : [])
      if (res.data.count) setTotalPages(Math.ceil(res.data.count / 12))
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProjects() }, [search, page])

  const openEdit = (project) => {
    setEditingProject(project)
    setForm({
      name: project.name, description: project.description || '',
      location: project.location || '', status: project.status,
      budget: project.budget || '', start_date: project.start_date || '',
      end_date: project.end_date || '', progress: project.progress || 0
    })
    setShowModal(true)
  }

  const openCreate = () => {
    setEditingProject(null)
    setForm({ name: '', description: '', location: '', status: 'planning', budget: '', start_date: '', end_date: '', progress: 0 })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}/`, form)
      } else {
        await api.post('/projects/', form)
      }
      setShowModal(false)
      fetchProjects()
      if (selectedProject) fetchProjectDetail(selectedProject)
    } catch { toast.error('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบโปรเจกต์นี้?')) return
    try {
      await api.delete(`/projects/${id}/`)
      fetchProjects()
      if (selectedProject === id) setSelectedProject(null)
    } catch { toast.error('ไม่สามารถลบได้') }
  }

  const fetchProjectDetail = async (id) => {
    try {
      const [detRes, dashRes] = await Promise.all([
        api.get(`/projects/${id}/`),
        api.get(`/dashboard/project/${id}/`)
      ])
      setProjectDetail({ ...detRes.data, dashboard: dashRes.data })
      setSelectedProject(id)
    } catch { toast.error('ไม่พบข้อมูลโปรเจกต์') }
  }

  // PROJECT DETAIL VIEW
  if (selectedProject && projectDetail) {
    const d = projectDetail.dashboard
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedProject(null); setProjectDetail(null) }} className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{projectDetail.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {projectDetail.location && (
                <span className="text-sm text-surface-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {projectDetail.location}</span>
              )}
              <StatusBadge status={projectDetail.status} />
            </div>
          </div>
          <button onClick={() => openEdit(projectDetail)} className="btn-secondary"><Edit className="w-4 h-4" /> แก้ไข</button>
        </div>

        {/* Progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">ความคืบหน้า</span>
            <span className="text-sm font-bold">{projectDetail.progress}%</span>
          </div>
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${projectDetail.progress}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <div><p className="text-xs text-surface-500">งบประมาณ</p><p className="font-semibold">฿{Number(projectDetail.budget || 0).toLocaleString('th-TH')}</p></div>
            <div><p className="text-xs text-surface-500">เริ่มงาน</p><p className="font-semibold">{projectDetail.start_date ? new Date(projectDetail.start_date).toLocaleDateString('th-TH') : '-'}</p></div>
            <div><p className="text-xs text-surface-500">กำหนดเสร็จ</p><p className="font-semibold">{projectDetail.end_date ? new Date(projectDetail.end_date).toLocaleDateString('th-TH') : '-'}</p></div>
            <div><p className="text-xs text-surface-500">งบคงเหลือ</p><p className="font-semibold text-emerald-600">฿{Number(d?.budget_remaining || 0).toLocaleString('th-TH')}</p></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: 'ค่าใช้จ่าย', value: `฿${Number(d?.total_expenses || 0).toLocaleString('th-TH')}`, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
            { icon: Users, label: 'คนงาน', value: d?.counts?.workers || 0, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: Camera, label: 'Daily Logs', value: d?.counts?.daily_logs || 0, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
            { icon: BarChart3, label: 'Material Logs', value: d?.counts?.material_logs || 0, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
          ].map((s, i) => (
            <div key={i} className="card p-4">
              <div className={`w-9 h-9 rounded-lg ${s.color.split(' ').slice(1).join(' ')} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-surface-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Workers List */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> คนงานในโปรเจกต์ ({projectDetail.workers?.length || 0})</h3>
          {projectDetail.workers?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projectDetail.workers.map(w => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-400">{w.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{w.name}</p>
                    <p className="text-xs text-surface-500">{w.role || 'ทั่วไป'} - ฿{Number(w.daily_rate).toLocaleString()}/วัน</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-500 text-center py-4">ยังไม่มีคนงานในโปรเจกต์นี้</p>
          )}
        </div>

        {projectDetail.description && (
          <div className="card p-5">
            <h3 className="font-semibold mb-2">รายละเอียด</h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 whitespace-pre-wrap">{projectDetail.description}</p>
          </div>
        )}
      </div>
    )
  }

  // PROJECT LIST VIEW
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-surface-500">จัดการโปรเจกต์ก่อสร้าง</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> เพิ่มโปรเจกต์</button>
      </div>

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="ค้นหาโปรเจกต์..." />

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="ยังไม่มีโปรเจกต์" subtitle="กดปุ่มด้านบนเพื่อสร้างโปรเจกต์แรก" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <div key={project.id} className="card-hover p-5 animate-slide-up cursor-pointer" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => fetchProjectDetail(project.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      {project.location && <p className="text-sm text-surface-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {project.location}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(project)} className="btn-ghost p-1.5 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(project.id)} className="btn-ghost p-1.5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1"><span className="text-surface-500">Progress</span><span className="font-medium">{project.progress || 0}%</span></div>
                  <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${project.progress || 0}%` }} /></div>
                </div>
                <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
                  <StatusBadge status={project.status} />
                  <div className="flex items-center gap-3 text-xs text-surface-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {project.worker_count || 0}</span>
                    <span>฿{Number(project.total_expenses || 0).toLocaleString('th-TH')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProject ? 'แก้ไขโปรเจกต์' : 'สร้างโปรเจกต์ใหม่'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">ชื่อโปรเจกต์</label><input className="input" placeholder="เช่น บ้านคุณสมชาย" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">สถานที่</label><input className="input" placeholder="เช่น ถนนสุขุมวิท กรุงเทพ" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">สถานะ</label><select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="planning">Planning</option><option value="in_progress">In Progress</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <div><label className="label">งบประมาณ (฿)</label><input className="input" type="number" placeholder="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">วันเริ่มงาน</label><input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="label">กำหนดเสร็จ</label><input className="input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div><label className="label">ความคืบหน้า ({form.progress}%)</label><input type="range" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: parseInt(e.target.value) })} className="w-full accent-primary-600" /></div>
          <div><label className="label">รายละเอียด</label><textarea className="input h-20 resize-none" placeholder="รายละเอียดเพิ่มเติม..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingProject ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างโปรเจกต์')}</button>
        </form>
      </Modal>
    </div>
  )
}
