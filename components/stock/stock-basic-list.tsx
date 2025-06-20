'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import { getStockColor, formatPctChg, formatPrice, formatLargeNumber } from "@/lib/stock-colors"

interface StockBasic {
  stockCode: string
  stockName: string
  exchange: string | null
  industry: string | null
  listDate: Date | null
  totalShare: number | null
  floatShare: number | null
  isSt: boolean | null
  status: string | null
  updateTime: Date
}

interface StockWithQuote extends StockBasic {
  latestQuote?: {
    close: number | null
    pctChg: number | null
    volume: number | null
    amount: number | null
    tradeDate: Date
  }
}

export function StockBasicList() {
  const [stocks, setStocks] = useState<StockWithQuote[]>([])
  const [filteredStocks, setFilteredStocks] = useState<StockWithQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExchange, setSelectedExchange] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('/api/stocks?includeQuote=true&limit=200')
        const data = await response.json()
        setStocks(data || [])
        setFilteredStocks(data || [])
      } catch (error) {
        console.error('获取股票数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStocks()
  }, [])

  useEffect(() => {
    let filtered = stocks

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(stock => 
        stock.stockCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.stockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stock.industry && stock.industry.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 交易所过滤
    if (selectedExchange !== 'all') {
      filtered = filtered.filter(stock => stock.exchange === selectedExchange)
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'st') {
        filtered = filtered.filter(stock => stock.isSt === true)
      } else {
        filtered = filtered.filter(stock => stock.status === selectedStatus)
      }
    }

    setFilteredStocks(filtered)
    setCurrentPage(1)
  }, [searchTerm, selectedExchange, selectedStatus, stocks])

  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredStocks.length / pageSize)

  const formatNumber = (num: number | null) => {
    return formatLargeNumber(num)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '--'
    return new Date(date).toLocaleDateString('zh-CN')
  }

  const formatPriceDisplay = (price: number | null) => {
    return formatPrice(price)
  }

  const formatPctChgDisplay = (pctChg: number | null) => {
    return formatPctChg(pctChg)
  }

  const getPctChgColor = (pctChg: number | null) => {
    return getStockColor(pctChg, 'text')
  }

  const exchanges = Array.from(new Set(stocks.map(s => s.exchange).filter(Boolean)))
  const industries = Array.from(new Set(stocks.map(s => s.industry).filter(Boolean)))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>股票基本信息</CardTitle>
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
        <CardTitle className="flex items-center justify-between">
          <span>股票基本信息</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{filteredStocks.length} 只股票</Badge>
            <Badge variant="secondary">{stocks.filter(s => s.isSt).length} 只ST股</Badge>
          </div>
        </CardTitle>
        
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索股票代码、名称或行业..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={selectedExchange} onValueChange={setSelectedExchange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="交易所" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部交易所</SelectItem>
              {exchanges.map(exchange => (
                <SelectItem key={exchange} value={exchange!}>
                  {exchange}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="L">正常</SelectItem>
              <SelectItem value="st">ST股票</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>股票代码</TableHead>
                <TableHead>股票名称</TableHead>
                <TableHead>交易所</TableHead>
                <TableHead>行业</TableHead>
                <TableHead>最新价</TableHead>
                <TableHead>涨跌幅</TableHead>
                <TableHead>上市日期</TableHead>
                <TableHead>总股本</TableHead>
                <TableHead>流通股</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStocks.map((stock) => (
                <TableRow key={stock.stockCode}>
                  <TableCell className="font-medium">{stock.stockCode}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{stock.stockName}</span>
                      {stock.isSt && <Badge variant="destructive" className="text-xs">ST</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{stock.exchange || '--'}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{stock.industry || '--'}</span>
                  </TableCell>
                  <TableCell>
                    {stock.latestQuote ? (
                      formatPriceDisplay(stock.latestQuote.close)
                    ) : '--'}
                  </TableCell>
                  <TableCell>
                    {stock.latestQuote ? (
                      <div className={`flex items-center space-x-1 ${getPctChgColor(stock.latestQuote.pctChg)}`}>
                        {(stock.latestQuote.pctChg || 0) > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (stock.latestQuote.pctChg || 0) < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        <span>{formatPctChgDisplay(stock.latestQuote.pctChg)}</span>
                      </div>
                    ) : '--'}
                  </TableCell>
                  <TableCell>{formatDate(stock.listDate)}</TableCell>
                  <TableCell>{formatNumber(stock.totalShare)}</TableCell>
                  <TableCell>{formatNumber(stock.floatShare)}</TableCell>
                  <TableCell>
                    <Badge variant={stock.status === 'L' ? 'default' : 'secondary'}>
                      {stock.status === 'L' ? '正常' : stock.status || '--'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStocks.length)} 条，
              共 {filteredStocks.length} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 