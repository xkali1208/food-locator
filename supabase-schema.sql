-- ============================================
-- 美食定位 - Supabase 数据库建表脚本
-- 在 Supabase Dashboard > SQL Editor 中运行
-- ============================================

-- 1. 美食表
CREATE TABLE IF NOT EXISTS food_spots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  avg_rating DOUBLE PRECISION DEFAULT 0,
  price_level INTEGER DEFAULT 1,
  opening_hours TEXT DEFAULT '',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 美食图片表
CREATE TABLE IF NOT EXISTS food_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_spot_id UUID NOT NULL REFERENCES food_spots(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 评价表
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_spot_id UUID NOT NULL REFERENCES food_spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT '匿名用户',
  user_avatar TEXT DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  taste_rating INTEGER DEFAULT 5,
  environment_rating INTEGER DEFAULT 5,
  service_rating INTEGER DEFAULT 5,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_food_spots_user_id ON food_spots(user_id);
CREATE INDEX IF NOT EXISTS idx_food_spots_category ON food_spots(category);
CREATE INDEX IF NOT EXISTS idx_food_spots_created_at ON food_spots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_images_food_spot_id ON food_images(food_spot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_food_spot_id ON reviews(food_spot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

-- food_spots
ALTER TABLE food_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人都可以查看美食" ON food_spots
  FOR SELECT USING (true);

CREATE POLICY "登录用户可以添加美食" ON food_spots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的美食" ON food_spots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的美食" ON food_spots
  FOR DELETE USING (auth.uid() = user_id);

-- food_images
ALTER TABLE food_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人都可以查看图片" ON food_images
  FOR SELECT USING (true);

CREATE POLICY "登录用户可以上传图片" ON food_images
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM food_spots WHERE id = food_spot_id
  ));

-- reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人都可以查看评价" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "登录用户可以写评价" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的评价" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 存储桶 (Storage Bucket)
-- 请在 Supabase Dashboard > Storage 中手动创建
-- Bucket 名称: food-images
-- 公开访问: ON
-- ============================================
-- 或者运行以下 SQL 创建存储桶:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('food-images', 'food-images', true);
