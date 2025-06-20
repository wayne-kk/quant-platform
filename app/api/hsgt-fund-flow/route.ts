import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date')

        if (!date) {
            return NextResponse.json({ error: '缺少日期参数' }, { status: 400 })
        }

        const hsgtData = await prisma.hsgtFundFlow.findMany({
            where: {
                tradeDate: new Date(date)
            },
            orderBy: [
                { direction: 'asc' },
                { type: 'asc' },
                { sector: 'asc' }
            ]
        })

        return NextResponse.json(hsgtData)
    } catch (error) {
        console.error('获取沪深港通资金流向数据失败:', error)
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }
} 