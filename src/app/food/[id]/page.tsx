'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { FoodSpot, FoodImage, Review } from '@/lib/types'
import StarRating, { StarInput } from '@/components/StarRating'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [food, setFood] = useState<FoodSpot | null>(null)
  const [images, setImages] = useState<FoodImage[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [reviewTaste, setReviewTaste] = useState(5)
  const [reviewEnv, setReviewEnv] = useState(5)
  const [reviewService, setReviewService] = useState(5)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: spot } = await supabase
        .from('food_spots')
        .select('*')
        .eq('id', id)
        .single()

      if (spot) setFood(spot)

      const { data: imgs } = await supabase
        .from('food_images')
        .select('*')
        .eq('food_spot_id', id)
        .order('is_cover', { ascending: false })

      if (imgs) setImages(imgs)

      const { data: revs } = await supabase
        .from('reviews')
        .select('*')
        .eq('food_spot_id', id)
        .order('created_at', { ascending: false })

      if (revs) setReviews(revs)

      setLoading(false)
    }
    load()
  }, [id])

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setReviewError('请先登录'); return }
    if (!reviewContent.trim()) { setReviewError('请输入评价内容'); return }

    setSubmittingReview(true)
    setReviewError('')

    const { error: rErr } = await supabase.from('reviews').insert({
      food_spot_id: id,
      user_id: user.id,
      user_name: user.email?.split('@')[0] || '匿名用户',
      user_avatar: '',
      rating: reviewRating,
      taste_rating: reviewTaste,
      environment_rating: reviewEnv,
      service_rating: reviewService,
      content: reviewContent.trim(),
    })

    if (rErr) {
      setReviewError(rErr.message)
    } else {
      // Recalculate average rating
      const { data: updatedRevs } = await supabase
        .from('reviews')
        .select('rating')
        .eq('food_spot_id', id)

      if (updatedRevs && updatedRevs.length > 0) {
        const avg = updatedRevs.reduce((s, r) => s + r.rating, 0) / updatedRevs.length
        await supabase.from('food_spots').update({ avg_rating: Math.round(avg * 10) / 10 }).eq('id', id)
      }

      setReviewContent('')
      setShowReviewForm(false)

      // Reload reviews
      const { data: revs } = await supabase
        .from('reviews')
        .select('*')
        .eq('food_spot_id', id)
        .order('created_at', { ascending: false })

      if (revs) setReviews(revs)
    }

    setSubmittingReview(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!food) {
    return (
      <div className="text-center py-32">
        <span className="text-6xl">😢</span>
        <p className="text-gray-500 mt-4">美食不存在或已被删除</p>
        <Link href="/" className="inline-block mt-4 text-orange-500 hover:text-orange-600">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-16">
      {/* 图片轮播 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="aspect-[16/9] bg-gray-100 relative">
          {images.length > 0 ? (
            <img
              src={images[activeImage].url}
              alt={food.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
              🍽️
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                  i === activeImage ? 'border-orange-500' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 左侧：详情 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{food.name}</h1>
                <span className="inline-block mt-2 px-3 py-1 bg-orange-50 text-orange-600 text-sm rounded-lg">
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
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <StarRating rating={food.avg_rating} size="sm" readonly />
                  <span className="text-lg font-bold text-yellow-500">{food.avg_rating?.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-400">{'💰'.repeat(food.price_level || 1)}</span>
              </div>
            </div>

            <p className="mt-4 text-gray-600 leading-relaxed">
              {food.description}
            </p>

            <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{food.address}</span>
            </div>

            {food.opening_hours && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{food.opening_hours}</span>
              </div>
            )}
          </div>

          {/* 位置地图 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">📍 位置</h2>
            <div className="aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden">
              <MapView lng={food.longitude} lat={food.latitude} name={food.name} />
            </div>
          </div>

          {/* 评价 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                评价
                <span className="text-sm font-normal text-gray-400 ml-2">共 {reviews.length} 条</span>
              </h2>
              {user && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-1.5 text-sm font-medium text-orange-500 border border-orange-500 rounded-xl hover:bg-orange-50 transition"
                >
                  {showReviewForm ? '取消' : '写评价'}
                </button>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={handleReview} className="mb-6 p-4 bg-orange-50 rounded-xl space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <StarInput value={reviewTaste} onChange={setReviewTaste} label="口味" />
                  <StarInput value={reviewEnv} onChange={setReviewEnv} label="环境" />
                  <StarInput value={reviewService} onChange={setReviewService} label="服务" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">综合评分</label>
                  <StarInput value={reviewRating} onChange={setReviewRating} label="" />
                </div>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="说说你的感受..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                />
                {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  {submittingReview ? '提交中...' : '提交评价'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无评价，快来写第一条吧</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-sm font-medium text-orange-600">
                          {review.user_name?.[0] || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{review.user_name}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" readonly />
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>口味 {review.taste_rating}★</span>
                      <span>环境 {review.environment_rating}★</span>
                      <span>服务 {review.service_rating}★</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{review.content}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：信息卡片 */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">评分详情</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">综合</span>
                <span className="font-medium">{food.avg_rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">价格</span>
                <span>{'💰'.repeat(food.price_level || 1)}</span>
              </div>
            </div>
          </div>

          {user && user.id === food.user_id && (
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
              <p className="text-sm text-orange-700">这是你添加的美食</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 简单的地图视图组件
function MapView({ lng, lat, name }: { lng: number; lat: number; name: string }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const amapKey = process.env.NEXT_PUBLIC_AMAP_KEY
    if (!amapKey || amapKey === 'your_amap_key') return

    async function loadMap(key: string) {
      const AMapLoader = (await import('@amap/amap-jsapi-loader')).default
      const AMap = await AMapLoader.load({ key, version: '2.0' })

      const map = new AMap.Map(`map-${lng}-${lat}`, {
        zoom: 16,
        center: [lng, lat],
      })

      new AMap.Marker({
        position: [lng, lat],
        title: name,
        map,
      })

      setReady(true)
    }
    loadMap(amapKey)
  }, [lng, lat, name])

  const key = process.env.NEXT_PUBLIC_AMAP_KEY as string
  if (!key || key === 'your_amap_key') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-400">请配置高德地图 API Key</p>
      </div>
    )
  }

  return (
    <div id={`map-${lng}-${lat}`} className="w-full h-full" />
  )
}
