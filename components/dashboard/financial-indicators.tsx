'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface FinancialIndicator {
  stock_code: string
  period: string
  eps: number | null
  bps: number | null
  roe: number | null
  roa: number | null
  gross_margin: number | null
  net_margin: number | null
  debt_to_asset: number | null
  current_ratio: number | null
  quick_ratio: number | null
  stock_name?: string
}

export function FinancialIndicators() {
  const [data, setData] = useState<FinancialIndicator[]>([])
  const [filteredData, setFilteredData] = useState<FinancialIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const { data: indicators } = await supabase
          .from('financial_indicator')
          .select(`
            *,
            stock_basic!inner(stock_name)
          `)
          .order('period', { ascending: false })
          .limit(200)

        const formattedData = indicators?.map(item => ({
          ...item,
          stock_name: (item as any).stock_basic.stock_name
        })) || []

        setData(formattedData)
        setFilteredData(formattedData)
      } catch (error) {
        console.error('获取财务指标数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  useEffect(() => {
    const filtered = data.filter(item => 
      item.stock_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.stock_name && item.stock_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.period.includes(searchTerm)
    )
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, data])

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const formatNumber = (num: number | null, decimals = 2) => {
    if (num === null || num === undefined) return '--'
    return num.toFixed(decimals)
  }

  const formatPercent = (num: number | null, decimals = 2) => {
    if (num === null || num === undefined) return '--'
    return `${(num * 100).toFixed(decimals)}%`
  }

  const getROEColor = (roe: number | null) => {
    if (!roe) return ''
    if (roe > 0.15) return 'text-green-600'
    if (roe > 0.1) return 'text-blue-600'
    if (roe > 0.05) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDebtRatioColor = (ratio: number | null) => {
    if (!ratio) return ''
    if (ratio < 0.3) return 'text-green-600'
    if (ratio < 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 计算统计信息
  const stats = filteredData.reduce((acc, item) => {
    if (item.roe !== null) {
      acc.avgROE += item.roe
      acc.roeCount++
    }
    if (item.eps !== null) {
      acc.avgEPS += item.eps
      acc.epsCount++
    }
    if (item.debt_to_asset !== null) {
      acc.avgDebtRatio += item.debt_to_asset
      acc.debtCount++
    }
    return acc
  }, {
    avgROE: 0,
    roeCount: 0,
    avgEPS: 0,
    epsCount: 0,
    avgDebtRatio: 0,
    debtCount: 0
  })

  const avgROE = stats.roeCount > 0 ? stats.avgROE / stats.roeCount : 0
  const avgEPS = stats.epsCount > 0 ? stats.avgEPS / stats.epsCount : 0
  const avgDebtRatio = stats.debtCount > 0 ? stats.avgDebtRatio / stats.debtCount : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>财务指标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">平均ROE</div>
            <div className={`text-2xl font-bold ${getROEColor(avgROE)}`}>
              {formatPercent(avgROE)}
            </div>
            <div className="text-sm text-muted-foreground">
              净资产收益率
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">平均EPS</div>
            <div className="text-2xl font-bold">
              ¥{formatNumber(avgEPS)}
            </div>
            <div className="text-sm text-muted-foreground">
              每股收益
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">平均资产负债率</div>
            <div className={`text-2xl font-bold ${getDebtRatioColor(avgDebtRatio)}`}>
              {formatPercent(avgDebtRatio)}
            </div>
            <div className="text-sm text-muted-foreground">
              债务比率
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>财务指标详情</span>
            <Badge variant="outline">{filteredData.length} 条记录</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索股票代码、名称或期间..."
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
                  <TableHead>期间</TableHead>
                  <TableHead>EPS</TableHead>
                  <TableHead>BPS</TableHead>
                  <TableHead>ROE</TableHead>
                  <TableHead>ROA</TableHead>
                  <TableHead>毛利率</TableHead>
                  <TableHead>净利率</TableHead>
                  <TableHead>资产负债率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow key={`${item.stock_code}-${item.period}-${index}`}>
                    <TableCell className="font-medium">{item.stock_code}</TableCell>
                    <TableCell>{item.stock_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.period}</Badge>
                    </TableCell>
                    <TableCell>{formatNumber(item.eps)}</TableCell>
                    <TableCell>{formatNumber(item.bps)}</TableCell>
                    <TableCell>
                      <span className={getROEColor(item.roe)}>
                        {formatPercent(item.roe)}
                      </span>
                    </TableCell>
                    <TableCell>{formatPercent(item.roa)}</TableCell>
                    <TableCell>{formatPercent(item.gross_margin)}</TableCell>
                    <TableCell>{formatPercent(item.net_margin)}</TableCell>
                    <TableCell>
                      <span className={getDebtRatioColor(item.debt_to_asset)}>
                        {formatPercent(item.debt_to_asset)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} 条，
                共 {filteredData.length} 条记录
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
    </div>
  )
} 