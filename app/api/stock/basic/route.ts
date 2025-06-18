import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStockBasic } from '@/lib/tushare-api';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
    console.log('API 路由被调用');

    if (!request.body) {
        console.error('请求体为空');
        return NextResponse.json(
            { success: false, message: '请求体不能为空' },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        console.log('请求参数:', body);

        if (!body) {
            console.error('解析请求体失败');
            return NextResponse.json(
                { success: false, message: '无效的请求数据' },
                { status: 400 }
            );
        }

        const { list_status, exchange, forceUpdate } = body;

        // 获取Tushare股票基础数据
        console.log('开始调用 Tushare API...');
        const result = await getStockBasic({
            exchange,
            list_status,
            fields: 'ts_code,symbol,name,area,industry,market,exchange,list_date,delist_date,is_hs'
        });
        console.log('Tushare API 返回数据:', result);

        if (!result.data || result.data.length === 0) {
            return NextResponse.json({
                success: false,
                message: '未获取到股票基础数据'
            }, { status: 404 });
        }

        // 将API返回的数据转换为数据库模型格式
        console.log('开始转换数据格式...');
        const stocksToUpsert = result.data.map((item: any) => {
            const [ts_code, symbol, name, area, industry, market, exchange, list_date, delist_date, is_hs] = item;

            return {
                code: symbol,
                name,
                area,
                industry,
                market,
                exchange: exchange === 'SSE' ? 'SSE' : 'SZSE',
                listDate: list_date ? new Date(`${list_date.slice(0, 4)}-${list_date.slice(4, 6)}-${list_date.slice(6, 8)}`) : null,
                delistDate: delist_date ? new Date(`${delist_date.slice(0, 4)}-${delist_date.slice(4, 6)}-${delist_date.slice(6, 8)}`) : null,
                isHs: is_hs,
                isActive: list_status === 'L'
            };
        });
        console.log('数据转换完成，准备写入数据库...');

        // 检查是否已存在数据
        const existingCount = await prisma.stockBasic.count();
        console.log('现有数据数量:', existingCount);

        if (existingCount > 0 && !forceUpdate) {
            return NextResponse.json({
                success: false,
                message: '数据库中已存在股票基础数据，如需更新请设置forceUpdate=true',
                existingCount
            }, { status: 409 });
        }

        // 批量更新或插入股票数据
        console.log('开始写入数据库...');
        const BATCH_SIZE = 100; // 每批处理的记录数
        let totalInserted = 0;

        // 如果强制更新且已有数据，先清空表
        if (forceUpdate && existingCount > 0) {
            console.log('强制更新模式：清空现有数据...');
            await prisma.stockBasic.deleteMany({});
        }

        // 分批创建数据
        console.log('开始分批创建数据...');
        for (let i = 0; i < stocksToUpsert.length; i += BATCH_SIZE) {
            const batch = stocksToUpsert.slice(i, i + BATCH_SIZE);
            console.log(`处理第 ${i / BATCH_SIZE + 1} 批数据，共 ${batch.length} 条记录`);

            const batchResult = await prisma.stockBasic.createMany({
                data: batch,
                skipDuplicates: true
            });

            totalInserted += batchResult.count;
            console.log(`第 ${i / BATCH_SIZE + 1} 批数据插入完成，本批插入 ${batchResult.count} 条记录`);
        }

        console.log('数据库写入完成，总共插入:', totalInserted);

        return NextResponse.json({
            success: true,
            message: '股票基础数据导入成功',
            count: totalInserted,
            total: stocksToUpsert.length
        });
    } catch (error) {
        console.error('导入股票基础数据失败:', error);
        // 打印完整的错误堆栈
        if (error instanceof Error) {
            console.error('错误堆栈:', error.stack);
        }
        return NextResponse.json(
            {
                success: false,
                message: '导入过程中发生错误',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}
