'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import CountUp from "react-countup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign,
  BarChart3,
  Users,
  Zap
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getStockColor } from "@/lib/stock-colors"

interface MarketStats {
  totalStocks: number
  activeStocks: number
  avgChange: number
  totalVolume: number
  upCount: number
  downCount: number
  flatCount: number
  totalAmount: number
}

const StatCard = ({ title, value, icon: Icon, trend, subtitle, color, progress }: {
  title: string
  value: number | string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  subtitle: string
  color: string
  progress?: number
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className={`relative overflow-hidden bg-gradient-to-br ${color} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
          <Icon className="h-5 w-5 text-white/80" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold text-white mb-1">
            {typeof value === 'number' ? (
              <CountUp end={value} duration={2} preserveValue />
            ) : (
              value
            )}
          </div>
          <p className="text-xs text-white/70 mb-2">{subtitle}</p>
          
          {trend && (
            <Badge 
              variant="secondary" 
              className={`
                ${trend === 'up' ? getStockColor(1, 'full').replace('text-red-600', 'bg-red-500/20 text-red-100 border-red-400/30') : 
                  trend === 'down' ? getStockColor(-1, 'full').replace('text-green-600', 'bg-green-500/20 text-green-100 border-green-400/30') : 
                  'bg-gray-500/20 text-gray-100 border-gray-400/30'
                }
              `}
            >
              {trend === 'up' ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  上涨
                </>
              ) : trend === 'down' ? (
                <>
                  <TrendingDown className="h-3 w-3 mr-1" />
                  下跌
                </>
              ) : (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  平稳
                </>
              )}
            </Badge>
          )}

          {progress !== undefined && (
            <div className="mt-3">
              <Progress value={progress} className="h-2 bg-white/20" />
              <p className="text-xs text-white/60 mt-1">{progress.toFixed(1)}% 活跃度</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function EnhancedMarketOverview() {
  const [stats, setStats] = useState<MarketStats>({
    totalStocks: 0,
    activeStocks: 0,
    avgChange: 0,
    totalVolume: 0,
    upCount: 0,
    downCount: 0,
    flatCount: 0,
    totalAmount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarketStats = async () => {
      try {
        // 获取股票总数
        const { count: totalStocks } = await supabase
          .from('stock_basic')
          .select('*', { count: 'exact', head: true })

        // 获取今日交易数据
        const today = new Date().toISOString().split('T')[0]
        const { data: todayQuotes, count: activeStocks } = await supabase
          .from('daily_quote')
          .select('pct_chg, volume, amount', { count: 'exact' })
          .eq('trade_date', today)
          .not('pct_chg', 'is', null)
        if (todayQuotes) {
          // 计算统计数据
          const avgChange = todayQuotes.reduce((sum, quote) => sum + Number(quote.pct_chg || 0), 0) / todayQuotes.length
          const totalVolume = todayQuotes.reduce((sum, quote) => sum + Number(quote.volume || 0), 0)
          const totalAmount = todayQuotes.reduce((sum, quote) => sum + Number(quote.amount || 0), 0)
          
          // 计算涨跌统计
          const upCount = todayQuotes.filter(quote => Number(quote.pct_chg) > 0).length
          const downCount = todayQuotes.filter(quote => Number(quote.pct_chg) < 0).length
          const flatCount = todayQuotes.filter(quote => Number(quote.pct_chg) === 0).length

          setStats({
            totalStocks: totalStocks || 0,
            activeStocks: activeStocks || 0,
            avgChange: Number(avgChange.toFixed(2)),
            totalVolume: Math.round(totalVolume / 100000000), // 转换为亿股
            totalAmount: Math.round(totalAmount / 100000000), // 转换为亿元
            upCount,
            downCount,
            flatCount
          })
        }
      } catch (error) {
        console.error('获取市场统计数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const activeRate = (stats.activeStocks / stats.totalStocks) * 100
  const upRate = (stats.upCount / stats.activeStocks) * 100

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        title="股票总数"
        value={stats.totalStocks.toLocaleString()}
        icon={BarChart3}
        subtitle="A股上市公司"
        color="from-blue-500 to-blue-600"
        progress={activeRate}
      />

      <StatCard
        title="活跃股票"
        value={stats.activeStocks.toLocaleString()}
        icon={Activity}
        subtitle="今日有交易"
        color="from-green-500 to-green-600"
        trend={stats.activeStocks > stats.totalStocks * 0.8 ? 'up' : 'neutral'}
      />

      <StatCard
        title="平均涨跌幅"
        value={`${stats.avgChange > 0 ? '+' : ''}${stats.avgChange}%`}
        icon={stats.avgChange >= 0 ? TrendingUp : TrendingDown}
        subtitle="今日市场表现"
        color={stats.avgChange >= 0 ? getStockColor(1, 'gradient') : getStockColor(-1, 'gradient')}
        trend={stats.avgChange > 0 ? 'up' : stats.avgChange < 0 ? 'down' : 'neutral'}
      />

      <StatCard
        title="总成交额"
        value={`${stats.totalAmount}亿元`}
        icon={DollarSign}
        subtitle="今日成交额"
        color="from-purple-500 to-purple-600"
        progress={upRate}
      />
    </motion.div>
  )
} 