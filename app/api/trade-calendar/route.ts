import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface HolidayInfo {
    type: string;
    name: string;
}

// 初始化 Supabase 客户端
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 简单的内存缓存
const holidayCache = new Map<string, string | null>()

// 2024年和2025年官方节假日数据（根据国务院办公厅通知）
const HOLIDAY_DATA: { [key: string]: { type: string, name: string } } = {
    // 2024年节假日
    '2024-01-01': { type: 'holiday', name: '元旦' },
    '2024-02-09': { type: 'holiday', name: '春节' }, // 除夕
    '2024-02-10': { type: 'holiday', name: '春节' },
    '2024-02-11': { type: 'holiday', name: '春节' },
    '2024-02-12': { type: 'holiday', name: '春节' },
    '2024-02-13': { type: 'holiday', name: '春节' },
    '2024-02-14': { type: 'holiday', name: '春节' },
    '2024-02-15': { type: 'holiday', name: '春节' },
    '2024-02-16': { type: 'holiday', name: '春节' },
    '2024-02-17': { type: 'holiday', name: '春节' },
    '2024-04-04': { type: 'holiday', name: '清明节' },
    '2024-04-05': { type: 'holiday', name: '清明节' },
    '2024-04-06': { type: 'holiday', name: '清明节' },
    '2024-05-01': { type: 'holiday', name: '劳动节' },
    '2024-05-02': { type: 'holiday', name: '劳动节' },
    '2024-05-03': { type: 'holiday', name: '劳动节' },
    '2024-05-04': { type: 'holiday', name: '劳动节' },
    '2024-05-05': { type: 'holiday', name: '劳动节' },
    '2024-06-10': { type: 'holiday', name: '端午节' },
    '2024-09-15': { type: 'holiday', name: '中秋节' },
    '2024-09-16': { type: 'holiday', name: '中秋节' },
    '2024-09-17': { type: 'holiday', name: '中秋节' },
    '2024-10-01': { type: 'holiday', name: '国庆节' },
    '2024-10-02': { type: 'holiday', name: '国庆节' },
    '2024-10-03': { type: 'holiday', name: '国庆节' },
    '2024-10-04': { type: 'holiday', name: '国庆节' },
    '2024-10-05': { type: 'holiday', name: '国庆节' },
    '2024-10-06': { type: 'holiday', name: '国庆节' },
    '2024-10-07': { type: 'holiday', name: '国庆节' },

    // 2025年节假日（根据国务院办公厅2024年11月12日通知）
    '2025-01-01': { type: 'holiday', name: '元旦' },
    '2025-01-28': { type: 'holiday', name: '春节' },
    '2025-01-29': { type: 'holiday', name: '春节' },
    '2025-01-30': { type: 'holiday', name: '春节' },
    '2025-01-31': { type: 'holiday', name: '春节' },
    '2025-02-01': { type: 'holiday', name: '春节' },
    '2025-02-02': { type: 'holiday', name: '春节' },
    '2025-02-03': { type: 'holiday', name: '春节' },
    '2025-02-04': { type: 'holiday', name: '春节' },
    '2025-04-04': { type: 'holiday', name: '清明节' },
    '2025-04-05': { type: 'holiday', name: '清明节' },
    '2025-04-06': { type: 'holiday', name: '清明节' },
    '2025-05-01': { type: 'holiday', name: '劳动节' },
    '2025-05-02': { type: 'holiday', name: '劳动节' },
    '2025-05-03': { type: 'holiday', name: '劳动节' },
    '2025-05-04': { type: 'holiday', name: '劳动节' },
    '2025-05-05': { type: 'holiday', name: '劳动节' },
    '2025-05-31': { type: 'holiday', name: '端午节' },
    '2025-06-01': { type: 'holiday', name: '端午节' },
    '2025-06-02': { type: 'holiday', name: '端午节' },
    '2025-10-01': { type: 'holiday', name: '国庆节' },
    '2025-10-02': { type: 'holiday', name: '国庆节' },
    '2025-10-03': { type: 'holiday', name: '国庆节' },
    '2025-10-04': { type: 'holiday', name: '国庆节' },
    '2025-10-05': { type: 'holiday', name: '国庆节' },
    '2025-10-06': { type: 'holiday', name: '中秋节' },
    '2025-10-07': { type: 'holiday', name: '国庆节' },
    '2025-10-08': { type: 'holiday', name: '国庆节' },
};

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const month = searchParams.get('month') // 格式: 2024-06
        const year = searchParams.get('year') // 格式: 2024

        let query = supabase.from('trade_calendar').select('*')

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

        // 如果没有数据，生成整个月的完整日历数据（包括周末）
        if (!calendarData || calendarData.length === 0) {
            return NextResponse.json(await generateFullCalendarMonth(month))
        }

        // 格式化现有数据，并补充缺失的周末数据
        const fullCalendarData = await generateCompleteCalendarData(calendarData, month)

        return NextResponse.json(fullCalendarData)
    } catch (error) {
        console.error('获取交易日历数据失败:', error)

        // 如果数据库查询失败，生成基本的日历数据
        const month = request.nextUrl.searchParams.get('month')
        return NextResponse.json(await generateFullCalendarMonth(month))
    }
}

