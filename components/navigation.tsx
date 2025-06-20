'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  BarChart3, 
  Menu, 
  X, 
  Home,
  TrendingUp,
  Activity,
  DollarSign,
  Target,
  PieChart,
  Eye,
  Shield,
  Sparkles,
  Zap
} from "lucide-react"

const navItems = [
  { href: "/", label: "首页", icon: Home, color: "from-blue-500 to-cyan-500" },
  { href: "/dashboard", label: "数据中心", icon: BarChart3, color: "from-purple-500 to-pink-500" },
  { href: "/stocks", label: "股票监控", icon: Target, color: "from-green-500 to-emerald-500" },
  { href: "/analysis", label: "数据分析", icon: TrendingUp, color: "from-orange-500 to-red-500" },
  { href: "/news", label: "资讯动态", icon: Eye, color: "from-indigo-500 to-blue-500" }
]

// 浮动粒子组件
const FloatingParticle = ({ delay, index }: { delay: number; index: number }) => {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
      initial={{ 
        x: Math.random() * 1200,
        y: -10,
        opacity: 0
      }}
      animate={{
        y: 80,
        opacity: [0, 1, 0],
        x: Math.random() * 1200 + Math.sin(index) * 50
      }}
      transition={{
        duration: Math.random() * 4 + 3,
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { scrollY } = useScroll()
  
  // 滚动时的动态效果
  const backgroundOpacity = useTransform(scrollY, [0, 50], [0.95, 1])

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", updateScrolled)
    return () => window.removeEventListener("scroll", updateScrolled)
  }, [])

  return (
    <motion.nav 
      style={{ opacity: backgroundOpacity }}
      className="fixed top-0 left-0 right-0 z-[9999] w-full border-b border-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 overflow-hidden shadow-lg"
    >
      {/* 动态背景效果 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* 浮动粒子 */}
        {Array.from({ length: 15 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.2} index={i} />
        ))}
      </div>

             <div className="container mx-auto flex h-16 items-center justify-between relative z-10 max-w-7xl">
         {/* 炫酷Logo */}
         <motion.div 
           className="flex items-center space-x-2"
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
         >
           <Link href="/" className="flex items-center space-x-2 group">
             <motion.div 
               className="relative flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden"
               whileHover={{ scale: 1.1, rotate: 360 }}
               transition={{ duration: 0.6 }}
             >
               <motion.div
                 className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"
                 animate={{
                   background: [
                     "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                     "linear-gradient(45deg, #8b5cf6, #ec4899)",
                     "linear-gradient(45deg, #ec4899, #3b82f6)",
                   ]
                 }}
                 transition={{ duration: 3, repeat: Infinity }}
               />
               <motion.div
                 className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-50 transition-opacity duration-300"
               />
               <BarChart3 className="h-5 w-5 text-white relative z-10" />
               
               {/* 发光效果 */}
               <motion.div
                 className="absolute inset-0 rounded-lg"
                 animate={{
                   boxShadow: [
                     "0 0 20px rgba(59, 130, 246, 0.3)",
                     "0 0 30px rgba(139, 92, 246, 0.4)",
                     "0 0 20px rgba(59, 130, 246, 0.3)"
                   ]
                 }}
                 transition={{ duration: 2, repeat: Infinity }}
               />
             </motion.div>
             
             <motion.span 
               className="hidden font-bold sm:inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative"
               animate={{
                 backgroundPosition: ["0%", "100%", "0%"]
               }}
               transition={{ duration: 4, repeat: Infinity }}
               style={{ backgroundSize: "200%" }}
             >
               A股数据中心
               <motion.div
                 className="absolute -top-1 -right-1"
                 animate={{ rotate: 360 }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               >
                 <Sparkles className="w-3 h-3 text-yellow-400" />
               </motion.div>
             </motion.span>
           </Link>
         </motion.div>

         {/* 炫酷桌面导航 - 居中显示 */}
         <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
           <div className="flex items-center space-x-1">
             {navItems.map((item, index) => {
               const isActive = pathname === item.href
               return (
                 <motion.div
                   key={item.href}
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.5, delay: index * 0.1 }}
                 >
                   <Link href={item.href}>
                     <motion.div
                       whileHover={{ 
                         scale: 1.05,
                         y: -2
                       }}
                       whileTap={{ scale: 0.95 }}
                       className="relative group"
                     >
                       <Button
                         variant={isActive ? "default" : "ghost"}
                         size="sm"
                         className={`relative overflow-hidden transition-all duration-300 ${
                           isActive 
                             ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                             : "hover:bg-white/10 hover:text-foreground hover:shadow-md"
                         }`}
                       >
                         {/* 悬浮时的背景发光 */}
                         <motion.div
                           className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                         />
                         
                         <motion.div
                           animate={isActive ? { rotate: [0, 10, 0] } : {}}
                           transition={{ duration: 2, repeat: Infinity }}
                         >
                           <item.icon className="mr-2 h-4 w-4 relative z-10" />
                         </motion.div>
                         <span className="relative z-10">{item.label}</span>
                         
                         {/* 活跃状态指示器 */}
                         {isActive && (
                           <motion.div
                             className="absolute inset-0 rounded-md"
                             layoutId="activeTab"
                             initial={false}
                             animate={{
                               boxShadow: [
                                 "0 0 20px rgba(59, 130, 246, 0.3)",
                                 "0 0 30px rgba(139, 92, 246, 0.4)",
                                 "0 0 20px rgba(59, 130, 246, 0.3)"
                               ]
                             }}
                             transition={{ 
                               layout: { type: "spring", bounce: 0.2, duration: 0.6 },
                               boxShadow: { duration: 2, repeat: Infinity }
                             }}
                           />
                         )}
                       </Button>
                     </motion.div>
                   </Link>
                 </motion.div>
               )
             })}
           </div>
         </div>

         {/* 炫酷状态区域 */}
         <div className="flex items-center space-x-4">
          {/* 增强的状态徽章 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Badge 
              variant="secondary" 
              className="hidden sm:flex text-green-600 bg-green-50/80 dark:bg-green-900/20 border-green-200 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
            >
              {/* 背景发光动画 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              
              <motion.div 
                className="mr-2 h-2 w-2 rounded-full bg-green-500 relative z-10"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-400"
                  animate={{
                    scale: [1, 2.5, 1],
                    opacity: [0.7, 0, 0.7],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-300"
                  animate={{
                    scale: [1, 3.5, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                />
              </motion.div>
              <span className="relative z-10">实时更新</span>
              
              <motion.div
                className="ml-1 relative z-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-3 h-3" />
              </motion.div>
            </Badge>
          </motion.div>

          {/* 主题切换 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <ThemeToggle />
          </motion.div>

          {/* 炫酷移动端菜单按钮 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="md:hidden"
          >
            <Button
              variant="ghost"
              size="sm"
              className="relative overflow-hidden hover:bg-white/10 hover:shadow-lg transition-all duration-300"
              onClick={() => setIsOpen(!isOpen)}
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* 炫酷移动端导航 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10 bg-background/95 backdrop-blur-md md:hidden relative overflow-hidden"
          >
            {/* 移动端背景效果 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <div className="container py-4 relative z-10">
              <div className="space-y-2">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02, x: 10 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            className={`w-full justify-start relative overflow-hidden ${
                              isActive 
                                ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                                : "hover:bg-white/10"
                            }`}
                          >
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 hover:opacity-10 transition-opacity duration-300`}
                            />
                            <item.icon className="mr-2 h-4 w-4 relative z-10" />
                            <span className="relative z-10">{item.label}</span>
                          </Button>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
} 