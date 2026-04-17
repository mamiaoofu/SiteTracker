import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { Briefcase, MapPin, ArrowRight, Search } from 'lucide-react'

export default function ForemanProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects() }, [search])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await api.get('/projects/', { params: { search, page_size: 50 } })
      setProjects(res.data.results || res.data || [])
    } catch {} finally { setLoading(false) }
  }

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📁 โปรเจกต์ทั้งหมด</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input className="input pl-10" placeholder="ค้นหาโปรเจกต์..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <button key={p.id} onClick={() => navigate(`/foreman/projects/${p.id}`)}
              className="w-full card p-4 text-left hover:shadow-md transition-all active:scale-[0.98]">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{p.name}</p>
                    {p.status && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status] || statusColors.active}`}>{p.status}</span>}
                  </div>
                  {p.location && <p className="text-xs text-surface-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</p>}
                  {p.progress !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold">{p.progress}%</span>
                    </div>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
          {projects.length === 0 && <p className="text-center text-surface-500 py-12">ไม่พบโปรเจกต์</p>}
        </div>
      )}
    </div>
  )
}
