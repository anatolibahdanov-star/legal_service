import { useRef } from 'react'

export const useFileUpload = (
  files: File[], 
  onFilesChange: (files: File[]) => void
) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    // Filter files by size (max 10 MB) and type
    const validFiles = selectedFiles.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10 MB
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ]
      
      return file.size <= maxSize && allowedTypes.includes(file.type)
    })

    // Combine with already attached files
    const updatedFiles = [...files, ...validFiles]
    onFilesChange(updatedFiles)

    // Clear input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    onFilesChange(updatedFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б'
    const k = 1024
    const sizes = ['Б', 'КБ', 'МБ']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return {
    fileInputRef,
    handleFileClick,
    handleFileChange,
    removeFile,
    formatFileSize,
  }
}