/**
 * 中国股市颜色规范工具函数
 * 规范：红色代表上涨，绿色代表下跌
 */

export const STOCK_COLORS = {
    // 上涨颜色（红色系）
    UP: {
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        full: 'text-red-600 bg-red-50 border-red-200',
        gradient: 'from-red-500 to-red-600',
        hex: '#dc2626'
    },
    // 下跌颜色（绿色系）
    DOWN: {
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        full: 'text-green-600 bg-green-50 border-green-200',
        gradient: 'from-green-500 to-green-600',
        hex: '#16a34a'
    },
    // 平盘颜色（灰色系）
    FLAT: {
        text: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        full: 'text-gray-600 bg-gray-50 border-gray-200',
        gradient: 'from-gray-500 to-gray-600',
        hex: '#6b7280'
    }
}

/**
 * 根据涨跌幅获取颜色类名
 * @param value 涨跌幅值
 * @param type 返回的颜色类型
 * @returns 对应的CSS类名
 */
export function getStockColor(
    value: number | null | undefined,
    type: 'text' | 'bg' | 'border' | 'full' | 'gradient' = 'text'
): string {
    if (value === null || value === undefined) {
        return STOCK_COLORS.FLAT[type]
    }

    if (value > 0) {
        return STOCK_COLORS.UP[type]
    } else if (value < 0) {
        return STOCK_COLORS.DOWN[type]
    } else {
        return STOCK_COLORS.FLAT[type]
    }
}

/**
 * 根据涨跌幅获取颜色十六进制值
 * @param value 涨跌幅值
 * @returns 对应的十六进制颜色值
 */
export function getStockColorHex(value: number | null | undefined): string {
    if (value === null || value === undefined) {
        return STOCK_COLORS.FLAT.hex
    }

    if (value > 0) {
        return STOCK_COLORS.UP.hex
    } else if (value < 0) {
        return STOCK_COLORS.DOWN.hex
    } else {
        return STOCK_COLORS.FLAT.hex
    }
}

/**
 * 格式化涨跌幅显示
 * @param pctChg 涨跌幅
 * @returns 格式化后的字符串
 */
export function formatPctChg(pctChg: number | null | undefined): string {
    if (pctChg === null || pctChg === undefined) {
        return '--'
    }
    return `${pctChg > 0 ? '+' : ''}${pctChg.toFixed(2)}%`
}

/**
 * 格式化价格显示
 * @param price 价格
 * @returns 格式化后的字符串
 */
export function formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) {
        return '--'
    }
    return `¥${price.toFixed(2)}`
}

/**
 * 格式化大数字显示（万、亿）
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatLargeNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) {
        return '--'
    }

    if (num >= 100000000) {
        return `${(num / 100000000).toFixed(2)}亿`
    }
    if (num >= 10000) {
        return `${(num / 10000).toFixed(2)}万`
    }
    return num.toFixed(2)
} 