'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getStockColor, formatPctChg, formatLargeNumber } from "@/lib/stock-colors"

interface KLineData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  pct_chg: number
  amount: number
}

export function AdvancedKLineChart() {
  const [klineData, setKlineData] = useState<KLineData[]>([])
  const [selectedStock, setSelectedStock] = useState('000001')
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKLineData = async () => {
      try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - (timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 90))

        const { data } = await supabase
          .from('daily_quote')
          .select('*')
          .eq('stock_code', selectedStock)
          .gte('trade_date', startDate.toISOString().split('T')[0])
          .lte('trade_date', endDate.toISOString().split('T')[0])
          .order('trade_date', { ascending: true })

        if (data) {
          const formattedData: KLineData[] = data.map((item: any) => ({
            date: item.trade_date,
            open: Number(item.open),
            high: Number(item.high), 
            low: Number(item.low),
            close: Number(item.close),
            volume: Number(item.volume),
            pct_chg: Number(item.pct_chg),
            amount: Number(item.amount)
          }))
          setKlineData(formattedData)
        }
      } catch (error) {
        console.error('获取K线数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKLineData()
  }, [selectedStock, timeRange])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      if (data) {
        return (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border">
            <p className="font-medium mb-2">{`日期: ${label}`}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>开盘: {data.open?.toFixed(2)}</p>
              <p>收盘: {data.close?.toFixed(2)}</p>
              <p>最高: {data.high?.toFixed(2)}</p>
              <p>最低: {data.low?.toFixed(2)}</p>
              <p className={getStockColor(data.pct_chg, 'text')}>
                涨跌幅: {formatPctChg(data.pct_chg)}
              </p>
              <p>成交量: {formatLargeNumber(data.volume)}</p>
            </div>
          </div>
        )
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">加载K线数据中...</p>
        </div>
      </div>
    )
  }

  const latestData = klineData[klineData.length - 1]
  const isPositive = latestData?.pct_chg >= 0

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      {/* 控制栏 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Select value={selectedStock} onValueChange={setSelectedStock}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择股票" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="000001">平安银行</SelectItem>
              <SelectItem value="000002">万科A</SelectItem>
              <SelectItem value="600519">贵州茅台</SelectItem>
              <SelectItem value="600036">招商银行</SelectItem>
              <SelectItem value="000858">五粮液</SelectItem>
            </SelectContent>
          </Select>

          {latestData && (
            <Badge 
              variant="outline"
              className={getStockColor(latestData.pct_chg, 'full')}
            >
              当前价: {latestData.close.toFixed(2)} 
              <span className="ml-1 flex items-center">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPctChg(latestData.pct_chg)}
              </span>
            </Badge>
          )}
        </div>
        
        <div className="flex space-x-1">
          {[
            { key: '7d', label: '7天' },
            { key: '30d', label: '30天' },
            { key: '90d', label: '90天' }
          ].map((range) => (
            <Button
              key={range.key}
              variant={timeRange === range.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range.key)}
              className="text-xs h-7"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* K线图 */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={klineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              yAxisId="price"
              stroke="#64748b"
              fontSize={12}
              domain={['dataMin * 0.95', 'dataMax * 1.05']}
            />
            <YAxis 
              yAxisId="volume"
              orientation="right"
              stroke="#64748b" 
              fontSize={12}
              tickFormatter={(value) => (value / 10000).toFixed(0) + 'W'}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Bar 
              yAxisId="volume"
              dataKey="volume" 
              fill="#3b82f6" 
              fillOpacity={0.3}
              name="成交量"
            />
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="close" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="收盘价"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
} 