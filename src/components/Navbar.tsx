'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-orange-500">
          <span className="text-2xl">🍜</span>
          <span className="hidden sm:inline">美食定位</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 rounded-lg hover:bg-orange-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">搜索</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/add"
                className="flex items-center gap-1 px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>添加美食</span>
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 rounded-lg hover:bg-orange-50 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                </button>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[160px]">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500">
                      个人中心
                    </Link>
                    <button
                      onClick={() => { signOut(); router.push('/') }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-1.5 text-sm font-medium text-orange-500 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
