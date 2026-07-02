import { motion } from 'framer-motion'
import { MdCheckCircle } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const STEPS = [
  { label: 'Parsing Text Files',         icon: '📄' },
  { label: 'Extracting Records with AI', icon: '🤖' },
  { label: 'Detecting New Columns',      icon: '🔍' },
  { label: 'Updating Excel Workbook',    icon: '📊' },
]

export default function ProgressPanel({ uploadPct, currentStep, done }) {
  const pct = done ? 100 : uploadPct

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 space-y-5 dark:bg-dark-card dark:border-dark-border"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-secondary dark:text-white text-sm">Processing</h3>
        <span className="text-xs font-bold text-blue-600">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map(({ label, icon }, i) => {
          const isActive   = i === currentStep && !done
          const isComplete = done || i < currentStep
          return (
            <motion.div key={label}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                              bg-slate-50 dark:bg-slate-800 text-base">
                {isComplete
                  ? <MdCheckCircle className="text-emerald-500" size={20} />
                  : isActive
                  ? <AiOutlineLoading3Quarters className="text-blue-600 animate-spin" size={16} />
                  : <span className="opacity-40">{icon}</span>
                }
              </div>
              <span className={`text-sm font-medium ${
                isComplete ? 'text-emerald-600 dark:text-emerald-400'
                : isActive  ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-600'
              }`}>
                {label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
