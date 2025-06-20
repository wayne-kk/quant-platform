'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getStockColor, formatPctChg } from "@/lib/stock-colors"

interface IndexData {
  trade_date: string
  index_name: string
  close: number
  pct_chg: number
  open: number
  high: number
  low: number
}

interface ChartData {
  date: string
  上证指数: number
  深证成指: number
  创业板指: number
  沪深300: number
  中证500: number
}

const indexMapping = {
  'sh000001': '上证指数',
  'sz399001': '深证成指', 
  'sz399006': '创业板指',
  'sh000300': '沪深300',
  'sh000905': '中证500'
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
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    const fetchIndexData = async () => {
      try {
        // 获取最近30天的指数数据
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - (timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1))

        const { data: indexData } = await supabase
          .from('index_data')
          .select('*')
          .gte('trade_date', startDate.toISOString().split('T')[0])
          .lte('trade_date', endDate.toISOString().split('T')[0])
          .order('trade_date', { ascending: true })

        if (indexData) {
          // 按日期分组数据
          const groupedData: Record<string, Record<string, number>> = {}
          const latest: Record<string, IndexData> = {}

          indexData.forEach((item: any) => {
            const date = item.trade_date
            const indexName = indexMapping[item.index_code as keyof typeof indexMapping]
            
            if (indexName) {
              if (!groupedData[date]) {
                groupedData[date] = {}
              }
              groupedData[date][indexName] = item.close
              
              // 保存最新数据
              if (!latest[indexName] || new Date(item.trade_date) > new Date(latest[indexName].trade_date)) {
                latest[indexName] = item
              }
            }
          })

          // 转换为图表格式
          const chartArray: ChartData[] = Object.keys(groupedData)
            .sort()
            .map(date => ({
              date,
              上证指数: groupedData[date]['上证指数'] || 0,
              深证成指: groupedData[date]['深证成指'] || 0,
              创业板指: groupedData[date]['创业板指'] || 0,
              沪深300: groupedData[date]['沪深300'] || 0,
              中证500: groupedData[date]['中证500'] || 0
            }))

          setChartData(chartArray)
          setLatestData(latest)
        }
      } catch (error) {
        console.error('获取指数数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIndexData()
  }, [timeRange])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{`日期: ${label}`}</p>
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
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {Object.keys(latestData).map((indexName) => {
            const data = latestData[indexName]
            const isPositive = data.pct_chg >= 0
            return (
              <Badge 
                key={indexName}
                variant="outline"
                className={`text-xs ${getStockColor(data.pct_chg, 'full')}`}
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
              </Badge>
            )
          })}
        </div>
        
        <div className="flex space-x-1">
          {[
            { key: '1d', label: '1天' },
            { key: '7d', label: '7天' },
            { key: '30d', label: '30天' }
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

      {/* 图表区域 */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
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
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            
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
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
} 