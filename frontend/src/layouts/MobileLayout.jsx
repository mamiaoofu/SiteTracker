import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import { Camera, Users, Package, LayoutDashboard, LogOut, FolderKanban } from 'lucide-react'

const navItems = [
  { to: '/foreman', icon: LayoutDashboard, label: 'Home' },
  { to: '/foreman/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/foreman/daily-log', icon: Camera, label: 'Photo' },
  { to: '/foreman/labor', icon: Users, label: 'Labor' },
  { to: '/foreman/material', icon: Package, label: 'Material' },
]

export default function MobileLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-surface-200/50 dark:border-surface-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm gradient-text">Site Tracker</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={handleLogout} className="btn-ghost p-2 rounded-lg text-red-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 bg-surface-50 dark:bg-surface-950">
        <div className="animate-fade-in p-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-surface-200/50 dark:border-surface-700/50">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/foreman'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-500 dark:text-surface-400'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
