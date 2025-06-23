import { NextRequest, NextResponse } from 'next/server'

// 指数代码映射
const INDEX_CODES = {
    'sh000001': '000001', // 上证指数
    'sz399001': '399001', // 深证成指
    'sz399006': '399006', // 创业板指
    'sh000300': '000300', // 沪深300
    'sh000905': '000905'  // 中证500
}

interface MinuteData {
    time: string
    open: number
    close: number
    high: number
    low: number
    volume: number
    amount: number
    avgPrice: number
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const symbol = searchParams.get('symbol') || '000001'
        const period = searchParams.get('period') || '1'
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')

        // 构建请求URL (这里应该是你的Python后端服务地址)
        const apiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'
        const url = new URL('/stock_zh_index_spot_sina', apiUrl)

        url.searchParams.set('symbol', symbol)
        url.searchParams.set('period', period)
        if (startDate) url.searchParams.set('start_date', startDate)
        if (endDate) url.searchParams.set('end_date', endDate)

        // 如果是生产环境且没有Python服务，直接返回错误
        if (!process.env.PYTHON_API_URL) {
            return NextResponse.json(
                { error: '数据服务未配置，请检查 PYTHON_API_URL 环境变量' },
                { status: 503 }
            )
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // 设置超时
            signal: AbortSignal.timeout(10000)
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('获取分时数据失败:', error)
        return NextResponse.json(
            { error: '获取分时数据失败: ' + (error instanceof Error ? error.message : '未知错误') },
            { status: 500 }
        )
    }
}

