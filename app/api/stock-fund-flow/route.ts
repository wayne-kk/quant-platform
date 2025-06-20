import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date')
        const indicator = searchParams.get('indicator') || '今日'
        const limit = parseInt(searchParams.get('limit') || '50')

        if (!date) {
            return NextResponse.json({ error: '缺少日期参数' }, { status: 400 })
        }

        const fundFlowData = await prisma.stockFundFlowRank.findMany({
            where: {
                tradeDate: new Date(date),
                indicator: indicator
            },
            include: {
                stock: {
                    select: {
                        stockName: true
                    }
                }
            },
            orderBy: [
                { rank: 'asc' },
                { mainNetInflowAmount: 'desc' }
            ],
            take: limit
        })

        const formattedData = fundFlowData.map(item => ({
            ...item,
            stockName: item.stock.stockName
        }))

        return NextResponse.json(formattedData)
    } catch (error) {
        console.error('获取资金流向数据失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 