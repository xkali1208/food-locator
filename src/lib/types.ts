export interface FoodSpot {
  id: string
  name: string
  description: string
  category: string
  latitude: number
  longitude: number
  address: string
  avg_rating: number
  price_level: number
  opening_hours: string
  user_id: string
  created_at: string
}

export interface FoodImage {
  id: string
  food_spot_id: string
  url: string
  is_cover: boolean
}

export interface Review {
  id: string
  food_spot_id: string
  user_id: string
  user_name: string
  user_avatar: string
  rating: number
  taste_rating: number
  environment_rating: number
  service_rating: number
  content: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string
}

export type Category = {
  id: string
  name: string
  icon: string
}

export const CATEGORIES: Category[] = [
  { id: 'chinese', name: '中餐', icon: '🥟' },
  { id: 'western', name: '西餐', icon: '🍝' },
  { id: 'japanese', name: '日料', icon: '🍣' },
  { id: 'korean', name: '韩餐', icon: '🥘' },
  { id: 'snack', name: '小吃', icon: '🍢' },
  { id: 'dessert', name: '甜品', icon: '🍰' },
  { id: 'drink', name: '饮品', icon: '🧋' },
  { id: 'bbq', name: '烧烤', icon: '🥩' },
  { id: 'hotpot', name: '火锅', icon: '🫕' },
  { id: 'other', name: '其他', icon: '🍽️' },
]
