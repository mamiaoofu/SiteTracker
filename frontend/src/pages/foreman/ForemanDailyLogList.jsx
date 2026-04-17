import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { Camera, Search, ChevronRight, Plus } from 'lucide-react'

export default function ForemanDailyLogList() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [search])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/daily-logs/', { params: { search, page_size: 50 } })
      setLogs(res.data.results || res.data || [])
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📸 Daily Logs</h1>
        <button onClick={() => navigate('/foreman/daily-log/add')} className="btn-primary text-sm"><Plus className="w-4 h-4" /> เพิ่ม</button>
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
            const imgSrc = log.images?.[0]?.image || log.image
            return (
              <div key={log.id} className="card p-3 flex items-center gap-3">
                {imgSrc ? (
                  <img src={imgSrc} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-surface-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{log.project_name}</p>
                  <p className="text-xs text-surface-500">{new Date(log.date || log.created_at).toLocaleDateString('th-TH')}</p>
                  {log.notes && <p className="text-xs text-surface-400 truncate mt-0.5">{log.notes}</p>}
                  {log.images?.length > 1 && <span className="text-[10px] text-primary-500 font-medium">{log.images.length} รูป</span>}
                </div>
                {log.weather && <span className="text-lg">{log.weather === 'sunny' ? '☀️' : log.weather === 'cloudy' ? '☁️' : log.weather === 'rainy' ? '🌧️' : '⛈️'}</span>}
              </div>
            )
          })}
          {logs.length === 0 && <p className="text-center text-surface-500 py-12">ไม่มี Daily Log</p>}
        </div>
      )}
    </div>
  )
}
