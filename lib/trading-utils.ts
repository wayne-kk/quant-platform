/**
 * 交易日工具函数
 * 用于处理非交易日的数据显示逻辑
 */

export interface TradingDateInfo {
    date: string
    isToday: boolean
    isTradeDay: boolean
    displayText: string
    daysAgo: number
}

/**
 * 获取最近的交易日
 */
export async function getLatestTradingDate(): Promise<TradingDateInfo> {
    try {
        const response = await fetch('/api/trade-calendar/latest-trading-date')
        if (response.ok) {
            const data = await response.json()
            return data
        }
    } catch (error) {
        console.error('获取最近交易日失败:', error)
    }

    // 降级处理：返回今天的信息
    const today = new Date().toISOString().split('T')[0]
    return {
        date: today,
        isToday: true,
        isTradeDay: false,
        displayText: '数据获取中',
        daysAgo: 0
    }
}

/**
 * 格式化交易日期显示文本
 */
export function formatTradingDateDisplay(dateInfo: TradingDateInfo): string {
    if (dateInfo.isToday && dateInfo.isTradeDay) {
        return '今日实时数据'
    } else if (dateInfo.isToday && !dateInfo.isTradeDay) {
        return '今日非交易日，显示最近交易日数据'
    } else if (dateInfo.daysAgo === 1) {
        return '昨日交易数据'
    } else {
        return `${dateInfo.daysAgo}个交易日前数据`
    }
}

/**
 * 获取数据查询的日期参数
 * 如果今天是非交易日，自动使用最近的交易日
 */
export async function getDataQueryDate(): Promise<string> {
    const dateInfo = await getLatestTradingDate()
    return dateInfo.date
}

/**
 * 检查是否为交易日
 */
export async function isTradingDay(date?: string): Promise<boolean> {
    try {
        const queryDate = date || new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/trade-calendar?startDate=${queryDate}&endDate=${queryDate}`)

        if (response.ok) {
            const data = await response.json()
            return data.length > 0 && data[0].isTradeDay
        }
    } catch (error) {
        console.error('检查交易日失败:', error)
    }

    return false
}

/**
 * 客户端缓存最近交易日信息
 */
let cachedTradingDateInfo: TradingDateInfo | null = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export function getCachedTradingDateInfo(): TradingDateInfo | null {
    if (cachedTradingDateInfo && Date.now() - cacheTime < CACHE_DURATION) {
        return cachedTradingDateInfo
    }
    return null
}

export function setCachedTradingDateInfo(info: TradingDateInfo): void {
    cachedTradingDateInfo = info
    cacheTime = Date.now()
} 