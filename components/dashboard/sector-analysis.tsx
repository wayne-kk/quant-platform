'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getStockColor, formatPctChg } from "@/lib/stock-colors"
import { getLatestTradingDate, formatTradingDateDisplay, type TradingDateInfo } from "@/lib/trading-utils"
import { Button } from "@/components/ui/button"

interface SectorData {
  name: string
  value: number
  color: string
  stockCount: number
  avgChange: number
  totalMarketCap: number
}

interface IndustryStats {
  industry: string
  stockCount: number
  avgPrice: number
  avgChange: number
  totalVolume: number
  totalAmount: number
}

export function SectorAnalysis() {
  const [sectorData, setSectorData] = useState<SectorData[]>([])
  const [industryStats, setIndustryStats] = useState<IndustryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tradingDateInfo, setTradingDateInfo] = useState<TradingDateInfo | null>(null)

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        setError(null)
        // 获取最近的交易日期信息
        const dateInfo = await getLatestTradingDate()
        setTradingDateInfo(dateInfo)

        console.log('获取板块数据，交易日期:', dateInfo.date)

        // 先获取有行业信息的股票基本信息
        const { data: stocksData, error: stocksError } = await supabase
          .from('stock_basic')
          .select('stock_code, stock_name, industry')
          .not('industry', 'is', null)
          .limit(1000)

        if (stocksError) {
          console.error('获取股票基本信息失败:', stocksError)
          throw stocksError
        }

        console.log('获取到股票基本信息数量:', stocksData?.length || 0)

        if (!stocksData || stocksData.length === 0) {
          setError('没有找到股票基本信息')
          return
        }

        // 获取这些股票的最新行情数据
        const stockCodes = stocksData.map(stock => stock.stock_code)
        const { data: quotesData, error: quotesError } = await supabase
          .from('daily_quote')
          .select('stock_code, close, pct_chg, volume, amount, trade_date')
          .eq('trade_date', dateInfo.date)
          .in('stock_code', stockCodes)

        if (quotesError) {
          console.error('获取行情数据失败:', quotesError)
          throw quotesError
        }

        console.log('获取到行情数据数量:', quotesData?.length || 0)

        if (!quotesData || quotesData.length === 0) {
          setError(`没有找到 ${dateInfo.date} 的行情数据`)
          return
        }

        // 合并股票基本信息和行情数据
        const mergedData = stocksData
          .map(stock => {
            const quote = quotesData.find(q => q.stock_code === stock.stock_code)
            return quote ? { ...stock, ...quote } : null
          })
          .filter(Boolean)

        console.log('合并后数据数量:', mergedData.length)

        if (mergedData.length === 0) {
          setError('没有找到匹配的股票和行情数据')
          return
        }

        // 按行业分组统计
        const industryMap: Record<string, {
          stocks: any[]
          totalVolume: number
          totalAmount: number
        }> = {}

        mergedData.forEach((item: any) => {
          const industry = item.industry

          if (!industryMap[industry]) {
            industryMap[industry] = {
              stocks: [],
              totalVolume: 0,
              totalAmount: 0
            }
          }

          industryMap[industry].stocks.push({
            stock_code: item.stock_code,
            name: item.stock_name,
            close: Number(item.close || 0),
            pct_chg: Number(item.pct_chg || 0),
            volume: Number(item.volume || 0),
            amount: Number(item.amount || 0)
          })

          industryMap[industry].totalVolume += Number(item.volume || 0)
          industryMap[industry].totalAmount += Number(item.amount || 0)
        })

        console.log('行业分组数量:', Object.keys(industryMap).length)

        // 生成行业统计
        const industries: IndustryStats[] = Object.entries(industryMap).map(([industry, data]) => {
          const stockCount = data.stocks.length
          const avgPrice = data.stocks.reduce((sum, stock) => sum + stock.close, 0) / stockCount
          const avgChange = data.stocks.reduce((sum, stock) => sum + stock.pct_chg, 0) / stockCount

          return {
            industry,
            stockCount,
            avgPrice,
            avgChange,
            totalVolume: data.totalVolume,
            totalAmount: data.totalAmount
          }
        }).sort((a, b) => b.totalAmount - a.totalAmount)

        setIndustryStats(industries)

        // 生成树状图数据
        const treeMapData: SectorData[] = industries.slice(0, 20).map((item, index) => {
          const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
          ]

          return {
            name: item.industry,
            value: item.totalAmount / 100000000, // 转换为亿元
            color: colors[index % colors.length],
            stockCount: item.stockCount,
            avgChange: item.avgChange,
            totalMarketCap: item.totalAmount / 100000000
          }
        })

        setSectorData(treeMapData)
        console.log('板块数据处理完成:', treeMapData.length)

      } catch (error: any) {
        console.error('获取板块数据失败:', error)
        setError(error.message || '获取板块数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchSectorData()
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p>成交额: {data.totalMarketCap.toFixed(1)}亿元</p>
            <p>股票数量: {data.stockCount}只</p>
            <p className={getStockColor(data.avgChange, 'text')}>
              平均涨跌: {formatPctChg(data.avgChange)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <PieChart className="h-12 w-12 mx-auto mb-4 text-cyan-500" />
          <p className="text-muted-foreground">加载板块数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium mb-2">板块数据加载失败</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  if (industryStats.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-muted-foreground font-medium mb-2">暂无板块数据</p>
          <p className="text-muted-foreground text-sm">
            可能是当前交易日没有数据或者数据库中缺少行业分类信息
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* 数据日期显示 */}
      {tradingDateInfo && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>数据日期: {tradingDateInfo.date}</span>
            {!tradingDateInfo.isToday && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {formatTradingDateDisplay(tradingDateInfo)}
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 树状图 */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <PieChart className="h-5 w-5 mr-2 text-cyan-600" />
                行业热力图（按成交额）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={sectorData}
                    dataKey="value"
                    stroke="#fff"
                    fill="#3b82f6"
                  >
                    <Tooltip content={<CustomTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 行业排行 */}
        <div>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                行业涨跌排行
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {industryStats
                .sort((a, b) => b.avgChange - a.avgChange)
                .slice(0, 10)
                .map((industry, index) => (
                  <motion.div
                    key={industry.industry}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 hover:from-blue-50 dark:hover:from-blue-900/20 transition-all duration-200"
                  >
                    <div>
                      <p className="font-medium text-sm">{industry.industry}</p>
                      <p className="text-xs text-muted-foreground">
                        {industry.stockCount}只股票
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStockColor(industry.avgChange, 'full')}`}
                      >
                        {industry.avgChange >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPctChg(industry.avgChange)}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              }
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 详细统计表格 */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <PieChart className="h-5 w-5 mr-2 text-cyan-600" />
            行业详细统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">行业</th>
                  <th className="text-right p-2">股票数量</th>
                  <th className="text-right p-2">平均价格</th>
                  <th className="text-right p-2">平均涨跌幅</th>
                  <th className="text-right p-2">成交额(亿)</th>
                </tr>
              </thead>
              <tbody>
                {industryStats.slice(0, 15).map((industry, index) => (
                  <motion.tr
                    key={industry.industry}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="p-2 font-medium">{industry.industry}</td>
                    <td className="p-2 text-right">{industry.stockCount}</td>
                    <td className="p-2 text-right">¥{industry.avgPrice.toFixed(2)}</td>
                    <td className={`p-2 text-right ${getStockColor(industry.avgChange, 'text')}`}>
                      {formatPctChg(industry.avgChange)}
                    </td>
                    <td className="p-2 text-right">
                      {(industry.totalAmount / 100000000).toFixed(1)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 