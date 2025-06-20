import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const limit = parseInt(searchParams.get('limit') || '20')

        // 获取最新交易日期
        const latestDate = await prisma.stockHotRank.findFirst({
            select: { tradeDate: true },
            orderBy: { tradeDate: 'desc' }
        })

        if (!latestDate) {
            return NextResponse.json([])
        }

        const hotRanks = await prisma.stockHotRank.findMany({
            where: {
                tradeDate: latestDate.tradeDate
            },
            orderBy: {
                currentRank: 'asc'
            },
            take: limit
        })

        return NextResponse.json(hotRanks)
    } catch (error) {
        console.error('获取股票人气榜失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 