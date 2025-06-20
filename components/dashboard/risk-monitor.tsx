'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface RiskMetric {
  name: string
  value: number
  threshold: number
  status: 'safe' | 'warning' | 'danger'
  description: string
}

interface MarketRisk {
  volatility: number
  declineRatio: number
  volumeSpike: number
  concentrationRisk: number
}

export function RiskMonitor() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([])
  const [marketRisk, setMarketRisk] = useState<MarketRisk>({
    volatility: 0,
    declineRatio: 0,
    volumeSpike: 0,
    concentrationRisk: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // 获取今日交易数据
        const { data: todayData } = await supabase
          .from('daily_quote')
          .select('pct_chg, volume, amount')
          .eq('trade_date', today)
          .not('pct_chg', 'is', null)

        if (todayData) {
          // 计算市场波动率
          const changes = todayData.map(item => Number(item.pct_chg))
          const volatility = Math.sqrt(
            changes.reduce((sum, change) => sum + Math.pow(change, 2), 0) / changes.length
          )

          // 计算下跌股票比例
          const declineCount = changes.filter(change => change < 0).length
          const declineRatio = (declineCount / changes.length) * 100

          // 计算成交量异常
          const volumes = todayData.map(item => Number(item.volume))
          const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
          const volumeSpikes = volumes.filter(vol => vol > avgVolume * 2).length
          const volumeSpike = (volumeSpikes / volumes.length) * 100

          // 计算集中度风险（简化计算）
          const totalAmount = todayData.reduce((sum, item) => sum + Number(item.amount), 0)
          const sortedAmounts = todayData
            .map(item => Number(item.amount))
            .sort((a, b) => b - a)
          const top10Amount = sortedAmounts.slice(0, 10).reduce((sum, amount) => sum + amount, 0)
          const concentrationRisk = (top10Amount / totalAmount) * 100

          setMarketRisk({
            volatility,
            declineRatio,
            volumeSpike,
            concentrationRisk
          })

          // 生成风险指标
          const metrics: RiskMetric[] = [
            {
              name: '市场波动率',
              value: volatility,
              threshold: 3.0,
              status: volatility > 4.0 ? 'danger' : volatility > 2.5 ? 'warning' : 'safe',
              description: '衡量市场整体波动程度'
            },
            {
              name: '下跌股票比例',
              value: declineRatio,
              threshold: 60,
              status: declineRatio > 70 ? 'danger' : declineRatio > 50 ? 'warning' : 'safe',
              description: '下跌股票占总数比例'
            },
            {
              name: '成交量异常',
              value: volumeSpike,
              threshold: 20,
              status: volumeSpike > 30 ? 'danger' : volumeSpike > 15 ? 'warning' : 'safe',
              description: '成交量异常放大的股票比例'
            },
            {
              name: '集中度风险',
              value: concentrationRisk,
              threshold: 40,
              status: concentrationRisk > 50 ? 'danger' : concentrationRisk > 35 ? 'warning' : 'safe',
              description: '前10大成交额占比'
            }
          ]

          setRiskMetrics(metrics)
        }
      } catch (error) {
        console.error('获取风险数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRiskData()
  }, [])

  const getRiskLevel = () => {
    const dangerCount = riskMetrics.filter(metric => metric.status === 'danger').length
    const warningCount = riskMetrics.filter(metric => metric.status === 'warning').length
    
    if (dangerCount > 1) return { level: '高风险', color: 'text-red-600', bgColor: 'bg-red-50' }
    if (dangerCount > 0 || warningCount > 2) return { level: '中风险', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    if (warningCount > 0) return { level: '低风险', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { level: '安全', color: 'text-green-600', bgColor: 'bg-green-50' }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'danger':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Zap className="h-4 w-4 text-orange-500" />
      default:
        return <Shield className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      default:
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-rose-500" />
          <p className="text-muted-foreground">分析风险数据中...</p>
        </div>
      </div>
    )
  }

  const riskLevel = getRiskLevel()

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* 风险等级总览 */}
      <Alert className={`${riskLevel.bgColor} border-2`}>
        <Activity className="h-4 w-4" />
        <AlertDescription className="text-lg font-semibold">
          <span className={riskLevel.color}>
            当前市场风险等级: {riskLevel.level}
          </span>
        </AlertDescription>
      </Alert>

      {/* 风险指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {riskMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{metric.name}</span>
                  {getStatusIcon(metric.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">
                  {metric.value.toFixed(1)}
                  {metric.name.includes('比例') || metric.name.includes('异常') || metric.name.includes('集中度') ? '%' : ''}
                </div>
                
                <Progress 
                  value={(metric.value / metric.threshold) * 100} 
                  className="h-2"
                />
                
                <Badge 
                  variant="outline"
                  className={`text-xs ${getStatusColor(metric.status)}`}
                >
                  {metric.status === 'danger' ? '高风险' : 
                   metric.status === 'warning' ? '中风险' : '安全'}
                </Badge>
                
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 风险详情分析 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
              市场情绪分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">恐慌指数</span>
              <Badge variant="outline" className={getStatusColor(
                marketRisk.declineRatio > 70 ? 'danger' : 
                marketRisk.declineRatio > 50 ? 'warning' : 'safe'
              )}>
                {marketRisk.declineRatio > 70 ? '极度恐慌' : 
                 marketRisk.declineRatio > 50 ? '恐慌' : '正常'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">波动水平</span>
              <Badge variant="outline" className={getStatusColor(
                marketRisk.volatility > 4 ? 'danger' : 
                marketRisk.volatility > 2.5 ? 'warning' : 'safe'
              )}>
                {marketRisk.volatility > 4 ? '高波动' : 
                 marketRisk.volatility > 2.5 ? '中波动' : '低波动'}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              基于今日交易数据分析，下跌股票占比 {marketRisk.declineRatio.toFixed(1)}%，
              市场波动率为 {marketRisk.volatility.toFixed(2)}。
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              流动性监控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">成交活跃度</span>
              <Badge variant="outline" className={getStatusColor(
                marketRisk.volumeSpike > 30 ? 'danger' : 
                marketRisk.volumeSpike > 15 ? 'warning' : 'safe'
              )}>
                {marketRisk.volumeSpike > 30 ? '异常活跃' : 
                 marketRisk.volumeSpike > 15 ? '较为活跃' : '正常'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">集中度风险</span>
              <Badge variant="outline" className={getStatusColor(
                marketRisk.concentrationRisk > 50 ? 'danger' : 
                marketRisk.concentrationRisk > 35 ? 'warning' : 'safe'
              )}>
                {marketRisk.concentrationRisk > 50 ? '高度集中' : 
                 marketRisk.concentrationRisk > 35 ? '中度集中' : '分散'}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              {marketRisk.volumeSpike.toFixed(1)}% 的股票出现成交量异常，
              前10大成交额占比 {marketRisk.concentrationRisk.toFixed(1)}%。
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
} 