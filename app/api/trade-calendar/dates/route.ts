import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // 获取近期的交易日期
        const dates = await prisma.tradeCalendar.findMany({
            select: {
                calendarDate: true,
                isTradeDay: true,
                isHoliday: true,
                holidayName: true
            },
            orderBy: { calendarDate: 'desc' },
            take: 90 // 获取最近90天的数据
        })

        const formattedDates = dates.map(d => ({
            date: d.calendarDate.toISOString().split('T')[0],
            isTradeDay: d.isTradeDay,
            isHoliday: d.isHoliday,
            holidayName: d.holidayName
        }))

        return NextResponse.json(formattedDates)
    } catch (error) {
        console.error('获取交易日历可用日期失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 