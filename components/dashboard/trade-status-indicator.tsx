"use client"

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, AlertTriangle, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TodayTradeStatus {
    date: string
    isTradeDay: boolean
}

// 交易时段定义
const TRADING_SESSIONS = {
    MORNING_START: { hour: 9, minute: 30 },
    MORNING_END: { hour: 11, minute: 30 },
    AFTERNOON_START: { hour: 13, minute: 0 },
    AFTERNOON_END: { hour: 15, minute: 0 }
}

// 获取当前交易状态
function getCurrentTradeStatus(isTradeDay: boolean): {
    status: 'pre-market' | 'morning-session' | 'lunch-break' | 'afternoon-session' | 'closed'
    nextEvent: { time: string; description: string } | null
} {
    if (!isTradeDay) {
        return { status: 'closed', nextEvent: null }
    }

    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const currentMinutes = hours * 60 + minutes

    // 转换交易时段为分钟表示
    const morningStart = TRADING_SESSIONS.MORNING_START.hour * 60 + TRADING_SESSIONS.MORNING_START.minute
    const morningEnd = TRADING_SESSIONS.MORNING_END.hour * 60 + TRADING_SESSIONS.MORNING_END.minute
    const afternoonStart = TRADING_SESSIONS.AFTERNOON_START.hour * 60 + TRADING_SESSIONS.AFTERNOON_START.minute
    const afternoonEnd = TRADING_SESSIONS.AFTERNOON_END.hour * 60 + TRADING_SESSIONS.AFTERNOON_END.minute

    // 开市前
    if (currentMinutes < morningStart) {
        return {
            status: 'pre-market',
            nextEvent: {
                time: '09:30',
                description: '开市'
            }
        }
    }
    // 上午交易
    if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
        return {
            status: 'morning-session',
            nextEvent: {
                time: '11:30',
                description: '午休'
            }
        }
    }
    // 午休
    if (currentMinutes >= morningEnd && currentMinutes < afternoonStart) {
        return {
            status: 'lunch-break',
            nextEvent: {
                time: '13:00',
                description: '下午开市'
            }
        }
    }
    // 下午交易
    if (currentMinutes >= afternoonStart && currentMinutes < afternoonEnd) {
        return {
            status: 'afternoon-session',
            nextEvent: {
                time: '15:00',
                description: '收市'
            }
        }
    }
    // 收市后
    return {
        status: 'closed',
        nextEvent: null
    }
}

export function TradeStatusIndicator() {
    const [todayStatus, setTodayStatus] = useState<TodayTradeStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState(new Date())

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

        // 每秒更新当前时间
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
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

    const tradeStatus = getCurrentTradeStatus(todayStatus.isTradeDay)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'morning-session':
            case 'afternoon-session':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'lunch-break':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'pre-market':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            default:
                return 'bg-red-100 text-red-800 border-red-200'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'morning-session':
                return '上午交易中'
            case 'afternoon-session':
                return '下午交易中'
            case 'lunch-break':
                return '午间休市'
            case 'pre-market':
                return '等待开市'
            case 'closed':
                return todayStatus.isTradeDay ? '已收市' : '休市'
            default:
                return '未知状态'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'morning-session':
            case 'afternoon-session':
                return <TrendingUp className="w-4 h-4" />
            case 'lunch-break':
            case 'pre-market':
                return <Clock className="w-4 h-4" />
            default:
                return <AlertTriangle className="w-4 h-4" />
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
                                getStatusColor(tradeStatus.status)
                            )}
                        >
                            {getStatusIcon(tradeStatus.status)}
                            <span className="font-medium">{getStatusText(tradeStatus.status)}</span>
                        </Badge>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {todayStatus.date}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
                                {tradeStatus.nextEvent && (
                                    <> · {tradeStatus.nextEvent.time} {tradeStatus.nextEvent.description}</>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* 交易状态指示灯 */}
                    <div className="flex items-center space-x-2">
                        <div className={cn(
                            "w-3 h-3 rounded-full",
                            tradeStatus.status === 'morning-session' || tradeStatus.status === 'afternoon-session'
                                ? "bg-green-500 animate-pulse"
                                : tradeStatus.status === 'lunch-break'
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
                        )}></div>
                        <span className="text-xs text-muted-foreground">
                            {tradeStatus.status === 'morning-session' || tradeStatus.status === 'afternoon-session'
                                ? "交易中"
                                : "暂停交易"}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 