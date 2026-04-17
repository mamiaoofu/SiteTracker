import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Settings, Plus, Trash2, GripVertical, Loader2, Save } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

export default function PhaseTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => { fetchTemplates() }, [])

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/phase-templates/?ordering=order')
      setTemplates(res.data.results || res.data || [])
    } catch {} finally { setLoading(false) }
  }

  const addTemplate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const nextOrder = templates.length + 1
      await api.post('/phase-templates/', { name: newName.trim(), order: nextOrder })
      setNewName('')
      await fetchTemplates()
    } catch (err) {
      const detail = err.response?.data
      toast.error(detail?.name?.[0] || 'เกิดข้อผิดพลาด')
    } finally { setSaving(false) }
  }

  const deleteTemplate = async (id) => {
    if (!confirm('ต้องการลบ Template นี้?')) return
    try {
      await api.delete(`/phase-templates/${id}/`)
      await fetchTemplates()
    } catch { toast.error('ไม่สามารถลบได้') }
  }

  const updateOrder = async (id, newOrder) => {
    try {
      await api.patch(`/phase-templates/${id}/`, { order: newOrder })
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-600" /> Phase Templates
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            กำหนดเฟสงานมาตรฐานที่ใช้เป็นต้นแบบสำหรับทุกโปรเจกต์ — Foreman สามารถนำ Template ไปใช้กับโปรเจกต์ของตนได้
          </p>
        </div>
      </div>

      {/* Add new template */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">เพิ่ม Template ใหม่</h3>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="ชื่อเฟส เช่น เตรียมพื้นที่, เทฐานราก, โครงสร้าง..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTemplate())}
          />
          <button
            onClick={addTemplate}
            disabled={saving || !newName.trim()}
            className="btn-primary px-4 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            เพิ่ม
          </button>
        </div>
      </div>

      {/* Templates list */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">รายการ Template ({templates.length})</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <p className="text-center text-surface-500 py-8">ยังไม่มี Template — เพิ่มด้านบน</p>
        ) : (
          <div className="space-y-2">
            {templates.map((tmpl, idx) => (
              <div key={tmpl.id} className="flex items-center gap-3 bg-surface-50 dark:bg-surface-800 rounded-xl px-4 py-3">
                <GripVertical className="w-4 h-4 text-surface-400 flex-shrink-0" />
                <span className="text-sm text-surface-400 w-6">{idx + 1}.</span>
                <span className="flex-1 font-medium">{tmpl.name}</span>
                <input
                  type="number"
                  min="0"
                  value={tmpl.order}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0
                    setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, order: val } : t))
                  }}
                  onBlur={e => updateOrder(tmpl.id, parseInt(e.target.value) || 0)}
                  className="input w-16 text-center text-sm"
                  title="ลำดับ"
                />
                <button onClick={() => deleteTemplate(tmpl.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">วิธีใช้งาน</h4>
        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Template คือชุดเฟสงานมาตรฐานขององค์กร</li>
          <li>Foreman สามารถกด "ใช้ Template" ในหน้าโปรเจกต์เพื่อคัดลอกเฟสทั้งหมดไปใช้</li>
          <li>Foreman ยังสามารถเพิ่มเฟสเฉพาะโปรเจกต์ได้เอง</li>
          <li>เฟสที่ชื่อซ้ำกับที่มีอยู่แล้วในโปรเจกต์จะถูกข้ามโดยอัตโนมัติ</li>
        </ul>
      </div>
    </div>
  )
}
