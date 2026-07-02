import { motion } from 'framer-motion'
import { MdInsertDriveFile, MdClose, MdCheckCircle } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

function fmt(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const STATUS = {
  ready:     { label: 'Ready',      dotCls: 'bg-blue-500',    textCls: 'text-blue-700',    bgCls: 'bg-blue-50'    },
  uploading: { label: 'Uploading…', dotCls: 'bg-amber-500',   textCls: 'text-amber-700',   bgCls: 'bg-amber-50'   },
  done:      { label: 'Done',       dotCls: 'bg-emerald-500', textCls: 'text-emerald-700', bgCls: 'bg-emerald-50' },
  error:     { label: 'Error',      dotCls: 'bg-red-500',     textCls: 'text-red-600',     bgCls: 'bg-red-50'     },
}

export default function FileCard({ file, status = 'ready', onRemove }) {
  const s = STATUS[status] ?? STATUS.ready

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card px-4 py-3 flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bgCls}`}>
        {status === 'done'
          ? <MdCheckCircle className="text-emerald-500" size={22} />
          : status === 'uploading'
          ? <AiOutlineLoading3Quarters className="text-amber-500 animate-spin" size={18} />
          : <MdInsertDriveFile className="text-blue-600" size={20} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-secondary dark:text-white truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{fmt(file.size)}</span>
          <span className="text-slate-200 dark:text-slate-600">·</span>
          <span className={`flex items-center gap-1 text-xs font-semibold ${s.textCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dotCls}`} />
            {s.label}
          </span>
        </div>
      </div>

      {status === 'ready' && onRemove && (
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(file)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition shrink-0"
          aria-label="Remove"
        >
          <MdClose size={15} />
        </motion.button>
      )}
    </motion.div>
  )
}
