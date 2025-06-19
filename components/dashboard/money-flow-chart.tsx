'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface MoneyFlowData {
  stock_code: string
  trade_date: string
  main_net_inflow: number | null
  main_net_inflow_rate: number | null
  super_net_inflow: number | null
  large_net_inflow: number | null
  medium_net_inflow: number | null
  small_net_inflow: number | null
  stock_name?: string
}

export function MoneyFlowChart() {
  const [data, setData] = useState<MoneyFlowData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const { data: dates } = await supabase
          .from('money_flow')
          .select('trade_date')
          .order('trade_date', { ascending: false })
          .limit(30)

        const uniqueDates = [...new Set(dates?.map(d => d.trade_date))] as string[]
        setAvailableDates(uniqueDates)
        if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[0])
        }
      } catch (error) {
        console.error('获取日期数据失败:', error)
      }
    }

    fetchAvailableDates()
  }, [])

  useEffect(() => {
    if (!selectedDate) return

    const fetchMoneyFlowData = async () => {
      setLoading(true)
      try {
        const { data: flowData } = await supabase
          .from('money_flow')
          .select(`
            *,
            stock_basic!inner(stock_name)
          `)
          .eq('trade_date', selectedDate)
          .not('main_net_inflow', 'is', null)
          .order('main_net_inflow', { ascending: false })
          .limit(50)

        const formattedData = flowData?.map(item => ({
          ...item,
          stock_name: (item as any).stock_basic.stock_name
        })) || []

        setData(formattedData)
      } catch (error) {
        console.error('获取资金流向数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMoneyFlowData()
  }, [selectedDate])

  const formatMoney = (amount: number | null) => {
    if (!amount) return '--'
    const absAmount = Math.abs(amount)
    if (absAmount >= 100000000) {
      return `${(amount / 100000000).toFixed(2)}亿`
    }
    if (absAmount >= 10000) {
      return `${(amount / 10000).toFixed(2)}万`
    }
    return amount.toFixed(2)
  }

  const formatRate = (rate: number | null) => {
    if (!rate) return '--'
    return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`
  }

  const getFlowColor = (flow: number | null) => {
    if (!flow) return ''
    return flow > 0 ? 'text-red-600' : 'text-green-600'
  }

  const getFlowIcon = (flow: number | null) => {
    if (!flow) return null
    return flow > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  }

  const summaryStats = data.reduce((acc, item) => {
    acc.totalMainInflow += item.main_net_inflow || 0
    acc.totalSuperInflow += item.super_net_inflow || 0
    acc.totalLargeInflow += item.large_net_inflow || 0
    acc.totalMediumInflow += item.medium_net_inflow || 0
    acc.totalSmallInflow += item.small_net_inflow || 0
    return acc
  }, {
    totalMainInflow: 0,
    totalSuperInflow: 0,
    totalLargeInflow: 0,
    totalMediumInflow: 0,
    totalSmallInflow: 0
  })

  return (
    <div className="space-y-4">
      {/* 汇总卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: '主力净流入', value: summaryStats.totalMainInflow, icon: DollarSign },
          { label: '超大单', value: summaryStats.totalSuperInflow, icon: TrendingUp },
          { label: '大单', value: summaryStats.totalLargeInflow, icon: TrendingUp },
          { label: '中单', value: summaryStats.totalMediumInflow, icon: TrendingDown },
          { label: '小单', value: summaryStats.totalSmallInflow, icon: TrendingDown }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${getFlowColor(stat.value)}`} />
                  <div className="text-sm font-medium">{stat.label}</div>
                </div>
                <div className={`text-lg font-bold mt-1 ${getFlowColor(stat.value)}`}>
                  {formatMoney(stat.value)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 详细数据表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>资金流向明细</CardTitle>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择日期" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map(date => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString('zh-CN')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>股票代码</TableHead>
                    <TableHead>股票名称</TableHead>
                    <TableHead>主力净流入</TableHead>
                    <TableHead>流入率</TableHead>
                    <TableHead>超大单</TableHead>
                    <TableHead>大单</TableHead>
                    <TableHead>中单</TableHead>
                    <TableHead>小单</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 20).map((item) => (
                    <TableRow key={item.stock_code}>
                      <TableCell className="font-medium">{item.stock_code}</TableCell>
                      <TableCell>{item.stock_name}</TableCell>
                      <TableCell>
                        <div className={`flex items-center space-x-1 ${getFlowColor(item.main_net_inflow)}`}>
                          {getFlowIcon(item.main_net_inflow)}
                          <span>{formatMoney(item.main_net_inflow)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          (item.main_net_inflow_rate || 0) > 0 ? 'default' : 'secondary'
                        }>
                          {formatRate(item.main_net_inflow_rate)}
                        </Badge>
                      </TableCell>
                      <TableCell className={getFlowColor(item.super_net_inflow)}>
                        {formatMoney(item.super_net_inflow)}
                      </TableCell>
                      <TableCell className={getFlowColor(item.large_net_inflow)}>
                        {formatMoney(item.large_net_inflow)}
                      </TableCell>
                      <TableCell className={getFlowColor(item.medium_net_inflow)}>
                        {formatMoney(item.medium_net_inflow)}
                      </TableCell>
                      <TableCell className={getFlowColor(item.small_net_inflow)}>
                        {formatMoney(item.small_net_inflow)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 