'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Target, 
  Zap,
  Crown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getStockColor, formatPctChg } from "@/lib/stock-colors"

interface StockRankData {
  stock_code: string
  stock_name: string
  latest_price: number
  pct_chg: number
  change: number
  current_rank: number
  rank_change?: number
}

interface StockBasic {
  stockCode: string
  stockName: string
  exchange: string
  industry: string
  latestQuote?: {
    close: number
    pctChg: number
    volume: number
    tradeDate: string
  }
}

export function SmartStockRanking() {
  const [hotRankData, setHotRankData] = useState<StockRankData[]>([])
  const [hotUpData, setHotUpData] = useState<StockRankData[]>([])
  const [stockList, setStockList] = useState<StockBasic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]

        // 获取人气排行数据
        const { data: hotRank } = await supabase
          .from('stock_hot_rank')
          .select('*')
          .eq('trade_date', today)
          .order('current_rank', { ascending: true })
          .limit(20)

        // 获取飙升排行数据
        const { data: hotUp } = await supabase
          .from('stock_hot_up')
          .select('*')
          .eq('trade_date', today)
          .order('current_rank', { ascending: true })
          .limit(20)

        if (hotRank) {
          setHotRankData(hotRank.map((item: any) => ({
            stock_code: item.stock_code,
            stock_name: item.stock_name,
            latest_price: Number(item.latest_price),
            pct_chg: Number(item.pct_chg),
            change: Number(item.change),
            current_rank: item.current_rank
          })))
        }

        if (hotUp) {
          setHotUpData(hotUp.map((item: any) => ({
            stock_code: item.stock_code,
            stock_name: item.stock_name,
            latest_price: Number(item.latest_price),
            pct_chg: Number(item.pct_chg),
            change: Number(item.change),
            current_rank: item.current_rank,
            rank_change: item.rank_change
          })))
        }

        // 获取股票基础数据用于搜索
        const { data: stocks } = await supabase
          .rpc('get_stocks_with_latest_quotes', { limit_count: 100 })

        if (stocks) {
          setStockList(stocks)
        }

      } catch (error) {
        console.error('获取排行数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredStocks = stockList.filter(stock => 
    stock.stockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.stockCode.includes(searchTerm)
  )

  const RankingCard = ({ data, title, icon: Icon, showRankChange = false }: {
    data: StockRankData[]
    title: string
    icon: any
    showRankChange?: boolean
  }) => (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Icon className="h-5 w-5 mr-2 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.slice(0, 10).map((stock, index) => (
          <motion.div
            key={stock.stock_code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 hover:from-blue-50 dark:hover:from-blue-900/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{stock.stock_name}</p>
                <p className="text-xs text-muted-foreground">{stock.stock_code}</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <p className="font-medium">¥{stock.latest_price.toFixed(2)}</p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline"
                  className={`text-xs ${getStockColor(stock.pct_chg, 'full')}`}
                >
                  {stock.pct_chg >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPctChg(stock.pct_chg)}
                </Badge>
                {showRankChange && stock.rank_change !== undefined && (
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${
                      stock.rank_change > 0 ? getStockColor(1, 'full') : 
                      stock.rank_change < 0 ? getStockColor(-1, 'full') : 
                      'text-gray-600 bg-gray-50'
                    }`}
                  >
                    {stock.rank_change > 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : stock.rank_change < 0 ? (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    ) : null}
                    {Math.abs(stock.rank_change)}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-muted-foreground">加载排行数据中...</p>
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
      <Tabs defaultValue="hotrank" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <TabsTrigger value="hotrank" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Crown className="h-4 w-4 mr-2" />
              人气排行
            </TabsTrigger>
            <TabsTrigger value="hotup" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" />
              飙升排行
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Search className="h-4 w-4 mr-2" />
              股票搜索
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hotrank">
          <RankingCard 
            data={hotRankData}
            title="股票人气排行榜"
            icon={Crown}
          />
        </TabsContent>

        <TabsContent value="hotup">
          <RankingCard 
            data={hotUpData}
            title="股票飙升排行榜"
            icon={Zap}
            showRankChange={true}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索股票代码或名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                搜索结果 ({filteredStocks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredStocks.slice(0, 20).map((stock, index) => (
                <motion.div
                  key={stock.stockCode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 hover:from-blue-50 dark:hover:from-blue-900/20 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      {stock.exchange}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{stock.stockName}</p>
                      <p className="text-xs text-muted-foreground">
                        {stock.stockCode} • {stock.industry}
                      </p>
                    </div>
                  </div>

                  {stock.latestQuote && (
                    <div className="text-right">
                      <p className="font-medium">¥{stock.latestQuote.close.toFixed(2)}</p>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${getStockColor(stock.latestQuote.pctChg, 'full')}`}
                      >
                        {formatPctChg(stock.latestQuote.pctChg)}
                      </Badge>
                    </div>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
} 