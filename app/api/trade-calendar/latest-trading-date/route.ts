import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // 首先检查今天是否为交易日
        const { data: todayInfo } = await supabase
            .from('trade_calendar')
            .select('*')
            .eq('calendar_date', todayStr)
            .single()

        if (todayInfo?.is_trade_day === true) {
            return NextResponse.json({
                date: todayStr,
                isToday: true,
                isTradeDay: true,
                displayText: '今日实时数据',
                daysAgo: 0
            })
        }

        // 如果今天不是交易日，查找最近的交易日
        const { data: latestTradingDay } = await supabase
            .from('trade_calendar')
            .select('*')
            .eq('is_trade_day', true)
            .lt('calendar_date', todayStr)
            .order('calendar_date', { ascending: false })
            .limit(1)
            .single()

        if (!latestTradingDay) {
            // 如果找不到历史交易日，直接从股票数据中查找最近有数据的日期
            const { data: latestQuote } = await supabase
                .from('daily_quote')
                .select('trade_date')
                .order('trade_date', { ascending: false })
                .limit(1)
                .single()

            if (latestQuote) {
                const latestDateStr = latestQuote.trade_date
                const daysDiff = Math.ceil((today.getTime() - new Date(latestDateStr).getTime()) / (1000 * 60 * 60 * 24))

                return NextResponse.json({
                    date: latestDateStr,
                    isToday: false,
                    isTradeDay: false,
                    displayText: daysDiff === 1 ? '昨日交易数据' : `${daysDiff}天前交易数据`,
                    daysAgo: daysDiff
                })
            }

            // 最后的降级处理
            return NextResponse.json({
                date: todayStr,
                isToday: true,
                isTradeDay: false,
                displayText: '暂无交易数据',
                daysAgo: 0
            })
        }

        const latestDateStr = latestTradingDay.calendar_date

        // 计算实际天数差异
        const daysDiff = Math.ceil((today.getTime() - new Date(latestDateStr).getTime()) / (1000 * 60 * 60 * 24))

        let displayText = ''
        if (daysDiff === 1) {
            displayText = '昨日交易数据'
        } else if (daysDiff <= 3) {
            displayText = `${daysDiff}天前交易数据`
        } else {
            displayText = '最近交易日数据'
        }

        return NextResponse.json({
            date: latestDateStr,
            isToday: false,
            isTradeDay: false,
            displayText,
            daysAgo: daysDiff
        })

    } catch (error) {
        console.error('获取最近交易日失败:', error)

        // 降级处理：直接从股票数据中查找最近有数据的日期
        try {
            const { data: latestQuote } = await supabase
                .from('daily_quote')
                .select('trade_date')
                .order('trade_date', { ascending: false })
                .limit(1)
                .single()

            if (latestQuote) {
                const today = new Date()
                const latestDateStr = latestQuote.trade_date
                const daysDiff = Math.ceil((today.getTime() - new Date(latestDateStr).getTime()) / (1000 * 60 * 60 * 24))

                return NextResponse.json({
                    date: latestDateStr,
                    isToday: daysDiff === 0,
                    isTradeDay: daysDiff === 0,
                    displayText: daysDiff === 0 ? '今日数据' : daysDiff === 1 ? '昨日交易数据' : `${daysDiff}天前交易数据`,
                    daysAgo: daysDiff
                })
            }
        } catch (fallbackError) {
            console.error('降级查询也失败:', fallbackError)
        }

        // 最终降级处理
        const today = new Date().toISOString().split('T')[0]
        return NextResponse.json({
            date: today,
            isToday: true,
            isTradeDay: false,
            displayText: '数据获取中',
            daysAgo: 0
        })
    }
} 