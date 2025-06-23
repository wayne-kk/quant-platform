/**
 * 市场交易时间相关工具函数
 */

// 市场状态类型
export type MarketStatus = 'closed' | 'open' | 'break'

/**
 * 判断是否为交易时间
 * @returns {boolean} 是否在交易时间内
 */
export function isMarketOpen(): boolean {
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)) // 转换为北京时间
    const day = beijingTime.getDay() // 0=周日, 1=周一, ..., 6=周六

    // 周末不开市
    if (day === 0 || day === 6) return false

    const hours = beijingTime.getHours()
    const minutes = beijingTime.getMinutes()

    // 上午 9:30-11:30
    if ((hours === 9 && minutes >= 30) || (hours > 9 && hours < 11) || (hours === 11 && minutes <= 30)) {
        return true
    }
    // 下午 13:00-15:00
    if ((hours === 13) || (hours === 14) || (hours === 15 && minutes === 0)) {
        return true
    }
    return false
}

/**
 * 获取当前市场状态
 * @returns {MarketStatus} 市场状态
 */
export function getMarketStatus(): MarketStatus {
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const day = beijingTime.getDay()

    // 周末闭市
    if (day === 0 || day === 6) return 'closed'

    const hours = beijingTime.getHours()
    const minutes = beijingTime.getMinutes()

    // 上午 9:30-11:30
    if ((hours === 9 && minutes >= 30) || (hours > 9 && hours < 11) || (hours === 11 && minutes <= 30)) {
        return 'open'
    }
    // 下午 13:00-15:00
    if ((hours === 13) || (hours === 14) || (hours === 15 && minutes === 0)) {
        return 'open'
    }
    // 午休 11:31-12:59
    if ((hours === 11 && minutes > 30) || (hours === 12)) {
        return 'break'
    }
    return 'closed'
}

/**
 * 判断当前是否为交易日（结合节假日）
 * @param {string} [date] 可选的日期字符串，默认为今天
 * @returns {Promise<boolean>} 是否为交易日
 */
export async function isTradeDay(date?: string): Promise<boolean> {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/trade-calendar?startDate=${targetDate}&endDate=${targetDate}`)

        if (response.ok) {
            const data = await response.json()
            return data.length > 0 && data[0].isTradeDay === true
        }
    } catch (error) {
        console.error('检查交易日失败:', error)
    }

    // 降级处理：简单判断是否为工作日
    const checkDate = date ? new Date(date) : new Date()
    const day = checkDate.getDay()
    return day >= 1 && day <= 5
}

/**
 * 获取下次开市时间
 * @returns {Date} 下次开市的时间
 */
export function getNextMarketOpenTime(): Date {
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const nextOpen = new Date(beijingTime)

    const day = beijingTime.getDay()
    const hours = beijingTime.getHours()
    const minutes = beijingTime.getMinutes()

    // 如果是交易日
    if (day >= 1 && day <= 5) {
        if (hours < 9 || (hours === 9 && minutes < 30)) {
            // 今天上午开市前
            nextOpen.setHours(9, 30, 0, 0)
        } else if ((hours === 11 && minutes > 30) || (hours === 12)) {
            // 午休时间
            nextOpen.setHours(13, 0, 0, 0)
        } else if (hours > 15 || (hours === 15 && minutes > 0)) {
            // 今天收市后，明天开市
            nextOpen.setDate(nextOpen.getDate() + 1)
            nextOpen.setHours(9, 30, 0, 0)
        } else if (hours > 11 && hours < 13) {
            // 午休时间
            nextOpen.setHours(13, 0, 0, 0)
        }
    } else {
        // 周末，下周一开市
        const daysUntilMonday = day === 0 ? 1 : 8 - day
        nextOpen.setDate(nextOpen.getDate() + daysUntilMonday)
        nextOpen.setHours(9, 30, 0, 0)
    }

    return new Date(nextOpen.getTime() - (8 * 60 * 60 * 1000)) // 转回UTC时间
}

/**
 * 获取下次收市时间
 * @returns {Date | null} 下次收市的时间，如果当前已收市则返回null
 */
export function getNextMarketCloseTime(): Date | null {
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const nextClose = new Date(beijingTime)

    const day = beijingTime.getDay()
    const hours = beijingTime.getHours()
    const minutes = beijingTime.getMinutes()

    // 只在交易日且开市时间内才有收市时间
    if (day >= 1 && day <= 5) {
        // 上午交易时间，下次收市是11:30
        if ((hours === 9 && minutes >= 30) || (hours > 9 && hours < 11) || (hours === 11 && minutes <= 30)) {
            nextClose.setHours(11, 30, 0, 0)
            return new Date(nextClose.getTime() - (8 * 60 * 60 * 1000))
        }
        // 下午交易时间，下次收市是15:00
        if ((hours === 13) || (hours === 14) || (hours === 15 && minutes === 0)) {
            nextClose.setHours(15, 0, 0, 0)
            return new Date(nextClose.getTime() - (8 * 60 * 60 * 1000))
        }
    }
    return null
}

/**
 * 计算距离下次开市的时间（毫秒）
 * @returns {number} 距离下次开市的毫秒数
 */
export function getTimeUntilNextOpen(): number {
    const nextOpen = getNextMarketOpenTime()
    return Math.max(0, nextOpen.getTime() - Date.now())
}

/**
 * 计算距离下次收市的时间（毫秒）
 * @returns {number} 距离下次收市的毫秒数，如果当前已收市则返回0
 */
export function getTimeUntilNextClose(): number {
    const nextClose = getNextMarketCloseTime()
    return nextClose ? Math.max(0, nextClose.getTime() - Date.now()) : 0
}

/**
 * 格式化市场状态显示文本
 * @param {MarketStatus} status 市场状态
 * @returns {string} 显示文本
 */
export function formatMarketStatus(status: MarketStatus): string {
    switch (status) {
        case 'open':
            return '开市中'
        case 'break':
            return '午休'
        case 'closed':
            return '闭市'
        default:
            return '未知'
    }
}

/**
 * 获取市场状态的颜色类名
 * @param {MarketStatus} status 市场状态
 * @returns {string} CSS类名
 */
export function getMarketStatusColor(status: MarketStatus): string {
    switch (status) {
        case 'open':
            return 'bg-green-500 text-white'
        case 'break':
            return 'bg-yellow-500 text-white'
        case 'closed':
            return 'bg-gray-500 text-white'
        default:
            return 'bg-gray-400 text-white'
    }
}

/**
 * 判断是否应该进行实时更新
 * 结合交易日和交易时间的综合判断
 * @returns {Promise<boolean>} 是否应该进行实时更新
 */
export async function shouldUpdateRealTime(): Promise<boolean> {
    const isTradingDay = await isTradeDay()
    const isOpen = isMarketOpen()
    return isTradingDay && isOpen
}

/**
 * 获取合适的更新间隔（毫秒）
 * 根据市场状态返回不同的更新频率
 * @param {MarketStatus} [status] 市场状态，如果不提供则自动获取
 * @returns {number} 更新间隔毫秒数
 */
export function getUpdateInterval(status?: MarketStatus): number {
    const marketStatus = status || getMarketStatus()

    switch (marketStatus) {
        case 'open':
            return 90000 // 开市时每1.5分钟更新
        case 'break':
            return 5 * 60 * 1000 // 午休时每5分钟检查一次
        case 'closed':
            return 60 * 60 * 1000 // 闭市时每小时检查一次
        default:
            return 60 * 60 * 1000
    }
} 