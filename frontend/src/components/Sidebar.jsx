import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MdDashboard, MdUploadFile, MdHistory,
  MdClose, MdChevronLeft, MdChevronRight,
} from 'react-icons/md'
import { TbPackage } from 'react-icons/tb'

const NAV = [
  { to: '/',        icon: MdDashboard,  label: 'Dashboard'      },
  { to: '/upload',  icon: MdUploadFile, label: 'Upload Files'   },
  { to: '/history', icon: MdHistory,    label: 'Upload History' },
]

const sidebarStyle = {
  background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
}

function NavItem({ to, icon: Icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
         transition-all duration-200 select-none overflow-hidden
         ${isActive
           ? 'bg-white/15 text-white shadow-sm'
           : 'text-slate-400 hover:bg-white/10 hover:text-white'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="activeBar"
              className="absolute left-0 top-2 bottom-2 w-0.5 bg-white rounded-full"
            />
          )}
          <Icon size={18} className="shrink-0 ml-0.5" />
          {!collapsed && (
            <span className="whitespace-nowrap overflow-hidden">{label}</span>
          )}
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onClose, mobile = false, collapsed = false, onToggleCollapse }) {
  return (
    <div className="flex flex-col h-full" style={sidebarStyle}>

      {/* Logo */}
      <div className={`h-16 flex items-center shrink-0 border-b border-white/10
                       ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shrink-0">
            <TbPackage className="text-white" size={20} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-white text-sm leading-none tracking-tight">Inventory AI</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-none">Text → Excel Agent</p>
            </div>
          )}
        </div>
        {mobile && !collapsed && (
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 transition ml-2 shrink-0">
            <MdClose size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">
            Menu
          </p>
        )}
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed}
            onClick={mobile ? onClose : undefined} />
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 shrink-0 ${collapsed ? 'py-4 flex justify-center' : 'px-5 py-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400">System online</span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl
                       text-slate-400 hover:bg-white/10 hover:text-white transition text-xs font-medium"
          >
            {collapsed
              ? <MdChevronRight size={18} />
              : <><MdChevronLeft size={16} /><span>Collapse</span></>
            }
          </button>
        )}
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Desktop static sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex lg:flex-col shrink-0 h-screen sticky top-0 overflow-hidden shadow-xl"
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.div key="dr"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.24 }}
              className="fixed top-0 left-0 h-full w-60 z-50 lg:hidden shadow-2xl overflow-hidden"
            >
              <SidebarContent onClose={onClose} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
