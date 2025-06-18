'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Database, RefreshCw, AlertCircle, CheckCircle, Download } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import axios from 'axios'

export default function DataImportPage() {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [importResult, setImportResult] = useState<any>(null)
    const [listStatus, setListStatus] = useState('L')
    const [exchange, setExchange] = useState('ALL')
    const [forceUpdate, setForceUpdate] = useState(false)

    const importStockBasic = async () => {
        setLoading(true)
        setProgress(10)
        setImportResult(null)

        try {
            console.log('开始发送请求...')
            console.log('请求参数:', {
                list_status: listStatus,
                exchange: exchange === 'ALL' ? '' : exchange,
                forceUpdate
            })

            const response = await axios.post('/api/stock/basic', {
                list_status: listStatus,
                exchange: exchange === 'ALL' ? '' : exchange,
                forceUpdate
            })

            console.log('收到响应:', response)

            setProgress(90)
            setImportResult(response.data)

            if (response.data.success) {
                toast.success("导入成功", {
                    description: `成功导入${response.data.count}条股票数据`,
                })
            } else {
                toast.error("导入失败", {
                    description: response.data.message,
                })
            }
        } catch (error) {
            console.error('导入股票基础数据失败:', error)
            if (axios.isAxiosError(error)) {
                console.error('请求错误详情:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    headers: error.response?.headers
                })
            }
            setImportResult({
                success: false,
                message: '导入过程中发生错误'
            })

            toast.error("导入失败", {
                description: "导入过程中发生错误，请查看控制台获取详细信息",
            })
        } finally {
            setProgress(100)
            setLoading(false)

            setTimeout(() => {
                setProgress(0)
            }, 1000)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">数据导入</h1>
                    <p className="text-muted-foreground mt-2">
                        从数据源导入股票基础数据，支持多种筛选条件
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="p-6 border-2">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Database className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold">A股基础数据</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                从Tushare API获取A股基础信息，包括股票代码、名称、上市日期等数据
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="list-status" className="text-base">上市状态</Label>
                                    <Select value={listStatus} onValueChange={setListStatus}>
                                        <SelectTrigger id="list-status" className="w-full">
                                            <SelectValue placeholder="选择上市状态" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="L">上市中 (L)</SelectItem>
                                            <SelectItem value="D">已退市 (D)</SelectItem>
                                            <SelectItem value="P">暂停上市 (P)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exchange" className="text-base">交易所</Label>
                                    <Select value={exchange} onValueChange={setExchange}>
                                        <SelectTrigger id="exchange" className="w-full">
                                            <SelectValue placeholder="选择交易所" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">全部</SelectItem>
                                            <SelectItem value="SSE">上交所 (SSE)</SelectItem>
                                            <SelectItem value="SZSE">深交所 (SZSE)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="force-update" className="text-base">强制更新</Label>
                                        <p className="text-sm text-muted-foreground">启用将覆盖现有数据</p>
                                    </div>
                                    <Switch
                                        id="force-update"
                                        checked={forceUpdate}
                                        onCheckedChange={setForceUpdate}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {loading && (
                                <div className="space-y-2">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-sm text-center text-muted-foreground">导入中，请稍候...</p>
                                </div>
                            )}

                            {importResult && (
                                <div className={`p-4 rounded-lg border ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            {importResult.success ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <h3 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                                {importResult.success ? '导入成功' : '导入失败'}
                                            </h3>
                                            <div className={`mt-2 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                                <p>{importResult.message}</p>
                                                {importResult.count && (
                                                    <p className="mt-1">导入数量: {importResult.count} / {importResult.total}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={importStockBasic}
                                disabled={loading}
                                className="w-full h-12 text-base"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                        导入中...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-5 w-5" />
                                        开始导入
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

