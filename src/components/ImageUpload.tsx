'use client'

import { useRef, useState } from 'react'

interface ImageUploadProps {
  images: File[]
  onChange: (files: File[]) => void
  maxImages?: number
}

export default function ImageUpload({ images, onChange, maxImages = 6 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = maxImages - images.length
    const selected = files.slice(0, remaining)

    const newFiles = [...images, ...selected]
    onChange(newFiles)

    // Generate previews
    const newPreviews = selected.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const newFiles = images.filter((_, i) => i !== index)
    onChange(newFiles)
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-3">
        {previews.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
            <img src={url} alt={`美食图片 ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-600"
            >
              ✕
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/50 text-white text-xs rounded-md backdrop-blur-sm">
                封面
              </span>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center gap-1 transition cursor-pointer"
          >
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs text-gray-400">上传照片</span>
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        最多 {maxImages} 张，第一张为封面图（点击可移除）
      </p>
    </div>
  )
}
