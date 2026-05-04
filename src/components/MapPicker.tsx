'use client'

import { useEffect, useRef, useState } from 'react'

interface MapPickerProps {
  onLocationSelect: (lng: number, lat: number, address: string) => void
  initialLocation?: [number, number]
  height?: string
}

declare global {
  interface Window {
    AMap: any
  }
}

export default function MapPicker({ onLocationSelect, initialLocation, height = '400px' }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [address, setAddress] = useState('')
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return

    const key = process.env.NEXT_PUBLIC_AMAP_KEY
    const securityKey = process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY
    if (!key || key === 'your_amap_key') {
      setLoading(false)
      return
    }

    import('@amap/amap-jsapi-loader').then((mod) =>
      mod.default.load({ key, version: '2.0', securityJsCode: securityKey } as any)
    ).then((AMap: any) => {
      const map = new AMap.Map(mapRef.current!, {
        zoom: 15,
        center: initialLocation || [116.397428, 39.90923],
        layers: [new AMap.TileLayer.Satellite()],
        resizeEnable: true,
      })

      // 先添加标准图层，再添加卫星图层做底图
      // 其实用默认图层就行
      map.setLayers([new AMap.TileLayer()])

      mapInstance.current = map

      if (initialLocation) {
        const marker = new AMap.Marker({
          position: initialLocation,
          draggable: true,
        })
        markerRef.current = marker
        map.add(marker)
        getAddress(AMap, initialLocation[0], initialLocation[1])
      }

      map.on('click', (e: any) => {
        const { lng, lat } = e.lnglat
        if (markerRef.current) {
          markerRef.current.setPosition([lng, lat])
        } else {
          const marker = new AMap.Marker({
            position: [lng, lat],
            draggable: true,
          })
          markerRef.current = marker
          map.add(marker)
        }
        getAddress(AMap, lng, lat)
      })

      setMapReady(true)
      setLoading(false)
    }).catch((err: any) => {
      console.error('高德地图加载失败:', err)
      setLoading(false)
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
      }
    }
  }, [])

  const getAddress = async (AMap: any, lng: number, lat: number) => {
    try {
      const geocoder = new AMap.Geocoder({ city: '全国' })
      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete') {
          const addr = result.regeocode.formattedAddress || '获取地址失败'
          setAddress(addr)
          onLocationSelect(lng, lat, addr)
        }
      })
    } catch (e) {
      console.error('逆地理编码失败:', e)
    }
  }

  const searchAddress = async () => {
    if (!searchText.trim() || !mapInstance.current) return
    const AMap = window.AMap
    if (!AMap) return

    try {
      const geocoder = new AMap.Geocoder({ city: '全国' })
      geocoder.getLocation(searchText, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const { location, formattedAddress } = result.geocodes[0]
          const lng = location.getLng()
          const lat = location.getLat()
          mapInstance.current.setCenter([lng, lat])
          mapInstance.current.setZoom(17)

          if (markerRef.current) {
            markerRef.current.setPosition([lng, lat])
          } else {
            const marker = new AMap.Marker({
              position: [lng, lat],
              draggable: true,
            })
            markerRef.current = marker
            mapInstance.current.add(marker)
          }
          setAddress(formattedAddress || searchText)
          onLocationSelect(lng, lat, formattedAddress || searchText)
        }
      })
    } catch (e) {
      console.error('地址搜索失败:', e)
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
