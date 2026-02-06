'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { callAIAgent, extractText } from '@/lib/aiAgent'
import {
  FaRupeeSign,
  FaChartLine,
  FaShieldAlt,
  FaLightbulb,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaComments,
  FaDownload,
  FaShare,
  FaTimes,
  FaPlay,
  FaFire,
  FaTrophy,
  FaStar,
  FaRocket,
  FaGem,
  FaMedal
} from 'react-icons/fa'

// Constants
const AGENT_ID = '6985ab8d3b50e9c8d7d7e9f2'
const STORAGE_KEY = 'financial_warrior_progress'

// TypeScript Interfaces
interface FinanceData {
  monthlyIncome: number
  monthlyBills: number
  leaks: {
    subscriptions: number
    impulse: number
    dining: number
  }
  hasHealthInsurance: boolean
  hasLifeInsurance: boolean
  hasTermInsurance: boolean
  emergencyMonths: number
  monthlySIP: number
  investmentYears: number
  quizAnswers: {
    q1: string
    q2: string
    q3: string
  }
  investorStyle: string
  completed: boolean
}

interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

interface AgentCoachingBubble {
  message: string
  trigger: string
}

// 3D Interactive Allocation Wheel Component
function AllocationWheel({ data }: { data: FinanceData }) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)

  const surplus = data.monthlyIncome - data.monthlyBills - data.leaks.subscriptions - data.leaks.impulse - data.leaks.dining
  const emergencyFund = data.monthlyBills * data.emergencyMonths

  const slices = [
    { label: 'SIP Investment', value: data.monthlySIP, color: '#14b8a6', colorEnd: '#3b82f6', icon: FaRocket },
    { label: 'Emergency Fund', value: emergencyFund / 12, color: '#fbbf24', colorEnd: '#f97316', icon: FaShieldAlt },
    { label: 'Available', value: Math.max(0, surplus - data.monthlySIP), color: '#34d399', colorEnd: '#22c55e', icon: FaGem },
  ]

  const total = slices.reduce((sum, s) => sum + s.value, 0)

  // Show placeholder if no data
  if (total === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mb-6">
          <FaChartLine className="text-gray-400 text-5xl" />
        </div>
        <p className="text-gray-600 text-lg">
          Complete Step 1 & 2 to see your allocation breakdown
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-80 h-80 mx-auto perspective-1000">
      <div
        className="relative w-full h-full transition-transform duration-500 ease-out transform-gpu"
        style={{
          transform: `rotateY(${rotation}deg) rotateX(10deg)`,
        }}
        onMouseEnter={() => setRotation(5)}
        onMouseLeave={() => setRotation(0)}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <defs>
            {slices.map((slice, i) => (
              <linearGradient key={i} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={slice.color} />
                <stop offset="100%" stopColor={slice.colorEnd} />
              </linearGradient>
            ))}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {slices.map((slice, i) => {
            const startAngle = slices.slice(0, i).reduce((sum, s) => sum + (s.value / total) * 360, 0)
            const angle = (slice.value / total) * 360
            const midAngle = startAngle + angle / 2

            const isHovered = hoveredSlice === slice.label
            const scale = isHovered ? 1.1 : 1

            // Calculate label position
            const labelRadius = 60
            const labelAngle = ((midAngle - 90) * Math.PI) / 180
            const labelX = 100 + labelRadius * Math.cos(labelAngle)
            const labelY = 100 + labelRadius * Math.sin(labelAngle)

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredSlice(slice.label)}
                onMouseLeave={() => setHoveredSlice(null)}
                className="cursor-pointer transition-all duration-300"
                style={{ transformOrigin: '100px 100px' }}
              >
                <path
                  d={describeArc(100, 100, isHovered ? 85 : 80, startAngle, startAngle + angle)}
                  fill={`url(#gradient-${i})`}
                  filter={isHovered ? 'url(#glow)' : undefined}
                  className="transition-all duration-300"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: '100px 100px',
                  }}
                />
                {/* Value label on slice */}
                {angle > 15 && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    className="text-xs font-bold fill-white pointer-events-none"
                    style={{ textShadow: '0 0 4px rgba(0,0,0,0.5)' }}
                  >
                    ₹{slice.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </text>
                )}
              </g>
            )
          })}

          <circle cx="100" cy="100" r="50" className="fill-white drop-shadow-lg" />
          <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
            ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </text>
          <text x="100" y="110" textAnchor="middle" className="text-xs fill-gray-500">
            Monthly Plan
          </text>
        </svg>
      </div>

      {/* Legend with hover effect and values */}
      <div className="absolute -bottom-32 left-0 right-0 flex flex-col gap-3">
        {slices.map((slice, i) => {
          const Icon = slice.icon
          const iconColors = ['text-teal-500', 'text-amber-500', 'text-emerald-500']
          const percentage = total > 0 ? ((slice.value / total) * 100).toFixed(1) : 0
          return (
            <div
              key={i}
              className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                hoveredSlice === slice.label
                  ? 'bg-white shadow-lg scale-105'
                  : 'bg-white/80 backdrop-blur-sm'
              }`}
              onMouseEnter={() => setHoveredSlice(slice.label)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-3">
                <Icon className={`${iconColors[i]} text-xl`} />
                <span className="text-sm font-semibold text-gray-800">{slice.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900">
                  ₹{slice.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-sm text-gray-500 min-w-[3rem] text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper function for SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', x, y,
    'Z'
  ].join(' ')
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

// Modern Glassmorphic Leaky Bucket
function LeakyBucket({ leaks, onLeakClick }: {
  leaks: { subscriptions: number; impulse: number; dining: number }
  onLeakClick: (category: keyof typeof leaks) => void
}) {
  const totalLeaks = leaks.subscriptions + leaks.impulse + leaks.dining
  const waterLevel = Math.max(10, 100 - (totalLeaks / 100) * 50)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleLeakClick = (category: keyof typeof leaks) => {
    // Create particle explosion effect
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    }))
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 1000)
    onLeakClick(category)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative w-64 h-80">
        {/* Glassmorphic Bucket with 3D effect */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-br from-blue-400/30 to-teal-500/30 backdrop-blur-xl rounded-b-3xl border-2 border-white/50 shadow-2xl"
          style={{
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
            transform: 'perspective(1000px) rotateX(5deg)',
          }}>
          {/* Animated Water with shimmer */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-500 via-teal-400 to-cyan-300 rounded-b-3xl transition-all duration-1000 ease-out overflow-hidden"
            style={{ height: `${waterLevel}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
              style={{
                animation: 'shimmer 2s infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(${p.x}px, ${p.y}px)`,
              }}
            />
          ))}
        </div>

        {/* Animated Leak Holes with pulse */}
        {leaks.subscriptions > 0 && (
          <div className="absolute left-8 bottom-32">
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping" />
            </div>
          </div>
        )}
        {leaks.impulse > 0 && (
          <div className="absolute right-12 bottom-40">
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping" />
            </div>
          </div>
        )}
        {leaks.dining > 0 && (
          <div className="absolute left-12 bottom-20">
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping" />
            </div>
          </div>
        )}
      </div>

      {/* Glassmorphic Leak Category Buttons */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        {[
          { key: 'subscriptions' as const, label: 'Subscriptions', value: leaks.subscriptions, icon: FaPlay },
          { key: 'impulse' as const, label: 'Impulse Buys', value: leaks.impulse, icon: FaStar },
          { key: 'dining' as const, label: 'Dining Out', value: leaks.dining, icon: FaGem },
        ].map((leak) => {
          const Icon = leak.icon
          return (
            <button
              key={leak.key}
              onClick={() => handleLeakClick(leak.key)}
              disabled={leak.value === 0}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-lg border border-white/50 p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className="text-2xl text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-gray-700">{leak.label}</span>
                <span className="text-lg font-bold text-emerald-600">₹{leak.value}</span>
              </div>
              {leak.value > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Glassmorphic Insurance Toggle Card
function InsuranceToggleCard({ title, description, checked, onChange }: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 cursor-pointer ${
        checked
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg shadow-emerald-200/50'
          : 'bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="p-6 flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
          checked
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg scale-110'
            : 'bg-gray-200'
        }`}>
          {checked ? (
            <FaCheckCircle className="text-white text-xl animate-in zoom-in duration-300" />
          ) : (
            <FaShieldAlt className="text-gray-400 text-xl" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      {checked && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-teal-400/10 animate-shimmer" />
      )}
    </div>
  )
}

// Animated SIP Projection Card with Liquid Fill Effect
function SIPProjectionCard({ monthlySIP, years }: { monthlySIP: number; years: number }) {
  const annualReturn = 0.12
  const months = years * 12
  const monthlyRate = annualReturn / 12
  const futureValue = monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  const invested = monthlySIP * months
  const gains = futureValue - invested

  const [fillLevel, setFillLevel] = useState(0)

  useEffect(() => {
    setTimeout(() => setFillLevel(100), 100)
  }, [futureValue])

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 shadow-2xl">
      <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl p-8">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-pink-100/50 to-orange-100/50 animate-gradient" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Investment Journey</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ₹{futureValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="relative w-24 h-24">
              <FaRocket className="absolute inset-0 m-auto text-5xl text-orange-500 animate-bounce" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-gray-600 mb-1">Total Invested</p>
              <p className="text-xl font-bold text-purple-600">₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-200">
              <p className="text-xs text-gray-600 mb-1">Gains</p>
              <p className="text-xl font-bold text-pink-600">₹{gains.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          {/* Animated progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Growth Progress</span>
              <span>{years} years</span>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-2000 ease-out"
                style={{ width: `${fillLevel}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
            <FaLightbulb className="text-blue-500 flex-shrink-0" />
            <span>Time is your biggest advantage - the magic of compounding at work</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gamified Achievement Badge
function AchievementBadge({ title, description, unlocked }: {
  title: string
  description: string
  unlocked: boolean
}) {
  return (
    <div className={`relative group overflow-hidden rounded-2xl border-2 p-6 transition-all duration-500 ${
      unlocked
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-400 shadow-lg shadow-amber-200/50 scale-100'
        : 'bg-gray-100 border-gray-300 opacity-60 scale-95'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
          unlocked
            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg animate-in zoom-in'
            : 'bg-gray-300'
        }`}>
          {unlocked ? (
            <FaTrophy className="text-white text-2xl animate-bounce" />
          ) : (
            <FaMedal className="text-gray-400 text-2xl" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {unlocked && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-300/30 to-yellow-300/30 rounded-full blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-yellow-400/10 animate-shimmer" />
        </>
      )}
    </div>
  )
}

// Main App Component
export default function FinancialWarrior() {
  // State Management
  const [currentStep, setCurrentStep] = useState(1)
  const [powerLevel, setPowerLevel] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [coachingBubble, setCoachingBubble] = useState<AgentCoachingBubble | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}`)

  const [financeData, setFinanceData] = useState<FinanceData>({
    monthlyIncome: 0,
    monthlyBills: 0,
    leaks: { subscriptions: 0, impulse: 0, dining: 0 },
    hasHealthInsurance: false,
    hasLifeInsurance: false,
    hasTermInsurance: false,
    emergencyMonths: 6,
    monthlySIP: 5000,
    investmentYears: 15,
    quizAnswers: { q1: '', q2: '', q3: '' },
    investorStyle: '',
    completed: false,
  })

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ financeData, currentStep, powerLevel }))
  }, [financeData, currentStep, powerLevel])

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const { financeData: savedData, currentStep: savedStep, powerLevel: savedPower } = JSON.parse(saved)
      setFinanceData(savedData)
      setCurrentStep(savedStep)
      setPowerLevel(savedPower)
    }
  }, [])

  // Calculations
  const surplus = financeData.monthlyIncome - financeData.monthlyBills -
    financeData.leaks.subscriptions - financeData.leaks.impulse - financeData.leaks.dining

  // Chat Handler
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setIsLoading(true)

    try {
      const contextMessage = `User is on Step ${currentStep}. Current financial data: Income ₹${financeData.monthlyIncome}, Bills ₹${financeData.monthlyBills}, Surplus ₹${surplus}. Question: ${chatInput}`

      const response = await callAIAgent(AGENT_ID, [
        ...chatMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: contextMessage }
      ], sessionId)

      const agentReply = extractText(response)

      const agentMessage: ChatMessage = {
        role: 'agent',
        content: agentReply,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'agent',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Show coaching bubble
  const showCoaching = (message: string, trigger: string) => {
    setCoachingBubble({ message, trigger })
    setTimeout(() => setCoachingBubble(null), 5000)
  }

  // Step Navigation
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
      setPowerLevel(Math.min(100, powerLevel + 20))

      // Celebration message
      showCoaching(
        `Great progress! You've unlocked Step ${currentStep + 1}!`,
        'step_complete'
      )
    }
  }

  // Handle leak plugging
  const handleLeakClick = (category: keyof typeof financeData.leaks) => {
    const amount = financeData.leaks[category]
    if (amount > 0) {
      setFinanceData(prev => ({
        ...prev,
        leaks: { ...prev.leaks, [category]: 0 }
      }))
      setPowerLevel(Math.min(100, powerLevel + 5))
      showCoaching(
        `Awesome! You just reclaimed ₹${amount} by optimizing your ${category}!`,
        'leak_fixed'
      )
    }
  }

  // Quiz calculation
  const calculateInvestorStyle = () => {
    const { q1, q2, q3 } = financeData.quizAnswers
    let score = 0
    if (q1 === 'accept') score += 2
    else if (q1 === 'cautious') score += 1
    if (q2 === 'long') score += 2
    else if (q2 === 'medium') score += 1
    if (q3 === 'growth') score += 2
    else if (q3 === 'balanced') score += 1

    if (score <= 2) return 'Stable'
    if (score <= 4) return 'Balanced'
    return 'Active'
  }

  // PDF Download
  const downloadPDF = () => {
    const summary = `
      FINANCIAL WARRIOR - YOUR PERSONALIZED PLAN

      Income & Surplus:
      - Monthly Income: ₹${financeData.monthlyIncome.toLocaleString('en-IN')}
      - Monthly Bills: ₹${financeData.monthlyBills.toLocaleString('en-IN')}
      - Surplus: ₹${surplus.toLocaleString('en-IN')}

      Safety Net:
      - Health Insurance: ${financeData.hasHealthInsurance ? 'Yes' : 'No'}
      - Life Insurance: ${financeData.hasLifeInsurance ? 'Yes' : 'No'}
      - Term Insurance: ${financeData.hasTermInsurance ? 'Yes' : 'No'}
      - Emergency Fund Goal: ₹${(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')} (${financeData.emergencyMonths} months)

      Investment Plan:
      - Monthly SIP: ₹${financeData.monthlySIP.toLocaleString('en-IN')}
      - Investment Horizon: ${financeData.investmentYears} years
      - Investor Style: ${financeData.investorStyle}

      Next Actions:
      1. Set up automated SIP for ₹${financeData.monthlySIP}
      2. ${!financeData.hasHealthInsurance ? 'Research and purchase health insurance' : 'Review health insurance coverage annually'}
      3. Build emergency fund of ₹${(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')}
    `

    const blob = new Blob([summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-warrior-plan.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Share functionality
  const sharePlan = async () => {
    const text = `I just completed my Financial Warrior journey! My personalized plan includes ₹${financeData.monthlySIP.toLocaleString('en-IN')} monthly SIP and ${financeData.emergencyMonths} months emergency fund.`

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      await navigator.clipboard.writeText(text)
      showCoaching('Plan copied to clipboard!', 'share')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-teal-300/20 to-blue-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Financial Warrior
            </h1>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    i + 1 < currentStep
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 scale-125 shadow-lg'
                      : i + 1 === currentStep
                        ? 'bg-gradient-to-r from-blue-400 to-purple-500 scale-150 shadow-xl animate-pulse'
                        : 'bg-gray-300'
                  }`} />
                  {i < 4 && <div className={`w-8 h-0.5 mx-1 ${i + 1 < currentStep ? 'bg-emerald-400' : 'bg-gray-300'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Animated Power Level Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1">
                <FaFire className="text-orange-500" />
                Power Level
              </span>
              <span className="font-bold text-transparent bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text">
                {powerLevel}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${powerLevel}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Coaching Bubble */}
        {coachingBubble && (
          <div className="fixed top-32 right-6 z-50 max-w-sm animate-in slide-in-from-right duration-500">
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <FaLightbulb className="text-2xl flex-shrink-0 mt-1 animate-bounce" />
                <p className="text-sm font-medium">{coachingBubble.message}</p>
                <button
                  onClick={() => setCoachingBubble(null)}
                  className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-teal-600 transform rotate-45" />
            </div>
          </div>
        )}

        {/* Step 1: Income & Leaks */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="text-center">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Know Your Numbers
              </h2>
              <p className="text-xl text-gray-600">Understanding your cash flow is the first step to financial freedom</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Income Card */}
              <Card className="bg-gradient-to-br from-white to-teal-50/50 border-2 border-teal-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-teal-700">
                    <div className="p-3 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl">
                      <FaRupeeSign className="text-white text-xl" />
                    </div>
                    Monthly Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">₹</span>
                    <Input
                      type="number"
                      value={financeData.monthlyIncome || ''}
                      onChange={(e) => setFinanceData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                      className="text-2xl font-bold pl-10 h-16 bg-white/80 backdrop-blur-sm border-2 border-teal-300 focus:border-teal-500 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bills Card */}
              <Card className="bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-orange-700">
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                      <FaChartLine className="text-white text-xl" />
                    </div>
                    Monthly Bills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">₹</span>
                    <Input
                      type="number"
                      value={financeData.monthlyBills || ''}
                      onChange={(e) => setFinanceData(prev => ({ ...prev, monthlyBills: Number(e.target.value) }))}
                      className="text-2xl font-bold pl-10 h-16 bg-white/80 backdrop-blur-sm border-2 border-orange-300 focus:border-orange-500 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Surplus Display */}
            {financeData.monthlyIncome > 0 && financeData.monthlyBills > 0 && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-2xl animate-in zoom-in duration-500">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Your Monthly Surplus</p>
                    <p className={`text-6xl font-bold mb-4 ${surplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₹{surplus.toLocaleString('en-IN')}
                    </p>
                    <p className="text-gray-600">
                      {surplus >= 0
                        ? 'Great start! You have solid breathing room to build wealth.'
                        : 'Your expenses exceed income. Let\'s identify areas to optimize.'}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-teal-400/10 animate-shimmer" />
                </div>
              </div>
            )}

            {/* Leaky Bucket */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Track Your Financial Leaks</CardTitle>
                <p className="text-center text-gray-600">Enter your monthly spending in each category</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input fields for leak amounts */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FaPlay className="text-blue-600" />
                      Subscriptions
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <Input
                        type="number"
                        value={financeData.leaks.subscriptions || ''}
                        onChange={(e) => setFinanceData(prev => ({
                          ...prev,
                          leaks: { ...prev.leaks, subscriptions: Number(e.target.value) }
                        }))}
                        className="pl-8 h-12 bg-white/80 backdrop-blur-sm border-2 border-blue-300 focus:border-blue-500 rounded-xl"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FaStar className="text-purple-600" />
                      Impulse Buys
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <Input
                        type="number"
                        value={financeData.leaks.impulse || ''}
                        onChange={(e) => setFinanceData(prev => ({
                          ...prev,
                          leaks: { ...prev.leaks, impulse: Number(e.target.value) }
                        }))}
                        className="pl-8 h-12 bg-white/80 backdrop-blur-sm border-2 border-purple-300 focus:border-purple-500 rounded-xl"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FaGem className="text-pink-600" />
                      Dining Out
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <Input
                        type="number"
                        value={financeData.leaks.dining || ''}
                        onChange={(e) => setFinanceData(prev => ({
                          ...prev,
                          leaks: { ...prev.leaks, dining: Number(e.target.value) }
                        }))}
                        className="pl-8 h-12 bg-white/80 backdrop-blur-sm border-2 border-pink-300 focus:border-pink-500 rounded-xl"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Leaky Bucket Visualization */}
                <LeakyBucket leaks={financeData.leaks} onLeakClick={handleLeakClick} />

                {/* Total Leaks Display */}
                {(financeData.leaks.subscriptions > 0 || financeData.leaks.impulse > 0 || financeData.leaks.dining > 0) && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Monthly Leaks</p>
                        <p className="text-3xl font-bold text-red-600">
                          ₹{(financeData.leaks.subscriptions + financeData.leaks.impulse + financeData.leaks.dining).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-600 mb-2">Reclaim this money</p>
                        <Button
                          onClick={() => {
                            setFinanceData(prev => ({
                              ...prev,
                              leaks: { subscriptions: 0, impulse: 0, dining: 0 }
                            }))
                            setPowerLevel(Math.min(100, powerLevel + 15))
                            showCoaching(
                              `Amazing! You just optimized ₹${(financeData.leaks.subscriptions + financeData.leaks.impulse + financeData.leaks.dining).toLocaleString('en-IN')} in monthly spending!`,
                              'all_leaks_fixed'
                            )
                          }}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl h-10 px-6"
                        >
                          Optimize All Leaks
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={nextStep}
                disabled={!financeData.monthlyIncome || !financeData.monthlyBills}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg h-16 px-10 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                Continue to Safety Net
                <FaArrowRight className="ml-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Safety Net */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="text-center">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Build Your Safety Net
              </h2>
              <p className="text-xl text-gray-600">Protection first, growth second - that's the warrior way</p>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                    <FaShieldAlt className="text-white text-2xl" />
                  </div>
                  Insurance Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InsuranceToggleCard
                  title="Health Insurance"
                  description="Covers medical emergencies and hospitalizations - your first line of defense"
                  checked={financeData.hasHealthInsurance}
                  onChange={(checked) => {
                    setFinanceData(prev => ({ ...prev, hasHealthInsurance: checked }))
                    if (checked) setPowerLevel(Math.min(100, powerLevel + 5))
                  }}
                />
                <InsuranceToggleCard
                  title="Life Insurance"
                  description="Provides financial security for your family - peace of mind protection"
                  checked={financeData.hasLifeInsurance}
                  onChange={(checked) => {
                    setFinanceData(prev => ({ ...prev, hasLifeInsurance: checked }))
                    if (checked) setPowerLevel(Math.min(100, powerLevel + 5))
                  }}
                />
                <InsuranceToggleCard
                  title="Term Insurance"
                  description="Pure protection at lowest cost - maximum coverage for your loved ones"
                  checked={financeData.hasTermInsurance}
                  onChange={(checked) => {
                    setFinanceData(prev => ({ ...prev, hasTermInsurance: checked }))
                    if (checked) setPowerLevel(Math.min(100, powerLevel + 5))
                  }}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-amber-50/50 border-2 border-amber-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Emergency Fund Goal</CardTitle>
                <p className="text-gray-600">Build a cushion for life's unexpected moments</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-semibold text-gray-700">{financeData.emergencyMonths} months</span>
                    <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      ₹{(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Slider
                    value={[financeData.emergencyMonths]}
                    onValueChange={(value) => setFinanceData(prev => ({ ...prev, emergencyMonths: value[0] }))}
                    min={3}
                    max={12}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>3 months (Minimum)</span>
                    <span>12 months (Conservative)</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <FaLightbulb className="text-blue-600 text-xl flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">Recommendation</p>
                      <p className="text-sm text-blue-800">
                        Aim for 6-12 months of expenses. This covers job loss, medical emergencies, and unexpected repairs without derailing your financial goals.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="text-lg h-14 px-8 rounded-xl border-2 hover:bg-gray-50"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </Button>
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-lg h-14 px-10 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Continue to Growth Engine
                <FaArrowRight className="ml-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Growth Engine */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="text-center">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
                Power Up Your Growth Engine
              </h2>
              <p className="text-xl text-gray-600">Small steps today, giant leaps tomorrow - the magic of compound interest</p>
            </div>

            {/* 3D Allocation Wheel */}
            <div className="py-12 pb-40">
              <AllocationWheel data={financeData} />
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                    <FaChartLine className="text-white text-2xl" />
                  </div>
                  SIP Calculator
                </CardTitle>
                <p className="text-gray-600">Design your wealth-building journey</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Monthly Investment</Label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">₹500</span>
                    <span className="text-2xl font-bold text-purple-600">₹{financeData.monthlySIP.toLocaleString('en-IN')}</span>
                    <span className="text-gray-600">₹50,000</span>
                  </div>
                  <Slider
                    value={[financeData.monthlySIP]}
                    onValueChange={(value) => setFinanceData(prev => ({ ...prev, monthlySIP: value[0] }))}
                    min={500}
                    max={50000}
                    step={500}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Investment Horizon</Label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">5 years</span>
                    <span className="text-2xl font-bold text-pink-600">{financeData.investmentYears} years</span>
                    <span className="text-gray-600">30 years</span>
                  </div>
                  <Slider
                    value={[financeData.investmentYears]}
                    onValueChange={(value) => setFinanceData(prev => ({ ...prev, investmentYears: value[0] }))}
                    min={5}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Animated SIP Projection */}
            <SIPProjectionCard monthlySIP={financeData.monthlySIP} years={financeData.investmentYears} />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="text-lg h-14 px-8 rounded-xl border-2 hover:bg-gray-50"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </Button>
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-pink-500 to-orange-600 hover:from-pink-600 hover:to-orange-700 text-white text-lg h-14 px-10 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Continue to Trading Basics
                <FaArrowRight className="ml-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Trading Basics */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="text-center">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Trading Wisdom
              </h2>
              <p className="text-xl text-gray-600">Learn the golden rules before you take the leap</p>
            </div>

            <Card className="bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                    <FaLightbulb className="text-white text-2xl" />
                  </div>
                  The 3 Golden Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { rule: 'Only invest money you can afford to lose', icon: FaShieldAlt },
                  { rule: 'Diversification is your best friend - never put all eggs in one basket', icon: FaChartLine },
                  { rule: 'Time in the market beats timing the market', icon: FaRocket },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <Icon className="text-white text-xl" />
                      </div>
                      <p className="text-gray-800 font-medium">{item.rule}</p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Discover Your Investor Style</CardTitle>
                <p className="text-gray-600">Answer these questions to find your perfect match</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question 1 */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">1. How do you feel about market volatility?</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'accept', label: 'I accept it as part of investing' },
                      { value: 'cautious', label: 'I\'m cautious but willing to learn' },
                      { value: 'avoid', label: 'I prefer to avoid it' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFinanceData(prev => ({ ...prev, quizAnswers: { ...prev.quizAnswers, q1: option.value } }))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          financeData.quizAnswers.q1 === option.value
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400 shadow-lg'
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            financeData.quizAnswers.q1 === option.value
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {financeData.quizAnswers.q1 === option.value && (
                              <FaCheckCircle className="text-white text-sm" />
                            )}
                          </div>
                          <span>{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 2 */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">2. What's your investment timeline?</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'long', label: 'Long-term (10+ years)' },
                      { value: 'medium', label: 'Medium-term (5-10 years)' },
                      { value: 'short', label: 'Short-term (1-5 years)' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFinanceData(prev => ({ ...prev, quizAnswers: { ...prev.quizAnswers, q2: option.value } }))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          financeData.quizAnswers.q2 === option.value
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400 shadow-lg'
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            financeData.quizAnswers.q2 === option.value
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {financeData.quizAnswers.q2 === option.value && (
                              <FaCheckCircle className="text-white text-sm" />
                            )}
                          </div>
                          <span>{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 3 */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">3. What's your investment priority?</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'growth', label: 'Growth - I want maximum returns' },
                      { value: 'balanced', label: 'Balanced - Mix of growth and safety' },
                      { value: 'safety', label: 'Safety - Preserve my capital' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFinanceData(prev => ({ ...prev, quizAnswers: { ...prev.quizAnswers, q3: option.value } }))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          financeData.quizAnswers.q3 === option.value
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400 shadow-lg'
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            financeData.quizAnswers.q3 === option.value
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {financeData.quizAnswers.q3 === option.value && (
                              <FaCheckCircle className="text-white text-sm" />
                            )}
                          </div>
                          <span>{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result Badge */}
                {financeData.quizAnswers.q1 && financeData.quizAnswers.q2 && financeData.quizAnswers.q3 && (
                  <div className="mt-6 animate-in zoom-in duration-500">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-1 shadow-2xl">
                      <div className="bg-white rounded-xl p-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mb-4 shadow-lg">
                            <FaTrophy className="text-white text-3xl animate-bounce" />
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Your Investor Style</p>
                          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                            {calculateInvestorStyle()}
                          </p>
                          <p className="text-gray-700">
                            {calculateInvestorStyle() === 'Stable' && 'You prefer steady, low-risk investments with predictable returns.'}
                            {calculateInvestorStyle() === 'Balanced' && 'You balance growth potential with risk management - a thoughtful approach!'}
                            {calculateInvestorStyle() === 'Active' && 'You embrace market dynamics and seek growth opportunities actively.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="text-lg h-14 px-8 rounded-xl border-2 hover:bg-gray-50"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </Button>
              <Button
                onClick={() => {
                  const style = calculateInvestorStyle()
                  setFinanceData(prev => ({ ...prev, investorStyle: style, completed: true }))
                  nextStep()
                }}
                disabled={!financeData.quizAnswers.q1 || !financeData.quizAnswers.q2 || !financeData.quizAnswers.q3}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg h-14 px-10 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                See My Complete Plan
                <FaArrowRight className="ml-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Your Plan */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-6 shadow-2xl animate-bounce">
                <FaTrophy className="text-white text-5xl" />
              </div>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                Your Financial Warrior Plan
              </h2>
              <p className="text-xl text-gray-600">You did it! Here's your personalized roadmap to financial freedom</p>
            </div>

            {/* Achievements */}
            <div className="grid md:grid-cols-2 gap-4">
              <AchievementBadge
                title="Planning Champion"
                description="Completed full financial assessment"
                unlocked={true}
              />
              <AchievementBadge
                title="Safety First"
                description="Configured insurance coverage"
                unlocked={financeData.hasHealthInsurance || financeData.hasLifeInsurance || financeData.hasTermInsurance}
              />
              <AchievementBadge
                title="Growth Mindset"
                description="Set up investment strategy"
                unlocked={financeData.monthlySIP >= 1000}
              />
              <AchievementBadge
                title="Leak Stopper"
                description="Identified expense optimizations"
                unlocked={financeData.leaks.subscriptions === 0 && financeData.leaks.impulse === 0 && financeData.leaks.dining === 0}
              />
            </div>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-white to-teal-50/50 border-2 border-teal-300 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-3xl text-center">Your Financial Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Income & Surplus */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-teal-200">
                    <p className="text-sm text-gray-600 mb-1">Monthly Income</p>
                    <p className="text-2xl font-bold text-teal-600">₹{financeData.monthlyIncome.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">Monthly Bills</p>
                    <p className="text-2xl font-bold text-orange-600">₹{financeData.monthlyBills.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
                    <p className="text-sm text-gray-600 mb-1">Surplus</p>
                    <p className="text-2xl font-bold text-emerald-600">₹{surplus.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <Separator />

                {/* Insurance Checklist */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FaShieldAlt className="text-purple-600" />
                    Insurance Coverage
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Health Insurance', checked: financeData.hasHealthInsurance },
                      { label: 'Life Insurance', checked: financeData.hasLifeInsurance },
                      { label: 'Term Insurance', checked: financeData.hasTermInsurance },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                        {item.checked ? (
                          <FaCheckCircle className="text-emerald-500 text-xl" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={item.checked ? 'text-gray-900 font-medium' : 'text-gray-500'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Investment Plan */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FaRocket className="text-pink-600" />
                    Investment Strategy
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-200">
                      <p className="text-sm text-gray-600 mb-1">Monthly SIP</p>
                      <p className="text-2xl font-bold text-pink-600">₹{financeData.monthlySIP.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-gray-600 mb-1">Investor Style</p>
                      <Badge className="text-lg px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-600">
                        {financeData.investorStyle}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Next Actions */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FaLightbulb className="text-amber-600" />
                    Your 3 Next Actions
                  </h3>
                  <div className="space-y-3">
                    {[
                      `Set up automated SIP for ₹${financeData.monthlySIP.toLocaleString('en-IN')} monthly`,
                      !financeData.hasHealthInsurance
                        ? 'Research and purchase health insurance coverage'
                        : 'Review your health insurance coverage annually',
                      `Build emergency fund of ₹${(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')} (${financeData.emergencyMonths} months)`,
                    ].map((action, i) => (
                      <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                          {i + 1}
                        </div>
                        <p className="text-gray-800 font-medium pt-1">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={downloadPDF}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaDownload className="mr-3 text-xl" />
                Download Your Plan
              </Button>
              <Button
                onClick={sharePlan}
                variant="outline"
                className="border-2 border-purple-300 hover:bg-purple-50 text-lg h-16 rounded-2xl"
              >
                <FaShare className="mr-3 text-xl" />
                Share Your Journey
              </Button>
            </div>

            {/* Celebration Message */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 p-1 shadow-2xl">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  Congratulations, Financial Warrior!
                </p>
                <p className="text-lg text-gray-700">
                  You've taken the first step towards financial freedom. Your journey starts now - stay consistent, stay focused, and watch your wealth grow!
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-teal-400/10 animate-shimmer" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Button */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 z-50 group"
          >
            <FaComments className="text-2xl text-white group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-full animate-ping" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-[450px] bg-gradient-to-br from-white to-teal-50/30 backdrop-blur-xl border-l-2 border-teal-200">
          <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg">
                <FaComments className="text-white" />
              </div>
              Finance Mentor
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-120px)] mt-6">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4">
                      <FaLightbulb className="text-white text-3xl" />
                    </div>
                    <p className="text-gray-600 text-lg">
                      Hi! I'm your Finance Mentor. Ask me anything about your financial journey!
                    </p>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : 'bg-white border border-emerald-200'
                    }`}>
                      <p className={msg.role === 'user' ? 'text-white' : 'text-gray-800'}>
                        {msg.content}
                      </p>
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-lg">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask your finance mentor..."
                className="flex-1 h-12 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                disabled={isLoading}
              />
              <Button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isLoading}
                className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
              >
                Send
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 3s;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}
