import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const dates = await prisma.hsgtFundFlow.findMany({
            select: { tradeDate: true },
            distinct: ['tradeDate'],
            orderBy: { tradeDate: 'desc' },
            take: 30
        })

        const dateStrings = dates.map(d => d.tradeDate.toISOString().split('T')[0])

        return NextResponse.json(dateStrings)
    } catch (error) {
        console.error('获取可用日期失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 