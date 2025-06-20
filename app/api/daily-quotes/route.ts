import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const stockCode = searchParams.get('stockCode')
        const days = parseInt(searchParams.get('days') || '30')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!stockCode) {
            return NextResponse.json({ error: '缺少股票代码参数' }, { status: 400 })
        }

        let where: any = { stockCode }

        if (startDate && endDate) {
            where.tradeDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        } else if (days) {
            const fromDate = new Date()
            fromDate.setDate(fromDate.getDate() - days)
            where.tradeDate = {
                gte: fromDate
            }
        }

        const dailyQuotes = await prisma.dailyQuote.findMany({
            where,
            include: {
                stock: {
                    select: {
                        stockName: true
                    }
                }
            },
            orderBy: {
                tradeDate: 'desc'
            },
            take: 100 // 限制返回数量
        })

        const formattedQuotes = dailyQuotes.map(quote => ({
            ...quote,
            stockName: quote.stock.stockName,
            stock: undefined // 不返回原始 stock 对象
        }))

        return NextResponse.json(formattedQuotes)
    } catch (error) {
        console.error('获取日线行情数据失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 