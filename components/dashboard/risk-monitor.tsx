'use client'

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import {
  Activity,
  AlertTriangle,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
  Calendar,
  AlertCircle,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Brain,
  Gauge,
  Timer,
  Bell,
  Eye,
  Settings,
  RefreshCw,
  Download
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getLatestTradingDate, formatTradingDateDisplay, type TradingDateInfo } from "@/lib/trading-utils"

// 核心风险指标接口
interface RiskMetric {
  name: string
  value: number
  threshold: number
  status: 'safe' | 'warning' | 'danger'
  description: string
  change24h: number
  unit: string
  category: 'market' | 'liquidity' | 'credit' | 'operational'
}

// 市场风险数据接口
interface MarketRisk {
  volatility: number
  skewness: number
  kurtosis: number
  beta: number
  correlation: number
  sharpeRatio: number
  var95: number
  var99: number
  maxDrawdown: number
  declineRatio: number
  volumeSpike: number
  concentrationRisk: number
}

// VaR计算结果接口
interface VaRData {
  confidence: number
  value: number
  expected: number
  stress: number
  timeframe: string
}

// 压力测试场景接口
interface StressScenario {
  name: string
  description: string
  marketDecline: number
  volatilityIncrease: number
  estimatedLoss: number
  probability: number
  recovery: string
}

// 风险预警接口
interface RiskAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
  metric: string
}

// 历史趋势数据接口
interface TrendData {
  date: string
  marketRisk: number
  liquidityRisk: number
  creditRisk: number
  operationalRisk: number
  overallRisk: number
  var95: number
}

