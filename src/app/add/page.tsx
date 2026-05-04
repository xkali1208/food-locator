'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { CATEGORIES } from '@/lib/types'
import MapPicker from '@/components/MapPicker'
import ImageUpload from '@/components/ImageUpload'
import { StarInput } from '@/components/StarRating'
import Link from 'next/link'

export default function AddFoodPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('chinese')
  const [priceLevel, setPriceLevel] = useState(2)
  const [rating, setRating] = useState(0)
  const [openingHours, setOpeningHours] = useState('')
  const [lng, setLng] = useState<number>(0)
  const [lat, setLat] = useState<number>(0)
  const [address, setAddress] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (authLoading) return null

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="text-5xl">🔒</span>
          <h1 className="text-xl font-bold text-gray-900 mt-3">请先登录</h1>
          <p className="text-sm text-gray-500 mt-1">登录后才能添加美食哦</p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition"
          >
            去登录
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('请输入美食名称'); return }
    if (!description.trim()) { setError('请输入美食简介'); return }
    if (!lng || !lat) { setError('请在地图上选择位置'); return }
    if (rating === 0) { setError('请给个评分吧'); return }

    setSubmitting(true)

    try {
      // 1. Insert food spot
      const { data: food, error: insertError } = await supabase
        .from('food_spots')
        .insert({
          name: name.trim(),
          description: description.trim(),
          category,
          latitude: lat,
          longitude: lng,
          address,
          avg_rating: rating,
          price_level: priceLevel,
          opening_hours: openingHours,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 2. Upload images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split('.').pop()
          const filePath = `${user.id}/${food.id}/${Date.now()}_${i}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('food-images')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('food-images')
            .getPublicUrl(filePath)

          await supabase.from('food_images').insert({
            food_spot_id: food.id,
            url: publicUrl,
            is_cover: i === 0,
          })
        }
      }

      router.push(`/food/${food.id}`)
    } catch (err: any) {
      setError(err.message || '提交失败，请重试')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">添加美食</h1>
        <p className="text-sm text-gray-500 mt-1">记录你发现的美味，分享给更多人</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            基本信息
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">美食名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：老北京炸酱面"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">美食简介 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述一下这道美食的味道、口感、特色..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">消费水平</label>
              <select
                value={priceLevel}
                onChange={(e) => setPriceLevel(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              >
                <option value={1}>💰 便宜</option>
                <option value={2}>💰💰 适中</option>
                <option value={3}>💰💰💰 偏贵</option>
                <option value={4}>💰💰💰💰 高端</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">营业时间（选填）</label>
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="如：10:00 - 22:00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        </section>

        {/* 评分 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            评分 *
          </h2>
          <StarInput value={rating} onChange={setRating} label="综合评分" />
        </section>

        {/* 位置选择 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            选择位置 *
          </h2>
          <MapPicker
            onLocationSelect={(lng, lat, addr) => {
              setLng(lng)
              setLat(lat)
              setAddress(addr)
            }}
          />
        </section>

        {/* 图片上传 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            美食照片
          </h2>
          <ImageUpload images={images} onChange={setImages} />
        </section>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition shadow-sm text-base"
        >
          {submitting ? '提交中...' : '发布美食 🎉'}
        </button>
      </form>
    </div>
  )
}
