import { motion } from 'framer-motion'
import { MdDeleteOutline } from 'react-icons/md'
import UploadHistoryTable from '../components/UploadHistoryTable'
import { useApp }         from '../context/AppContext'

export default function HistoryPage() {
  const { clearHistory, uploadHistory } = useApp()

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white tracking-tight">Upload History</h1>
          <p className="text-sm text-slate-400 mt-1">
            {uploadHistory.length > 0
              ? `${uploadHistory.length} upload${uploadHistory.length !== 1 ? 's' : ''} recorded across sessions`
              : 'No uploads yet'}
          </p>
        </div>
        {uploadHistory.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => window.confirm('Clear all upload history?') && clearHistory()}
            className="btn-secondary !text-red-500 !border-red-200 hover:!bg-red-50 dark:hover:!bg-red-900/20"
          >
            <MdDeleteOutline size={16} /> Clear History
          </motion.button>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <UploadHistoryTable />
      </motion.div>
    </div>
  )
}
