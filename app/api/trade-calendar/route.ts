import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase 客户端
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const month = searchParams.get('month') // 格式: 2024-06
        const year = searchParams.get('year') // 格式: 2024

        let query = supabase.from('trade_calendar').select('calendar_date, is_trade_day')

        if (startDate && endDate) {
            query = query.gte('calendar_date', startDate).lte('calendar_date', endDate)
        } else if (month) {
            // 获取整个月的数据
            const [yearNum, monthNum] = month.split('-').map(Number)
            const startOfMonth = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`
            const endOfMonth = new Date(yearNum, monthNum, 0).toISOString().split('T')[0]
            query = query.gte('calendar_date', startOfMonth).lte('calendar_date', endOfMonth)
        } else if (year) {
            // 获取整年的数据
            const yearNum = parseInt(year)
            const startOfYear = `${yearNum}-01-01`
            const endOfYear = `${yearNum}-12-31`
            query = query.gte('calendar_date', startOfYear).lte('calendar_date', endOfYear)
        } else {
            // 默认返回当前月份的数据
            const now = new Date()
            const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            query = query.gte('calendar_date', startOfMonth).lte('calendar_date', endOfMonth)
        }

        const { data: calendarData, error } = await query.order('calendar_date', { ascending: true })

        if (error) {
            throw error
        }

        // 如果查询特定日期范围，直接返回数据或补充缺失日期
        if (startDate && endDate) {
            const result = []
            const start = new Date(startDate)
            const end = new Date(endDate)

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0]
                const dbItem = calendarData?.find(item => item.calendar_date === dateStr)

                result.push({
                    date: dateStr,
                    isTradeDay: dbItem ? dbItem.is_trade_day : false
                })
            }

            return NextResponse.json(result)
        }

        // 对于月份或年份查询，补充缺失的日期
        if (!calendarData || calendarData.length === 0) {
            return NextResponse.json(await generateFullCalendarMonth(month))
        }

        const fullCalendarData = await generateCompleteCalendarData(calendarData, month)
        return NextResponse.json(fullCalendarData)

    } catch (error) {
        console.error('获取交易日历数据失败:', error)

        // 如果数据库查询失败，生成基本的日历数据
        const month = request.nextUrl.searchParams.get('month')
        return NextResponse.json(await generateFullCalendarMonth(month))
    }
}

// 生成完整的月份日历数据
async function generateFullCalendarMonth(month: string | null) {
    const now = new Date()
    const [yearNum, monthNum] = month ?
        month.split('-').map(Number) :
        [now.getFullYear(), now.getMonth() + 1]

    const startOfMonth = new Date(yearNum, monthNum - 1, 1)
    const endOfMonth = new Date(yearNum, monthNum, 0)
    const daysInMonth = endOfMonth.getDate()

    const calendarData = []

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        calendarData.push({
            date: dateStr,
            isTradeDay: false // 默认为非交易日，实际交易日在数据库中
        })
    }

    return calendarData
}

// 基于现有数据生成完整的日历数据
async function generateCompleteCalendarData(dbData: any[], month: string | null) {
    const now = new Date()
    const [yearNum, monthNum] = month ?
        month.split('-').map(Number) :
        [now.getFullYear(), now.getMonth() + 1]

    const startOfMonth = new Date(yearNum, monthNum - 1, 1)
    const endOfMonth = new Date(yearNum, monthNum, 0)
    const daysInMonth = endOfMonth.getDate()

    const calendarData = []

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        // 查找数据库中的对应数据
        const dbItem = dbData.find(item => item.calendar_date === dateStr)

        calendarData.push({
            date: dateStr,
            isTradeDay: dbItem ? dbItem.is_trade_day : false
        })
    }

    return calendarData
} 