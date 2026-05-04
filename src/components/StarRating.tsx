'use client'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

export default function StarRating({ rating, onChange, size = 'md', readonly = false }: StarRatingProps) {
  const sizeMap = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' }
  const starSize = sizeMap[size]

  return (
    <div className={`inline-flex gap-0.5 ${readonly ? '' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating)
        const half = !filled && star - 0.5 <= rating

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`${starSize} ${readonly ? 'cursor-default' : 'hover:scale-110'} transition-transform`}
          >
            {filled ? (
              <span className="text-yellow-400">★</span>
            ) : half ? (
              <span className="relative">
                <span className="text-gray-300">★</span>
                <span className="absolute inset-0 text-yellow-400 overflow-hidden w-1/2">★</span>
              </span>
            ) : (
              <span className="text-gray-300">★</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function StarInput({ value, onChange, label }: {
  value: number
  onChange: (v: number) => void
  label?: string
}) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-gray-600 min-w-[60px]">{label}</span>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-all ${
              star <= value ? 'text-yellow-400 scale-110' : 'text-gray-300'
            } hover:scale-125`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
