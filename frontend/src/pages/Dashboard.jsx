import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  MdTableRows, MdFolderOpen, MdViewColumn,
  MdAddBox, MdUploadFile, MdDownload,
} from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import StatsCard, { StatsCardSkeleton } from '../components/StatsCard'
import SchemaExplorer     from '../components/SchemaExplorer'
import UploadHistoryTable from '../components/UploadHistoryTable'
import ActivityTimeline   from '../components/ActivityTimeline'
import UploadTrendChart   from '../components/UploadTrendChart'
import { useStats }       from '../hooks/useStats'
import { useApp }         from '../context/AppContext'
import { downloadExcel }  from '../services/api'

const CARDS = [
  { key: 'total_records',     label: 'Total Records',   icon: MdTableRows,  color: 'text-blue-600',   bg: 'bg-blue-50',   trend: { label: '+12%', positive: true } },
  { key: 'files_processed',   label: 'Files Processed', icon: MdFolderOpen, color: 'text-amber-600',  bg: 'bg-amber-50',  trend: null },
  { key: 'total_columns',     label: 'Total Columns',   icon: MdViewColumn, color: 'text-purple-600', bg: 'bg-purple-50', trend: null },
  { key: 'new_columns_added', label: 'New Columns',     icon: MdAddBox,     color: 'text-emerald-600',bg: 'bg-emerald-50',trend: null },
]

const fade = (delay) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

export default function Dashboard() {
  const { stats, loading }            = useStats()
  const { uploadHistory }             = useApp()
  const navigate                      = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const lastUpload = uploadHistory[0]?.date ?? null

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadExcel()
      toast.success('master_inventory.xlsx downloaded!')
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'No Excel file yet — upload first.' : 'Download failed.')
    } finally { setDownloading(false) }
  }

  return (
    <div className="space-y-7">

      {/* Header */}
      <motion.div {...fade(0)} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            {lastUpload
              ? <>Last upload: <span className="font-medium text-slate-500 dark:text-slate-300">{lastUpload}</span></>
              : 'Your inventory data pipeline at a glance'
            }
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/upload')} className="btn-secondary">
            <MdUploadFile size={16} /> Upload
          </motion.button>
          <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={handleDownload} disabled={downloading} className="btn-primary">
            {downloading
              ? <AiOutlineLoading3Quarters className="animate-spin" size={16} />
              : <MdDownload size={16} />}
            {downloading ? 'Downloading…' : 'Download Excel'}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
          : CARDS.map((c, i) => (
              <StatsCard key={c.key} icon={c.icon} label={c.label}
                value={stats?.[c.key] ?? 0} color={c.color} bg={c.bg}
                trend={c.trend} delay={i * 0.07} />
            ))
        }
      </div>

      {/* Analytics row */}
      <motion.div {...fade(0.3)} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3"><UploadTrendChart /></div>
        <div className="lg:col-span-2"><ActivityTimeline /></div>
      </motion.div>

      {/* Schema */}
      <motion.section {...fade(0.38)}>
        <p className="section-label mb-3">Schema</p>
        <SchemaExplorer />
      </motion.section>

      {/* History */}
      <motion.section {...fade(0.44)}>
        <p className="section-label mb-3">Upload History</p>
        <UploadHistoryTable />
      </motion.section>

    </div>
  )
}
