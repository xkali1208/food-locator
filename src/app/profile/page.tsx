'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { FoodSpot, Review } from '@/lib/types'
import Link from 'next/link'
import StarRating from '@/components/StarRating'

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [myFoods, setMyFoods] = useState<FoodSpot[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'foods' | 'reviews'>('foods')
  const [stats, setStats] = useState({ foods: 0, reviews: 0 })

  useEffect(() => {
    const currentUser = user
    if (!currentUser) return

    async function load(uid: string) {
      const { data: foods } = await supabase
        .from('food_spots')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (foods) setMyFoods(foods)
      if (reviews) setMyReviews(reviews)
      setStats({ foods: foods?.length || 0, reviews: reviews?.length || 0 })
      setLoading(false)
    }
    if (currentUser) load(currentUser.id)
  }, [user])

  if (authLoading) return null

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="text-5xl">🔒</span>
          <h1 className="text-xl font-bold text-gray-900 mt-3">请先登录</h1>
          <p className="text-sm text-gray-500 mt-1">登录后查看个人中心</p>
          <Link href="/auth/login" className="inline-block mt-4 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition">去登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-16">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center text-2xl font-bold text-orange-600">
            {user.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.email?.split('@')[0]}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition"
          >
            退出登录
          </button>
        </div>

        <div className="flex gap-6 mt-6 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{stats.foods}</div>
            <div className="text-xs text-gray-500">美食</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{stats.reviews}</div>
            <div className="text-xs text-gray-500">评价</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('foods')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            tab === 'foods' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
          }`}
        >
          我的美食 ({stats.foods})
        </button>
        <button
          onClick={() => setTab('reviews')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            tab === 'reviews' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
          }`}
        >
          我的评价 ({stats.reviews})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'foods' ? (
        myFoods.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">🍽️</span>
            <p className="text-gray-500 mt-3">还没有添加美食</p>
            <Link href="/add" className="inline-block mt-3 px-5 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition text-sm">
              添加第一条
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {myFoods.map((food) => (
              <Link
                key={food.id}
                href={`/food/${food.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{food.name}</h3>
                  <StarRating rating={food.avg_rating} size="sm" readonly />
                </div>
                <p className="text-sm text-gray-500 mt-1 truncate">{food.description}</p>
                <p className="text-xs text-gray-400 mt-2">{food.address}</p>
              </Link>
            ))}
          </div>
        )
      ) : (
        myReviews.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">💬</span>
            <p className="text-gray-500 mt-3">还没有发表过评价</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {myReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} size="sm" readonly />
                  <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{review.content}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>口味 {review.taste_rating}★</span>
                  <span>环境 {review.environment_rating}★</span>
                  <span>服务 {review.service_rating}★</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
