'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface IndexData {
  index_code: string
  index_name: string | null
  trade_date: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  change: number | null
  pct_chg: number | null
  volume: number | null
  amount: number | null
}

export function IndexDataChart() {
  const [data, setData] = useState<IndexData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIndexData = async () => {
      try {
        const { data: indexData } = await supabase
          .from('index_data')
          .select('*')
          .order('trade_date', { ascending: false })
          .limit(10)

        setData(indexData || [])
      } catch (error) {
        console.error('获取指数数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIndexData()
  }, [])

  if (loading) {
    return <div className="text-center py-4">加载中...</div>
  }

  return (
    <div className="space-y-4">
      {data.slice(0, 3).map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.index_name || item.index_code}</div>
                <div className="text-2xl font-bold">{item.close?.toFixed(2) || '--'}</div>
              </div>
              <div className="text-right">
                <div className={`${
                  (item.change || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {item.change ? (item.change > 0 ? '+' : '') + item.change.toFixed(2) : '--'}
                </div>
                <div className={`${
                  (item.pct_chg || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {item.pct_chg ? (item.pct_chg > 0 ? '+' : '') + item.pct_chg.toFixed(2) + '%' : '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 