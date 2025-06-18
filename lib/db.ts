import { PrismaClient } from '../lib/generated/prisma';

declare global {
    var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

// 添加连接测试
prisma.$connect()
    .then(() => {
        console.log('Prisma Client 已成功连接到数据库');
    })
    .catch((error: Error) => {
        console.error('Prisma Client 连接数据库失败:', error);
    });

export { prisma };
