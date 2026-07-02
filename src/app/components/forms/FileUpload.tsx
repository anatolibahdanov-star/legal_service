'use client'

import { useRef, useState } from 'react'
import {
  ATTACH_ACCEPT,
  ATTACH_MAX_FILES,
  ATTACH_MAX_SIZE,
  validateAttachmentFile,
} from '@/src/app/components/forms/validation/attachments'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б'
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  existingCount?: number
  className?: string
}

export function FileUpload({
  files,
  onFilesChange,
  disabled = false,
  maxFiles = ATTACH_MAX_FILES,
  existingCount = 0,
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (inputRef.current) inputRef.current.value = ''
    if (selected.length === 0) return

    let nextError: string | null = null
    const valid: File[] = []
    for (const file of selected) {
      const res = validateAttachmentFile({ name: file.name, size: file.size, type: file.type })
      if (!res.ok) {
        nextError = res.error ?? 'Недопустимый файл.'
        continue
      }
      valid.push(file)
    }

    const remaining = Math.max(0, maxFiles - existingCount)
    let combined = [...files, ...valid]
    if (combined.length > remaining) {
      nextError = `Можно прикрепить не более ${maxFiles} файлов.`
      combined = combined.slice(0, remaining)
    }
    setError(nextError)
    onFilesChange(combined)
  }

  const removeFile = (index: number) => {
    if (disabled) return
    setError(null)
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className={`flex flex-col gap-3 transition-all duration-200 ${
          disabled ? 'opacity-60' : 'cursor-pointer hover:border-[#34347C]/60 hover:bg-[#f4f4ff]'
        }`}
        style={{ padding: 16, background: '#F9F9F9', border: '1.5px dashed rgba(52,52,124,0.3)', borderRadius: 16 }}
        onClick={files.length === 0 ? handleClick : undefined}
      >
        {files.length === 0 ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mx-auto">
              <path d="M8 2v8M4 6l4-4 4 4M2 12h12" stroke="#34347C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col gap-0.5 text-center">
              <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">Прикрепите документы (необязательно)</span>
              <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.35)]">DOC, DOCX, PDF, XLSX — до 3 МБ, не более {maxFiles} файлов</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium leading-[17px] text-[rgba(18,22,27,0.7)]">
                Прикреплённые файлы ({files.length}):
              </span>
              {files.length + existingCount < maxFiles && !disabled && (
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-[12px] leading-[15px] text-[#34347C] hover:underline"
                >
                  + Добавить
                </button>
              )}
            </div>

            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white/60 border border-[rgba(18,22,27,0.08)] rounded-[8px] group hover:bg-white hover:border-[#34347C]/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 flex items-center justify-center rounded bg-[rgba(52,52,124,0.1)] shrink-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M7 1H2.5A.5.5 0 002 1.5v9a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V4L7 1z" stroke="#34347C" strokeWidth="0.8" fill="rgba(52,52,124,0.05)" />
                      <path d="M7 1v3h3" stroke="#34347C" strokeWidth="0.8" fill="none" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-medium leading-[16px] text-[#12161B] truncate max-w-[220px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] leading-[12px] text-[rgba(18,22,27,0.5)]">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label="Удалить файл"
                    className="w-5 h-5 flex items-center justify-center rounded-full text-[rgba(18,22,27,0.4)] hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M7.5 2.5L2.5 7.5M2.5 2.5l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ATTACH_ACCEPT}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {error && <span className="text-[11px] text-red-400 px-1">{error}</span>}
    </div>
  )
}

export { ATTACH_MAX_SIZE }
export default FileUpload
