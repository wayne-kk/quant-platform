'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getLatestTradingDate, formatTradingDateDisplay, type TradingDateInfo } from "@/lib/trading-utils"

interface VolumeData {
  name: string
  value: number
  color: string
  percentage: number
}

interface ExchangeData {
  exchange: string
  totalVolume: number
  totalAmount: number
  stockCount: number
}

export function TradingVolumeDistribution() {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
  const [exchangeData, setExchangeData] = useState<ExchangeData[]>([])
  const [loading, setLoading] = useState(true)
  const [tradingDateInfo, setTradingDateInfo] = useState<TradingDateInfo | null>(null)

  useEffect(() => {
    const fetchVolumeData = async () => {
      try {
        // 获取最近的交易日期信息
        const dateInfo = await getLatestTradingDate()
        setTradingDateInfo(dateInfo)

        // 获取最近交易日的数据
        const { data: quotes } = await supabase
          .from('daily_quote')
          .select(`
            volume,
            amount,
            stock_basic!inner(exchange)
          `)
          .eq('trade_date', dateInfo.date)
          .not('volume', 'is', null)

        if (quotes) {
          // 计算各交易所数据
          const exchangeStats: Record<string, ExchangeData> = {}

          quotes.forEach((quote: any) => {
            const exchange = quote.stock_basic.exchange
            const volume = Number(quote.volume)
            const amount = Number(quote.amount)

            if (!exchangeStats[exchange]) {
              exchangeStats[exchange] = {
                exchange,
                totalVolume: 0,
                totalAmount: 0,
                stockCount: 0
              }
            }

            exchangeStats[exchange].totalVolume += volume
            exchangeStats[exchange].totalAmount += amount
            exchangeStats[exchange].stockCount += 1
          })

          const exchangeArray = Object.values(exchangeStats)
          setExchangeData(exchangeArray)

          // 计算总量用于百分比
          const totalVolume = exchangeArray.reduce((sum, item) => sum + item.totalVolume, 0)

          // 生成饼图数据
          const pieData: VolumeData[] = exchangeArray.map((item, index) => ({
            name: item.exchange,
            value: item.totalVolume,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index] || '#8b5cf6',
            percentage: (item.totalVolume / totalVolume) * 100
          }))

          setVolumeData(pieData)
        }
      } catch (error) {
        console.error('获取成交量数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVolumeData()
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            成交量: {(data.value / 100000000).toFixed(1)}亿股
          </p>
          <p className="text-sm">
            占比: {data.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-muted-foreground">加载成交数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="h-full flex flex-col space-y-4"
    >
      {/* 饼图 */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="60%">
          <PieChart>
            <Pie
              data={volumeData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {volumeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 统计列表 */}
      <div className="space-y-2">
        {exchangeData.map((item, index) => (
          <motion.div
            key={item.exchange}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-2 rounded bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50"
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: volumeData[index]?.color }}
              />
              <span className="text-sm font-medium">{item.exchange}</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium">
                {(item.totalVolume / 100000000).toFixed(1)}亿股
              </p>
              <p className="text-xs text-muted-foreground">
                {item.stockCount}只股票
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 数据日期显示 */}
      {tradingDateInfo && (
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>数据日期: {tradingDateInfo.date}</span>
            {!tradingDateInfo.isToday && (
              <Badge variant="outline" className="text-xs px-1">
                <AlertCircle className="w-2 h-2 mr-1" />
                {formatTradingDateDisplay(tradingDateInfo)}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* 汇总信息 */}
      <div className="pt-2 border-t">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">总成交量</p>
            <p className="font-medium">
              {(volumeData.reduce((sum, item) => sum + item.value, 0) / 100000000).toFixed(1)}亿股
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">活跃股票</p>
            <p className="font-medium">
              {exchangeData.reduce((sum, item) => sum + item.stockCount, 0)}只
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 