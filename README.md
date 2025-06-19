# A股量化数据平台

基于 Next.js 15 和 Supabase 构建的专业A股市场数据分析平台，提供全面的股票数据、财务指标、资金流向等信息展示。

## 🚀 主要功能

### 📊 市场概览
- 实时股票市场统计数据
- 股票总数、活跃股票数量
- 市场平均涨跌幅
- 总成交量统计

### 📈 股票数据
- 股票基本信息管理
- 日线行情数据展示
- 支持搜索和筛选功能
- 分页浏览大量数据

### 🔥 热点追踪
- **人气榜**：最受关注的股票排行
- **飙升榜**：排名快速上升的股票
- 实时排名变动监控
- 涨跌幅趋势分析

### 💰 资金流向
- 主力资金净流入统计
- 超大单、大单、中单、小单分析
- 资金流向汇总图表
- 按日期筛选查看

### 🌏 北向资金
- 港资持股市值统计
- 净买入金额追踪
- 买卖金额对比
- 持股占比分析

### 📋 财务指标
- ROE（净资产收益率）分析
- EPS（每股收益）统计
- 资产负债率监控
- 盈利能力指标
- 偿债能力分析

### 📉 指数数据
- 主要股指实时数据
- 指数涨跌幅统计
- 成交量和成交额
- 历史走势追踪

## 🏗️ 技术架构

- **前端框架**：Next.js 15 + TypeScript
- **UI组件库**：shadcn/ui + Tailwind CSS
- **数据库**：Supabase (PostgreSQL)
- **ORM**：Prisma
- **图标**：Lucide React
- **样式**：Tailwind CSS v4

## 📁 数据表结构

### 核心数据表
- `stock_basic` - 股票基本信息
- `daily_quote` - 日线行情数据
- `financial_indicator` - 财务指标
- `financial_statement` - 财务报表
- `index_data` - 指数数据
- `trade_calendar` - 交易日历
- `money_flow` - 资金流向
- `northbound_capital` - 北向资金
- `stock_hot_rank` - 股票人气榜
- `stock_hot_up` - 股票飙升榜

## 🚦 快速开始

### 环境变量配置

创建 `.env.local` 文件并配置以下环境变量：

```bash
# Supabase配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 数据库连接
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 数据库迁移

```bash
npx prisma generate
npx prisma db push
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📱 页面结构

### 主页 (`/`)
- 平台介绍和功能概览
- 快速导航到数据仪表板

### 数据仪表板 (`/dashboard`)
- **市场概览**：整体市场统计和指数走势
- **股票数据**：股票基本信息列表
- **热股排行**：人气榜和飙升榜
- **资金流向**：主力资金流向分析
- **财务指标**：上市公司财务数据

## 🎨 UI特性

- **响应式设计**：适配桌面端和移动端
- **暗色主题**：支持深色模式
- **数据可视化**：清晰的图表和统计展示
- **实时更新**：动态加载最新数据
- **搜索筛选**：强大的数据查询功能

## 📊 数据来源

- 上海证券交易所
- 深圳证券交易所
- 北京证券交易所
- 港股通资金数据

## 🔧 开发工具

- **代码格式化**：ESLint + Prettier
- **类型检查**：TypeScript
- **构建工具**：Next.js Turbopack
- **部署**：Vercel（推荐）

## 📈 性能优化

- 服务端渲染（SSR）
- 数据分页加载
- 组件懒加载
- 图片优化
- 缓存策略

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 联系我们

如有问题或建议，请创建 Issue 或联系开发团队。

---

**A股量化数据平台** - 专业的股票数据分析工具 🚀
