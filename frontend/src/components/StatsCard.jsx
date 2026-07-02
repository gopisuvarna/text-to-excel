import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function useCountUp(target, duration = 900) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof target !== 'number') return
    const start = performance.now()
    const tick  = (now) => {
      const pct  = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3)
      node.textContent = Math.round(target * ease).toLocaleString()
      if (pct < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return ref
}

export default function StatsCard({ icon: Icon, label, value, color, bg, trend, delay = 0 }) {
  const countRef = useCountUp(typeof value === 'number' ? value : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4 }}
      className="card p-5 cursor-default group relative overflow-hidden"
      style={{ transition: 'box-shadow 0.2s, transform 0.2s' }}
    >
      {/* Accent blob */}
      <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-[0.06] ${bg}`} />

      <div className="flex items-start justify-between gap-3 relative">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                         ${bg} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={color} size={22} />
        </div>
        {trend && (
          <span className={`badge text-[11px] ${trend.positive ? 'badge-green' : 'badge-red'}`}>
            {trend.positive ? '↑' : '↓'} {trend.label}
          </span>
        )}
      </div>

      <div className="mt-4 relative">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-secondary dark:text-white mt-1 tabular-nums">
          {typeof value === 'number'
            ? <span ref={countRef}>0</span>
            : <span className="text-slate-300">—</span>
          }
        </p>
      </div>
    </motion.div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl skeleton" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 skeleton w-20" />
        <div className="h-8 skeleton w-14" />
      </div>
    </div>
  )
}
