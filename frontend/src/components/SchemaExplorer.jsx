import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdSearch, MdRefresh } from 'react-icons/md'
import { useSchema } from '../hooks/useSchema'

const BASE_COLS = new Set([
  'Model', 'Direction', 'Date', 'Tag No',
  'Serial No', 'Type/Description', 'Recipient/Team', 'Notes',
])

export default function SchemaExplorer({ compact = false }) {
  const { columns, loading, reload } = useSchema()
  const [query, setQuery] = useState('')

  const filtered     = columns.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
  const dynamicCount = columns.filter((c) => !BASE_COLS.has(c)).length
  const baseCount    = columns.length - dynamicCount
  const display      = compact ? filtered.slice(0, 14) : filtered

  return (
    <div className="card p-6 space-y-5 dark:bg-dark-card dark:border-dark-border">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-secondary dark:text-white text-sm">Current Schema</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="badge badge-blue">{columns.length} columns</span>
            {dynamicCount > 0 && (
              <span className="badge badge-purple">★ {dynamicCount} dynamic</span>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.25 }}
          onClick={reload}
          className="p-2 rounded-xl border border-slate-200 dark:border-dark-border
                     text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50
                     dark:hover:bg-slate-700 transition"
          aria-label="Refresh schema"
        >
          <MdRefresh size={15} />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search columns…"
          className="input-base pl-9"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          Base ({baseCount})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
          Dynamic ({dynamicCount})
        </span>
      </div>

      {/* Chips */}
      {loading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: compact ? 8 : 12 }).map((_, i) => (
            <div key={i} className="h-7 rounded-full skeleton" style={{ width: `${52 + (i % 5) * 16}px` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No matching columns.</p>
      ) : (
        <motion.div layout className="flex flex-wrap gap-2">
          {display.map((col, i) => {
            const isDynamic = !BASE_COLS.has(col)
            return (
              <motion.span
                key={col} layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.018 }}
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                            text-xs font-semibold border select-none cursor-default
                            ${isDynamic
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}
              >
                {isDynamic && <span className="text-purple-400 text-[9px]">★</span>}
                {col}
              </motion.span>
            )
          })}
          {compact && filtered.length > 14 && (
            <span className="badge badge-slate">+{filtered.length - 14} more</span>
          )}
        </motion.div>
      )}
    </div>
  )
}
