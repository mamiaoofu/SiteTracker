import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import ProgressUpdateModal from '../../components/ProgressUpdateModal'
import { useToast } from '../../contexts/ToastContext'
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Users, Camera, Package,
  Briefcase, TrendingUp, Wrench, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Plus, Trash2, Copy, X, Loader2
} from 'lucide-react'



export default function ForemanProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [dailyLogs, setDailyLogs] = useState([])
  const [progressHistory, setProgressHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showPhaseManager, setShowPhaseManager] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [addingPhase, setAddingPhase] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const toast = useToast()

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, dRes, phRes] = await Promise.all([
        api.get(`/projects/${id}/`),
        api.get(`/daily-logs/?project=${id}&page_size=10`),
        api.get(`/progress-updates/?project=${id}&ordering=-created_at`),
      ])
      setProject(pRes.data)
      setDailyLogs(dRes.data.results || dRes.data || [])
      setProgressHistory(phRes.data.results || phRes.data || [])
    } catch {} finally { setLoading(false) }
  }

  const addPhase = async () => {
    if (!newPhaseName.trim() || !project) return
    setAddingPhase(true)
    try {
      const nextOrder = (project.phases?.length || 0) + 1
      await api.post('/project-phases/', { project: project.id, name: newPhaseName.trim(), order: nextOrder })
      setNewPhaseName('')
      await fetchAll()
    } catch (err) {
      const detail = err.response?.data
      toast.error(detail?.name?.[0] || detail?.non_field_errors?.[0] || 'เกิดข้อผิดพลาด')
    } finally { setAddingPhase(false) }
  }

  const deletePhase = async (phaseId) => {
    if (!confirm('ต้องการลบเฟสนี้?')) return
    try {
      await api.delete(`/project-phases/${phaseId}/`)
      await fetchAll()
    } catch { toast.error('ไม่สามารถลบได้') }
  }

  const applyTemplates = async () => {
    setApplyingTemplate(true)
    try {
      await api.post('/project-phases/apply_template/', { project: project.id })
      await fetchAll()
    } catch { toast.error('เกิดข้อผิดพลาด') }
    finally { setApplyingTemplate(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!project) return <p className="text-center py-12 text-surface-500">ไม่พบข้อมูล</p>

  const statusColors = {
    in_progress: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  }

  const progressColor = project.progress < 30 ? 'bg-gradient-to-r from-red-500 to-orange-500'
    : project.progress < 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
    : 'bg-gradient-to-r from-emerald-500 to-green-500'

  const currentPhase = project.current_phase
    ? { label: project.current_phase.name }
    : { label: 'ยังไม่ระบุ' }
  const historyToShow = showAllHistory ? progressHistory : progressHistory.slice(0, 5)

  // Calculate overall from phases (frontend display — backend is source of truth)
  const phases = project.phases || []
  const overallProgress = phases.length > 0
    ? Math.round(phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length)
    : project.progress

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary-600 font-medium">
        <ArrowLeft className="w-4 h-4" /> กลับ
      </button>

      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold">{project.name}</h1>
              {project.status && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[project.status] || ''}`}>
                  {project.status === 'in_progress' ? 'กำลังดำเนินการ' : project.status}
                </span>
              )}
            </div>
            {project.location && (
              <p className="text-sm text-surface-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{project.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Worker warning */}
      {!project.labor_log_count && (
        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>ยังไม่มีการบันทึกแรงงานในโปรเจกต์นี้ — กรุณาไปที่ <strong>บันทึกแรงงาน</strong> ก่อนเพื่อเพิ่มข้อมูลคนงาน</span>
        </div>
      )}

      {/* === Progress Overview Section === */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" /> ความคืบหน้า
          </h2>
          {project.labor_log_count > 0 ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" /> อัปเดต
            </button>
          ) : (
            <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-xl">
              ต้องบันทึกแรงงานก่อน
            </span>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-surface-500">ภาพรวม</span>
            <span className="text-2xl font-black gradient-text">{overallProgress}%</span>
          </div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          {phases.length > 0 && (
            <p className="text-[10px] text-surface-400 mt-1">
              คำนวณจากค่าเฉลี่ยของ {phases.length} เฟส
            </p>
          )}
        </div>

        {/* Per-Phase Progress Bars */}
        {phases.length > 0 && (
          <div className="space-y-3">
            {phases.map(p => {
              const pColor = p.progress < 30 ? 'bg-red-500'
                : p.progress < 70 ? 'bg-amber-500'
                : p.progress >= 100 ? 'bg-emerald-500'
                : 'bg-blue-500'
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className={`text-xs font-bold ${
                      p.progress >= 100 ? 'text-emerald-600' : p.progress > 0 ? 'text-primary-600' : 'text-surface-400'
                    }`}>{p.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pColor}`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {phases.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            ยังไม่มีเฟสงาน — กดจัดการเฟสเพื่อเพิ่ม
          </div>
        )}

        {/* Current Phase + Phase Manager toggle */}
        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">เฟสงานปัจจุบัน</p>
              <p className="font-bold">{currentPhase.label}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPhaseManager(!showPhaseManager)}
            className="text-xs text-primary-600 font-medium"
          >
            {showPhaseManager ? 'ปิด' : 'จัดการเฟส'}
          </button>
        </div>

        {/* Phase Manager Inline */}
        {showPhaseManager && (
          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Wrench className="w-4 h-4" /> เฟสงานทั้งหมด ({project.phases?.length || 0})
              </h4>
              <button
                onClick={applyTemplates}
                disabled={applyingTemplate}
                className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700"
              >
                {applyingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                ใช้ Template
              </button>
            </div>

            {/* List of phases */}
            {project.phases?.length > 0 && (
              <div className="space-y-1.5">
                {project.phases.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between bg-white dark:bg-surface-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-400 w-5">{idx + 1}.</span>
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.created_by_name && (
                        <span className="text-[10px] text-surface-400">โดย {p.created_by_name}</span>
                      )}
                    </div>
                    <button onClick={() => deletePhase(p.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new phase */}
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="ชื่อเฟสใหม่ เช่น เทฐานราก"
                value={newPhaseName}
                onChange={e => setNewPhaseName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhase())}
              />
              <button
                onClick={addPhase}
                disabled={addingPhase || !newPhaseName.trim()}
                className="btn-primary text-sm px-3 py-2 rounded-xl flex items-center gap-1"
              >
                {addingPhase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                เพิ่ม
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        {project.budget > 0 && (
          <div className="card p-3 text-center">
            <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] text-surface-500">งบประมาณ</p>
            <p className="font-bold text-sm">฿{Number(project.budget).toLocaleString()}</p>
          </div>
        )}
        {project.start_date && (
          <div className="card p-3 text-center">
            <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-[10px] text-surface-500">เริ่มงาน</p>
            <p className="font-bold text-sm">{new Date(project.start_date).toLocaleDateString('th-TH')}</p>
          </div>
        )}
        {project.worker_count !== undefined && (
          <div className="card p-3 text-center">
            <Users className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-[10px] text-surface-500">คนงาน (มา)</p>
            <p className="font-bold text-sm">{project.worker_count} คน</p>
          </div>
        )}
        {project.total_expenses !== undefined && (
          <div className="card p-3 text-center">
            <Package className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-[10px] text-surface-500">ค่าใช้จ่าย</p>
            <p className="font-bold text-sm">฿{Number(project.total_expenses || 0).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* === Progress History Timeline === */}
      {progressHistory.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> ประวัติอัปเดต ({progressHistory.length})
          </h3>
          <div className="space-y-0">
            {historyToShow.map((update, idx) => {
              const phaseInfo = { label: update.phase_name || 'ไม่ระบุ' }
              return (
                <div key={update.id} className="relative flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? 'bg-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30' : 'bg-surface-300 dark:bg-surface-600'
                    }`}>
                      {update.progress_percentage}%
                    </div>
                    {idx < historyToShow.length - 1 && (
                      <div className="w-0.5 flex-1 bg-surface-200 dark:bg-surface-700 min-h-[20px]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 pb-4 ${idx === 0 ? '' : 'opacity-75'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{phaseInfo.label}</span>
                      <span className="text-xs text-primary-600 font-bold">{update.progress_percentage}%</span>
                      <span className="text-[10px] text-surface-400">
                        {new Date(update.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric', month: 'short', year: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">
                      {update.work_description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-surface-400">
                      {update.worker_count > 0 && (
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {update.worker_count} คน</span>
                      )}
                      {update.created_by_name && (
                        <span>โดย {update.created_by_name}</span>
                      )}
                    </div>
                    {update.issues && (
                      <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs p-2 rounded-lg flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {update.issues}
                      </div>
                    )}
                    {update.images?.length > 0 && (
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        {update.images.map(img => (
                          <div key={img.id} className="rounded-lg overflow-hidden aspect-square">
                            <img src={img.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {progressHistory.length > 5 && (
            <button
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="w-full text-sm text-primary-600 font-medium flex items-center justify-center gap-1 pt-2 border-t border-surface-100 dark:border-surface-800"
            >
              {showAllHistory ? <><ChevronUp className="w-4 h-4" /> ย่อ</> : <><ChevronDown className="w-4 h-4" /> ดูทั้งหมด ({progressHistory.length})</>}
            </button>
          )}
        </div>
      )}

      {/* Workers */}
      {project.workers?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> คนงาน ({project.workers.length})</h3>
          <div className="space-y-2">
            {project.workers.map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-surface-500 capitalize">{w.role || 'ทั่วไป'}</p>
                </div>
                <span className="text-xs font-semibold">฿{w.daily_rate}/วัน</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Daily Logs Gallery */}
      {dailyLogs.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> รูปหน้างานล่าสุด</h3>
          <div className="grid grid-cols-2 gap-2">
            {dailyLogs.map(log => {
              const imgSrc = log.images?.[0]?.image || log.image
              return imgSrc ? (
                <div key={log.id} className="relative rounded-xl overflow-hidden aspect-video">
                  <img src={imgSrc} alt="Daily log" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-[10px]">{new Date(log.date || log.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {project.description && (
        <div className="card p-4">
          <h3 className="font-semibold mb-2">รายละเอียด</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">{project.description}</p>
        </div>
      )}

      {/* Progress Update Modal */}
      <ProgressUpdateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        project={project}
        onSuccess={fetchAll}
      />
    </div>
  )
}
