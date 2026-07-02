import { useLocation } from 'react-router-dom'
import { HiMenuAlt2 } from 'react-icons/hi'
import { MdDarkMode, MdLightMode, MdNotifications } from 'react-icons/md'
import { TbPackage } from 'react-icons/tb'
import { useApp } from '../context/AppContext'

const BREADCRUMBS = {
  '/':        [{ label: 'Dashboard' }],
  '/upload':  [{ label: 'Dashboard' }, { label: 'Upload Files' }],
  '/history': [{ label: 'Dashboard' }, { label: 'Upload History' }],
}

export default function Header({ onMenuClick }) {
  const { darkMode, toggleDark, uploadHistory } = useApp()
  const location = useLocation()
  const crumbs   = BREADCRUMBS[location.pathname] ?? BREADCRUMBS['/']
  const unread   = uploadHistory.filter((r) => r.status === 'success').length

  return (
    <header
      className="sticky top-0 z-30 shrink-0 h-14
                 border-b border-slate-200/80 dark:border-dark-border
                 px-4 lg:px-6 flex items-center justify-between gap-4"
      style={{ background: 'rgba(66, 71, 87, 1)', backdropFilter: 'blur(12px)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700
                     transition lg:hidden shrink-0"
          aria-label="Open navigation">
          <HiMenuAlt2 size={20} />
        </button>

        {/* Mobile brand */}
        <div className="flex items-center gap-2 lg:hidden shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <TbPackage className="text-white" size={15} />
          </div>
          <span className="font-bold text-secondary dark:text-white text-sm">Inventory AI</span>
        </div>

        {/* Breadcrumb — desktop */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
              <span className={
                i === crumbs.length - 1
                  ? 'font-semibold text-secondary dark:text-white truncate'
                  : 'text-slate-400 dark:text-slate-500'
              }>
                {c.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Notification */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100
                     dark:hover:bg-slate-700 hover:text-slate-600 transition"
          aria-label="Notifications"
        >
          <MdNotifications size={20} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600
                             border-2 border-white dark:border-dark-card" />
          )}
        </button>

        {/* Dark mode toggle */}
        <button onClick={toggleDark}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700
                     hover:text-slate-600 dark:hover:text-slate-200 transition"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                     shadow-sm cursor-pointer hover:scale-105 transition-transform duration-150"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
        >
          AI
        </div>
      </div>
    </header>
  )
}
