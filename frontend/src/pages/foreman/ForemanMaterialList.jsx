import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { Package, Search, Plus } from 'lucide-react'

export default function ForemanMaterialList() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [search])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/material-logs/', { params: { search, page_size: 50 } })
      setLogs(res.data.results || res.data || [])
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🧾 Material Logs</h1>
        <button onClick={() => navigate('/foreman/material/add')} className="btn-primary text-sm"><Plus className="w-4 h-4" /> เพิ่ม</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input className="input pl-10" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => {
            const cats = log.categories || (log.category ? [log.category] : [])
            const imgSrc = log.images?.[0]?.image || log.image
            return (
              <div key={log.id} className="card p-3 cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all" onClick={() => navigate(`/foreman/material/${log.id}`)}>
                <div className="flex items-start gap-3">
                  {imgSrc ? (
                    <img src={imgSrc} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-orange-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{log.project_name}</p>
                      <p className="font-bold text-sm text-orange-600">฿{Number(log.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cats.map((c, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">{c}</span>)}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-surface-500">{new Date(log.date || log.created_at).toLocaleDateString('th-TH')}</p>
                      {log.supplier && <p className="text-xs text-surface-400">{log.supplier}</p>}
                    </div>
                    {log.images?.length > 1 && <span className="text-[10px] text-primary-500 font-medium">{log.images.length} ใบเสร็จ</span>}
                  </div>
                </div>
              </div>
            )
          })}
          {logs.length === 0 && <p className="text-center text-surface-500 py-12">ไม่มี Material Log</p>}
        </div>
      )}
    </div>
  )
}
