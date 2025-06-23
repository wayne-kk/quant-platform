'use client'

import { Suspense, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Calendar
} from "lucide-react"

// 新的现代化组件
import { EnhancedMarketOverview } from "@/components/dashboard/enhanced-market-overview"
import { RealTimeIndexChart } from "@/components/dashboard/real-time-index-chart"
import { AdvancedKLineChart } from "@/components/dashboard/advanced-kline-chart"
import { MoneyFlowHeatmap } from "@/components/dashboard/money-flow-heatmap"
import { SmartStockRanking } from "@/components/dashboard/smart-stock-ranking"
import { NewsTimeline } from "@/components/dashboard/news-timeline"
import { TradingVolumeDistribution } from "@/components/dashboard/trading-volume-distribution"
import { SectorAnalysis } from "@/components/dashboard/sector-analysis"
import { RiskMonitor } from "@/components/dashboard/risk-monitor"
import { TradingCalendar } from "@/components/dashboard/trading-calendar"
import { TradeStatusIndicator } from "@/components/dashboard/trade-status-indicator"
import { TradingCalendarOverview } from "@/components/dashboard/trading-calendar-overview"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    // 模拟刷新延迟
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 space-y-6 p-4 md:p-8 pt-6"
      >
        {/* 头部区域 */}
        <motion.div
          {...fadeInUp}
          className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🚀 A股量化数据中心
            </h1>
            <p className="text-lg text-muted-foreground">
              实时市场洞察 • 智能数据分析 • 专业投资决策
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '刷新中...' : '刷新数据'}
            </Button>
            <Badge variant="secondary" className="text-green-600 bg-green-50 dark:bg-green-900/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              实时数据
            </Badge>
          </div>
        </motion.div>

        {/* 导航标签 */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9 h-auto p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                市场概览
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Calendar className="h-4 w-4 mr-2" />
                交易日历
              </TabsTrigger>
              <TabsTrigger value="indices" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                指数分析
              </TabsTrigger>
              <TabsTrigger value="stocks" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <Target className="h-4 w-4 mr-2" />
                个股监控
              </TabsTrigger>
              <TabsTrigger value="capital" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4 mr-2" />
                资金流向
              </TabsTrigger>
              <TabsTrigger value="hotrank" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <Zap className="h-4 w-4 mr-2" />
                热度排行
              </TabsTrigger>
              <TabsTrigger value="sectors" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <PieChart className="h-4 w-4 mr-2" />
                板块分析
              </TabsTrigger>
              <TabsTrigger value="news" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                <Eye className="h-4 w-4 mr-2" />
                资讯动态
              </TabsTrigger>
              <TabsTrigger value="risk" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                <Activity className="h-4 w-4 mr-2" />
                风险监控
              </TabsTrigger>
            </TabsList>

            {/* 市场概览 */}
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {/* 交易状态指示器 */}
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-16 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg animate-pulse"></div>}>
                    <TradeStatusIndicator />
                  </Suspense>
                </motion.div>

                {/* 市场总览卡片 */}
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg animate-pulse"></div>}>
                    <EnhancedMarketOverview />
                  </Suspense>
                </motion.div>

                {/* 主要图表区域 */}
                <div className="grid gap-6 lg:grid-cols-7">
                  <motion.div variants={fadeInUp} className="lg:col-span-5">
                    <Card className="h-[500px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-xl">
                          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                          实时指数走势
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-full">
                        <Suspense fallback={<div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded animate-pulse"></div>}>
                          <RealTimeIndexChart />
                        </Suspense>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="lg:col-span-2">
                    <Card className="h-[500px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-xl">
                          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                          成交量分布
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-full">
                        <Suspense fallback={<div className="h-full bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded animate-pulse"></div>}>
                          <TradingVolumeDistribution />
                        </Suspense>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* 资金流向热力图 */}
                <motion.div variants={fadeInUp}>
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <Activity className="h-5 w-5 mr-2 text-purple-600" />
                        资金流向热力图
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<div className="h-80 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded animate-pulse"></div>}>
                        <MoneyFlowHeatmap />
                      </Suspense>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 交易日历 */}
            <TabsContent value="calendar" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                {/* 交易日历概览 */}
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-64 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-lg animate-pulse"></div>}>
                    <TradingCalendarOverview />
                  </Suspense>
                </motion.div>

                {/* 详细日历 */}
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-96 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-lg animate-pulse"></div>}>
                    <TradingCalendar />
                  </Suspense>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 指数分析 */}
            <TabsContent value="indices" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp}>
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                        高级K线图表
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<div className="h-96 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded animate-pulse"></div>}>
                        <AdvancedKLineChart />
                      </Suspense>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 个股监控 */}
            <TabsContent value="stocks" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-96 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg animate-pulse"></div>}>
                    <SmartStockRanking />
                  </Suspense>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 资金流向 */}
            <TabsContent value="capital" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-96 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 rounded-lg animate-pulse"></div>}>
                    <MoneyFlowHeatmap />
                  </Suspense>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 热度排行 */}
            <TabsContent value="hotrank" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-96 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-lg animate-pulse"></div>}>
                    <SmartStockRanking />
                  </Suspense>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 板块分析 */}
            <TabsContent value="sectors" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-96 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/10 dark:to-teal-900/10 rounded-lg animate-pulse"></div>}>
                    <SectorAnalysis />
                  </Suspense>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 资讯动态 */}
            <TabsContent value="news" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-96 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-lg animate-pulse"></div>}>
                    <NewsTimeline />
                  </Suspense>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* 风险监控 */}
            <TabsContent value="risk" className="space-y-6">
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp}>
                  <Suspense fallback={<div className="h-96 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10 rounded-lg animate-pulse"></div>}>
                    <RiskMonitor />
                  </Suspense>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  )
}
