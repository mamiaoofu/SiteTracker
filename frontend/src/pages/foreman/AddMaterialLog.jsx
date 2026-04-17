import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Package, Upload, Check, Loader2, Camera, X, Plus, Image as ImageIcon } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

const ALL_CATEGORIES = ['ปูน', 'เหล็ก', 'ไม้', 'สี', 'ทราย', 'หิน', 'ท่อ', 'สายไฟ', 'กระเบื้อง', 'อื่นๆ']

export default function AddMaterialLog() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [supplier, setSupplier] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
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

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setImages(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const removeImage = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setImages(images.filter((_, i) => i !== idx))
    setPreviews(previews.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!projectId || selectedCategories.length === 0 || !amount) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('project', projectId)
      formData.append('categories', JSON.stringify(selectedCategories))
      formData.append('description', description)
      formData.append('amount', amount)
      formData.append('supplier', supplier)
      formData.append('payment_type', paymentType)
      images.forEach(img => formData.append('images', img))

      await api.post('/material-logs/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setSelectedCategories([])
        setDescription(''); setAmount(''); setSupplier('')
        setImages([]); setPreviews([])
      }, 2000)
    } catch { toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-emerald-600">บันทึกสำเร็จ!</h2>
        <p className="text-sm text-surface-500 mt-1">บันทึกวัสดุเรียบร้อยแล้ว</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">🧾 บันทึกวัสดุ</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">โปรเจกต์</label>
          <select className="select" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Multi-select categories */}
        <div>
          <label className="label">ประเภทวัสดุ (เลือกได้หลายรายการ) — {selectedCategories.length} รายการ</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategories.includes(cat)
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}>
                {selectedCategories.includes(cat) && <span className="mr-1">✓</span>}
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">จำนวนเงิน (บาท)</label>
          <input type="number" className="input text-lg font-semibold" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>

        <div>
          <label className="label">ร้านค้า/ผู้จำหน่าย</label>
          <input type="text" className="input" placeholder="ชื่อร้านค้า..." value={supplier} onChange={e => setSupplier(e.target.value)} />
        </div>

        <div>
          <label className="label">ช่องทางจ่าย</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'cash', label: '💵 เงินสด' },
              { value: 'transfer', label: '🏦 โอน' },
              { value: 'credit', label: '💳 เครดิต' },
            ].map(pt => (
              <button key={pt.value} type="button" onClick={() => setPaymentType(pt.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${paymentType === pt.value ? 'bg-primary-600 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">รายละเอียด (ไม่บังคับ)</label>
          <input type="text" className="input" placeholder="เช่น ปูน TPI 20 ถุง" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Multi-image receipt upload */}
        <div>
          <label className="label">รูปใบเสร็จ ({images.length} รูป)</label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {previews.map((src, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden aspect-square">
                  <img src={src} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                <Plus className="w-6 h-6 text-surface-400" />
                <span className="text-[10px] text-surface-500">เพิ่มรูป</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          )}
          {previews.length === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center h-16 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl cursor-pointer hover:border-primary-500 transition-colors gap-2">
                <Camera className="w-5 h-5 text-surface-400" />
                <span className="text-sm text-surface-500">ถ่ายรูป</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
              </label>
              <label className="flex items-center justify-center h-16 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl cursor-pointer hover:border-primary-500 transition-colors gap-2">
                <ImageIcon className="w-5 h-5 text-surface-400" />
                <span className="text-sm text-surface-500">เลือกรูป</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          )}
        </div>

        <button type="submit" disabled={selectedCategories.length === 0 || !amount || loading} className="btn-primary w-full btn-lg">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Package className="w-5 h-5" /> บันทึกวัสดุ</>}
        </button>
      </form>
    </div>
  )
}
