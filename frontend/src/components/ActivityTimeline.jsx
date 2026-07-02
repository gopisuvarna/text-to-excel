import { motion } from 'framer-motion'
import { MdCheckCircle, MdErrorOutline, MdUploadFile } from 'react-icons/md'
import { useApp } from '../context/AppContext'

export default function ActivityTimeline() {
  const { uploadHistory } = useApp()
  const recent = uploadHistory.slice(0, 6)

  if (!recent.length) return null

  return (
    <div className="card p-5 dark:bg-dark-card dark:border-dark-border">
      <h3 className="font-semibold text-secondary dark:text-white text-sm mb-4">Recent Activity</h3>
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100 dark:bg-dark-border" />
        <div className="space-y-4">
          {recent.map((r, i) => (
            <motion.div key={r.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-4 relative"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10
                               ${r.status === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {r.status === 'success'
                  ? <MdCheckCircle className="text-emerald-500" size={15} />
                  : <MdErrorOutline className="text-red-500" size={15} />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MdUploadFile className="text-slate-400 shrink-0" size={13} />
                    <p className="text-xs font-semibold text-secondary dark:text-slate-200 truncate">
                      {r.files.join(', ')}
                    </p>
                  </div>
                  {r.status === 'success' && (
                    <span className="badge badge-green shrink-0 text-[10px]">+{r.recordsAdded}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{r.date}</p>
                {r.newColumns?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.newColumns.slice(0, 2).map((c) => (
                      <span key={c} className="badge badge-purple text-[10px]">★ {c}</span>
                    ))}
                    {r.newColumns.length > 2 && (
                      <span className="badge badge-slate text-[10px]">+{r.newColumns.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
