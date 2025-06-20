'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getStockColor, formatPctChg, formatPrice } from "@/lib/stock-colors"

interface FundFlowData {
  stock_name: string
  stock_code: string
  main_net_inflow_amount: number
  main_net_inflow_rate: number
  super_large_net_amount: number
  large_net_amount: number
  medium_net_amount: number
  small_net_amount: number
  latest_price: number
  pct_chg: number
}

interface FlowSummary {
  name: string
  value: number
  color: string
}

export function MoneyFlowHeatmap() {
  const [fundFlowData, setFundFlowData] = useState<FundFlowData[]>([])
  const [flowSummary, setFlowSummary] = useState<FlowSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [indicator, setIndicator] = useState('今日')
  const [stockCount, setStockCount] = useState(20)

  useEffect(() => {
    const fetchFundFlowData = async () => {
      try {
        // 先获取最新的交易日期
        const { data: latestDateData } = await supabase
          .from('stock_fund_flow_rank')
          .select('trade_date')
          .order('trade_date', { ascending: false })
          .limit(1)

        const latestDate = latestDateData?.[0]?.trade_date || new Date().toISOString().split('T')[0]
        console.log('最新交易日期:', latestDate)

        const { data } = await supabase
          .from('stock_fund_flow_rank')
          .select('*')
          .eq('trade_date', latestDate)
          .eq('indicator', indicator)
          .order('rank', { ascending: true })
          .limit(stockCount)

        console.log('获取到的数据:', data)
        console.log('数据条数:', data?.length)

        if (data && data.length > 0) {
          const formattedData: FundFlowData[] = data.map((item: any) => ({
            stock_name: item.stock_name,
            stock_code: item.stock_code,
            main_net_inflow_amount: Number(item.main_net_inflow_amount),
            main_net_inflow_rate: Number(item.main_net_inflow_rate),
            super_large_net_amount: Number(item.super_large_net_amount),
            large_net_amount: Number(item.large_net_amount),
            medium_net_amount: Number(item.medium_net_amount),
            small_net_amount: Number(item.small_net_amount),
            latest_price: Number(item.latest_price),
            pct_chg: Number(item.pct_chg)
          }))
          
          console.log('格式化后的数据:', formattedData)
          setFundFlowData(formattedData)

          // 计算资金流向汇总
          const totalSuperLarge = formattedData.reduce((sum, item) => sum + item.super_large_net_amount, 0)
          const totalLarge = formattedData.reduce((sum, item) => sum + item.large_net_amount, 0)
          const totalMedium = formattedData.reduce((sum, item) => sum + item.medium_net_amount, 0)
          const totalSmall = formattedData.reduce((sum, item) => sum + item.small_net_amount, 0)

          const summaryData = [
            { name: '超大单', value: totalSuperLarge / 100000000, color: '#ef4444' },
            { name: '大单', value: totalLarge / 100000000, color: '#f97316' },
            { name: '中单', value: totalMedium / 100000000, color: '#84cc16' },
            { name: '小单', value: totalSmall / 100000000, color: '#06b6d4' }
          ]
          
          console.log('汇总数据:', summaryData)
          setFlowSummary(summaryData)
        } else {
          console.log('没有获取到数据')
          setFundFlowData([])
          setFlowSummary([])
        }
      } catch (error) {
        console.error('获取资金流向数据失败:', error)
        setFundFlowData([])
        setFlowSummary([])
      } finally {
        setLoading(false)
      }
    }

    fetchFundFlowData()
  }, [indicator, stockCount])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm">
            主力净流入: {(data.main_net_inflow_amount / 100000000).toFixed(2)}亿元
          </p>
          <p className="text-sm">
            净流入率: {data.main_net_inflow_rate.toFixed(2)}%
          </p>
          <p className={`text-sm ${getStockColor(data.pct_chg, 'text')}`}>
            涨跌幅: {formatPctChg(data.pct_chg)}
          </p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-sm">
            净流入: {data.value.toFixed(2)}亿元
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-purple-500" />
          <p className="text-muted-foreground">加载资金流向数据中...</p>
        </div>
      </div>
    )
  }

  // 如果没有数据，显示提示信息
  if (!loading && fundFlowData.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* 控制栏 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">资金流向分析</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 时间周期选择 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">时间周期:</span>
              <div className="flex space-x-1">
                {['今日', '3日', '5日', '10日'].map((period) => (
                  <Button
                    key={period}
                    variant={indicator === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIndicator(period)}
                    className="text-xs h-7"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 股票数量选择 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">显示数量:</span>
              <div className="flex space-x-1">
                {[10, 20, 50].map((count) => (
                  <Button
                    key={count}
                    variant={stockCount === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStockCount(count)}
                    className="text-xs h-7"
                  >
                    {count}只
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 无数据提示 */}
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-muted-foreground mb-2">暂无数据</p>
            <p className="text-sm text-muted-foreground">
              当前时间周期（{indicator}）没有可用的资金流向数据
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* 控制栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">资金流向分析</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 时间周期选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">时间周期:</span>
            <div className="flex space-x-1">
              {['今日', '3日', '5日', '10日'].map((period) => (
                <Button
                  key={period}
                  variant={indicator === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIndicator(period)}
                  className="text-xs h-7"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
          
          {/* 股票数量选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">显示数量:</span>
            <div className="flex space-x-1">
              {[10, 20, 50].map((count) => (
                <Button
                  key={count}
                  variant={stockCount === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStockCount(count)}
                  className="text-xs h-7"
                >
                  {count}只
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* 资金流向排行 */}
        <div className="lg:col-span-5">
          <div className={`${stockCount > 20 ? 'h-96' : 'h-80'} transition-all duration-300`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fundFlowData.slice(0, Math.min(stockCount, 15))} layout="horizontal" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => (value / 100000000).toFixed(1) + '亿'}
                />
                <YAxis 
                  type="category"
                  dataKey="stock_name"
                  stroke="#64748b"
                  fontSize={12}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="main_net_inflow_amount" 
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 资金流向饼图 */}
        <div className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={flowSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {flowSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {flowSummary.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className={getStockColor(item.value, 'text')}>
                    {item.value.toFixed(1)}亿
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 股票列表 */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {fundFlowData.map((stock, index) => (
          <motion.div
            key={stock.stock_code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="p-3 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{stock.stock_name}</span>
                <Badge 
                  variant="outline"
                  className={`text-xs ${getStockColor(stock.pct_chg, 'full')}`}
                >
                  {formatPctChg(stock.pct_chg)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>价格: {formatPrice(stock.latest_price)}</p>
                <p className={getStockColor(stock.main_net_inflow_amount, 'text')}>
                  净流入: {(stock.main_net_inflow_amount / 100000000).toFixed(2)}亿
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
} 