'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, ExternalLink, Search, Clock, Newspaper } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface NewsItem {
  id: number
  url: string
  tag: string
  summary: string
  pub_time: string
  pub_date_time: string
  create_time: string
}

export function NewsTimeline() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await supabase
          .from('stock_news')
          .select('*')
          .order('pub_date_time', { ascending: false })
          .limit(50)

        if (data) {
          setNews(data)
          setFilteredNews(data)
        }
        console.log('xxxxx',data)
      } catch (error) {
        console.error('获取新闻数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = news.filter(item => 
        item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredNews(filtered)
    } else {
      setFilteredNews(news)
    }
  }, [searchTerm, news])

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor(diff / (1000 * 60))
      
      if (hours > 24) {
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      } else if (hours > 0) {
        return `${hours}小时前`
      } else if (minutes > 0) {
        return `${minutes}分钟前`
      } else {
        return '刚刚'
      }
    } catch {
      return timeString
    }
  }

  const NewsCard = ({ item, index }: { item: NewsItem; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="mb-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Newspaper className="h-3 w-3 mr-1" />
                财经快讯
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(item.pub_date_time)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(item.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <h3 className="font-medium text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {item.tag}
          </h3>
          
          {item.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {item.summary}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>点击查看详情</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => window.open(item.url, '_blank')}
            >
              阅读原文
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
          <p className="text-muted-foreground">加载新闻数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* 头部搜索 */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-xl">
            <Newspaper className="h-5 w-5 mr-2 text-indigo-600" />
            财经新闻动态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索新闻标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredNews.length} 条新闻
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 新闻时间线 */}
      <div className="space-y-0">
        {filteredNews.length > 0 ? (
          filteredNews.map((item, index) => (
            <NewsCard key={item.id} item={item} index={index} />
          ))
        ) : (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? '未找到相关新闻' : '暂无新闻数据'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 加载更多 */}
      {filteredNews.length >= 50 && (
        <div className="text-center">
          <Button variant="outline" className="w-full">
            加载更多新闻
          </Button>
        </div>
      )}
    </motion.div>
  )
} 