import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdUploadFile, MdOutlineFolderOpen, MdInsertDriveFile } from 'react-icons/md'
import { HiCloudUpload } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { uploadFiles, pingHealth } from '../services/api'
import FileCard from './FileCard'
import ProgressPanel from './ProgressPanel'
import ResultsPanel from './ResultsPanel'
import { useApp } from '../context/AppContext'

const MAX_SIZE = 20 * 1024 * 1024

export default function UploadArea({ onSuccess }) {
  const { addUploadRecord } = useApp()
  const inputRef = useRef(null)

  const [files,        setFiles]        = useState([])
  const [dragging,     setDragging]     = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [uploadPct,    setUploadPct]    = useState(0)
  const [currentStep,  setCurrentStep]  = useState(-1)
  const [result,       setResult]       = useState(null)
  const [fileStatuses, setFileStatuses] = useState({})

  /* ── file helpers ────────────────────────────────────────────────── */
  const addFiles = useCallback((incoming) => {
    const valid = []
    for (const f of incoming) {
      if (!f.name.toLowerCase().endsWith('.txt')) {
        toast.error(`"${f.name}" — only .txt files accepted`)
        continue
      }
      if (f.size > MAX_SIZE) {
        toast.error(`"${f.name}" exceeds 20 MB`)
        continue
      }
      valid.push(f)
    }
    if (!valid.length) return
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      const added = valid.filter((f) => !names.has(f.name))
      if (added.length < valid.length)
        toast(`${valid.length - added.length} duplicate(s) skipped`, { icon: '⚠️' })
      return [...prev, ...added]
    })
  }, [])

  const removeFile  = useCallback((t) => setFiles((p) => p.filter((f) => f.name !== t.name)), [])
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true)  }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  /* ── upload ──────────────────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!files.length) return toast.error('Add at least one .txt file first.')
    setUploading(true); setResult(null); setUploadPct(0); setCurrentStep(0)
    setFileStatuses(Object.fromEntries(files.map((f) => [f.name, 'uploading'])))

    // Ping the backend first — wakes Render free-tier if it's cold (~60s spin-up)
    // This runs silently; errors are ignored since the real upload will surface them
    await pingHealth()

    const timer = setInterval(() => setCurrentStep((s) => (s < 3 ? s + 1 : s)), 1400)
    try {
      const res  = await uploadFiles(files, (p) => setUploadPct(p))
      clearInterval(timer); setCurrentStep(4)
      const data = res.data
      setResult(data)
      setFileStatuses(Object.fromEntries(files.map((f) => [f.name, 'done'])))
      addUploadRecord({
        id: Date.now(), files: files.map((f) => f.name),
        date: new Date().toLocaleString(),
        recordsAdded: data.records_added ?? 0,
        newColumns: data.new_columns_added ?? [],
        status: 'success',
      })
      toast.success(`✓ ${data.records_added} record(s) added`)
      onSuccess?.()
    } catch (err) {
      clearInterval(timer); setCurrentStep(-1)
      setFileStatuses(Object.fromEntries(files.map((f) => [f.name, 'error'])))
      toast.error(err.response?.data?.detail ?? err.message ?? 'Upload failed')
      addUploadRecord({
        id: Date.now(), files: files.map((f) => f.name),
        date: new Date().toLocaleString(),
        recordsAdded: 0, newColumns: [], status: 'error',
      })
    } finally { setUploading(false) }
  }

  const reset = () => {
    setFiles([]); setResult(null)
    setCurrentStep(-1); setUploadPct(0); setFileStatuses({})
  }

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      <motion.div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
        animate={{ scale: dragging ? 1.01 : 1 }}
        transition={{ duration: 0.15 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer select-none
                   min-h-[260px] flex flex-col items-center justify-center gap-6 p-10
                   transition-all duration-200 group"
        style={{
          background: dragging
            ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
            : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: dragging ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
          boxShadow: dragging
            ? '0 0 0 4px rgba(37,99,235,0.1), 0 4px 24px rgba(37,99,235,0.08)'
            : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Decorative corner blobs */}
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-blue-100 opacity-40 pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-indigo-100 opacity-30 pointer-events-none" />

        {/* Floating file icons — decorative */}
        <div className="absolute top-5 right-8 opacity-20 pointer-events-none">
          <MdInsertDriveFile className="text-blue-400" size={22} />
        </div>
        <div className="absolute bottom-6 left-10 opacity-15 pointer-events-none">
          <MdInsertDriveFile className="text-indigo-400" size={18} />
        </div>

        {/* Main icon */}
        <motion.div
          animate={{
            y:      dragging ? -6 : 0,
            scale:  dragging ? 1.12 : 1,
            rotate: dragging ? -4 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative z-10"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md"
            style={{
              background: dragging
                ? 'linear-gradient(135deg, #2563EB, #4F46E5)'
                : 'linear-gradient(135deg, #3B82F6, #2563EB)',
            }}
          >
            <HiCloudUpload className="text-white" size={36} />
          </div>

          {/* Pulse ring when dragging */}
          {dragging && (
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-blue-400"
            />
          )}
        </motion.div>

        {/* Text */}
        <div className="text-center space-y-2 relative z-10">
          <p className="text-lg font-bold text-slate-700">
            {dragging ? '✦ Drop to upload' : 'Drop files here'}
          </p>
          <p className="text-sm text-slate-400 font-medium">
            or{' '}
            <span className="text-blue-600 font-semibold underline underline-offset-2">
              browse your computer
            </span>
          </p>
          <p className="text-xs text-slate-300 mt-1">
            .txt files only · Multiple files supported · Max 20 MB each
          </p>
        </div>

        {/* Browse button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => { e.stopPropagation(); !uploading && inputRef.current?.click() }}
          disabled={uploading}
          className="relative z-10 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
                     text-sm font-semibold text-white shadow-md
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' }}
        >
          <MdOutlineFolderOpen size={18} />
          Browse Files
        </motion.button>

        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value = '' }}
        />
      </motion.div>

      {/* ── Selected file cards ───────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {files.map((f) => (
          <FileCard
            key={f.name}
            file={f}
            status={fileStatuses[f.name] ?? 'ready'}
            onRemove={!uploading ? removeFile : null}
          />
        ))}
      </AnimatePresence>

      {/* ── Upload / Clear buttons ────────────────────────────────────── */}
      <AnimatePresence>
        {files.length > 0 && !uploading && !result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUpload}
              className="btn-primary flex-1 justify-center py-3 text-[15px] shadow-md"
            >
              <MdUploadFile size={20} />
              Upload {files.length} File{files.length > 1 ? 's' : ''}
            </motion.button>
            <button onClick={reset} className="btn-secondary px-5">
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Progress ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {uploading && (
          <ProgressPanel uploadPct={uploadPct} currentStep={currentStep} done={false} />
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <ResultsPanel result={result} />
            <button onClick={reset} className="btn-secondary w-full justify-center py-3">
              Upload More Files
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
