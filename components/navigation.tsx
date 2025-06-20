'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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
  Shield
} from "lucide-react"

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/dashboard", label: "数据中心", icon: BarChart3 },
  { href: "/stocks", label: "股票监控", icon: Target },
  { href: "/analysis", label: "数据分析", icon: TrendingUp },
  { href: "/news", label: "资讯动态", icon: Eye }
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="mr-6 flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="hidden font-bold sm:inline-block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              A股数据中心
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`relative ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-600/20"
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Badge variant="secondary" className="hidden sm:flex text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200">
            <div className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            实时更新
          </Badge>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="border-t bg-background md:hidden"
        >
          <div className="container py-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                          : ""
                      }`}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
} 