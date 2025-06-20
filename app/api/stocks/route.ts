import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const includeQuote = searchParams.get('includeQuote') === 'true'
        const limit = parseInt(searchParams.get('limit') || '100')
        const search = searchParams.get('search')
        const exchange = searchParams.get('exchange')
        const industry = searchParams.get('industry')

        const where: any = {}

        if (search) {
            where.OR = [
                { stockCode: { contains: search, mode: 'insensitive' } },
                { stockName: { contains: search, mode: 'insensitive' } },
                { industry: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (exchange) {
            where.exchange = exchange
        }

        if (industry) {
            where.industry = industry
        }

        const stocks = await prisma.stockBasic.findMany({
            where,
            orderBy: { stockCode: 'asc' },
            take: limit,
            include: includeQuote ? {
                dailyQuotes: {
                    orderBy: { tradeDate: 'desc' },
                    take: 1,
                    select: {
                        close: true,
                        pctChg: true,
                        volume: true,
                        amount: true,
                        tradeDate: true
                    }
                }
            } : undefined
        })

        const formattedStocks = stocks.map(stock => {
            const stockWithQuotes = stock as any
            return {
                ...stock,
                latestQuote: includeQuote && stockWithQuotes.dailyQuotes?.[0] ? stockWithQuotes.dailyQuotes[0] : undefined,
                dailyQuotes: undefined // 不返回原始 dailyQuotes 数组
            }
        })

        return NextResponse.json(formattedStocks)
    } catch (error) {
        console.error('获取股票数据失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 