import { useState, useEffect } from 'react'
import api from '../api/client'
import {
  X, Camera, Plus, Upload, Loader2, Check,
  AlertTriangle, TrendingUp, Users, Wrench, Image as ImageIcon
} from 'lucide-react'

export default function ProgressUpdateModal({ isOpen, onClose, project, onSuccess }) {
  const [phaseId, setPhaseId] = useState(null)
  const [phases, setPhases] = useState([])
  const [progress, setProgress] = useState(0)
  const [workDescription, setWorkDescription] = useState('')
  const [workerCount, setWorkerCount] = useState(0)
  const [issues, setIssues] = useState('')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && project?.id) {
      api.get(`/project-phases/?project=${project.id}`).then(res => {
        const data = res.data.results || res.data || []
        setPhases(data)
        // Pick current phase or first phase
        const initialPhase = data.find(p => p.id === project.current_phase?.id) || data[0]
        if (initialPhase) {
          setPhaseId(initialPhase.id)
          setProgress(initialPhase.progress || 0)
        }
      }).catch(() => {})
      // Default to same as today's present workers; clamp to max
      const maxWorkers = project.worker_count || 0
      setWorkerCount(maxWorkers)
      setWorkDescription('')
      setIssues('')
      setImages([])
      setPreviews([])
      setError('')
      setSuccess(false)
    }
  }, [isOpen, project?.id])

  // When user switches phase, update slider to that phase's current progress
  const selectPhase = (id) => {
    setPhaseId(id)
    const phase = phases.find(p => p.id === id)
    setProgress(phase?.progress || 0)
  }

  if (!isOpen) return null

  const selectedPhase = phases.find(p => p.id === phaseId)
  const minProgress = selectedPhase?.progress || 0

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setImages(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const removeImage = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setImages(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!workDescription.trim()) {
      setError('กรุณากรอกรายละเอียดงานวันนี้')
      return
    }
    if (!phaseId) {
      setError('กรุณาเลือกเฟสงาน')
      return
    }
    if (progress <= minProgress) {
      setError(`กรุณาเลื่อนความคืบหน้าเฟสให้มากกว่า ${minProgress}%`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('project', project.id)
      formData.append('progress_percentage', progress)
      if (phaseId) formData.append('phase', phaseId)
      formData.append('work_description', workDescription)
      formData.append('worker_count', workerCount)
      formData.append('issues', issues)
      images.forEach(img => formData.append('images', img))

      await api.post('/progress-updates/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      const detail = err.response?.data
      if (detail?.progress_percentage) {
        setError(Array.isArray(detail.progress_percentage) ? detail.progress_percentage[0] : detail.progress_percentage)
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative card p-8 flex flex-col items-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-emerald-600">อัปเดตสำเร็จ!</h2>
          <p className="text-sm text-surface-500 mt-1">ความคืบหน้าถูกบันทึกแล้ว</p>
        </div>
      </div>
    )
  }

  const progressColor = progress < 30 ? 'from-red-500 to-orange-500'
    : progress < 70 ? 'from-amber-500 to-yellow-500'
    : 'from-emerald-500 to-green-500'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg card p-0 animate-scale-in max-h-[95vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-bold">อัปเดตความคืบหน้า</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-5">
          {/* Phase Selector — pick which phase to update */}
          {phases.length > 0 && (
            <div>
              <label className="label flex items-center gap-2">
                <Wrench className="w-4 h-4" /> เลือกเฟสที่ต้องการอัปเดต
              </label>
              <div className="space-y-2">
                {phases.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPhase(p.id)}
                    className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left transition-all ${
                      phaseId === p.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500'
                        : 'bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${phaseId === p.id ? 'font-semibold text-primary-700 dark:text-primary-400' : ''}`}>{p.name}</span>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${
                      p.progress >= 100 ? 'text-emerald-600' : p.progress > 0 ? 'text-primary-600' : 'text-surface-400'
                    }`}>{p.progress}%</span>
                    <div className="w-16 h-1.5 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          p.progress >= 100 ? 'bg-emerald-500' : p.progress > 0 ? 'bg-primary-500' : ''
                        }`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phases.length === 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              ยังไม่มีเฟสงาน — เพิ่มเฟสในหน้าโปรเจกต์ หรือใช้ Template จาก Admin
            </div>
          )}

          {/* Progress Slider for selected phase */}
          {selectedPhase && (
            <div>
              <label className="label flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> ความคืบหน้า: {selectedPhase.name}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="range"
                    min={minProgress}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary-600"
                    style={{
                      background: `linear-gradient(to right, var(--color-primary-500) 0%, var(--color-primary-500) ${((progress - minProgress) / (100 - minProgress || 1)) * 100}%, var(--color-surface-300) ${((progress - minProgress) / (100 - minProgress || 1)) * 100}%, var(--color-surface-300) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-surface-500 mt-1">
                    <span>{minProgress}%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${progressColor} flex items-center justify-center shadow-lg`}>
                  <span className="text-white text-xl font-black">{progress}%</span>
                </div>
              </div>
              {minProgress > 0 && (
                <p className="text-[10px] text-surface-400 mt-1">
                  * ค่าขั้นต่ำ {minProgress}% (ไม่สามารถลดลง)
                </p>
              )}
              {progress <= minProgress && (
                <p className="text-[10px] text-amber-500 font-medium mt-1">
                  ⚠ กรุณาเลื่อนความคืบหน้าให้เพิ่มขึ้น
                </p>
              )}
            </div>
          )}

          {/* Work Description */}
          <div>
            <label className="label">รายละเอียดงานวันนี้ *</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="เช่น เทเสาเข็ม 8 ต้น, ติดตั้งเหล็กเสริม..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              required
            />
          </div>

          {/* Worker Count */}
          <div>
            <label className="label flex items-center gap-2">
              <Users className="w-4 h-4" /> จำนวนคนงานวันนี้
              {project?.worker_count > 0 && (
                <span className="text-[11px] text-surface-400 font-normal">(มาทำงาน {project.worker_count} คน)</span>
              )}
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setWorkerCount(Math.max(0, workerCount - 1))}
                className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-lg font-bold hover:bg-surface-200 transition-colors">
                −
              </button>
              <input
                type="number"
                min="0"
                max={project?.worker_count || undefined}
                value={workerCount}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0)
                  const max = project?.worker_count
                  setWorkerCount(max ? Math.min(val, max) : val)
                }}
                className="input w-20 text-center text-lg font-bold"
              />
              <button
                type="button"
                onClick={() => setWorkerCount(Math.min(workerCount + 1, project?.worker_count ?? Infinity))}
                disabled={project?.worker_count != null && workerCount >= project.worker_count}
                className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-lg font-bold hover:bg-surface-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                +
              </button>
              <span className="text-sm text-surface-500">คน</span>
            </div>
            {project?.worker_count != null && workerCount > project.worker_count && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> เกินจำนวนคนงานที่มาวันนี้ ({project.worker_count} คน)
              </p>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="label flex items-center gap-2">
              <Camera className="w-4 h-4" /> รูปถ่ายหน้างาน ({images.length} รูป)
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-square">
                    <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                  <Camera className="w-5 h-5 text-surface-400" />
                  <span className="text-[10px] text-surface-500 mt-1">ถ่ายเพิ่ม</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                </label>
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                  <Plus className="w-5 h-5 text-surface-400" />
                  <span className="text-[10px] text-surface-500 mt-1">เลือกรูป</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            )}
            {previews.length === 0 && (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl cursor-pointer hover:border-primary-500 transition-colors">
                  <Camera className="w-7 h-7 text-surface-400 mb-1" />
                  <span className="text-xs text-surface-500">ถ่ายรูป</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                </label>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl cursor-pointer hover:border-primary-500 transition-colors">
                  <ImageIcon className="w-7 h-7 text-surface-400 mb-1" />
                  <span className="text-xs text-surface-500">เลือกจากแกลเลอรี</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Issues */}
          <div>
            <label className="label flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> ปัญหาที่พบ (ไม่บังคับ)
            </label>
            <textarea
              className="input h-16 resize-none"
              placeholder="เช่น ฝนตกหนัก ทำให้งานล่าช้า..."
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !workDescription.trim() || !phaseId || progress <= minProgress}
            className="btn-primary w-full btn-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                บันทึก {selectedPhase?.name || 'ความคืบหน้า'} ({progress}%)
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
