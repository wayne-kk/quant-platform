'use client'

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3, Calendar, AlertCircle, Activity, Pause, Play } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getStockColor, formatPctChg } from "@/lib/stock-colors"
import { getLatestTradingDate, formatTradingDateDisplay, type TradingDateInfo } from "@/lib/trading-utils"
import { 
  isMarketOpen, 
  getMarketStatus, 
  isTradeDay,
  shouldUpdateRealTime,
  getUpdateInterval,
  formatMarketStatus,
  getMarketStatusColor,
  getNextMarketOpenTime,
  type MarketStatus
} from '@/lib/market-utils'
import { useMarketTimer } from '@/lib/useMarketTimer'

interface IndexData {
  trade_date: string
  index_name: string
  close: number
  pct_chg: number
  open: number
  high: number
  low: number
}

interface MinuteData {
  time: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  amount: number
  avgPrice: number
}

interface ChartData {
  time: string
  date?: string
  [key: string]: string | number | undefined
}

const indexMapping = {
  'sh000001': { name: '上证指数', code: '000001' },
  'sz399001': { name: '深证成指', code: '399001' },
  'sz399006': { name: '创业板指', code: '399006' },
  'sh000300': { name: '沪深300', code: '000300' },
  'sh000905': { name: '中证500', code: '000905' }
}

const indexColors = {
  '上证指数': '#3b82f6',
  '深证成指': '#10b981',
  '创业板指': '#f59e0b',
  '沪深300': '#8b5cf6',
  '中证500': '#ef4444'
}

