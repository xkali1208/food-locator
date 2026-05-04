'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface MapPickerProps {
  onLocationSelect: (lng: number, lat: number, address: string) => void
  initialLocation?: [number, number]
  height?: string
}

declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: { securityJsCode: string }
  }
}

export default function MapPicker({ onLocationSelect, initialLocation, height = '400px' }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const AMapRef = useRef<any>(null)
  const [address, setAddress] = useState('')
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getAddress = useCallback((AMap: any, lng: number, lat: number) => {
    try {
      const geocoder = new AMap.Geocoder({ city: '全国' })
      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete') {
          const addr = result.regeocode.formattedAddress || '获取地址失败'
          setAddress(addr)
          onLocationSelect(lng, lat, addr)
        } else {
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          onLocationSelect(lng, lat, `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
      })
    } catch (e) {
      console.error('逆地理编码失败:', e)
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      onLocationSelect(lng, lat, `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }
  }, [onLocationSelect])

  const placeMarker = useCallback((AMap: any, map: any, lng: number, lat: number) => {
    if (markerRef.current) {
      markerRef.current.setPosition([lng, lat])
    } else {
      const marker = new AMap.Marker({
        position: [lng, lat],
        draggable: true,
      })
      markerRef.current = marker
      map.add(marker)

      marker.on('dragend', (e: any) => {
        const pos = e.target.getPosition()
        getAddress(AMap, pos.getLng(), pos.getLat())
      })
    }
    map.setCenter([lng, lat])
    getAddress(AMap, lng, lat)
  }, [getAddress])

  useEffect(() => {
    if (!mapRef.current) return

    const key = process.env.NEXT_PUBLIC_AMAP_KEY
    const securityKey = process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY
    if (!key || key === 'your_amap_key') {
      setError('请先配置高德地图 API Key')
      setLoading(false)
      return
    }

    // 全局安全配置（更可靠的方式）
    if (securityKey) {
      window._AMapSecurityConfig = { securityJsCode: securityKey }
    }

    let destroyed = false

    import('@amap/amap-jsapi-loader').then((mod) =>
      mod.default.load({
        key,
        version: '2.0',
        securityJsCode: securityKey,
      } as any)
    ).then((AMap: any) => {
      if (destroyed) return

      AMapRef.current = AMap

      const map = new AMap.Map(mapRef.current!, {
        zoom: 15,
        center: initialLocation || [116.397428, 39.90923],
        resizeEnable: true,
        mapStyle: 'amap://styles/light',
      })

      mapInstance.current = map

      if (initialLocation) {
        placeMarker(AMap, map, initialLocation[0], initialLocation[1])
      }

      map.on('click', (e: any) => {
        const { lng, lat } = e.lnglat
        placeMarker(AMap, map, lng, lat)
      })

      setLoading(false)
    }).catch((err: any) => {
      if (destroyed) return
      console.error('高德地图加载失败:', err)
      setError('地图加载失败，请检查网络或高德地图 Key 配置')
      setLoading(false)
    })

    return () => {
      destroyed = true
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
      }
    }
  }, [])

  const searchAddress = async () => {
    if (!searchText.trim() || !mapInstance.current) return
    const AMap = AMapRef.current || window.AMap
    if (!AMap) {
      setError('地图未加载完成，请稍后再试')
      return
    }

    try {
      const geocoder = new AMap.Geocoder({ city: '全国' })
      geocoder.getLocation(searchText, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const geo = result.geocodes[0]
          const lng = geo.location.getLng()
          const lat = geo.location.getLat()
          const addr = geo.formattedAddress || searchText

          placeMarker(AMap, mapInstance.current, lng, lat)
          mapInstance.current.setZoom(17)
          setAddress(addr)
        } else {
          setError('未找到该地址，请换个关键词试试')
        }
      })
    } catch (e) {
      console.error('地址搜索失败:', e)
      setError('地址搜索失败，请重试')
    }
  }

  const key = process.env.NEXT_PUBLIC_AMAP_KEY
  if (!key || key === 'your_amap_key') {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-700 font-medium">⚠️ 请先配置高德地图 API Key</p>
        <p className="text-yellow-600 text-sm mt-1">在 .env.local 中设置 NEXT_PUBLIC_AMAP_KEY</p>
        <p className="text-gray-500 text-xs mt-2">访问 https://console.amap.com 注册获取</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
          placeholder="搜索地址，如：北京市朝阳区..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
        <button
          type="button"
          onClick={searchAddress}
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition shadow-sm"
        >
          搜索
        </button>
      </div>

      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-xl border border-gray-200 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-2">地图加载中...</p>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 z-10">
            <div className="text-center px-6">
              <span className="text-4xl">🗺️</span>
              <p className="text-sm text-red-500 mt-2">{error}</p>
            </div>
          </div>
        )}
      </div>

      {address && (
        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
          <span className="text-green-500 mt-0.5">📍</span>
          <div>
            <p className="text-sm font-medium text-green-800">已选位置</p>
            <p className="text-sm text-green-600">{address}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        💡 点击地图选择位置，或拖动标记微调。搜索地址可快速定位。
      </p>
    </div>
  )
}
