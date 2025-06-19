'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Flame, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface HotStock {
  current_rank: number
  stock_code: string
  stock_name: string
  latest_price: number | null
  change: number | null
  pct_chg: number | null
  rank_change?: number // 仅飙升榜有此字段
}

export function HotStockRanks() {
  const [hotRanks, setHotRanks] = useState<HotStock[]>([])
  const [hotUps, setHotUps] = useState<HotStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHotStocks = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // 获取人气榜数据
        const { data: rankData } = await supabase
          .from('stock_hot_rank')
          .select('*')
          .eq('trade_date', today)
          .order('current_rank')
          .limit(20)

        // 获取飙升榜数据
        const { data: upData } = await supabase
          .from('stock_hot_up')
          .select('*')
          .eq('trade_date', today)
          .order('current_rank')
          .limit(20)

        setHotRanks(rankData || [])
        setHotUps(upData || [])
      } catch (error) {
        console.error('获取热股数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotStocks()
  }, [])

  const formatPrice = (price: number | null) => {
    return price ? `¥${price.toFixed(2)}` : '--'
  }

  const formatChange = (change: number | null) => {
    if (!change) return '--'
    return change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)
  }

  const formatPctChange = (pctChg: number | null) => {
    if (!pctChg) return '--'
    return `${pctChg > 0 ? '+' : ''}${pctChg.toFixed(2)}%`
  }

  const renderStockTable = (stocks: HotStock[], showRankChange = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">排名</TableHead>
          <TableHead>股票代码</TableHead>
          <TableHead>股票名称</TableHead>
          <TableHead>最新价</TableHead>
          <TableHead>涨跌额</TableHead>
          <TableHead>涨跌幅</TableHead>
          {showRankChange && <TableHead>排名变动</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow key={stock.stock_code}>
            <TableCell>
              <div className="flex items-center">
                <Badge variant={stock.current_rank <= 3 ? 'default' : 'outline'}>
                  {stock.current_rank}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="font-medium">{stock.stock_code}</TableCell>
            <TableCell>{stock.stock_name}</TableCell>
            <TableCell>{formatPrice(stock.latest_price)}</TableCell>
            <TableCell>
              <span className={`${
                (stock.change || 0) > 0 ? 'text-red-600' : 
                (stock.change || 0) < 0 ? 'text-green-600' : ''
              }`}>
                {formatChange(stock.change)}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                {(stock.pct_chg || 0) > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-600" />
                ) : (stock.pct_chg || 0) < 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-600" />
                ) : null}
                <span className={`${
                  (stock.pct_chg || 0) > 0 ? 'text-red-600' : 
                  (stock.pct_chg || 0) < 0 ? 'text-green-600' : ''
                }`}>
                  {formatPctChange(stock.pct_chg)}
                </span>
              </div>
            </TableCell>
            {showRankChange && (
              <TableCell>
                <div className="flex items-center space-x-1">
                  {(stock.rank_change || 0) > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (stock.rank_change || 0) < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  ) : null}
                  <span className={`${
                    (stock.rank_change || 0) > 0 ? 'text-green-600' : 
                    (stock.rank_change || 0) < 0 ? 'text-red-600' : ''
                  }`}>
                    {stock.rank_change || '--'}
                  </span>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>热股排行榜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Flame className="h-5 w-5" />
          <span>热股排行榜</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rank" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rank" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>人气榜</span>
            </TabsTrigger>
            <TabsTrigger value="up" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>飙升榜</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rank" className="mt-4">
            <div className="rounded-md border">
              {hotRanks.length > 0 ? (
                renderStockTable(hotRanks)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无人气榜数据
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="up" className="mt-4">
            <div className="rounded-md border">
              {hotUps.length > 0 ? (
                renderStockTable(hotUps, true)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无飙升榜数据
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 