export function RiskMonitor() {
  const [activeTab, setActiveTab] = useState('overview')
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([])
  const [marketRisk, setMarketRisk] = useState<MarketRisk>({
    volatility: 0,
    skewness: 0,
    kurtosis: 0,
    beta: 1,
    correlation: 0,
    sharpeRatio: 0,
    var95: 0,
    var99: 0,
    maxDrawdown: 0,
    declineRatio: 0,
    volumeSpike: 0,
    concentrationRisk: 0
  })
  const [varData, setVarData] = useState<VaRData[]>([])
  const [stressScenarios, setStressScenarios] = useState<StressScenario[]>([])
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [tradingDateInfo, setTradingDateInfo] = useState<TradingDateInfo | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true)
        // 获取最近的交易日期信息
        const dateInfo = await getLatestTradingDate()
        setTradingDateInfo(dateInfo)

        // 获取最近30个交易日的数据用于计算
        const { data: historicalData } = await supabase
          .from('daily_quote')
          .select('stock_code, trade_date, close, pct_chg, volume, amount, high, low')
          .gte('trade_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .lte('trade_date', dateInfo.date)
          .order('trade_date', { ascending: false })

        // 获取当日数据
        const { data: todayData } = await supabase
          .from('daily_quote')
          .select('pct_chg, volume, amount, close, high, low')
          .eq('trade_date', dateInfo.date)
          .not('pct_chg', 'is', null)

        if (todayData && historicalData) {
          const riskAnalysis = calculateAdvancedRiskMetrics(todayData, historicalData)
          const varCalculations = calculateVaR(historicalData)
          const stressTests = generateStressScenarios(riskAnalysis)
          const alerts = generateRiskAlerts(riskAnalysis)
          const trends = calculateTrendData(historicalData)

          setMarketRisk(riskAnalysis)
          setVarData(varCalculations)
          setStressScenarios(stressTests)
          setRiskAlerts(alerts)
          setTrendData(trends)

          // 生成综合风险指标
          const metrics = generateRiskMetrics(riskAnalysis, varCalculations)
          setRiskMetrics(metrics)
        }

        setLastUpdate(new Date())
      } catch (error) {
        console.error('获取风险数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRiskData()
    // 每5分钟自动刷新
    const interval = setInterval(fetchRiskData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // 计算高级风险指标
  const calculateAdvancedRiskMetrics = (todayData: any[], historicalData: any[]): MarketRisk => {
    const changes = todayData.map(item => Number(item.pct_chg))
    const volumes = todayData.map(item => Number(item.volume))
    const amounts = todayData.map(item => Number(item.amount))

    // 基础统计量
    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length
    const volatility = Math.sqrt(variance)

    // 偏度和峰度
    const skewness = changes.reduce((sum, change) => sum + Math.pow((change - mean) / Math.sqrt(variance), 3), 0) / changes.length
    const kurtosis = changes.reduce((sum, change) => sum + Math.pow((change - mean) / Math.sqrt(variance), 4), 0) / changes.length - 3

    // Beta值计算（相对于大盘）
    const marketReturns = calculateMarketReturns(historicalData)
    const beta = calculateBeta(changes, marketReturns)

    // 相关系数
    const correlation = calculateCorrelation(changes, marketReturns)

    // 夏普比率
    const riskFreeRate = 0.03 / 252 // 年化3%的日收益率
    const sharpeRatio = (mean - riskFreeRate) / volatility

    // VaR计算
    const sortedReturns = changes.sort((a, b) => a - b)
    const var95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)]
    const var99 = sortedReturns[Math.floor(sortedReturns.length * 0.01)]

    // 最大回撤
    const maxDrawdown = calculateMaxDrawdown(historicalData)

    // 下跌比例
    const declineCount = changes.filter(change => change < 0).length
    const declineRatio = (declineCount / changes.length) * 100

    // 成交量异常
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
    const volumeSpikes = volumes.filter(vol => vol > avgVolume * 2).length
    const volumeSpike = (volumeSpikes / volumes.length) * 100

    // 集中度风险
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)
    const sortedAmounts = amounts.sort((a, b) => b - a)
    const top10Amount = sortedAmounts.slice(0, 10).reduce((sum, amount) => sum + amount, 0)
    const concentrationRisk = (top10Amount / totalAmount) * 100

    return {
      volatility,
      skewness,
      kurtosis,
      beta,
      correlation,
      sharpeRatio,
      var95,
      var99,
      maxDrawdown,
      declineRatio,
      volumeSpike,
      concentrationRisk
    }
  }

  // 计算市场收益率
  const calculateMarketReturns = (data: any[]) => {
    // 简化计算，使用平均收益率代表市场
    const dates = [...new Set(data.map(item => item.trade_date))].sort()
    return dates.map(date => {
      const dayData = data.filter(item => item.trade_date === date)
      const avgReturn = dayData.reduce((sum, item) => sum + Number(item.pct_chg), 0) / dayData.length
      return avgReturn
    })
  }

  // 计算Beta值
  const calculateBeta = (stockReturns: number[], marketReturns: number[]) => {
    if (stockReturns.length !== marketReturns.length) return 1

    const stockMean = stockReturns.reduce((sum, r) => sum + r, 0) / stockReturns.length
    const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / marketReturns.length

    const covariance = stockReturns.reduce((sum, r, i) =>
      sum + (r - stockMean) * (marketReturns[i] - marketMean), 0) / stockReturns.length

    const marketVariance = marketReturns.reduce((sum, r) =>
      sum + Math.pow(r - marketMean, 2), 0) / marketReturns.length

    return marketVariance === 0 ? 1 : covariance / marketVariance
  }

  // 计算相关系数
  const calculateCorrelation = (x: number[], y: number[]) => {
    if (x.length !== y.length) return 0

    const n = x.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0)
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  // 计算最大回撤
  const calculateMaxDrawdown = (data: any[]) => {
    const prices = data.map(item => Number(item.close)).sort((a, b) => a - b)
    let maxPrice = prices[0]
    let maxDrawdown = 0

    for (const price of prices) {
      if (price > maxPrice) {
        maxPrice = price
      } else {
        const drawdown = (maxPrice - price) / maxPrice
        maxDrawdown = Math.max(maxDrawdown, drawdown)
      }
    }

    return maxDrawdown * 100
  }

  // 计算VaR
  const calculateVaR = (data: any[]): VaRData[] => {
    const returns = data.map(item => Number(item.pct_chg)).filter(r => !isNaN(r))
    const sortedReturns = returns.sort((a, b) => a - b)

    return [
      {
        confidence: 95,
        value: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.05)]),
        expected: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.1)]),
        stress: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.02)]),
        timeframe: '1日'
      },
      {
        confidence: 99,
        value: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.01)]),
        expected: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.05)]),
        stress: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.005)]),
        timeframe: '1日'
      }
    ]
  }

  // 生成压力测试场景
  const generateStressScenarios = (risk: MarketRisk): StressScenario[] => {
    return [
      {
        name: '轻度修正',
        description: '市场下跌5-10%，波动率小幅上升',
        marketDecline: 7.5,
        volatilityIncrease: 25,
        estimatedLoss: risk.var95 * 1.2,
        probability: 20,
        recovery: '1-2个月'
      },
      {
        name: '中度调整',
        description: '市场下跌15-25%，波动率显著上升',
        marketDecline: 20,
        volatilityIncrease: 50,
        estimatedLoss: risk.var95 * 2.5,
        probability: 8,
        recovery: '3-6个月'
      },
      {
        name: '深度回调',
        description: '市场下跌30%以上，波动率剧烈上升',
        marketDecline: 35,
        volatilityIncrease: 100,
        estimatedLoss: risk.var99 * 3,
        probability: 2,
        recovery: '6-12个月'
      },
      {
        name: '系统性风险',
        description: '金融系统性危机，流动性枯竭',
        marketDecline: 50,
        volatilityIncrease: 200,
        estimatedLoss: risk.var99 * 5,
        probability: 0.5,
        recovery: '1-2年'
      }
    ]
  }

  // 生成风险预警
  const generateRiskAlerts = (risk: MarketRisk): RiskAlert[] => {
    const alerts: RiskAlert[] = []

    if (risk.volatility > 4) {
      alerts.push({
        id: 'vol_high',
        type: 'critical',
        title: '高波动率预警',
        message: `当前波动率 ${risk.volatility.toFixed(2)}% 超过警戒线，建议谨慎操作`,
        timestamp: new Date(),
        acknowledged: false,
        metric: 'volatility'
      })
    }

    if (risk.declineRatio > 70) {
      alerts.push({
        id: 'decline_high',
        type: 'warning',
        title: '市场恐慌情绪',
        message: `${risk.declineRatio.toFixed(1)}% 的股票下跌，市场情绪较为悲观`,
        timestamp: new Date(),
        acknowledged: false,
        metric: 'sentiment'
      })
    }

    if (risk.concentrationRisk > 50) {
      alerts.push({
        id: 'concentration_high',
        type: 'warning',
        title: '流动性集中度风险',
        message: `前10大成交额占比 ${risk.concentrationRisk.toFixed(1)}%，存在流动性风险`,
        timestamp: new Date(),
        acknowledged: false,
        metric: 'liquidity'
      })
    }

    if (risk.sharpeRatio < 0) {
      alerts.push({
        id: 'sharpe_negative',
        type: 'info',
        title: '风险调整收益为负',
        message: `夏普比率 ${risk.sharpeRatio.toFixed(2)}，当前风险高于收益`,
        timestamp: new Date(),
        acknowledged: false,
        metric: 'performance'
      })
    }

    return alerts
  }

  // 计算趋势数据
  const calculateTrendData = (data: any[]): TrendData[] => {
    const dates = [...new Set(data.map(item => item.trade_date))].sort().slice(-7)

    return dates.map(date => {
      const dayData = data.filter(item => item.trade_date === date)
      const changes = dayData.map(item => Number(item.pct_chg))
      const volatility = Math.sqrt(changes.reduce((sum, change) => {
        const mean = changes.reduce((s, c) => s + c, 0) / changes.length
        return sum + Math.pow(change - mean, 2)
      }, 0) / changes.length)

      return {
        date: new Date(date).toLocaleDateString(),
        marketRisk: volatility * 10,
        liquidityRisk: Math.random() * 20 + 30, // 模拟数据
        creditRisk: Math.random() * 15 + 25,    // 模拟数据
        operationalRisk: Math.random() * 10 + 20, // 模拟数据
        overallRisk: volatility * 8 + Math.random() * 10,
        var95: Math.abs(changes.sort((a, b) => a - b)[Math.floor(changes.length * 0.05)] || 0)
      }
    })
  }

  // 生成风险指标
  const generateRiskMetrics = (risk: MarketRisk, varData: VaRData[]): RiskMetric[] => {
    return [
      {
        name: '市场波动率',
        value: risk.volatility,
        threshold: 3.0,
        status: risk.volatility > 4.0 ? 'danger' : risk.volatility > 2.5 ? 'warning' : 'safe',
        description: '衡量市场整体波动程度，基于收益率标准差计算',
        change24h: Math.random() * 2 - 1, // 模拟变化
        unit: '%',
        category: 'market'
      },
      {
        name: 'VaR 95%',
        value: Math.abs(risk.var95),
        threshold: 5.0,
        status: Math.abs(risk.var95) > 8 ? 'danger' : Math.abs(risk.var95) > 5 ? 'warning' : 'safe',
        description: '95%置信度下的单日最大可能损失',
        change24h: Math.random() * 1 - 0.5,
        unit: '%',
        category: 'market'
      },
      {
        name: '最大回撤',
        value: risk.maxDrawdown,
        threshold: 20.0,
        status: risk.maxDrawdown > 30 ? 'danger' : risk.maxDrawdown > 20 ? 'warning' : 'safe',
        description: '历史最大回撤幅度',
        change24h: Math.random() * 0.5,
        unit: '%',
        category: 'market'
      },
      {
        name: '流动性风险',
        value: risk.concentrationRisk,
        threshold: 40.0,
        status: risk.concentrationRisk > 50 ? 'danger' : risk.concentrationRisk > 40 ? 'warning' : 'safe',
        description: '前10大成交额集中度',
        change24h: Math.random() * 2 - 1,
        unit: '%',
        category: 'liquidity'
      },
      {
        name: '夏普比率',
        value: risk.sharpeRatio,
        threshold: 1.0,
        status: risk.sharpeRatio < 0 ? 'danger' : risk.sharpeRatio < 0.5 ? 'warning' : 'safe',
        description: '风险调整后收益率',
        change24h: Math.random() * 0.2 - 0.1,
        unit: '',
        category: 'market'
      },
      {
        name: '市场情绪',
        value: 100 - risk.declineRatio,
        threshold: 50.0,
        status: risk.declineRatio > 70 ? 'danger' : risk.declineRatio > 50 ? 'warning' : 'safe',
        description: '基于涨跌比例的市场情绪指标',
        change24h: Math.random() * 10 - 5,
        unit: '',
        category: 'market'
      },
      {
        name: '偏度风险',
        value: Math.abs(risk.skewness),
        threshold: 1.0,
        status: Math.abs(risk.skewness) > 2 ? 'danger' : Math.abs(risk.skewness) > 1 ? 'warning' : 'safe',
        description: '收益分布的偏斜程度',
        change24h: Math.random() * 0.5 - 0.25,
        unit: '',
        category: 'market'
      },
      {
        name: '峰度风险',
        value: Math.abs(risk.kurtosis),
        threshold: 3.0,
        status: Math.abs(risk.kurtosis) > 5 ? 'danger' : Math.abs(risk.kurtosis) > 3 ? 'warning' : 'safe',
        description: '极端事件发生概率',
        change24h: Math.random() * 1 - 0.5,
        unit: '',
        category: 'market'
      }
    ]
  }

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <Zap className="h-5 w-5 text-orange-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />
    }
  }

  const CHART_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']

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
      {/* 顶部风险等级总览 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Alert className={`${riskLevel.bgColor} border-2 flex-1`}>
          <Activity className="h-4 w-4" />
          <AlertDescription className="text-lg font-semibold">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className={riskLevel.color}>
                当前市场风险等级: {riskLevel.level}
              </span>
              {tradingDateInfo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>数据日期: {tradingDateInfo.date}</span>
                  {!tradingDateInfo.isToday && (
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {formatTradingDateDisplay(tradingDateInfo)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Timer className="w-4 h-4" />
            <span>最后更新: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-8"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* 实时预警 */}
      {riskAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-red-700">
                <Bell className="h-5 w-5 mr-2" />
                实时风险预警 ({riskAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <Badge variant="outline" className={
                          alert.type === 'critical' ? 'border-red-200 text-red-700' :
                            alert.type === 'warning' ? 'border-orange-200 text-orange-700' :
                              'border-blue-200 text-blue-700'
                        }>
                          {alert.type === 'critical' ? '严重' : alert.type === 'warning' ? '警告' : '提示'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 主要内容标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            <span className="hidden sm:inline">总览</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">指标</span>
          </TabsTrigger>
          <TabsTrigger value="var" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">VaR</span>
          </TabsTrigger>
          <TabsTrigger value="stress" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">压力测试</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">趋势</span>
          </TabsTrigger>
        </TabsList>

        {/* 总览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 风险指标卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {riskMetrics.slice(0, 8).map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{metric.name}</span>
                      {getStatusIcon(metric.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {metric.value.toFixed(metric.name.includes('比率') ? 2 : 1)}
                      </span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min((Math.abs(metric.value) / metric.threshold) * 100, 100)}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">
                        {((Math.abs(metric.value) / metric.threshold) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(metric.status)}`}
                      >
                        {metric.status === 'danger' ? '高风险' :
                          metric.status === 'warning' ? '中风险' : '安全'}
                      </Badge>

                      <div className="flex items-center gap-1 text-xs">
                        {metric.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={metric.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {Math.abs(metric.change24h).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* 风险分布雷达图 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <PieChartIcon className="h-5 w-5 mr-2 text-blue-600" />
                  风险分布雷达图
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    {
                      metric: '市场风险',
                      value: Math.min(marketRisk.volatility * 10, 100),
                      fullMark: 100
                    },
                    {
                      metric: '流动性风险',
                      value: Math.min(marketRisk.concentrationRisk, 100),
                      fullMark: 100
                    },
                    {
                      metric: '信用风险',
                      value: Math.min(Math.abs(marketRisk.sharpeRatio) * 20, 100),
                      fullMark: 100
                    },
                    {
                      metric: '操作风险',
                      value: Math.min(marketRisk.volumeSpike * 2, 100),
                      fullMark: 100
                    },
                    {
                      metric: '系统风险',
                      value: Math.min(marketRisk.maxDrawdown * 2, 100),
                      fullMark: 100
                    }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={0} domain={[0, 100]} />
                    <Radar
                      name="风险水平"
                      dataKey="value"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  关键风险指标
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {marketRisk.beta.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600">Beta系数</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {marketRisk.sharpeRatio.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">夏普比率</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">
                      {marketRisk.skewness.toFixed(2)}
                    </div>
                    <div className="text-sm text-orange-600">偏度</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {marketRisk.kurtosis.toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-600">峰度</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">最大回撤</span>
                    <Badge variant="outline" className={getStatusColor(
                      marketRisk.maxDrawdown > 30 ? 'danger' :
                        marketRisk.maxDrawdown > 20 ? 'warning' : 'safe'
                    )}>
                      {marketRisk.maxDrawdown.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">市场相关性</span>
                    <Badge variant="outline">
                      {marketRisk.correlation.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 详细指标标签页 */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {['market', 'liquidity', 'credit'].map((category) => {
              const categoryMetrics = riskMetrics.filter(m => m.category === category)
              const categoryName =
                category === 'market' ? '市场风险' :
                  category === 'liquidity' ? '流动性风险' : '信用风险'

              return (
                <Card key={category} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      {category === 'market' && <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />}
                      {category === 'liquidity' && <Activity className="h-5 w-5 mr-2 text-green-600" />}
                      {category === 'credit' && <Shield className="h-5 w-5 mr-2 text-orange-600" />}
                      {categoryName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryMetrics.map((metric) => (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{metric.name}</span>
                          {getStatusIcon(metric.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min((Math.abs(metric.value) / metric.threshold) * 100, 100)}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm font-bold">
                            {metric.value.toFixed(metric.name.includes('比率') ? 2 : 1)}{metric.unit}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* VaR分析标签页 */}
        <TabsContent value="var" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="h-5 w-5 mr-2 text-red-600" />
                  Value at Risk (VaR) 分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {varData.map((var_, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold">VaR {var_.confidence}% ({var_.timeframe})</h4>
                        <Badge variant={var_.confidence === 99 ? 'destructive' : 'secondary'}>
                          {var_.confidence}% 置信度
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {var_.value.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">正常情况</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {var_.expected.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">预期损失</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-700">
                            {var_.stress.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">压力情况</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Eye className="h-5 w-5 mr-2 text-blue-600" />
                  风险敞口分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'VaR 95%', value: Math.abs(marketRisk.var95), color: '#F59E0B' },
                    { name: 'VaR 99%', value: Math.abs(marketRisk.var99), color: '#EF4444' },
                    { name: '最大回撤', value: marketRisk.maxDrawdown, color: '#DC2626' },
                    { name: '波动率', value: marketRisk.volatility, color: '#3B82F6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, '风险值']} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 压力测试标签页 */}
        <TabsContent value="stress" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {stressScenarios.map((scenario, index) => (
              <motion.div
                key={scenario.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-600" />
                        {scenario.name}
                      </span>
                      <Badge variant={
                        scenario.probability > 10 ? 'secondary' :
                          scenario.probability > 2 ? 'destructive' : 'outline'
                      }>
                        {scenario.probability}% 概率
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-xl font-bold text-red-600">
                          -{scenario.marketDecline}%
                        </div>
                        <div className="text-xs text-red-600">市场下跌</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                          +{scenario.volatilityIncrease}%
                        </div>
                        <div className="text-xs text-orange-600">波动率上升</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">预估损失</span>
                        <Badge variant="destructive">
                          {scenario.estimatedLoss.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">恢复周期</span>
                        <Badge variant="outline">
                          {scenario.recovery}
                        </Badge>
                      </div>
                    </div>

                    <Progress
                      value={scenario.probability * 5}
                      className="h-2"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* 趋势分析标签页 */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                风险趋势分析 (最近7天)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="marketRisk" stroke="#3B82F6" strokeWidth={2} name="市场风险" />
                  <Line type="monotone" dataKey="liquidityRisk" stroke="#10B981" strokeWidth={2} name="流动性风险" />
                  <Line type="monotone" dataKey="creditRisk" stroke="#F59E0B" strokeWidth={2} name="信用风险" />
                  <Line type="monotone" dataKey="overallRisk" stroke="#EF4444" strokeWidth={3} name="整体风险" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                VaR趋势变化
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'VaR 95%']} />
                  <Area type="monotone" dataKey="var95" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
} 