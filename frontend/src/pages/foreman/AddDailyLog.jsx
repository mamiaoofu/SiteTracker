import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Camera, Upload, Check, Loader2, X, Plus, Image as ImageIcon } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

export default function AddDailyLog() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [notes, setNotes] = useState('')
  const [weather, setWeather] = useState('sunny')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const toast = useToast()

  useEffect(() => {
    api.get('/projects/').then(res => {
      const data = res.data.results || res.data
      setProjects(data)
      if (data.length > 0) setProjectId(data[0].id)
    })
  }, [])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    const newImages = [...images, ...files]
    const newPreviews = [...previews, ...files.map(f => URL.createObjectURL(f))]
    setImages(newImages)
    setPreviews(newPreviews)
  }

  const removeImage = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setImages(images.filter((_, i) => i !== idx))
    setPreviews(previews.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (images.length === 0 || !projectId) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('project', projectId)
      formData.append('notes', notes)
      formData.append('weather', weather)
      images.forEach(img => formData.append('images', img))

      await api.post('/daily-logs/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setImages([]); setPreviews([]); setNotes('')
      }, 2000)
    } catch { toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่') }
    finally { setLoading(false) }
  }

  const weatherOptions = [
    { value: 'sunny', emoji: '☀️', label: 'แดด' },
    { value: 'cloudy', emoji: '☁️', label: 'มืดครึ้ม' },
    { value: 'rainy', emoji: '🌧️', label: 'ฝนตก' },
    { value: 'stormy', emoji: '⛈️', label: 'พายุ' },
  ]

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-emerald-600">บันทึกสำเร็จ!</h2>
        <p className="text-sm text-surface-500 mt-1">Daily log ถูกบันทึกแล้ว</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📸 ถ่ายรูปหน้างาน</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">โปรเจกต์</label>
          <select className="select" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Weather */}
        <div>
          <label className="label">สภาพอากาศ</label>
          <div className="flex gap-2">
            {weatherOptions.map(w => (
              <button key={w.value} type="button" onClick={() => setWeather(w.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-sm transition-all ${weather === w.value ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'bg-surface-100 dark:bg-surface-800'}`}>
                <span className="text-lg">{w.emoji}</span>
                <span className="text-[10px]">{w.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-image upload */}
        <div>
          <label className="label">รูปถ่าย ({images.length} รูป)</label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {previews.map((src, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden aspect-square">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Add more button */}
              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                <Plus className="w-6 h-6 text-surface-400" />
                <span className="text-[10px] text-surface-500 mt-1">เพิ่มรูป</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          )}
          {previews.length === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl cursor-pointer hover:border-primary-500 transition-colors">
                <Camera className="w-8 h-8 text-surface-400 mb-1" />
                <span className="text-sm text-surface-500">ถ่ายรูป</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
              </label>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl cursor-pointer hover:border-primary-500 transition-colors">
                <ImageIcon className="w-8 h-8 text-surface-400 mb-1" />
                <span className="text-sm text-surface-500">เลือกจากแกลเลอรี</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          )}
        </div>

        <div>
          <label className="label">หมายเหตุ (ไม่บังคับ)</label>
          <textarea className="input h-20 resize-none" placeholder="เพิ่มรายละเอียด..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button type="submit" disabled={images.length === 0 || loading} className="btn-primary w-full btn-lg">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> บันทึก Daily Log ({images.length} รูป)</>}
        </button>
      </form>
    </div>
  )
}