export function RealTimeIndexChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [latestData, setLatestData] = useState<Record<string, IndexData>>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today')
  const [tradingDateInfo, setTradingDateInfo] = useState<TradingDateInfo | null>(null)
  const [isRealTime, setIsRealTime] = useState(false)
  const [marketStatus, setMarketStatus] = useState<'closed' | 'open' | 'break'>('closed')
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null)
  
  // 获取分时数据
  const fetchMinuteData = useCallback(async (symbol: string): Promise<MinuteData[]> => {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const startDate = `${today} 09:30:00`
      const endDate = `${today} 15:00:00`
      
      const response = await fetch(
        `/api/index-minute-data?symbol=${symbol}&period=1&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`,
        { 
          signal: AbortSignal.timeout(10000) // 10秒超时
        }
      )
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: 获取分时数据失败`)
      
      const data = await response.json()
      
      // 数据验证
      if (!Array.isArray(data)) {
        console.warn(`${symbol}返回的数据格式不正确:`, data)
        return []
      }
      
      // 过滤无效数据
      const validData = data.filter((item: any) => 
        item && 
        typeof item.time === 'string' && 
        typeof item.close === 'number' && 
        !isNaN(item.close)
      )
      
      return validData
    } catch (error) {
      console.error(`获取${symbol}分时数据失败:`, error)
      return []
    }
  }, [])

  // 获取历史日线数据
  const fetchHistoricalData = useCallback(async () => {
    try {
      const dateInfo = await getLatestTradingDate()
      setTradingDateInfo(dateInfo)

      const endDate = new Date(dateInfo.date)
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - (timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1))

      const { data: indexData } = await supabase
        .from('index_data')
        .select('*')
        .gte('trade_date', startDate.toISOString().split('T')[0])
        .lte('trade_date', dateInfo.date)
        .order('trade_date', { ascending: true })

      if (indexData) {
        const groupedData: Record<string, Record<string, number>> = {}
        const latest: Record<string, IndexData> = {}

        indexData.forEach((item: any) => {
          const date = item.trade_date
          const indexName = Object.values(indexMapping).find(m => m.code === item.index_code.slice(-6))?.name

          if (indexName) {
            if (!groupedData[date]) {
              groupedData[date] = {}
            }
            groupedData[date][indexName] = item.close

            if (!latest[indexName] || new Date(item.trade_date) > new Date(latest[indexName].trade_date)) {
              latest[indexName] = item
            }
          }
        })

                 const chartArray: ChartData[] = Object.keys(groupedData)
           .sort()
           .map(date => {
             const item: ChartData = {
               time: date,
               date,
             }
             // 动态添加各个指数的数据
             Object.keys(indexColors).forEach(indexName => {
               item[indexName] = groupedData[date][indexName] || 0
             })
             return item
           })

        setChartData(chartArray)
        setLatestData(latest)
      }
    } catch (error) {
      console.error('获取历史数据失败:', error)
    }
  }, [timeRange])

  // 获取今日分时数据
  const fetchTodayMinuteData = useCallback(async () => {
    try {
      const promises = Object.entries(indexMapping).map(async ([key, { name, code }]) => {
        const data = await fetchMinuteData(code)
        return { name, data }
      })

      const results = await Promise.all(promises)
      
      // 合并所有指数的分时数据
      const timeMap: Record<string, ChartData> = {}
      
              results.forEach(({ name, data }) => {
          data.forEach((item) => {
            const time = item.time
            if (!timeMap[time]) {
              const item: ChartData = { time }
              // 动态初始化各个指数为0
              Object.keys(indexColors).forEach(indexName => {
                item[indexName] = 0
              })
              timeMap[time] = item
            }
            timeMap[time][name] = item.close
          })
        })

      const chartArray = Object.values(timeMap).sort((a, b) => a.time.localeCompare(b.time))
      setChartData(chartArray)

      // 更新最新数据
      const latest: Record<string, IndexData> = {}
      results.forEach(({ name, data }) => {
        if (data.length > 0) {
          const lastItem = data[data.length - 1]
          latest[name] = {
            trade_date: lastItem.time.split(' ')[0],
            index_name: name,
            close: lastItem.close,
            pct_chg: ((lastItem.close - data[0].open) / data[0].open) * 100,
            open: data[0].open,
            high: Math.max(...data.map(d => d.high)),
            low: Math.min(...data.map(d => d.low))
          }
        }
      })
      setLatestData(latest)
      
    } catch (error) {
      console.error('获取分时数据失败:', error)
    }
  }, [fetchMinuteData])

  // 用 useMarketTimer 替换原有定时推送逻辑
  useMarketTimer(
    useCallback(() => {
      if (timeRange === 'today') {
        fetchTodayMinuteData()
        setMarketStatus(getMarketStatus())
      }
    }, [timeRange, fetchTodayMinuteData]),
    isRealTime && timeRange === 'today'
  )

  // 初始化数据加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      if (timeRange === 'today') {
        await fetchTodayMinuteData()
        setMarketStatus(getMarketStatus())
      } else {
        await fetchHistoricalData()
      }
      setLoading(false)
    }
    loadData()
  }, [timeRange, fetchTodayMinuteData, fetchHistoricalData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isToday = timeRange === 'today'
      const timeLabel = isToday ? 
        new Date(label).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) :
        label

      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{isToday ? '时间' : '日期'}: {timeLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value?.toFixed(2)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">加载指数数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="h-full flex flex-col"
    >
      {/* 数据日期和状态显示 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {timeRange === 'today' ? (
            <div className="flex items-center gap-2">
              <span>今日分时</span>
              <Badge 
                variant={marketStatus === 'open' ? 'default' : 'secondary'}
                className={`text-xs ${
                  marketStatus === 'open' ? 'bg-green-500 text-white' :
                  marketStatus === 'break' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}
              >
                {marketStatus === 'open' ? '开市中' : 
                 marketStatus === 'break' ? '午休' : '闭市'}
              </Badge>
              {nextUpdateTime && marketStatus !== 'open' && (
                <span className="text-xs">
                  下次开市: {nextUpdateTime.toLocaleString('zh-CN')}
                </span>
              )}
            </div>
          ) : tradingDateInfo && (
            <div className="flex items-center gap-2">
              <span>数据日期: {tradingDateInfo.date}</span>
              {!tradingDateInfo.isToday && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formatTradingDateDisplay(tradingDateInfo)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center justify-between mb-4">
                  {/* 指数数据显示 */}
          <div className="flex items-center space-x-2 flex-wrap">
            {Object.keys(latestData).slice(0, 3).map((indexName) => {
              const data = latestData[indexName]
              if (!data) return null
              
              const isPositive = data.pct_chg >= 0
              return (
                <Badge
                  key={indexName}
                  variant="outline"
                  className={`text-xs ${getStockColor(data.pct_chg, 'full')} transition-colors duration-300`}
                >
                  {indexName}: {data.close.toFixed(2)}
                  <span className="ml-1 flex items-center">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatPctChg(data.pct_chg)}
                  </span>
                  {isRealTime && timeRange === 'today' && marketStatus === 'open' && (
                    <div className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </Badge>
              )
            })}
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center space-x-2">
          {/* 实时更新控制 */}
          {timeRange === 'today' && (
            <Button
              variant={isRealTime ? "default" : "outline"}
              size="sm"
              onClick={() => setIsRealTime(!isRealTime)}
              className="text-xs h-7"
            >
              {isRealTime ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  停止实时
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  开始实时
                </>
              )}
            </Button>
          )}
          
          {/* 时间范围选择 */}
          <div className="flex space-x-1">
            {[
              { key: 'today' as const, label: '分时' },
              { key: '7d' as const, label: '7天' },
              { key: '30d' as const, label: '30天' }
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
      </div>

      {/* 图表区域 */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {timeRange === 'today' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => typeof value === 'string' ? value.slice(11, 16) : ''}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />

              {Object.entries(indexColors).map(([indexName, color]) => (
                <Area
                  key={indexName}
                  type="monotone"
                  dataKey={indexName}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#fff' }}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />

              {Object.entries(indexColors).map(([indexName, color]) => (
                <Line
                  key={indexName}
                  type="monotone"
                  dataKey={indexName}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#fff' }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
} 