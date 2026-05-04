'use client'

import Link from 'next/link'
import StarRating from './StarRating'
import type { FoodSpot } from '@/lib/types'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FoodCard({ food }: { food: FoodSpot }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: images } = await supabase
        .from('food_images')
        .select('url')
        .eq('food_spot_id', food.id)
        .eq('is_cover', true)
        .limit(1)

      if (images && images.length > 0) {
        setCoverUrl(images[0].url)
      }
    }
    load()
  }, [food.id])

  return (
    <Link
      href={`/food/${food.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 animate-fade-in"
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            🍽️
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-lg shadow-sm">
            {food.category === 'chinese' ? '🥟 中餐'
              : food.category === 'western' ? '🍝 西餐'
              : food.category === 'japanese' ? '🍣 日料'
              : food.category === 'korean' ? '🥘 韩餐'
              : food.category === 'snack' ? '🍢 小吃'
              : food.category === 'dessert' ? '🍰 甜品'
              : food.category === 'drink' ? '🧋 饮品'
              : food.category === 'bbq' ? '🥩 烧烤'
              : food.category === 'hotpot' ? '🫕 火锅'
              : '🍽️ 其他'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-orange-500 transition-colors truncate">
          {food.name}
        </h3>
        {food.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {food.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <StarRating rating={food.avg_rating} size="sm" readonly />
            <span className="text-sm font-medium text-gray-600">{food.avg_rating?.toFixed(1) || '0.0'}</span>
          </div>
          <span className="text-sm text-gray-400">
            {'💰'.repeat(food.price_level || 1)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{food.address}</span>
        </div>
      </div>
    </Link>
  )
}
