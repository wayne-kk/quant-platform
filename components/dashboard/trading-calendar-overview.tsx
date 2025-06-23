"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, AlertTriangle, Clock, BarChart3, Users, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlyStats {
    month: string
    totalDays: number
    tradingDays: number
    holidays: number
    weekends: number
    tradingRate: number
}

interface UpcomingEvent {
    date: string
    type: 'holiday' | 'weekend' | 'special'
    name: string
    description: string
    daysUntil: number
}

export function TradingCalendarOverview() {
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [loading, setLoading] = useState(true)

    const fetchYearlyData = async (year: number) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/trade-calendar?year=${year}`)

            if (!response.ok) {
                throw new Error('获取数据失败')
            }

            const data = await response.json()

            // 按月份分组统计
            const monthlyData: { [key: string]: MonthlyStats } = {}

            data.forEach((item: any) => {
                const date = new Date(item.date)
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        month: monthKey,
                        totalDays: 0,
                        tradingDays: 0,
                        holidays: 0,
                        weekends: 0,
                        tradingRate: 0
                    }
                }

                monthlyData[monthKey].totalDays++
                if (item.isTradeDay) {
                    monthlyData[monthKey].tradingDays++
                } else if (item.isHoliday) {
                    monthlyData[monthKey].holidays++
                } else {
                    monthlyData[monthKey].weekends++
                }
            })

            // 计算交易率
            Object.values(monthlyData).forEach(month => {
                month.tradingRate = month.totalDays > 0 ? (month.tradingDays / month.totalDays) * 100 : 0
            })

            setMonthlyStats(Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)))

            // 计算即将到来的事件
            const today = new Date()
            const upcoming = data
                .filter((item: any) => {
                    const itemDate = new Date(item.date)
                    return itemDate > today && (!item.isTradeDay)
                })
                .slice(0, 5)
                .map((item: any) => {
                    const itemDate = new Date(item.date)
                    const daysUntil = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                    return {
                        date: item.date,
                        type: item.isHoliday ? 'holiday' : 'weekend',
                        name: item.statusText,
                        description: item.holidayName || '周末休市',
                        daysUntil
                    }
                })

            setUpcomingEvents(upcoming)
        } catch (error) {
            console.error('获取年度交易日历数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchYearlyData(currentYear)
    }, [currentYear])

    const handleYearChange = (direction: 'prev' | 'next') => {
        setCurrentYear(prev => direction === 'prev' ? prev - 1 : prev + 1)
    }

    const getMonthName = (monthKey: string) => {
        const [year, month] = monthKey.split('-')
        return `${month}月`
    }

    const yearlyTotals = monthlyStats.reduce(
        (acc, month) => ({
            totalDays: acc.totalDays + month.totalDays,
            tradingDays: acc.tradingDays + month.tradingDays,
            holidays: acc.holidays + month.holidays,
            weekends: acc.weekends + month.weekends
        }),
        { totalDays: 0, tradingDays: 0, holidays: 0, weekends: 0 }
    )

    const yearlyTradingRate = yearlyTotals.totalDays > 0 ? (yearlyTotals.tradingDays / yearlyTotals.totalDays) * 100 : 0

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 年度总览 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                {currentYear}年交易日历总览
                            </CardTitle>
                            <CardDescription>
                                全年交易日统计与分析
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleYearChange('prev')}>
                                {currentYear - 1}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleYearChange('next')}>
                                {currentYear + 1}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{yearlyTotals.totalDays}</div>
                            <div className="text-sm text-blue-700">总天数</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{yearlyTotals.tradingDays}</div>
                            <div className="text-sm text-green-700">交易日</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{yearlyTotals.holidays}</div>
                            <div className="text-sm text-red-700">节假日</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{yearlyTradingRate.toFixed(1)}%</div>
                            <div className="text-sm text-purple-700">交易率</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* 月度统计 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            月度交易统计
                        </CardTitle>
                        <CardDescription>
                            各月份交易日分布情况
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-3">
                            {monthlyStats.map((month, index) => (
                                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                                            {getMonthName(month.month)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{month.tradingDays}个交易日</div>
                                            <div className="text-xs text-gray-600">
                                                节假日{month.holidays}天 • 周末{month.weekends}天
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-medium text-sm">{month.tradingRate.toFixed(1)}%</div>
                                        <div className="text-xs text-gray-600">交易率</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 即将到来的休市日 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            即将到来的休市日
                        </CardTitle>
                        <CardDescription>
                            未来的节假日和休市安排
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-4">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event, index) => (
                                    <div key={event.date} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold",
                                                event.type === 'holiday' ? 'bg-red-500' : 'bg-gray-500'
                                            )}>
                                                {event.type === 'holiday' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">{event.name}</div>
                                                <div className="text-sm text-gray-600">{event.date}</div>
                                                <div className="text-xs text-gray-500">{event.description}</div>
                                            </div>
                                        </div>

                                        <Badge variant={event.daysUntil <= 3 ? 'destructive' : 'secondary'}>
                                            {event.daysUntil}天后
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>暂无即将到来的休市日</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 