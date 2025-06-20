'use client'

import Link from "next/link"
import { motion, useScroll, useTransform, useInView, useAnimation, AnimatePresence } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Zap,
  Target,
  Eye,
  Shield,
  Rocket,
  Database,
  Brain,
  Globe,
  ArrowRight,
  Sparkles,
  Star
} from "lucide-react"

// 打字机效果组件
const TypewriterEffect = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }
    }, delay + currentIndex * 100)

    return () => clearTimeout(timer)
  }, [currentIndex, text, delay])

  return <span>{displayText}</span>
}

// 浮动粒子组件
const FloatingParticle = ({ delay }: { delay: number }) => {
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
  }, [])

  return (
    <motion.div
      className="absolute w-2 h-2 bg-white/30 rounded-full"
      initial={{ 
        x: Math.random() * windowSize.width,
        y: windowSize.height + 20,
        opacity: 0
      }}
      animate={{
        y: -20,
        opacity: [0, 1, 0],
        x: Math.random() * windowSize.width
      }}
      transition={{
        duration: Math.random() * 3 + 2,
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

// 粒子系统组件
const ParticleSystem = () => {
  const particles = Array.from({ length: 50 }, (_, i) => (
    <FloatingParticle key={i} delay={i * 0.1} />
  ))

  return <div className="absolute inset-0 overflow-hidden pointer-events-none">{particles}</div>
}

// 数字递增动画组件
const CountUpAnimation = ({ end, duration = 2 }: { end: string; duration?: number }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref)

  useEffect(() => {
    if (isInView) {
      const numericEnd = parseInt(end.replace(/\D/g, '')) || 0
      const increment = numericEnd / (duration * 60)
      const timer = setInterval(() => {
        setCount(prev => {
          const next = prev + increment
          return next >= numericEnd ? numericEnd : next
        })
      }, 1000 / 60)

      return () => clearInterval(timer)
    }
  }, [isInView, end, duration])

  const formatCount = (num: number) => {
    if (end.includes('+')) return `${Math.floor(num).toLocaleString()}+`
    if (end.includes('%')) return `${Math.floor(num)}%`
    return Math.floor(num).toLocaleString()
  }

  return <span ref={ref}>{isInView ? formatCount(count) : '0'}</span>
}

export default function HomePage() {
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // 优化滚动动效，减少移动幅度
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])
  
  // 背景动画
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  const features = [
    {
      icon: BarChart3,
      title: "实时行情数据",
      description: "涵盖沪深港三地5725+只股票的实时价格、涨跌幅、成交量等核心数据",
      color: "from-blue-500 to-cyan-500",
      delay: 0.1
    },
    {
      icon: Brain,
      title: "智能数据分析",
      description: "运用量化模型对股票走势、资金流向、市场情绪进行深度挖掘和预测",
      color: "from-purple-500 to-pink-500",
      delay: 0.2
    },
    {
      icon: DollarSign,
      title: "资金流向追踪",
      description: "实时监控主力资金、北向资金、机构资金的流入流出，洞察资金动向",
      color: "from-green-500 to-emerald-500",
      delay: 0.3
    },
    {
      icon: Target,
      title: "热点板块发现",
      description: "基于大数据算法识别市场热点、概念板块和投资机会",
      color: "from-orange-500 to-red-500",
      delay: 0.4
    },
    {
      icon: Shield,
      title: "风险监控预警",
      description: "多维度风险指标监控，及时预警市场风险和异常波动",
      color: "from-indigo-500 to-blue-500",
      delay: 0.5
    },
    {
      icon: Zap,
      title: "毫秒级响应",
      description: "基于云端架构，确保数据更新及时，用户体验流畅",
      color: "from-yellow-500 to-orange-500",
      delay: 0.6
    }
  ]

  const stats = [
    { label: "股票覆盖", value: "5725", icon: Database },
    { label: "数据更新", value: "100", icon: Zap, suffix: "%" },
    { label: "用户体验", value: "99", icon: Target, suffix: "%" },
    { label: "数据准确率", value: "99", icon: Shield, suffix: "%" }
  ]

  const techStack = [
    { name: "Next.js 15", description: "现代化React框架", color: "bg-black text-white", icon: "⚡" },
    { name: "Supabase", description: "实时数据库", color: "bg-green-600 text-white", icon: "🗄️" },
    { name: "Prisma", description: "类型安全ORM", color: "bg-indigo-600 text-white", icon: "🔗" },
    { name: "AKShare", description: "数据源接口", color: "bg-blue-600 text-white", icon: "📊" },
    { name: "TypeScript", description: "类型安全", color: "bg-blue-500 text-white", icon: "🔧" },
    { name: "Tailwind CSS", description: "现代化样式", color: "bg-cyan-500 text-white", icon: "🎨" }
  ]

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden">
      {/* Hero Section with Enhanced Parallax */}
      <motion.section 
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"
      >
        {/* 增强的背景动画 */}
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0 overflow-hidden"
        >
          {/* 动态渐变背景 */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          {/* 多层浮动圆球 */}
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-25"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* 星光效果 */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 1,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>

        {/* 粒子系统 */}
        <ParticleSystem />

        <div className="relative z-10 text-center space-y-8 px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 120 }}
            >
              <Badge className="mb-6 bg-blue-500/20 text-blue-200 border-blue-400/30 px-6 py-3 text-lg backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                </motion.div>
                专业量化投资平台
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <motion.span 
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                <TypewriterEffect text="智能A股" delay={1000} />
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 2 }}
              >
                数据中心
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              基于人工智能和大数据技术，为您提供全方位的A股市场数据分析和投资决策支持
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-10 py-5 text-lg group">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                  </motion.div>
                  立即体验
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-5 text-lg">
                <Eye className="mr-2 h-5 w-5" />
                了解更多
              </Button>
            </motion.div>
          </motion.div>

          {/* 增强的统计数据 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label} 
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 2.8 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -1, 1, 0],
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group"
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                >
                  <motion.div
                    animate={{ 
                      y: [0, -5, 0],
                      rotateY: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5 
                    }}
                  >
                    <stat.icon className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                  </motion.div>
                  <div className="text-3xl font-bold text-white mb-1">
                    <CountUpAnimation end={stat.value} />
                    {stat.suffix && stat.suffix}
                    {stat.label === "股票覆盖" && "+"}
                  </div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* 增强的功能特性区域 */}
      <section className="py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-blue-100 text-blue-600 border-blue-200 px-6 py-3 text-lg">
                <Target className="w-5 h-5 mr-2" />
                核心功能
              </Badge>
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              viewport={{ once: true }}
            >
              专业级数据分析能力
            </motion.h2>
            
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              整合多源数据，运用先进算法，为投资决策提供强有力的数据支撑
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50, rotateY: -90 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: feature.delay,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                className="group perspective-1000"
              >
                <Card className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:scale-105 overflow-hidden">
                  <CardHeader className="pb-4 relative">
                    <motion.div 
                      className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                      whileHover={{ 
                        scale: 1.2,
                        rotate: 360,
                        transition: { duration: 0.5 }
                      }}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                    
                    {/* 悬浮时的装饰效果 */}
                    <motion.div
                      className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </CardHeader>
                  
                  <CardContent>
                    <motion.p 
                      className="text-gray-600 dark:text-gray-300 leading-relaxed"
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.description}
                    </motion.p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 增强的技术栈区域 */}
      <section className="py-32 bg-white dark:bg-slate-900 relative overflow-hidden">
        {/* 动态网格背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 120 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-purple-100 text-purple-600 border-purple-200 px-6 py-3 text-lg">
                <Globe className="w-5 h-5 mr-2" />
                技术架构
              </Badge>
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              viewport={{ once: true }}
            >
              现代化技术栈
            </motion.h2>
            
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              采用业界领先的技术框架，确保系统的稳定性、安全性和可扩展性
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.3, rotateX: -90 }}
                whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.08,
                  rotateY: 5,
                  z: 50,
                  transition: { duration: 0.3 }
                }}
                className="group"
              >
                <motion.div 
                  className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-8 border border-slate-200 dark:border-slate-600 hover:shadow-xl transition-all duration-500 relative overflow-hidden h-full"
                  whileHover={{ 
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  {/* 悬浮时的背景效果 */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  
                  <div className="relative z-10">
                    <motion.div
                      className="flex items-center justify-between mb-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.div 
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${tech.color} shadow-lg`}
                        animate={{
                          boxShadow: [
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <span className="text-lg">{tech.icon}</span>
                        {tech.name}
                      </motion.div>
                    </motion.div>
                    
                    <motion.p 
                      className="text-gray-600 dark:text-gray-300 text-lg"
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                    >
                      {tech.description}
                    </motion.p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 增强的CTA区域 */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* 动态背景效果 */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-pink-500/50"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* 发光效果 */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -30, -60],
              }}
              transition={{
                duration: Math.random() * 4 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-5xl md:text-7xl font-bold text-white mb-8"
              animate={{
                textShadow: [
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 30px rgba(255,255,255,0.8)",
                  "0 0 20px rgba(255,255,255,0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              开启您的投资之旅
            </motion.h2>
            
            <motion.p 
              className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              立即体验专业级的A股数据分析平台，让数据驱动您的投资决策
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Link href="/dashboard">
                <motion.div
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    y: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-6 text-xl font-semibold shadow-2xl">
                    <BarChart3 className="mr-3 h-6 w-6" />
                    进入数据中心
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
