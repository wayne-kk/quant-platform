'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface StockBasic {
  stock_code: string
  stock_name: string
  exchange: string | null
  industry: string | null
  list_date: string | null
  total_share: number | null
  float_share: number | null
  is_st: boolean | null
  status: string | null
}

export function StockBasicList() {
  const [stocks, setStocks] = useState<StockBasic[]>([])
  const [filteredStocks, setFilteredStocks] = useState<StockBasic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const { data, error } = await supabase
          .from('stock_basic')
          .select('*')
          .order('stock_code')
          .limit(100) // 限制返回数量，避免性能问题

        if (error) throw error
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
    const filtered = stocks.filter(stock => 
      stock.stock_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.stock_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.industry && stock.industry.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredStocks(filtered)
    setCurrentPage(1)
  }, [searchTerm, stocks])

  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredStocks.length / pageSize)

  const formatNumber = (num: number | null) => {
    if (!num) return '--'
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(2)}亿`
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(2)}万`
    }
    return num.toFixed(2)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

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
          <Badge variant="outline">{filteredStocks.length} 只股票</Badge>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索股票代码、名称或行业..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
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
                <TableHead>上市日期</TableHead>
                <TableHead>总股本</TableHead>
                <TableHead>流通股</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStocks.map((stock) => (
                <TableRow key={stock.stock_code}>
                  <TableCell className="font-medium">{stock.stock_code}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{stock.stock_name}</span>
                      {stock.is_st && <Badge variant="destructive" className="text-xs">ST</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{stock.exchange || '--'}</Badge>
                  </TableCell>
                  <TableCell>{stock.industry || '--'}</TableCell>
                  <TableCell>{formatDate(stock.list_date)}</TableCell>
                  <TableCell>{formatNumber(stock.total_share)}</TableCell>
                  <TableCell>{formatNumber(stock.float_share)}</TableCell>
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