// 优化：高性能的批量获取节假日信息函数（纯本地查询）
function batchGetHolidayInfo(dateStrs: string[]): Map<string, string | null> {
    const result = new Map<string, string | null>();

    for (const dateStr of dateStrs) {
        const holidayInfo = HOLIDAY_DATA[dateStr];
        result.set(dateStr, holidayInfo ? holidayInfo.name : null);
    }

    return result;
}

// 优化：高性能的获取节假日信息函数（纯本地查询）
function getHolidayInfo(dateStr: string): HolidayInfo | null {
    const holidayInfo = HOLIDAY_DATA[dateStr];
    return holidayInfo ? {
        type: holidayInfo.type,
        name: holidayInfo.name,
    } : null;
}

// 生成完整的月份日历数据，包括所有天（交易日、节假日、周末）
async function generateFullCalendarMonth(month: string | null) {
    const now = new Date()
    const [yearNum, monthNum] = month ?
        month.split('-').map(Number) :
        [now.getFullYear(), now.getMonth() + 1]

    const startOfMonth = new Date(yearNum, monthNum - 1, 1)
    const endOfMonth = new Date(yearNum, monthNum, 0)
    const daysInMonth = endOfMonth.getDate()

    // 生成所有日期字符串
    const allDates: string[] = []
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        allDates.push(dateStr)
    }

    // 批量获取节假日信息
    const holidayInfoMap = batchGetHolidayInfo(allDates)

    const calendarData = []

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const date = new Date(dateStr + 'T00:00:00.000Z')
        const weekDay = date.getUTCDay() // 0=周日, 1=周一, ..., 6=周六
        const isWeekend = weekDay === 0 || weekDay === 6

        // 从批量结果中获取节假日信息
        const holidayInfo = holidayInfoMap.get(dateStr) || null

        // 只包含当月的数据
        if (date.getUTCFullYear() === yearNum && date.getUTCMonth() === monthNum - 1) {
            calendarData.push({
                date: dateStr,
                isTradeDay: !isWeekend && !holidayInfo,
                isHoliday: !!holidayInfo,
                weekDay: weekDay,
                holidayName: holidayInfo || null,
                displayStatus: holidayInfo ? 'holiday' : (isWeekend ? 'weekend' : 'trading'),
                statusText: holidayInfo ? holidayInfo : (isWeekend ? '休市' : '交易日'),
                canTrade: !isWeekend && !holidayInfo,
                weekDayText: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekDay]
            })
        }
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

    // 收集需要查询节假日信息的日期
    const datesToQuery: string[] = []
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        // 查找数据库中的对应数据
        const dbItem = dbData.find(item => {
            const itemDate = new Date(item.calendar_date)
            return item.calendar_date === dateStr &&
                itemDate.getFullYear() === yearNum &&
                itemDate.getMonth() === monthNum - 1
        })

        // 如果数据库中没有数据，需要查询节假日信息
        if (!dbItem) {
            datesToQuery.push(dateStr)
        }
    }

    // 批量获取节假日信息
    const holidayInfoMap = datesToQuery.length > 0 ? batchGetHolidayInfo(datesToQuery) : new Map()

    const calendarData = []

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const date = new Date(dateStr + 'T00:00:00.000Z')
        const weekDay = date.getUTCDay()
        const isWeekend = weekDay === 0 || weekDay === 6

        // 查找数据库中的对应数据
        const dbItem = dbData.find(item => {
            // 确保只匹配当月的数据
            const itemDate = new Date(item.calendar_date)
            return item.calendar_date === dateStr &&
                itemDate.getFullYear() === yearNum &&
                itemDate.getMonth() === monthNum - 1
        })

        if (dbItem) {
            // 使用数据库数据
            calendarData.push({
                date: dateStr,
                isTradeDay: dbItem.is_trade_day,
                isHoliday: dbItem.is_holiday,
                weekDay: dbItem.week_day,
                holidayName: dbItem.holiday_name || null,
                displayStatus: dbItem.is_trade_day ? 'trading' : (dbItem.is_holiday ? 'holiday' : 'weekend'),
                statusText: dbItem.is_trade_day ? '交易日' : (dbItem.is_holiday ? (dbItem.holiday_name || '节假日') : '休市'),
                canTrade: dbItem.is_trade_day,
                weekDayText: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dbItem.week_day]
            })
        } else {
            // 没有数据库数据，从批量查询结果中获取节假日信息
            const holidayInfo = holidayInfoMap.get(dateStr) || null

            calendarData.push({
                date: dateStr,
                isTradeDay: !isWeekend && !holidayInfo,
                isHoliday: !!holidayInfo,
                weekDay: weekDay,
                holidayName: holidayInfo || null,
                displayStatus: holidayInfo ? 'holiday' : (isWeekend ? 'weekend' : 'trading'),
                statusText: holidayInfo ? holidayInfo : (isWeekend ? '休市' : '交易日'),
                canTrade: !isWeekend && !holidayInfo,
                weekDayText: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekDay]
            })
        }
    }

    return calendarData
} 