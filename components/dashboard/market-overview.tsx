'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface MarketStats {
  totalStocks: number
  activeStocks: number
  avgChange: number
  totalVolume: number
}

export function MarketOverview() {
  const [stats, setStats] = useState<MarketStats>({
    totalStocks: 0,
    activeStocks: 0,
    avgChange: 0,
    totalVolume: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarketStats = async () => {
      try {
        // 获取股票总数
        const { count: totalStocks } = await supabase
          .from('stock_basic')
          .select('*', { count: 'exact', head: true })

        // 获取今日有交易的股票数量和平均涨跌幅
        const today = new Date().toISOString().split('T')[0]
        const { data: todayQuotes, count: activeStocks } = await supabase
          .from('daily_quote')
          .select('pct_chg, volume', { count: 'exact' })
          .eq('trade_date', today)
          .not('pct_chg', 'is', null)

        // 计算平均涨跌幅和总成交量
        const avgChange = todayQuotes?.reduce((sum, quote) => sum + Number(quote.pct_chg || 0), 0) / (todayQuotes?.length || 1) || 0
        const totalVolume = todayQuotes?.reduce((sum, quote) => sum + Number(quote.volume || 0), 0) || 0

        setStats({
          totalStocks: totalStocks || 0,
          activeStocks: activeStocks || 0,
          avgChange: Number(avgChange.toFixed(2)),
          totalVolume: Math.round(totalVolume / 100000000) // 转换为亿股
        })
      } catch (error) {
        console.error('获取市场统计数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketStats()
  }, [])

  const statCards = [
    {
      title: "股票总数",
      value: stats.totalStocks.toLocaleString(),
      icon: DollarSign,
      description: "A股上市公司"
    },
    {
      title: "活跃股票",
      value: stats.activeStocks.toLocaleString(),
      icon: Activity,
      description: "今日有交易"
    },
    {
      title: "平均涨跌幅",
      value: `${stats.avgChange > 0 ? '+' : ''}${stats.avgChange}%`,
      icon: stats.avgChange >= 0 ? TrendingUp : TrendingDown,
      description: "今日平均表现",
      trend: stats.avgChange >= 0 ? 'up' : 'down'
    },
    {
      title: "总成交量",
      value: `${stats.totalVolume}亿股`,
      icon: Activity,
      description: "今日成交量"
    }
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">加载中...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">--</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${
                stat.trend === 'up' ? 'text-green-600' : 
                stat.trend === 'down' ? 'text-red-600' : 
                'text-muted-foreground'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stat.trend === 'up' ? 'text-green-600' : 
                stat.trend === 'down' ? 'text-red-600' : 
                ''
              }`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.trend && (
                <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="mt-1">
                  {stat.trend === 'up' ? '上涨' : '下跌'}
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 