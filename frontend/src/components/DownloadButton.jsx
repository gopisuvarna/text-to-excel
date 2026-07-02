import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdDownload } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import toast from 'react-hot-toast'
import { downloadExcel } from '../services/api'

export default function DownloadButton({ fullWidth = false }) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      await downloadExcel()
      toast.success('master_inventory.xlsx downloaded!')
    } catch (err) {
      toast.error(
        err.response?.status === 404
          ? 'No Excel file yet — upload files first.'
          : 'Download failed.'
      )
    } finally { setLoading(false) }
  }

  return (
    <motion.button
      onClick={handle}
      disabled={loading}
      whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!loading ? { scale: 0.97 } : {}}
      className={`btn-primary ${fullWidth ? 'w-full justify-center py-3 text-[15px]' : ''}`}
    >
      {loading
        ? <AiOutlineLoading3Quarters className="animate-spin" size={16} />
        : <MdDownload size={18} />
      }
      {loading ? 'Downloading…' : 'Download Excel'}
    </motion.button>
  )
}
