import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockBasicList } from "@/components/stock/stock-basic-list"
import { MarketOverview } from "@/components/dashboard/market-overview"
import { HotStockRanks } from "@/components/dashboard/hot-stock-ranks"
import { MoneyFlowChart } from "@/components/dashboard/money-flow-chart"
import { IndexDataChart } from "@/components/dashboard/index-data-chart"
import { NorthboundCapitalChart } from "@/components/dashboard/northbound-capital-chart"
import { FinancialIndicators } from "@/components/dashboard/financial-indicators"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">A股数据仪表板</h2>
            </div>
            
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">市场概览</TabsTrigger>
                    <TabsTrigger value="stocks">股票数据</TabsTrigger>
                    <TabsTrigger value="hotranks">热股排行</TabsTrigger>
                    <TabsTrigger value="capital">资金流向</TabsTrigger>
                    <TabsTrigger value="financial">财务指标</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Suspense fallback={<Skeleton className="h-32" />}>
                            <MarketOverview />
                        </Suspense>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>指数走势</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <Suspense fallback={<Skeleton className="h-80" />}>
                                    <IndexDataChart />
                                </Suspense>
                            </CardContent>
                        </Card>
                        
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>北向资金</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<Skeleton className="h-80" />}>
                                    <NorthboundCapitalChart />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="stocks" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-96" />}>
                        <StockBasicList />
                    </Suspense>
                </TabsContent>
                
                <TabsContent value="hotranks" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Suspense fallback={<Skeleton className="h-96" />}>
                            <HotStockRanks />
                        </Suspense>
                    </div>
                </TabsContent>
                
                <TabsContent value="capital" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>资金流向分析</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<Skeleton className="h-96" />}>
                                <MoneyFlowChart />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="financial" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-96" />}>
                        <FinancialIndicators />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    )
}
