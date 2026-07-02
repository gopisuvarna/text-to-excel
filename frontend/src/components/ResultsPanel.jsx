import { motion } from 'framer-motion'
import { MdCheckCircle, MdNewLabel, MdSkipNext, MdTableRows } from 'react-icons/md'

export default function ResultsPanel({ result }) {
  const { records_added = 0, duplicates_skipped = 0, new_columns_added = [], files = [] } = result
  const total_extracted = files.reduce((s, f) => s + (f.records_extracted ?? 0), 0)

  const cards = [
    { icon: MdTableRows,   label: 'Extracted',  value: total_extracted,         color: 'text-primary-600', bg: 'bg-blue-50 dark:bg-blue-900/30'    },
    { icon: MdCheckCircle, label: 'Added',       value: records_added,           color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { icon: MdSkipNext,    label: 'Duplicates',  value: duplicates_skipped,      color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/30'  },
    { icon: MdNewLabel,    label: 'New Cols',    value: new_columns_added.length, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

      {/* Summary mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <motion.div key={c.label}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4 flex flex-col items-center gap-2 text-center"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
              <c.icon className={c.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-secondary dark:text-white tabular-nums">{c.value}</p>
            <p className="text-xs font-semibold text-slate-400">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* New column badges */}
      {new_columns_added.length > 0 && (
        <div className="card p-5 space-y-3 dark:bg-dark-card dark:border-dark-border">
          <p className="text-sm font-semibold text-secondary dark:text-white">New Columns Detected</p>
          <div className="flex flex-wrap gap-2">
            {new_columns_added.map((col) => (
              <span key={col} className="badge badge-purple">★ {col}</span>
            ))}
          </div>
        </div>
      )}

      {/* Per-file breakdown */}
      {files.length > 1 && (
        <div className="card p-5 divide-y divide-slate-100 dark:divide-dark-border dark:bg-dark-card dark:border-dark-border">
          <p className="text-sm font-semibold text-secondary dark:text-white pb-3">Per-File Breakdown</p>
          {files.map((f) => (
            <div key={f.file} className="py-2.5 flex items-center justify-between gap-3">
              <p className="text-sm text-secondary dark:text-slate-300 truncate">{f.file}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="badge badge-green">{f.records_added} added</span>
                {f.new_columns_added?.length > 0 && (
                  <span className="badge badge-purple">{f.new_columns_added.length} cols</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
