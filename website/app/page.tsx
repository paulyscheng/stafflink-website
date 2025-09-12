'use client'

import { useState, useEffect, useRef } from 'react'
import emailjs from '@emailjs/browser'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [waitlistType, setWaitlistType] = useState<'company' | 'worker'>('company')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    role: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [videoHover, setVideoHover] = useState<'left' | 'right' | null>(null)
  const [videosLoaded, setVideosLoaded] = useState(false)
  const [cardsInView, setCardsInView] = useState(false)
  const [isWeChat, setIsWeChat] = useState(false)
  const [videosPlaying, setVideosPlaying] = useState({ company: false, worker: false, hero: false })
  const companyVideoRef = useRef<HTMLVideoElement>(null)
  const workerVideoRef = useRef<HTMLVideoElement>(null)
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const transformSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Detect WeChat browser
    const ua = navigator.userAgent.toLowerCase()
    const isWeChatBrowser = ua.includes('micromessenger') || ua.includes('wechat')
    setIsWeChat(isWeChatBrowser)
    
    const handleScroll = () => {
      setScrollY(window.scrollY)
      
      // Check if transformation section is in view
      if (transformSectionRef.current) {
        const rect = transformSectionRef.current.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.75 && rect.bottom > 0) {
          setCardsInView(true)
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    
    // Trigger video load animation
    setTimeout(() => setVideosLoaded(true), 100)
    
    // Try to autoplay videos if not WeChat
    if (!isWeChatBrowser) {
      const playVideos = async () => {
        try {
          if (heroVideoRef.current) {
            await heroVideoRef.current.play()
            setVideosPlaying(prev => ({ ...prev, hero: true }))
          }
          if (companyVideoRef.current) {
            await companyVideoRef.current.play()
            setVideosPlaying(prev => ({ ...prev, company: true }))
          }
          if (workerVideoRef.current) {
            await workerVideoRef.current.play()
            setVideosPlaying(prev => ({ ...prev, worker: true }))
          }
        } catch (error) {
          console.log('Autoplay failed, user interaction required')
        }
      }
      playVideos()
    }
    
    // Check initial scroll position
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleVideoPlay = async (videoType: 'company' | 'worker' | 'hero') => {
    try {
      let videoRef = null
      if (videoType === 'hero') videoRef = heroVideoRef
      else if (videoType === 'company') videoRef = companyVideoRef
      else if (videoType === 'worker') videoRef = workerVideoRef
      
      if (videoRef?.current) {
        // For WeChat, ensure video is muted and try multiple play methods
        videoRef.current.muted = true
        videoRef.current.setAttribute('muted', 'true')
        
        // Try playing with a promise
        const playPromise = videoRef.current.play()
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setVideosPlaying(prev => ({ ...prev, [videoType]: true }))
          }).catch(error => {
            // Auto-play was prevented, try again with user interaction
            console.log('Autoplay prevented, trying fallback:', error)
            // Set playing state anyway to hide the button
            setVideosPlaying(prev => ({ ...prev, [videoType]: true }))
          })
        }
      }
    } catch (error) {
      console.log('Video play failed:', error)
      // Still hide the play button even if play fails
      setVideosPlaying(prev => ({ ...prev, [videoType]: true }))
    }
  }

  const openWaitlist = (type: 'company' | 'worker') => {
    setWaitlistType(type)
    setShowWaitlistModal(true)
    setSubmitSuccess(false)
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      role: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Save to local API/database
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: waitlistType
        })
      })
      
      // Send email notification using EmailJS
      // Note: If EmailJS is not configured, this will fail silently
      try {
        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_stafflink'
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_waitlist'
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
        
        if (publicKey && publicKey !== 'YOUR_PUBLIC_KEY_HERE') {
          // Initialize EmailJS if not already done
          emailjs.init(publicKey)
          
          // Send email with form data
          await emailjs.send(serviceId, templateId, {
            to_email: 'stafflink33@gmail.com',
            user_type: waitlistType === 'company' ? '企业用户' : '工人用户',
            user_name: formData.name || '',
            user_phone: formData.phone || '',
            user_email: formData.email || '未提供',
            company_name: waitlistType === 'company' ? (formData.company || '未提供') : '不适用',
            worker_role: waitlistType === 'worker' ? (formData.role || '未提供') : '不适用',
            submission_date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
          })
          console.log('Email sent successfully to stafflink33@gmail.com')
        } else {
          console.log('EmailJS not configured - email not sent')
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Don't show error to user - email is secondary to saving the data
      }
      
      if (response.ok) {
        setSubmitSuccess(true)
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowWaitlistModal(false)
        }, 2000)
      } else {
        alert('提交失败，请稍后再试')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('提交失败，请稍后再试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section with Construction Video Background */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video 
            ref={heroVideoRef}
            autoPlay={!isWeChat}
            muted 
            loop 
            playsInline
            webkit-playsinline="true"
            x5-video-player-type="h5"
            x5-video-player-fullscreen="true"
            x5-playsinline="true"
            poster="/images/construction-poster.jpg"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
              videosLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
            }`}
          >
            <source src="/video/Construction.mp4" type="video/mp4" />
            <source src="/video/Construction.webm" type="video/webm" />
          </video>
          
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-10" />
          
          {/* Additional overlay for better contrast */}
          <div className="absolute inset-0 bg-black/30 z-10" />
          
          {/* Play button overlay for WeChat - must be above ALL content (z-40) */}
          {isWeChat && !videosPlaying.hero && (
            <div 
              onClick={() => handleVideoPlay('hero')}
              className="absolute inset-0 flex items-center justify-center z-40 cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="bg-black/50 rounded-full p-6 backdrop-blur-sm pointer-events-auto">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-30 min-h-screen flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-5xl mx-auto w-full">
            <h1 className={`text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 drop-shadow-2xl transition-all duration-1000 delay-500 ${
              videosLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
            }`}>
              诸葛调度
            </h1>
            <div 
              className={`inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-2 border-blue-400/50 px-3 sm:px-5 py-2 sm:py-3 rounded-full mb-4 sm:mb-6 transform transition-all duration-1000 shadow-lg ${
              videosLoaded ? 'translate-y-0 opacity-100 scale-100 animate-bounce' : '-translate-y-10 opacity-0 scale-95'
            }`} 
              style={{ 
                transitionDelay: '1500ms',
                animationDelay: '2000ms',
                animationDuration: '2s',
                animationIterationCount: '3',
                boxShadow: videosLoaded ? '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)' : 'none'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-lg sm:text-xl animate-pulse">🍂</span>
                <span className="text-blue-300 font-bold text-base sm:text-lg animate-pulse">今秋即将推出</span>
              </div>
              <span className="hidden sm:inline text-gray-400">|</span>
              <span className="text-gray-300 text-sm sm:text-lg">加入等待名单，成为首批用户</span>
            </div>
            <p className={`text-xl sm:text-2xl md:text-3xl text-blue-400 mb-4 sm:mb-8 drop-shadow-lg transition-all duration-1000 delay-700 ${
              videosLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
            }`}>
              让每一次派工都精准高效
            </p>
            <p className={`text-base sm:text-lg md:text-xl text-gray-200 mb-8 sm:mb-12 max-w-5xl mx-auto drop-shadow-lg transition-all duration-1000 delay-900 ${
              videosLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
            }`}>
              <span className="block sm:inline">AI智能匹配，精准连接每一个需求。</span>
              <span className="block sm:inline">在这里，我们连接工人与企业，</span>
              <span className="block sm:inline">用科技改变蓝领派工。</span>
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => openWaitlist('company')}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base sm:text-lg font-semibold transition-all transform hover:scale-105 backdrop-blur-sm bg-opacity-90 ${
                  videosLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: '1100ms' }}
              >
                企业入驻 - 加入等待名单
              </button>
              <button 
                onClick={() => openWaitlist('worker')}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-base sm:text-lg font-semibold transition-all transform hover:scale-105 backdrop-blur-sm bg-opacity-90 ${
                  videosLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: '1200ms' }}
              >
                工人注册 - 加入等待名单
              </button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-30">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

{/* Section 3: App Showcase with Device Mockups */}
      <section className="bg-gradient-to-b from-gray-900 to-black py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            智能调度如何运作
          </h2>
          <p className="text-xl text-gray-300 mb-16 text-center">
            企业与工人，在同一平台无缝连接
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Company App */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* iPhone Frame */}
                <div className="relative mx-auto" style={{ width: '320px', height: '650px' }}>
                  {/* Phone Border */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl">
                    {/* Screen Area */}
                    <div className="absolute inset-4 bg-black rounded-[2.5rem] overflow-hidden">
                      {/* Video - No status bar overlay */}
                      <video 
                        ref={companyVideoRef}
                        autoPlay={!isWeChat}
                        muted 
                        loop 
                        playsInline
                        webkit-playsinline="true"
                        x5-video-player-type="h5"
                        x5-video-player-fullscreen="true"
                        x5-playsinline="true"
                        poster="/images/company-poster.jpg"
                        onClick={() => isWeChat && !videosPlaying.company && handleVideoPlay('company')}
                        className="absolute inset-0 w-full h-full object-cover"
                      >
                        <source src="/video/Company.MP4" type="video/mp4" />
                        <source src="/video/Company.webm" type="video/webm" />
                      </video>
                      
                      {/* Play button for WeChat */}
                      {isWeChat && !videosPlaying.company && (
                        <div 
                          onClick={() => handleVideoPlay('company')}
                          className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer"
                        >
                          <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* App UI Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="bg-blue-600/90 backdrop-blur rounded-xl p-3">
                            <p className="text-white text-sm font-bold">实时追踪 • 一键发布 • 数据分析</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notch removed to show video */}
                    
                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-2xl">🏢</span>
                </div>
              </div>
              
              {/* App Info */}
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold text-blue-400 mb-2">企业端</h3>
                <p className="text-gray-300 mb-4">智能派工管理平台</p>
                
                {/* Features */}
                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-200 text-sm">一键发布用工需求</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-200 text-sm">AI自动联系工人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-200 text-sm">实时查看到岗情况</span>
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Worker App */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* iPhone Frame */}
                <div className="relative mx-auto" style={{ width: '320px', height: '650px' }}>
                  {/* Phone Border */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl">
                    {/* Screen Area */}
                    <div className="absolute inset-4 bg-black rounded-[2.5rem] overflow-hidden">
                      {/* Video - No status bar overlay */}
                      <video 
                        ref={workerVideoRef}
                        autoPlay={!isWeChat}
                        muted 
                        loop 
                        playsInline
                        webkit-playsinline="true"
                        x5-video-player-type="h5"
                        x5-video-player-fullscreen="true"
                        x5-playsinline="true"
                        poster="/images/worker-poster.jpg"
                        onClick={() => isWeChat && !videosPlaying.worker && handleVideoPlay('worker')}
                        className="absolute inset-0 w-full h-full object-cover"
                      >
                        <source src="/video/Worker.MP4" type="video/mp4" />
                        <source src="/video/Worker.webm" type="video/webm" />
                      </video>
                      
                      {/* Play button for WeChat */}
                      {isWeChat && !videosPlaying.worker && (
                        <div 
                          onClick={() => handleVideoPlay('worker')}
                          className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer"
                        >
                          <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* App UI Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="bg-purple-600/90 backdrop-blur rounded-xl p-3 mb-3">
                            <p className="text-white text-sm font-bold">新工作机会</p>
                            <p className="text-white/80 text-xs">园艺剪草 - ¥200/小时</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold">
                              接受
                            </button>
                            <button className="flex-1 bg-gray-600 text-white py-2 rounded-lg text-sm font-bold">
                              查看详情
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notch removed to show video */}
                    
                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-2xl">👷</span>
                </div>
              </div>
              
              {/* App Info */}
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold text-purple-400 mb-2">工人端</h3>
                <p className="text-gray-300 mb-4">便捷找工作平台</p>
                
                {/* Features */}
                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-200 text-sm">接收AI智能推荐</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-200 text-sm">一键确认工作</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-200 text-sm">查看历史记录</span>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
          
          {/* Connection Indicator */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur px-6 py-3 rounded-full">
              <span className="text-blue-400">企业端</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200"></div>
              </div>
              <span className="text-white">实时同步</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-purple-400">工人端</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Real Stories */}
      <section className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
            真实的改变，看得见的效果
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">企业的故事</h3>
              <div className="space-y-6">
                <div className="border-l-4 border-yellow-300 pl-4">
                  <p className="text-xl font-bold text-yellow-300 mb-2">以前：开工前一晚的噩梦</p>
                  <p className="text-gray-200">
                    "明天需要20个工人，现在开始打电话...打了3小时，只有8个确定能来"
                  </p>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <p className="text-xl font-bold text-green-400 mb-2">现在：一键搞定</p>
                  <p className="text-gray-200">
                    "晚上10点发布需求，AI自动打电话和发讯息，早上醒来20个工人已确认"
                  </p>
                </div>
                <div className="bg-blue-900/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-300 italic">
                    "再也不用半夜爬起来打电话了，AI帮我们24小时招人"
                  </p>
                  <p className="text-xs text-gray-400 mt-2">- 某建筑公司项目经理</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">工人的故事</h3>
              <div className="space-y-6">
                <div className="border-l-4 border-yellow-300 pl-4">
                  <p className="text-xl font-bold text-yellow-300 mb-2">以前：错过的机会</p>
                  <p className="text-gray-200">
                    "在工地干活时老板打电话，等收工回电话，工作已经给别人了"
                  </p>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <p className="text-xl font-bold text-green-400 mb-2">现在：灵活接收工作机会</p>
                  <p className="text-gray-200">
                    "电话、短信、App通知 - 选最方便的方式。晚上回家查看，一键确认明天的活"
                  </p>
                </div>
                <div className="bg-purple-900/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-300 italic">
                    "不用担心错过机会，合适的工作会通过多种方式通知我，我能自己选择什么时候回复"
                  </p>
                  <p className="text-xs text-gray-400 mt-2">- 张师傅，电工</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-300">
              从手忙脚乱到井井有条，从错失良机到机会满满
            </p>
            <p className="text-2xl font-bold text-blue-400 mt-4">
              这就是智能调度带来的改变
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-20 px-4 flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            用科技智能调度
          </h2>
          <p className="text-2xl text-gray-300 mb-12">
            让蓝领派工更智能、更高效！
          </p>
          
          {/* Waitlist Version */}
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              onClick={() => openWaitlist('company')}
              className="bg-blue-600 p-8 rounded-2xl hover:bg-blue-700 transition-all cursor-pointer transform hover:scale-105"
            >
              <h3 className="text-2xl font-bold text-white mb-4">企业入驻</h3>
              <p className="text-gray-200 mb-6">开启智能派工新时代</p>
              <div className="bg-white/10 backdrop-blur p-6 rounded-lg inline-block">
                <div className="text-5xl mb-2">🚀</div>
                <p className="text-lg text-white font-semibold">加入等待名单</p>
                <p className="text-sm text-gray-300 mt-2">成为首批体验用户</p>
              </div>
            </div>
            <div 
              onClick={() => openWaitlist('worker')}
              className="bg-purple-600 p-8 rounded-2xl hover:bg-purple-700 transition-all cursor-pointer transform hover:scale-105"
            >
              <h3 className="text-2xl font-bold text-white mb-4">工人注册</h3>
              <p className="text-gray-200 mb-6">获得更多工作机会</p>
              <div className="bg-white/10 backdrop-blur p-6 rounded-lg inline-block">
                <div className="text-5xl mb-2">⭐</div>
                <p className="text-lg text-white font-semibold">加入等待名单</p>
                <p className="text-sm text-gray-300 mt-2">抢先获得工作机会</p>
              </div>
            </div>
          </div>
          
          {/* QR Code Version - Commented for future use */}
          {/* <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-600 p-8 rounded-2xl hover:bg-blue-700 transition-all cursor-pointer">
              <h3 className="text-2xl font-bold text-white mb-4">企业入驻</h3>
              <p className="text-gray-200 mb-6">开启智能派工新时代</p>
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="w-32 h-32 bg-gray-300"></div>
                <p className="text-sm text-gray-600 mt-2">扫码注册</p>
              </div>
            </div>
            <div className="bg-purple-600 p-8 rounded-2xl hover:bg-purple-700 transition-all cursor-pointer">
              <h3 className="text-2xl font-bold text-white mb-4">工人注册</h3>
              <p className="text-gray-200 mb-6">获得更多工作机会</p>
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="w-32 h-32 bg-gray-300"></div>
                <p className="text-sm text-gray-600 mt-2">扫码下载</p>
              </div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 px-4 text-center text-gray-400">
        <p>© 2025 诸葛调度 - StaffLink. All rights reserved.</p>
      </footer>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {!submitSuccess ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">
                  加入等待名单
                </h2>
                <p className="text-gray-400 mb-6">
                  {waitlistType === 'company' ? 
                    '成为首批使用智能派工系统的企业' : 
                    '抢先获得优质工作机会'}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      邮箱 *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      手机号码
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="选填"
                    />
                  </div>
                  
                  {waitlistType === 'company' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        公司名称
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="请输入公司名称"
                      />
                    </div>
                  )}
                  
                  {waitlistType === 'worker' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        工种
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="如：电工、木工、瓦工等"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        waitlistType === 'company' 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      } text-white ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? '提交中...' : '加入等待名单'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWaitlistModal(false)}
                      className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  成功加入等待名单！
                </h2>
                <p className="text-gray-400">
                  我们会第一时间通知您产品上线消息
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}