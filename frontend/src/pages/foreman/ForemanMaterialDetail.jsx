import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import {
  ArrowLeft, Package, MapPin, User, Calendar,
  CreditCard, Store, FileText, X
} from 'lucide-react'

export default function ForemanMaterialDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    api.get(`/material-logs/${id}/`)
      .then(res => setLog(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!log) return <p className="text-center py-12 text-surface-500">ไม่พบข้อมูล</p>

  const cats = log.categories || (log.category ? [log.category] : [])
  const paymentLabel = log.payment_type === 'cash' ? 'เงินสด' : log.payment_type === 'transfer' ? 'โอน' : log.payment_type === 'credit' ? 'เครดิต' : log.payment_type || '-'

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary-600 font-medium">
        <ArrowLeft className="w-4 h-4" /> กลับ
      </button>

      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Package className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{log.project_name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {cats.map((c, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xl font-black text-orange-600">฿{Number(log.amount).toLocaleString()}</p>
        </div>
      </div>

      {/* Details */}
      <div className="card p-4 space-y-3">
        {log.description && (
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-surface-500">รายละเอียด</p>
              <p className="text-sm">{log.description}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-surface-500">ประเภทการจ่าย</p>
            <p className="text-sm font-medium">{paymentLabel}</p>
          </div>
        </div>
        {log.supplier && (
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-surface-500">ร้านค้า / ผู้จำหน่าย</p>
              <p className="text-sm font-medium">{log.supplier}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-surface-500">วันที่</p>
            <p className="text-sm font-medium">
              {new Date(log.date || log.created_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
        </div>
        {log.created_by_name && (
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-surface-500">บันทึกโดย</p>
              <p className="text-sm font-medium">{log.created_by_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Images / Receipts */}
      {log.images?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">🧾 ใบเสร็จ / รูปภาพ ({log.images.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {log.images.map((img, idx) => (
              <div
                key={img.id}
                className="relative rounded-xl overflow-hidden aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(img.image)}
              >
                <img src={img.image} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-2xl w-full">
            <button className="absolute -top-10 right-0 text-white" onClick={() => setLightbox(null)}>
              <X className="w-6 h-6" />
            </button>
            <img src={lightbox} alt="Full size" className="w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}
