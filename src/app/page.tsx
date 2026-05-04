'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FoodSpot } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import FoodCard from '@/components/FoodCard'
import Link from 'next/link'

export default function HomePage() {
  const [foods, setFoods] = useState<FoodSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [stats, setStats] = useState({ total: 0, users: 0 })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('food_spots')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setFoods(data)

      // Count unique users
      const { count: userCount } = await supabase
        .from('food_spots')
        .select('user_id', { count: 'exact', head: true })

      setStats({
        total: data?.length || 0,
        users: userCount || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const filteredFoods = activeCategory === 'all'
    ? foods
    : foods.filter((f) => f.category === activeCategory)

  return (
    <div>
      {/* Hero 区域 */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            发现身边的美食 🍜
          </h1>
          <p className="text-orange-100 text-sm sm:text-base max-w-lg mx-auto">
            在地图上记录你品尝过的美食，分享给更多吃货朋友
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-orange-100">收录美食</div>
            </div>
            <div className="w-px h-10 bg-orange-300" />
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-xs text-orange-100">美食家</div>
            </div>
            <div className="w-px h-10 bg-orange-300" />
            <div className="text-center">
              <div className="text-2xl font-bold">{foods.length > 0 ? (foods.reduce((s, f) => s + (f.avg_rating || 0), 0) / foods.length).toFixed(1) : '0.0'}</div>
              <div className="text-xs text-orange-100">平均评分</div>
            </div>
          </div>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-white text-orange-500 font-semibold rounded-xl hover:bg-orange-50 transition shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加美食
          </Link>
        </div>
      </section>

      {/* 分类筛选 */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              activeCategory === 'all'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 美食列表 */}
      <section className="max-w-6xl mx-auto px-4 py-6 mb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">🍽️</span>
            <p className="text-gray-500 mt-4">还没有美食记录</p>
            <Link
              href="/add"
              className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition"
            >
              添加第一条美食
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeCategory === 'all' ? '全部美食' : `${CATEGORIES.find(c => c.id === activeCategory)?.name || ''}`}
                <span className="text-sm font-normal text-gray-400 ml-2">共 {filteredFoods.length} 个</span>
              </h2>
              <Link href="/search" className="text-sm text-orange-500 hover:text-orange-600">
                查看地图 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredFoods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
