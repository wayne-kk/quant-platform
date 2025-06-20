import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const stocks = await prisma.stockBasic.findMany({
            where: {
                dailyQuotes: {
                    some: {} // 只返回有日线数据的股票
                }
            },
            select: {
                stockCode: true,
                stockName: true
            },
            orderBy: {
                stockCode: 'asc'
            },
            take: 500 // 限制返回数量
        })

        const formattedStocks = stocks.map(stock => ({
            code: stock.stockCode,
            name: stock.stockName
        }))

        return NextResponse.json(formattedStocks)
    } catch (error) {
        console.error('获取股票列表失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 