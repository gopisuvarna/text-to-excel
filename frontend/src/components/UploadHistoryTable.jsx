import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MdSearch, MdArrowUpward, MdArrowDownward, MdInsertDriveFile } from 'react-icons/md'
import { useApp } from '../context/AppContext'

const PAGE_SIZE = 8

export default function UploadHistoryTable() {
  const { uploadHistory } = useApp()
  const [query,   setQuery]   = useState('')
  const [sortDir, setSortDir] = useState('desc')
  const [page,    setPage]    = useState(1)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return uploadHistory
      .filter((r) => r.files.some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => sortDir === 'desc' ? b.id - a.id : a.id - b.id)
  }, [uploadHistory, query, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!uploadHistory.length) {
    return (
      <div className="card p-12 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <MdInsertDriveFile className="text-slate-400" size={28} />
        </div>
        <div>
          <p className="font-semibold text-secondary dark:text-white">No uploads yet</p>
          <p className="text-sm text-slate-400 mt-1">Files you upload will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden dark:bg-dark-card dark:border-dark-border">

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-dark-border
                      flex flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="relative flex-1 min-w-[180px]">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search by filename…"
            className="input-base pl-9 py-1.5 text-xs"
          />
        </div>
        <button
          onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
          className="btn-secondary !px-3 !py-1.5 !text-xs"
        >
          {sortDir === 'desc' ? <MdArrowDownward size={14} /> : <MdArrowUpward size={14} />}
          Date
        </button>
        <span className="text-xs text-slate-400 ml-auto hidden sm:block">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-dark-border">
              {['File(s)', 'Upload Date', 'Records Added', 'New Columns', 'Status'].map((h) => (
                <th key={h}
                  className="text-left px-5 py-3 text-[11px] font-bold text-slate-400
                             dark:text-slate-500 uppercase tracking-widest whitespace-nowrap
                             sticky top-0 bg-white dark:bg-dark-card">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
            {paginated.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors duration-100 group"
              >
                {/* File(s) */}
                <td className="px-5 py-3.5 max-w-[220px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center
                                    justify-center shrink-0 group-hover:bg-blue-100 transition">
                      <MdInsertDriveFile className="text-primary-600" size={15} />
                    </div>
                    <div className="min-w-0">
                      {row.files.map((f) => (
                        <p key={f} className="truncate text-secondary dark:text-slate-200 font-medium text-xs leading-snug">{f}</p>
                      ))}
                    </div>
                  </div>
                </td>

                {/* Date */}
                <td className="px-5 py-3.5 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                  {row.date}
                </td>

                {/* Records */}
                <td className="px-5 py-3.5">
                  <span className="badge badge-green tabular-nums">{row.recordsAdded}</span>
                </td>

                {/* New columns */}
                <td className="px-5 py-3.5">
                  {row.newColumns.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.newColumns.slice(0, 2).map((c) => (
                        <span key={c} className="badge badge-purple">{c}</span>
                      ))}
                      {row.newColumns.length > 2 && (
                        <span className="badge badge-slate">+{row.newColumns.length - 2}</span>
                      )}
                    </div>
                  ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                </td>

                {/* Status */}
                <td className="px-5 py-3.5">
                  {row.status === 'success'
                    ? <span className="badge badge-green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Completed</span>
                    : <span className="badge badge-red"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Failed</span>
                  }
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-dark-border
                        flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/30">
          <span className="text-xs text-slate-400">{filtered.length} results</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all
                  ${page === i + 1
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
