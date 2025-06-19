'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface NorthboundData {
  trade_date: string
  hk_hold: number | null
  hk_hold_ratio: number | null
  net_buy: number | null
  buy_amount: number | null
  sell_amount: number | null
}

export function NorthboundCapitalChart() {
  const [data, setData] = useState<NorthboundData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNorthboundData = async () => {
      try {
        const { data: northboundData } = await supabase
          .from('northbound_capital')
          .select('*')
          .order('trade_date', { ascending: false })
          .limit(10)

        setData(northboundData || [])
      } catch (error) {
        console.error('获取北向资金数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNorthboundData()
  }, [])

  const formatMoney = (amount: number | null) => {
    if (!amount) return '--'
    if (Math.abs(amount) >= 100000000) {
      return `${(amount / 100000000).toFixed(2)}亿`
    }
    if (Math.abs(amount) >= 10000) {
      return `${(amount / 10000).toFixed(2)}万`
    }
    return amount.toFixed(2)
  }

  const formatRate = (rate: number | null) => {
    if (!rate) return '--'
    return `${rate.toFixed(4)}%`
  }

  const latestData = data[0]

  if (loading) {
    return <div className="text-center py-4">加载中...</div>
  }

  return (
    <div className="space-y-4">
      {latestData && (
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-sm font-medium">净买入</span>
              </div>
              <div className={`text-2xl font-bold ${
                (latestData.net_buy || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatMoney(latestData.net_buy)}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(latestData.trade_date).toLocaleDateString('zh-CN')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-2">持股市值</div>
              <div className="text-lg font-bold">
                {formatMoney(latestData.hk_hold)}
              </div>
              <div className="text-sm text-muted-foreground">
                占比: {formatRate(latestData.hk_hold_ratio)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-2">买卖情况</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">买入:</span>
                  <span className="text-red-600">{formatMoney(latestData.buy_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">卖出:</span>
                  <span className="text-green-600">{formatMoney(latestData.sell_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>最近走势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.slice(0, 7).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">
                  {new Date(item.trade_date).toLocaleDateString('zh-CN')}
                </span>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    (item.net_buy || 0) > 0 ? 'destructive' : 'secondary'
                  }>
                    {formatMoney(item.net_buy)}
                  </Badge>
                  {(item.net_buy || 0) > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 