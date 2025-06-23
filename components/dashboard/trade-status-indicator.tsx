"use client"

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, AlertTriangle, Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface TodayTradeStatus {
    date: string
    isTradeDay: boolean
    isHoliday: boolean
    holidayName: string | null
    statusText: string
    displayStatus: 'trading' | 'holiday' | 'weekend'
    weekDayText: string
}

export function TradeStatusIndicator() {
    const [todayStatus, setTodayStatus] = useState<TodayTradeStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTodayStatus = async () => {
            try {
                const today = new Date().toISOString().split('T')[0]
                const response = await fetch(`/api/trade-calendar?startDate=${today}&endDate=${today}`)

                if (response.ok) {
                    const data = await response.json()
                    if (data.length > 0) {
                        setTodayStatus(data[0])
                    }
                }
            } catch (error) {
                console.error('获取今日交易状态失败:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTodayStatus()
    }, [])

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!todayStatus) {
        return (
            <Card className="w-full">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">暂无交易状态数据</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'trading':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'holiday':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'weekend':
                return 'bg-gray-100 text-gray-600 border-gray-200'
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'trading':
                return <TrendingUp className="w-4 h-4" />
            case 'holiday':
                return <AlertTriangle className="w-4 h-4" />
            case 'weekend':
                return <Clock className="w-4 h-4" />
            default:
                return <Calendar className="w-4 h-4" />
        }
    }

    const getStatusDescription = (status: TodayTradeStatus) => {
        if (status.isTradeDay) {
            return "今日为交易日，股市正常开市"
        } else if (status.isHoliday) {
            return `今日为${status.holidayName || '节假日'}，股市休市`
        } else {
            return "今日为周末，股市休市"
        }
    }

    return (
        <Card className="w-full">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Badge
                            variant="outline"
                            className={cn(
                                "flex items-center space-x-1.5 px-3 py-1.5 border-2",
                                getStatusColor(todayStatus.displayStatus)
                            )}
                        >
                            {getStatusIcon(todayStatus.displayStatus)}
                            <span className="font-medium">{todayStatus.statusText}</span>
                        </Badge>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {todayStatus.date} ({todayStatus.weekDayText})
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {getStatusDescription(todayStatus)}
                            </span>
                        </div>
                    </div>

                    {/* 添加一个小的状态指示灯 */}
                    <div className="flex items-center space-x-2">
                        <div className={cn(
                            "w-3 h-3 rounded-full",
                            todayStatus.isTradeDay
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-400"
                        )}></div>
                        <span className="text-xs text-muted-foreground">
                            {todayStatus.isTradeDay ? "可交易" : "不可交易"}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 