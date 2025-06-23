"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TradeCalendarItem {
    date: string
    isTradeDay: boolean
    isHoliday: boolean
    weekDay: number
    holidayName: string | null
    displayStatus: 'trading' | 'holiday' | 'weekend'
    statusText: string
    canTrade: boolean
    weekDayText: string
}

interface CalendarStats {
    totalDays: number
    tradingDays: number
    holidays: number
    weekends: number
    tradingRate: number
}

export function TradingCalendar() {
    const [calendarData, setCalendarData] = useState<TradeCalendarItem[]>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<CalendarStats>({
        totalDays: 0,
        tradingDays: 0,
        holidays: 0,
        weekends: 0,
        tradingRate: 0
    })

    const fetchCalendarData = async (date: Date) => {
        try {
            setLoading(true)
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const response = await fetch(`/api/trade-calendar?month=${month}`)

            if (!response.ok) {
                throw new Error('获取数据失败')
            }

            const data = await response.json()
            setCalendarData(data)

            // 计算统计信息
            const totalDays = data.length
            const tradingDays = data.filter((item: TradeCalendarItem) => item.isTradeDay).length
            const holidays = data.filter((item: TradeCalendarItem) => item.isHoliday).length
            const weekends = totalDays - tradingDays - holidays
            const tradingRate = totalDays > 0 ? (tradingDays / totalDays) * 100 : 0

            setStats({
                totalDays,
                tradingDays,
                holidays,
                weekends,
                tradingRate
            })
        } catch (error) {
            console.error('获取交易日历数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCalendarData(currentMonth)
    }, [currentMonth])

    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const handleToday = () => {
        setCurrentMonth(new Date())
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'trading':
                return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
            case 'holiday':
                return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
            case 'weekend':
                return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'trading':
                return <TrendingUp className="w-3 h-3" />
            case 'holiday':
                return <AlertTriangle className="w-3 h-3" />
            case 'weekend':
                return <Clock className="w-3 h-3" />
            default:
                return null
        }
    }

    const renderCalendarGrid = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-7 gap-1 p-4">
                    {Array.from({ length: 35 }, (_, i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-md animate-pulse" />
                    ))}
                </div>
            )
        }

        // 获取当月第一天是星期几
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const firstDayWeek = firstDay.getDay()

        // 获取当月有多少天
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
        const daysInMonth = lastDay.getDate()

        // 创建日历网格
        const calendarGrid = []

        // 添加星期标题
        const weekDays = ['日', '一', '二', '三', '四', '五', '六']
        weekDays.forEach(day => {
            calendarGrid.push(
                <div key={`header-${day}`} className="h-8 flex items-center justify-center font-medium text-sm text-gray-600">
                    {day}
                </div>
            )
        })

        // 添加空白天数（月初）
        for (let i = 0; i < firstDayWeek; i++) {
            calendarGrid.push(
                <div key={`empty-${i}`} className="h-20 rounded-md" />
            )
        }

        // 添加当月的天数
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayData = calendarData.find(item => item.date === dateStr)
            const isToday = dateStr === new Date().toISOString().split('T')[0]

            // 如果没有数据，根据星期几生成默认数据
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const weekDay = date.getDay()
            const isWeekend = weekDay === 0 || weekDay === 6

            const displayData = dayData || {
                date: dateStr,
                isTradeDay: !isWeekend,
                isHoliday: false,
                weekDay: weekDay,
                holidayName: null,
                displayStatus: isWeekend ? 'weekend' : 'trading',
                statusText: isWeekend ? '休市' : '交易日',
                canTrade: !isWeekend,
                weekDayText: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekDay]
            }

            calendarGrid.push(
                <div
                    key={day}
                    className={cn(
                        "h-20 rounded-md border-2 transition-all duration-200 cursor-pointer",
                        getStatusColor(displayData.displayStatus),
                        isToday && "ring-2 ring-blue-400 ring-offset-1"
                    )}
                >
                    <div className="p-2 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className={cn(
                                "text-sm font-medium",
                                isToday && "text-blue-600"
                            )}>
                                {day}
                            </span>
                            {getStatusIcon(displayData.displayStatus)}
                        </div>

                        <div className="flex flex-col items-start">
                            <span className="text-xs font-medium truncate w-full">
                                {displayData.statusText}
                            </span>
                            <span className="text-xs opacity-70">
                                {displayData.weekDayText}
                            </span>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-7 gap-1 p-4">
                {calendarGrid}
            </div>
        )
    }

    return (
        <Card className="col-span-full">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            交易日历
                        </CardTitle>
                        <CardDescription>
                            查看股市交易日、节假日和休市安排
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            今天
                        </Button>
                        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextMonth}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* 月份标题 */}
                <div className="flex items-center justify-center py-2">
                    <h3 className="text-lg font-semibold">
                        {currentMonth.toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long'
                        })}
                    </h3>
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.tradingDays}</div>
                        <div className="text-sm text-gray-600">交易日</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.holidays}</div>
                        <div className="text-sm text-gray-600">节假日</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{stats.weekends}</div>
                        <div className="text-sm text-gray-600">周末</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.tradingRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">交易率</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {renderCalendarGrid()}

                {/* 图例 */}
                <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 border-t">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-200 rounded-sm flex items-center justify-center">
                            <TrendingUp className="w-2 h-2 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-600">交易日</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-200 rounded-sm flex items-center justify-center">
                            <AlertTriangle className="w-2 h-2 text-red-600" />
                        </div>
                        <span className="text-sm text-gray-600">节假日</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded-sm flex items-center justify-center">
                            <Clock className="w-2 h-2 text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-600">周末休市</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 