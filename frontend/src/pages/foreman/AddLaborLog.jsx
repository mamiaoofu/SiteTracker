import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Users, Check, Loader2, Plus, AlertTriangle, Edit2, X, Save } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

// savedWorkers shape: { [workerId]: { id, status, advance_amount } }
// editingWorkers shape: { [workerId]: { status, advance_amount } }  ← draft while editing

const STATUS_CONFIG = {
  present:  { label: 'มาทำงาน',  badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', icon: 'bg-emerald-100 dark:bg-emerald-900/30' },
  half_day: { label: 'ครึ่งวัน', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',   icon: 'bg-amber-100 dark:bg-amber-900/30' },
  absent:   { label: 'ขาด',      badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',           icon: 'bg-red-100 dark:bg-red-900/30' },
}

export default function AddLaborLog() {
  const [projects, setProjects] = useState([])
  const [workers, setWorkers] = useState([])
  const [projectId, setProjectId] = useState('')
  const [selectedWorkers, setSelectedWorkers] = useState([])
  const [savedWorkers, setSavedWorkers] = useState({})   // { workerId: { id, status, advance_amount } }
  const [editingWorkers, setEditingWorkers] = useState({}) // { workerId: { status, advance_amount } }
  const [saving, setSaving] = useState({})               // { workerId: true } — per-worker saving spinner
  const [workerCapacity, setWorkerCapacity] = useState({}) // { workerId: { usedSlots, blocked, mustHalfDay, projectNames } }
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [projectError, setProjectError] = useState(false)
  const toast = useToast()

  // Fetch projects once
  useEffect(() => {
    api.get('/projects/?is_active=true').then(res => {
      setProjects(res.data.results || res.data || [])
    })
  }, [])

  // Fetch workers (filtered to project history) and today's saved logs when project changes
  useEffect(() => {
    if (!projectId) {
      setWorkers([])
      setSelectedWorkers([])
      setSavedWorkers({})
      setEditingWorkers({})
      setWorkerCapacity({})
      return
    }
    setProjectError(false)
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      api.get('/workers/?is_active=true&page_size=100'),
      api.get(`/labor-logs/?project=${projectId}&date=${today}&page_size=200`),
      api.get(`/labor-logs/?project=${projectId}&page_size=500`),
      api.get(`/labor-logs/?date=${today}&page_size=500`),
    ]).then(([wRes, todayRes, histRes, allTodayRes]) => {
      const allWorkers = wRes.data.results || wRes.data || []

      // Determine which workers have ever logged for this project
      const histLogs = histRes.data.results || histRes.data || []
      const projectWorkerIds = new Set(histLogs.map(l => l.worker))

      // Show all workers, but sort project-history workers first
      const sortedWorkers = [...allWorkers].sort((a, b) => {
        const aInProject = projectWorkerIds.has(a.id) ? 0 : 1
        const bInProject = projectWorkerIds.has(b.id) ? 0 : 1
        return aInProject - bInProject || a.name.localeCompare(b.name, 'th')
      })

      setWorkers(sortedWorkers)
      setSelectedWorkers([])

      // Pre-mark workers who already have logs today
      const todayLogs = todayRes.data.results || todayRes.data || []
      // build map: { workerId: { id, status, advance_amount } }
      const savedMap = {}
      todayLogs.forEach(l => {
        savedMap[l.worker] = { id: l.id, status: l.status, advance_amount: l.advance_amount }
      })
      setSavedWorkers(savedMap)
      setEditingWorkers({})

      // Build cross-project capacity map (other projects only)
      // Rule: present=1 full day, half_day=0.5 day, max 1 day total
      const allTodayLogs = allTodayRes.data.results || allTodayRes.data || []
      const rawCap = {}
      allTodayLogs.forEach(log => {
        if (String(log.project) === String(projectId)) return // skip current project's own logs
        if (log.status === 'absent') return                   // absent uses no capacity
        if (!rawCap[log.worker]) rawCap[log.worker] = { slots: 0, projectNames: [] }
        if (log.status === 'present') {
          rawCap[log.worker].slots = 1
        } else if (log.status === 'half_day') {
          rawCap[log.worker].slots = Math.min(rawCap[log.worker].slots + 0.5, 1)
        }
        const name = log.project_name || `โครงการ ${log.project}`
        if (!rawCap[log.worker].projectNames.includes(name)) {
          rawCap[log.worker].projectNames.push(name)
        }
      })
      const capacityMap = {}
      Object.entries(rawCap).forEach(([wid, { slots, projectNames }]) => {
        capacityMap[Number(wid)] = {
          usedSlots: slots,
          blocked:     slots >= 1,        // full day elsewhere → cannot add to this project
          mustHalfDay: slots > 0 && slots < 1, // half-day elsewhere → must be half_day here
          projectNames,
        }
      })
      setWorkerCapacity(capacityMap)
    }).catch(() => {
      // Fallback: load all workers even if any of the labor-log requests fail
      api.get('/workers/?is_active=true&page_size=100').then(res => {
        setWorkers(res.data.results || res.data || [])
        setSelectedWorkers([])
        setSavedWorkers({})
        setEditingWorkers({})
        setWorkerCapacity({})
      })
    })
  }, [projectId])

  const toggleWorker = (worker) => {
    if (savedWorkers[worker.id]) return
    const cap = workerCapacity[worker.id]
    if (cap?.blocked) return
    const defaultStatus = cap?.mustHalfDay ? 'half_day' : 'present'
    setSelectedWorkers(prev => {
      const exists = prev.find(w => w.id === worker.id)
      if (exists) return prev.filter(w => w.id !== worker.id)
      return [...prev, { ...worker, status: defaultStatus, advance_amount: 0 }]
    })
  }

  const startEdit = (workerId) => {
    const s = savedWorkers[workerId]
    if (!s) return
    setEditingWorkers(prev => ({ ...prev, [workerId]: { status: s.status, advance_amount: s.advance_amount } }))
  }

  const cancelEdit = (workerId) => {
    setEditingWorkers(prev => { const n = { ...prev }; delete n[workerId]; return n })
  }

  const updateEdit = (workerId, field, value) => {
    setEditingWorkers(prev => ({ ...prev, [workerId]: { ...prev[workerId], [field]: value } }))
  }

  const saveEdit = async (worker) => {
    const draft = editingWorkers[worker.id]
    const saved = savedWorkers[worker.id]
    if (!draft || !saved?.id) return
    setSaving(prev => ({ ...prev, [worker.id]: true }))
    try {
      const res = await api.patch(`/labor-logs/${saved.id}/`, {
        status: draft.status,
        advance_amount: draft.advance_amount || 0,
      })
      setSavedWorkers(prev => ({
        ...prev,
        [worker.id]: { id: saved.id, status: res.data.status, advance_amount: res.data.advance_amount },
      }))
      cancelEdit(worker.id)
      toast.success(`แก้ไข ${worker.name} สำเร็จ`)
    } catch {
      toast.error('แก้ไขไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(prev => { const n = { ...prev }; delete n[worker.id]; return n })
    }
  }

  const updateWorker = (workerId, field, value) => {
    setSelectedWorkers(prev =>
      prev.map(w => w.id === workerId ? { ...w, [field]: value } : w)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!projectId) {
      setProjectError(true)
      return
    }
    if (selectedWorkers.length === 0) return
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const results = await Promise.allSettled(selectedWorkers.map(w =>
        api.post('/labor-logs/', {
          project: projectId,
          worker: w.id,
          date: today,
          status: w.status,
          advance_amount: w.advance_amount || 0,
        })
      ))

      const newSaved = { ...savedWorkers }
      const failedNames = []
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          const resData = r.value?.data || null
          const wid = selectedWorkers[idx].id
          newSaved[wid] = {
            id: resData?.id,
            status: resData?.status || selectedWorkers[idx].status || 'present',
            advance_amount: resData?.advance_amount ?? selectedWorkers[idx].advance_amount ?? 0,
          }
        } else {
          failedNames.push(selectedWorkers[idx].name)
        }
      })
      setSavedWorkers(newSaved)

      if (failedNames.length > 0) {
        toast.error(`บันทึกไม่สำเร็จ: ${failedNames.join(', ')} (อาจบันทึกซ้ำวันนี้แล้ว)`)
      }

      // Keep saved workers selected but move unsaved out
      setSelectedWorkers(prev => prev.filter(w => !newSaved[w.id]))

      if (failedNames.length === 0) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2500)
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">👷 บันทึกแรงงาน</h1>

      {/* Success toast */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">บันทึกแรงงานสำเร็จ!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project select */}
        <div>
          <label className="label">โปรเจกต์ *</label>
          <select
            className={`select ${projectError ? 'ring-2 ring-red-400' : ''}`}
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="">-- เลือกโปรเจกต์ --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {projectError && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> กรุณาเลือกโปรเจกต์ก่อน
            </p>
          )}
        </div>

        {/* No project selected hint */}
        {!projectId && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            กรุณาเลือกโปรเจกต์ก่อนเพื่อดูรายชื่อคนงาน
          </div>
        )}

        {/* Worker list */}
        {projectId && (
          <div>
            <label className="label">
              คนงานในโปรเจกต์ ({workers.length} คน)
              {workers.length > 0 && Object.keys(savedWorkers).length > 0 && (
                <span className="text-[11px] text-emerald-600 font-normal ml-1">
                  · บันทึกแล้ว {Object.keys(savedWorkers).length} คน
                </span>
              )}
            </label>
            <div className="space-y-2">
              {workers.map(worker => {
                const selected = selectedWorkers.find(w => w.id === worker.id)
                const savedData = savedWorkers[worker.id]   // { id, status, advance_amount } | undefined
                const saved = Boolean(savedData)
                const isEditing = Boolean(editingWorkers[worker.id])
                const draft = editingWorkers[worker.id]
                const isSaving = Boolean(saving[worker.id])
                const statusCfg = STATUS_CONFIG[savedData?.status] || STATUS_CONFIG.present
                const cap = workerCapacity[worker.id]           // capacity used in OTHER projects today
                const isBlocked   = !saved && Boolean(cap?.blocked)     // full day elsewhere → cannot add
                const mustHalfDay = !saved && Boolean(cap?.mustHalfDay) // half-day elsewhere → must be half_day

                return (
                  <div key={worker.id} className={`card p-3 transition-opacity ${(saved && !isEditing) || isBlocked ? 'opacity-60' : ''}`}>
                    {/* Top row: icon + name + badge + edit button */}
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <button
                        type="button"
                        onClick={() => !saved && !isBlocked && toggleWorker(worker)}
                        disabled={saved || isBlocked}
                        className="flex-shrink-0"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          saved
                            ? statusCfg.icon
                            : isBlocked
                            ? 'bg-surface-100 dark:bg-surface-800'
                            : selected
                            ? 'bg-primary-100 dark:bg-primary-900/30'
                            : 'bg-surface-100 dark:bg-surface-800'
                        }`}>
                          {saved ? (
                            <Check className={`w-5 h-5 ${
                              savedData?.status === 'absent' ? 'text-red-600' :
                              savedData?.status === 'half_day' ? 'text-amber-600' :
                              'text-emerald-600'
                            }`} />
                          ) : isBlocked ? (
                            <X className="w-5 h-5 text-surface-400" />
                          ) : selected ? (
                            <Check className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Plus className="w-5 h-5 text-surface-400" />
                          )}
                        </div>
                      </button>

                      {/* Name + badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{worker.name}</p>
                          {saved && !isEditing && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusCfg.badge}`}>
                              {statusCfg.label}
                            </span>
                          )}
                          {isBlocked && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-surface-100 dark:bg-surface-800 text-surface-500">
                              เต็มวัน
                            </span>
                          )}
                          {mustHalfDay && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                              ครึ่งวัน
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-500">
                          {worker.role || 'ทั่วไป'} · ฿{Number(worker.daily_rate).toLocaleString()}/วัน
                          {saved && !isEditing && savedData?.advance_amount > 0 && (
                            <span className="ml-1 text-amber-600">· ล่วงหน้า ฿{Number(savedData.advance_amount).toLocaleString()}</span>
                          )}
                        </p>
                        {(isBlocked || mustHalfDay) && cap?.projectNames?.length > 0 && (
                          <p className="text-[10px] text-surface-400 mt-0.5">
                            {isBlocked ? '⛔' : '⚠'} {cap.projectNames.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Edit / Cancel button for saved workers */}
                      {saved && (
                        isEditing ? (
                          <button
                            type="button"
                            onClick={() => cancelEdit(worker.id)}
                            className="flex-shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(worker.id)}
                            className="flex-shrink-0 p-1.5 rounded-lg text-primary-500 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>

                    {/* New-entry fields */}
                    {selected && !saved && (
                      <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 grid grid-cols-2 gap-3 animate-fade-in">
                        <div>
                          <label className="text-xs text-surface-500 mb-1 block">สถานะ</label>
                          <select
                            className="select text-sm py-1.5"
                            value={selected.status}
                            onChange={e => updateWorker(worker.id, 'status', e.target.value)}
                          >
                            {!mustHalfDay && <option value="present">มาทำงาน</option>}
                            <option value="half_day">ครึ่งวัน</option>
                            <option value="absent">ขาด</option>
                          </select>
                          {mustHalfDay && (
                            <p className="text-[10px] text-amber-600 mt-1">เพิ่มได้เฉพาะครึ่งวันเท่านั้น</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-surface-500 mb-1 block">เงินล่วงหน้า</label>
                          <input
                            type="number"
                            className="input text-sm py-1.5"
                            placeholder="0"
                            value={selected.advance_amount || ''}
                            onChange={e => updateWorker(worker.id, 'advance_amount', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Edit-mode fields for already-saved workers */}
                    {isEditing && draft && (
                      <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-surface-500 mb-1 block">สถานะ</label>
                            <select
                              className="select text-sm py-1.5"
                              value={draft.status}
                              onChange={e => updateEdit(worker.id, 'status', e.target.value)}
                            >
                              <option value="present">มาทำงาน</option>
                              <option value="half_day">ครึ่งวัน</option>
                              <option value="absent">ขาด</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-surface-500 mb-1 block">เงินล่วงหน้า</label>
                            <input
                              type="number"
                              className="input text-sm py-1.5"
                              placeholder="0"
                              value={draft.advance_amount || ''}
                              onChange={e => updateEdit(worker.id, 'advance_amount', e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveEdit(worker)}
                          disabled={isSaving}
                          className="btn-primary w-full text-sm py-2 rounded-xl flex items-center justify-center gap-2"
                        >
                          {isSaving
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><Save className="w-4 h-4" /> บันทึกการแก้ไข</>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {workers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-surface-500">ยังไม่มีคนงานในโปรเจกต์นี้</p>
                  <p className="text-xs text-surface-400 mt-1">ยังไม่มีประวัติการบันทึกแรงงานในโปรเจกต์นี้</p>
                </div>
              )}
            </div>
          </div>
        )}

        {projectId && (
          <button
            type="submit"
            disabled={selectedWorkers.length === 0 || loading}
            className="btn-primary w-full btn-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Users className="w-5 h-5" />
                บันทึกแรงงาน ({selectedWorkers.length} คน)
              </>
            )}
          </button>
        )}
      </form>
    </div>
  )
}
