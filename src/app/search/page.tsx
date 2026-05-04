'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { FoodSpot } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import FoodCard from '@/components/FoodCard'

export default function SearchPage() {
  const [foods, setFoods] = useState<FoodSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'rating'>('newest')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    async function load() {
      let query = supabase.from('food_spots').select('*')

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory)
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else {
        query = query.order('avg_rating', { ascending: false })
      }

      const { data } = await query
      if (data) setFoods(data)
      setLoading(false)
    }
    load()
  }, [activeCategory, sortBy])

  // 地图展示
  useEffect(() => {
    if (viewMode !== 'map' || !mapRef.current || loading) return

    const amapKey = process.env.NEXT_PUBLIC_AMAP_KEY
    if (!amapKey || amapKey === 'your_amap_key') return

    async function initMap(key: string) {
      const AMapLoader = (await import('@amap/amap-jsapi-loader')).default
      const securityKey = process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY
      const AMap = await AMapLoader.load({ key, version: '2.0', securityJsCode: securityKey })

      if (mapInstance.current) {
        mapInstance.current.destroy()
        markersRef.current = []
      }

      const map = new AMap.Map(mapRef.current!, {
        zoom: 13,
        center: [116.397428, 39.90923],
      })
      mapInstance.current = map

      if (foods.length > 0) {
        const bounds = new AMap.Bounds()
        foods.forEach((food) => {
          const marker = new AMap.Marker({
            position: [food.longitude, food.latitude],
            title: food.name,
            map,
            label: {
              content: `<div style="background:#f97316;color:white;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap">${food.name}</div>`,
              direction: 'top',
            },
          })

          marker.on('click', () => {
            window.open(`/food/${food.id}`, '_self')
          })

          markersRef.current.push(marker)
          bounds.extend([food.longitude, food.latitude])
        })

        if (foods.length > 1) {
          map.setFitView(null, false, [30, 30, 30, 30])
        } else {
          map.setZoom(15)
        }
      }
    }
    initMap(amapKey)
  }, [viewMode, foods, loading])

  const filteredFoods = searchText.trim()
    ? foods.filter((f) =>
        f.name.toLowerCase().includes(searchText.toLowerCase()) ||
        f.description.toLowerCase().includes(searchText.toLowerCase()) ||
        f.address.toLowerCase().includes(searchText.toLowerCase())
      )
    : foods

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 mb-16">
      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索美食名称、描述或地址..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
            viewMode === 'map'
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-orange-50'
          }`}
        >
          {viewMode === 'map' ? '📋 列表' : '🗺️ 地图'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'rating')}
          className="ml-auto px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none"
        >
          <option value="newest">最新</option>
          <option value="rating">评分最高</option>
        </select>
      </div>

      {viewMode === 'map' ? (
        <div ref={mapRef} style={{ height: '600px' }} className="rounded-xl border border-gray-200 overflow-hidden" />
      ) : (
        <>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-5xl">🔍</span>
              <p className="text-gray-500 mt-3">没有找到匹配的美食</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4">找到 {filteredFoods.length} 个美食</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredFoods.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
