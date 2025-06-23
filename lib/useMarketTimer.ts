import { useEffect, useRef, useCallback } from 'react'
import { isMarketOpen, isTradeDay, getMarketStatus, getUpdateInterval, getNextMarketOpenTime } from './market-utils'

/**
 * 智能市场定时器 hooks
 * @param onTick 每次定时触发的回调
 * @param enabled 是否启用定时器
 */
export function useMarketTimer(onTick: () => void, enabled: boolean) {
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const stoppedRef = useRef(false)

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const scheduleNext = useCallback(async () => {
        if (stoppedRef.current) return
        const isTradingDay = await isTradeDay()
        const status = getMarketStatus()
        const shouldUpdate = isTradingDay && status === 'open'
        const interval = getUpdateInterval(status)

        if (shouldUpdate) {
            onTick()
            timerRef.current = setTimeout(scheduleNext, interval)
        } else {
            // 闭市或午休，等待到下次开市
            const nextOpen = getNextMarketOpenTime()
            const wait = Math.max(1000 * 60, nextOpen.getTime() - Date.now()) // 最少1分钟
            timerRef.current = setTimeout(scheduleNext, wait)
        }
    }, [onTick])

    useEffect(() => {
        stoppedRef.current = !enabled
        clearTimer()
        if (enabled) {
            scheduleNext()
        }
        return () => {
            stoppedRef.current = true
            clearTimer()
        }
    }, [enabled, scheduleNext, clearTimer])
} 