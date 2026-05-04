import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * 获取 Supabase 客户端实例（懒加载）
 * 这样即使环境变量占位未配置也不会导致构建失败
 */
export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // 如果未配置，返回一个不会真正执行查询的 mock client
  if (!url.startsWith('http')) {
    client = createClient('https://placeholder.supabase.co', 'placeholder-key-for-build')
    return client
  }

  client = createClient(url, key)
  return client
}

// 保留 supabase 导出以兼容已有代码，但会检测是否已正确配置
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isValidConfig = url.startsWith('http') && key.length > 10

export const supabase = isValidConfig
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder-key-for-build')

// 检查配置是否有效的辅助函数
export function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return url.startsWith('http') && key.length > 10
}
