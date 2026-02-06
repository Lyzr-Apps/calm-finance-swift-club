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
import { FaRupeeSign, FaChartLine, FaShieldAlt, FaLightbulb, FaCheckCircle, FaArrowRight, FaArrowLeft, FaComments, FaDownload, FaShare, FaTimes, FaPlay } from 'react-icons/fa'

// Constants
const AGENT_ID = '6985ab8d3b50e9c8d7d7e9f2'
const STORAGE_KEY = 'financial_warrior_progress'

// TypeScript Interfaces
interface FinanceData {
  // Step 1 - Income & Leaks
  monthlyIncome: number
  monthlyBills: number
  leaks: {
    subscriptions: number
    impulse: number
    dining: number
  }

  // Step 2 - Safety Net
  hasHealthInsurance: boolean
  hasLifeInsurance: boolean
  hasTermInsurance: boolean
  emergencyMonths: number

  // Step 3 - Growth Engine
  monthlySIP: number
  investmentYears: number

  // Step 4 - Trading Basics
  quizAnswers: {
    q1: string
    q2: string
    q3: string
  }
  investorStyle: string

  // Step 5 - Summary
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

// Inline Components
function LeakyBucket({ leaks, onLeakClick }: { leaks: { subscriptions: number; impulse: number; dining: number }; onLeakClick: (category: keyof typeof leaks) => void }) {
  const totalLeaks = leaks.subscriptions + leaks.impulse + leaks.dining
  const bucketHeight = 200
  const waterLevel = Math.max(10, 100 - (totalLeaks / 100) * 50) // Visual representation

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative w-48 h-64">
        {/* Bucket */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-blue-100 to-blue-200 rounded-b-3xl border-4 border-blue-300" style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }}>
          {/* Water */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-400 to-blue-300 rounded-b-3xl transition-all duration-700" style={{ height: `${waterLevel}%` }} />
        </div>

        {/* Leak holes */}
        {leaks.subscriptions > 0 && (
          <div className="absolute left-4 bottom-24 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
        {leaks.impulse > 0 && (
          <div className="absolute right-8 bottom-32 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
        {leaks.dining > 0 && (
          <div className="absolute left-8 bottom-16 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Leak Categories */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {[
          { key: 'subscriptions' as const, label: 'Unused Subscriptions', value: leaks.subscriptions },
          { key: 'impulse' as const, label: 'Impulse Buys', value: leaks.impulse },
          { key: 'dining' as const, label: 'Excessive Dining', value: leaks.dining },
        ].map((leak) => (
          <button
            key={leak.key}
            onClick={() => onLeakClick(leak.key)}
            className="p-4 bg-white border-2 border-red-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group"
          >
            <div className="text-sm text-gray-600 mb-1">{leak.label}</div>
            <div className="text-2xl font-bold text-red-500 group-hover:text-emerald-600">
              ₹{leak.value.toLocaleString('en-IN')}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function InsuranceToggleCard({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`p-6 rounded-xl border-2 transition-all text-left w-full ${
        checked ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FaShieldAlt className={checked ? 'text-emerald-600' : 'text-gray-400'} size={24} />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
          {checked && <FaCheckCircle className="text-white" size={16} />}
        </div>
      </div>
    </button>
  )
}

function CompoundInterestDisplay({ principal, years }: { principal: number; years: number }) {
  // Assuming 12% annual return (conservative equity market estimate)
  const rate = 0.12
  const n = 12 // Monthly compounding
  const totalMonths = years * 12
  const futureValue = principal * (((Math.pow(1 + rate / n, n * years) - 1) / (rate / n)))
  const totalInvested = principal * totalMonths
  const returns = futureValue - totalInvested

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-8 border-2 border-emerald-200">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-gray-600 mb-1">Total Invested</div>
          <div className="text-2xl font-bold text-gray-800">₹{totalInvested.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Estimated Returns</div>
          <div className="text-2xl font-bold text-emerald-600">₹{Math.round(returns).toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-sm text-emerald-600 mb-1 font-semibold">Future Value</div>
          <div className="text-3xl font-bold text-emerald-700">₹{Math.round(futureValue).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        * Assumes 12% annual return with monthly compounding
      </div>
    </div>
  )
}

function QuizQuestion({ question, options, selected, onSelect }: { question: string; options: { value: string; label: string }[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-lg">{question}</h4>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selected === option.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [powerLevel, setPowerLevel] = useState(0)
  const [financeData, setFinanceData] = useState<FinanceData>({
    monthlyIncome: 0,
    monthlyBills: 0,
    leaks: { subscriptions: 0, impulse: 0, dining: 0 },
    hasHealthInsurance: false,
    hasLifeInsurance: false,
    hasTermInsurance: false,
    emergencyMonths: 6,
    monthlySIP: 5000,
    investmentYears: 10,
    quizAnswers: { q1: '', q2: '', q3: '' },
    investorStyle: '',
    completed: false,
  })

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [coachingBubble, setCoachingBubble] = useState<AgentCoachingBubble | null>(null)
  const [sessionId] = useState(() => `session_${Date.now()}`)

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setFinanceData(data.financeData || financeData)
        setCurrentStep(data.currentStep || 1)
        setPowerLevel(data.powerLevel || 0)
      } catch (e) {
        console.error('Failed to load saved progress:', e)
      }
    }
  }, [])

  // Auto-save progress
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ financeData, currentStep, powerLevel }))
  }, [financeData, currentStep, powerLevel])

  // Calculate surplus
  const surplus = financeData.monthlyIncome - financeData.monthlyBills
  const totalLeaks = financeData.leaks.subscriptions + financeData.leaks.impulse + financeData.leaks.dining
  const actualSurplus = surplus + totalLeaks

  // Send message to agent
  const sendChatMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      const result = await callAIAgent(message, AGENT_ID, { session_id: sessionId })

      if (result.success) {
        const agentResponse: ChatMessage = {
          role: 'agent',
          content: extractText(result.response) || 'I received your message!',
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev, agentResponse])
      } else {
        const errorMessage: ChatMessage = {
          role: 'agent',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setChatLoading(false)
    }
  }

  // Get contextual help
  const getContextualHelp = async () => {
    const contexts = {
      1: 'I need help understanding my income and expenses. Can you explain how to track my monthly budget?',
      2: 'Can you help me understand what insurance I need and how much emergency fund is recommended?',
      3: 'I want to learn about SIP investments and how compound interest works.',
      4: 'Can you explain the basics of trading and help me understand my risk profile?',
      5: 'Can you review my financial plan and suggest next steps?',
    }

    await sendChatMessage(contexts[currentStep as keyof typeof contexts])
    setIsChatOpen(true)
  }

  // Show coaching bubble
  const showCoaching = (message: string, trigger: string) => {
    setCoachingBubble({ message, trigger })
    setTimeout(() => setCoachingBubble(null), 5000)
  }

  // Handle leak click
  const handleLeakClick = (category: keyof FinanceData['leaks']) => {
    setFinanceData((prev) => ({
      ...prev,
      leaks: { ...prev.leaks, [category]: 0 },
    }))

    const totalReclaimed = financeData.leaks[category]
    showCoaching(`You just reclaimed ₹${totalReclaimed.toLocaleString('en-IN')}!`, 'leak_fixed')
    setPowerLevel((prev) => Math.min(100, prev + 10))
  }

  // Calculate investor style
  const calculateInvestorStyle = () => {
    const { q1, q2, q3 } = financeData.quizAnswers
    let score = 0

    if (q1 === 'hold') score += 3
    if (q1 === 'sell_some') score += 2
    if (q1 === 'sell_all') score += 1

    if (q2 === 'longterm') score += 3
    if (q2 === 'medium') score += 2
    if (q2 === 'shortterm') score += 1

    if (q3 === 'research') score += 3
    if (q3 === 'tips') score += 2
    if (q3 === 'hunch') score += 1

    if (score >= 8) return 'Stable Investor'
    if (score >= 5) return 'Balanced Investor'
    return 'Active Trader'
  }

  // Next step
  const nextStep = () => {
    if (currentStep === 4 && financeData.quizAnswers.q1 && financeData.quizAnswers.q2 && financeData.quizAnswers.q3) {
      const style = calculateInvestorStyle()
      setFinanceData((prev) => ({ ...prev, investorStyle: style }))
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1)
      setPowerLevel((prev) => Math.min(100, prev + 15))

      if (currentStep === 1 && surplus > 0) {
        showCoaching(`Great start! You have solid breathing room with ₹${surplus.toLocaleString('en-IN')} surplus.`, 'step1_complete')
      }
    }
  }

  // Generate PDF
  const generatePDF = () => {
    const pdfContent = `
FINANCIAL WARRIOR - YOUR PERSONALIZED PLAN
==========================================

INCOME & EXPENSES
-----------------
Monthly Income: ₹${financeData.monthlyIncome.toLocaleString('en-IN')}
Monthly Bills: ₹${financeData.monthlyBills.toLocaleString('en-IN')}
Surplus: ₹${surplus.toLocaleString('en-IN')}

SAFETY NET
----------
Health Insurance: ${financeData.hasHealthInsurance ? 'Yes' : 'No'}
Life Insurance: ${financeData.hasLifeInsurance ? 'Yes' : 'No'}
Term Insurance: ${financeData.hasTermInsurance ? 'Yes' : 'No'}
Emergency Fund Target: ${financeData.emergencyMonths} months (₹${(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')})

GROWTH ENGINE
-------------
Monthly SIP: ₹${financeData.monthlySIP.toLocaleString('en-IN')}
Investment Period: ${financeData.investmentYears} years
Estimated Corpus: ₹${Math.round(financeData.monthlySIP * (((Math.pow(1 + 0.12 / 12, 12 * financeData.investmentYears) - 1) / (0.12 / 12)))).toLocaleString('en-IN')}

INVESTOR PROFILE
----------------
Style: ${financeData.investorStyle}

NEXT ACTIONS
------------
1. Set up automatic SIP of ₹${financeData.monthlySIP.toLocaleString('en-IN')}
2. Build emergency fund of ₹${(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')}
3. Review and optimize monthly expenses

Generated on: ${new Date().toLocaleDateString('en-IN')}
    `.trim()

    const blob = new Blob([pdfContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-warrior-plan.txt'
    a.click()
    URL.revokeObjectURL(url)

    showCoaching('Your plan has been downloaded!', 'pdf_download')
  }

  // Share plan
  const sharePlan = async () => {
    const shareText = `I just completed my Financial Warrior plan! 💪\n\nInvestor Style: ${financeData.investorStyle}\nMonthly SIP: ₹${financeData.monthlySIP.toLocaleString('en-IN')}\nGoal: Building wealth for the next ${financeData.investmentYears} years!`

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareText)
      showCoaching('Plan copied to clipboard!', 'share')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Financial Warrior</h1>
            <div className="flex items-center gap-4">
              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step === currentStep
                        ? 'bg-emerald-500 text-white scale-110'
                        : step < currentStep
                        ? 'bg-emerald-200 text-emerald-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Power Level Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Power Level</span>
              <span className="font-semibold text-emerald-600">{powerLevel}/100</span>
            </div>
            <Progress value={powerLevel} className="h-3" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Coaching Bubble */}
          {coachingBubble && (
            <div className="mb-8 animate-in slide-in-from-top duration-500">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 relative">
                <button
                  onClick={() => setCoachingBubble(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaLightbulb className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-gray-800">{coachingBubble.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Income & Leaks */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Let's Start with Your Money Flow</h2>
                <p className="text-lg text-gray-600">Understanding your income and expenses is the first step to financial freedom</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FaRupeeSign className="text-emerald-600" />
                    Monthly Income & Bills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="income" className="text-base">Monthly Income</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                        <Input
                          id="income"
                          type="number"
                          placeholder="80000"
                          value={financeData.monthlyIncome || ''}
                          onChange={(e) => setFinanceData((prev) => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                          className="pl-8 text-lg h-14"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bills" className="text-base">Monthly Bills</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                        <Input
                          id="bills"
                          type="number"
                          placeholder="45000"
                          value={financeData.monthlyBills || ''}
                          onChange={(e) => setFinanceData((prev) => ({ ...prev, monthlyBills: Number(e.target.value) }))}
                          className="pl-8 text-lg h-14"
                        />
                      </div>
                    </div>
                  </div>

                  {surplus > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Your Monthly Surplus</div>
                        <div className="text-5xl font-bold text-emerald-600 mb-2">
                          ₹{surplus.toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-500">Available for savings and investments</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {surplus > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Plug the Leaks</CardTitle>
                    <p className="text-sm text-gray-600">Click on categories to reclaim wasted money</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { key: 'subscriptions' as const, label: 'Unused Subscriptions', placeholder: '500' },
                        { key: 'impulse' as const, label: 'Impulse Buys', placeholder: '2000' },
                        { key: 'dining' as const, label: 'Excessive Dining', placeholder: '2000' },
                      ].map((leak) => (
                        <div key={leak.key} className="space-y-2">
                          <Label className="text-sm">{leak.label}</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <Input
                              type="number"
                              placeholder={leak.placeholder}
                              value={financeData.leaks[leak.key] || ''}
                              onChange={(e) =>
                                setFinanceData((prev) => ({
                                  ...prev,
                                  leaks: { ...prev.leaks, [leak.key]: Number(e.target.value) },
                                }))
                              }
                              className="pl-7"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalLeaks > 0 && (
                      <>
                        <LeakyBucket leaks={financeData.leaks} onLeakClick={handleLeakClick} />
                        {totalLeaks > 0 && (
                          <div className="mt-6 text-center">
                            <div className="text-sm text-amber-600 mb-1">Potential savings if you fix these leaks:</div>
                            <div className="text-3xl font-bold text-amber-600">₹{totalLeaks.toLocaleString('en-IN')}/month</div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={!financeData.monthlyIncome || !financeData.monthlyBills || surplus <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-lg h-14 px-8"
                >
                  Continue to Safety Net
                  <FaArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Safety Net */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Build Your Safety Net</h2>
                <p className="text-lg text-gray-600">Protection first, growth second - that's the warrior way</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FaShieldAlt className="text-emerald-600" />
                    Insurance Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InsuranceToggleCard
                    title="Health Insurance"
                    description="Covers medical emergencies and hospitalizations"
                    checked={financeData.hasHealthInsurance}
                    onChange={(checked) => setFinanceData((prev) => ({ ...prev, hasHealthInsurance: checked }))}
                  />
                  <InsuranceToggleCard
                    title="Life Insurance"
                    description="Provides financial security for your family"
                    checked={financeData.hasLifeInsurance}
                    onChange={(checked) => setFinanceData((prev) => ({ ...prev, hasLifeInsurance: checked }))}
                  />
                  <InsuranceToggleCard
                    title="Term Insurance"
                    description="Pure protection at lowest cost"
                    checked={financeData.hasTermInsurance}
                    onChange={(checked) => setFinanceData((prev) => ({ ...prev, hasTermInsurance: checked }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Fund Goal</CardTitle>
                  <p className="text-sm text-gray-600">How many months of expenses should you save?</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{financeData.emergencyMonths} months</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        ₹{(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Slider
                      value={[financeData.emergencyMonths]}
                      onValueChange={(value) => setFinanceData((prev) => ({ ...prev, emergencyMonths: value[0] }))}
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

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> Aim for 6-12 months of expenses. This covers job loss, medical emergencies, and unexpected repairs.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="text-lg h-14 px-8">
                  <FaArrowLeft className="mr-2" />
                  Back
                </Button>
                <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-lg h-14 px-8">
                  Continue to Growth Engine
                  <FaArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Growth Engine */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Power Up Your Growth Engine</h2>
                <p className="text-lg text-gray-600">Small steps today, giant leaps tomorrow - the magic of compound interest</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FaChartLine className="text-emerald-600" />
                    Monthly SIP Investment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Monthly Amount</span>
                      <span className="text-3xl font-bold text-emerald-600">
                        ₹{financeData.monthlySIP.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Slider
                      value={[financeData.monthlySIP]}
                      onValueChange={(value) => setFinanceData((prev) => ({ ...prev, monthlySIP: value[0] }))}
                      min={500}
                      max={Math.min(50000, actualSurplus)}
                      step={500}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>₹500</span>
                      <span>₹{Math.min(50000, actualSurplus).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Investment Period</span>
                      <span className="text-3xl font-bold text-emerald-600">{financeData.investmentYears} years</span>
                    </div>
                    <Slider
                      value={[financeData.investmentYears]}
                      onValueChange={(value) => setFinanceData((prev) => ({ ...prev, investmentYears: value[0] }))}
                      min={5}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>5 years</span>
                      <span>30 years</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-xl font-semibold mb-4">Your Wealth Projection</h3>
                <CompoundInterestDisplay principal={financeData.monthlySIP} years={financeData.investmentYears} />
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-start gap-4">
                  <FaLightbulb className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Pro Tip: Start Small, Think Big</h4>
                    <p className="text-sm text-amber-800">
                      Even ₹500/month invested consistently can grow to significant wealth. The key is to start now and stay consistent. Time in the market beats timing the market!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="text-lg h-14 px-8">
                  <FaArrowLeft className="mr-2" />
                  Back
                </Button>
                <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-lg h-14 px-8">
                  Continue to Trading Basics
                  <FaArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Trading Basics */}
          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Master Trading Basics</h2>
                <p className="text-lg text-gray-600">Three simple rules that separate winners from losers</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>The Golden Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { rule: 'Rule 1: Never invest borrowed money', detail: 'Only invest what you can afford to lose' },
                      { rule: 'Rule 2: Diversify your portfolio', detail: 'Don\'t put all eggs in one basket' },
                      { rule: 'Rule 3: Research before you invest', detail: 'Understand what you\'re buying' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.rule}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Risk Assessment</CardTitle>
                  <p className="text-sm text-gray-600">Answer these questions to discover your investor style</p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <QuizQuestion
                    question="1. If your investment drops 20%, what would you do?"
                    options={[
                      { value: 'hold', label: 'Hold and wait for recovery - markets always bounce back' },
                      { value: 'sell_some', label: 'Sell some to cut losses, keep some for recovery' },
                      { value: 'sell_all', label: 'Sell everything immediately to prevent further loss' },
                    ]}
                    selected={financeData.quizAnswers.q1}
                    onSelect={(value) =>
                      setFinanceData((prev) => ({
                        ...prev,
                        quizAnswers: { ...prev.quizAnswers, q1: value },
                      }))
                    }
                  />

                  <QuizQuestion
                    question="2. What's your ideal investment timeline?"
                    options={[
                      { value: 'longterm', label: '10+ years - I\'m building long-term wealth' },
                      { value: 'medium', label: '3-5 years - I have medium-term goals' },
                      { value: 'shortterm', label: 'Less than 1 year - I want quick returns' },
                    ]}
                    selected={financeData.quizAnswers.q2}
                    onSelect={(value) =>
                      setFinanceData((prev) => ({
                        ...prev,
                        quizAnswers: { ...prev.quizAnswers, q2: value },
                      }))
                    }
                  />

                  <QuizQuestion
                    question="3. How do you make investment decisions?"
                    options={[
                      { value: 'research', label: 'Deep research and fundamental analysis' },
                      { value: 'tips', label: 'Expert tips and market trends' },
                      { value: 'hunch', label: 'Gut feeling and quick opportunities' },
                    ]}
                    selected={financeData.quizAnswers.q3}
                    onSelect={(value) =>
                      setFinanceData((prev) => ({
                        ...prev,
                        quizAnswers: { ...prev.quizAnswers, q3: value },
                      }))
                    }
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="text-lg h-14 px-8">
                  <FaArrowLeft className="mr-2" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!financeData.quizAnswers.q1 || !financeData.quizAnswers.q2 || !financeData.quizAnswers.q3}
                  className="bg-emerald-600 hover:bg-emerald-700 text-lg h-14 px-8"
                >
                  See My Plan
                  <FaArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Your Plan */}
          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Financial Warrior Plan</h2>
                <p className="text-lg text-gray-600">You've completed your journey - here's your personalized roadmap</p>
              </div>

              {/* Investor Style Badge */}
              <div className="text-center">
                <Badge className="text-lg px-6 py-3 bg-emerald-600">
                  <FaCheckCircle className="mr-2" />
                  {financeData.investorStyle}
                </Badge>
              </div>

              {/* Summary Card */}
              <Card className="border-2 border-emerald-200">
                <CardHeader className="bg-emerald-50">
                  <CardTitle className="text-2xl">Your Financial Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600">Monthly Income</div>
                        <div className="text-2xl font-bold text-gray-900">₹{financeData.monthlyIncome.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Monthly Bills</div>
                        <div className="text-2xl font-bold text-gray-900">₹{financeData.monthlyBills.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Monthly Surplus</div>
                        <div className="text-2xl font-bold text-emerald-600">₹{surplus.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600">Emergency Fund Target</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ₹{(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">{financeData.emergencyMonths} months of expenses</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Monthly SIP</div>
                        <div className="text-2xl font-bold text-emerald-600">₹{financeData.monthlySIP.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Investment Horizon</div>
                        <div className="text-2xl font-bold text-gray-900">{financeData.investmentYears} years</div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-200">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Projected Wealth in {financeData.investmentYears} years</div>
                      <div className="text-4xl font-bold text-emerald-700">
                        ₹
                        {Math.round(
                          financeData.monthlySIP *
                            (((Math.pow(1 + 0.12 / 12, 12 * financeData.investmentYears) - 1) / (0.12 / 12)))
                        ).toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Based on 12% annual returns</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle>Safety Net Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Health Insurance', checked: financeData.hasHealthInsurance },
                      { label: 'Life Insurance', checked: financeData.hasLifeInsurance },
                      { label: 'Term Insurance', checked: financeData.hasTermInsurance },
                      { label: 'Emergency Fund Plan', checked: financeData.emergencyMonths >= 6 },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          {item.checked && <FaCheckCircle className="text-white" size={14} />}
                        </div>
                        <span className={item.checked ? 'text-gray-900' : 'text-gray-500'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Next Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Next 3 Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      `Set up automatic monthly SIP of ₹${financeData.monthlySIP.toLocaleString('en-IN')}`,
                      `Build emergency fund of ₹${(financeData.monthlyBills * financeData.emergencyMonths).toLocaleString('en-IN')}`,
                      `Review and optimize monthly expenses to increase savings`,
                    ].map((action, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <FaPlay className="text-white" size={12} />
                        </div>
                        <div className="flex-1 text-gray-900">{action}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={generatePDF} size="lg" variant="outline" className="h-14">
                  <FaDownload className="mr-2" />
                  Download Plan
                </Button>
                <Button onClick={sharePlan} size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-14">
                  <FaShare className="mr-2" />
                  Share Success
                </Button>
              </div>

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setCurrentStep(4)} className="text-lg h-14 px-8">
                  <FaArrowLeft className="mr-2" />
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Help Button */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg z-50"
            size="icon"
          >
            <FaComments size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[400px] flex flex-col p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>Financial Coach</SheetTitle>
            <p className="text-sm text-gray-600">Ask me anything about your finances!</p>
          </SheetHeader>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <FaLightbulb className="mx-auto mb-4 text-emerald-600" size={32} />
                  <p className="mb-4">Start a conversation or get help for this step</p>
                  <Button onClick={getContextualHelp} variant="outline" size="sm">
                    Get Help with Step {currentStep}
                  </Button>
                </div>
              )}

              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendChatMessage(chatInput)
              }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={chatLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={!chatInput.trim() || chatLoading} size="icon">
                <FaPlay />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
