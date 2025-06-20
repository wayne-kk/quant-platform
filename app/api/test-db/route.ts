import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        console.log('开始测试数据库连接...')

        // 测试连接
        const { data: test, error: testError } = await supabase
            .from('stock_basic')
            .select('count')
            .limit(1)

        if (testError) {
            console.error('数据库连接错误:', testError)
            return NextResponse.json({
                error: '数据库连接失败',
                details: testError.message
            }, { status: 500 })
        }

        // 检查各个表的数据量
        const tables = [
            'stock_basic',
            'daily_quote',
            'index_data',
            'stock_hot_rank',
            'stock_hot_up',
            'stock_fund_flow_rank',
            'hsgt_fund_flow'
        ]

        const results: any = {}

        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true })

                if (error) {
                    results[table] = { error: error.message }
                } else {
                    results[table] = { count: count || 0 }
                }
            } catch (err) {
                results[table] = { error: '表不存在或查询失败' }
            }
        }

        // 获取一些样本数据
        const { data: sampleStocks } = await supabase
            .from('stock_basic')
            .select('*')
            .limit(5)

        const { data: sampleQuotes } = await supabase
            .from('daily_quote')
            .select('*')
            .limit(5)

        return NextResponse.json({
            status: 'success',
            message: '数据库连接正常',
            tables: results,
            samples: {
                stocks: sampleStocks || [],
                quotes: sampleQuotes || []
            }
        })

    } catch (error) {
        console.error('测试数据库时发生错误:', error)
        return NextResponse.json({
            error: '测试失败',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 })
    }
} 