import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import UploadArea     from '../components/UploadArea'
import DownloadButton from '../components/DownloadButton'

const TIPS = [
  'Upload multiple .txt files at once — all are processed together',
  'Any new field in a file becomes a new Excel column automatically',
  'Duplicate records (same Tag No + Serial + Date) are skipped silently',
  'Dates in any format are normalised to YYYY-MM-DD',
  'Direction values are classified (Received, Shipped Out, etc.)',
]

export default function UploadPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-secondary dark:text-white tracking-tight">Upload Files</h1>
        <p className="text-sm text-slate-400 mt-1">
          Drop one or more{' '}
          <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-xs font-mono">.txt</code>{' '}
          inventory files. The AI extracts records and saves them to the master Excel workbook.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Upload zone */}
        <motion.div className="xl:col-span-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <UploadArea onSuccess={() => setTimeout(() => navigate('/'), 1800)} />
        </motion.div>

        {/* Right panel */}
        <div className="space-y-4">

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }}
            className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
            <div>
              <p className="font-semibold text-secondary dark:text-white text-sm">Download Excel</p>
              <p className="text-xs text-slate-400 mt-0.5">Get the latest consolidated workbook.</p>
            </div>
            <DownloadButton fullWidth />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="card p-5 dark:bg-dark-card dark:border-dark-border">
            <p className="font-semibold text-secondary dark:text-white text-sm mb-3.5">Quick Tips</p>
            <ul className="space-y-2.5">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600
                                   flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
