import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

function buildTrend(history) {
  const days = 7
  const now  = Date.now()
  const MS   = 86_400_000

  // Build 7 day buckets: index 0 = 6 days ago, index 6 = today
  const buckets = Array.from({ length: days }, (_, i) => {
    const d   = new Date(now - (days - 1 - i) * MS)
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    return { label: key, count: 0, records: 0 }
  })

  history.forEach((r) => {
    // r.id is Date.now() at upload time
    const daysAgo = Math.floor((now - r.id) / MS)
    if (daysAgo >= 0 && daysAgo < days) {
      const b = buckets[days - 1 - daysAgo]
      if (b) {
        b.count++
        b.records += r.recordsAdded ?? 0
      }
    }
  })

  return buckets
}

export default function UploadTrendChart() {
  const { uploadHistory } = useApp()
  const data   = useMemo(() => buildTrend(uploadHistory), [uploadHistory])
  const maxRec = Math.max(...data.map((d) => d.records), 1)
  const totalUploads = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="card p-5 dark:bg-dark-card dark:border-dark-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-secondary dark:text-white text-sm">Upload Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Records added · last 7 days</p>
        </div>
        <span className="badge badge-blue">{totalUploads} uploads</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2" style={{ height: '72px' }}>
        {data.map((d, i) => {
          const hasData   = d.count > 0
          const heightPct = hasData ? Math.max((d.records / maxRec) * 100, 8) : 0

          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5" style={{ height: '72px' }}>
              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: '52px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.55, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                  title={hasData ? `${d.records} records, ${d.count} upload${d.count > 1 ? 's' : ''}` : 'No uploads'}
                  className="w-full rounded-t-md"
                  style={{
                    background: hasData
                      ? 'linear-gradient(to top, #2563EB, #60A5FA)'
                      : undefined,
                    backgroundColor: hasData ? undefined : 'rgb(241 245 249)',
                    minHeight: hasData ? '6px' : '2px',
                    opacity: hasData ? 1 : 0.4,
                  }}
                />
              </div>

              {/* Day label */}
              <span
                className="text-[10px] font-medium whitespace-nowrap"
                style={{ color: hasData ? '#2563EB' : '#94A3B8' }}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {totalUploads === 0 && (
        <p className="text-xs text-slate-400 text-center mt-2">
          No uploads in the last 7 days
        </p>
      )}
    </div>
  )
}
