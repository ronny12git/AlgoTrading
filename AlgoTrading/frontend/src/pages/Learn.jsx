import { useState } from 'react'

export default function Learn() {
  const [activeTab, setActiveTab] = useState('lessons')
  const [expandedModule, setExpandedModule] = useState(0)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [calcInputs, setCalcInputs] = useState({ portfolio: 10000, riskPercent: 2, entryPrice: 100, stopPrice: 95 })
  const [activeScenario, setActiveScenario] = useState(null)

  const modules = [
    {
      id: 1,
      title: 'Understanding Stocks',
      icon: '📈',
      completed: 0,
      lessons: [
        { title: 'What is a Stock?', content: 'A stock represents ownership in a company. When you buy stocks, you become a shareholder and own a portion of that company.' },
        { title: 'Market Basics', content: 'The stock market is where shares are bought and sold. Trading hours are 9:15 AM to 3:30 PM IST on weekdays.' },
        { title: 'Bid & Ask Price', content: 'The bid price is what buyers will pay, ask price is what sellers want. Spread = transaction cost.' }
      ]
    },
    {
      id: 2,
      title: 'Risk Management',
      icon: '🛡️',
      completed: 2,
      lessons: [
        { title: 'Position Sizing', content: 'Risk only 1-2% of your portfolio on a single trade. This protects you from significant losses.' },
        { title: 'Stop Loss & Take Profit', content: 'Set exit points before trading. Risk-reward ratio should be 1:2 minimum.' },
        { title: 'Diversification', content: 'Spread investments across multiple stocks and sectors to reduce risk.' }
      ]
    },
    {
      id: 3,
      title: 'Order Types',
      icon: '💱',
      completed: 1,
      lessons: [
        { title: 'Market Order', content: 'Buy/sell immediately at current market price. Fast execution.' },
        { title: 'Limit Order', content: 'Buy/sell only at specified price. Better price control.' },
        { title: 'Stop Loss Order', content: 'Automatically sells at specified price to limit losses.' }
      ]
    }
  ]

  const quizzes = [
    {
      id: 'stocks-101',
      title: 'Understanding Stocks Quiz',
      icon: '📈',
      questions: [
        {
          q: 'What does it mean when you own a stock?',
          options: ['You owe the company money', 'You own a part of the company', 'You lend money to the company', 'You have a debt obligation'],
          correct: 1
        },
        {
          q: 'What is the bid-ask spread?',
          options: ['Profit made from trading', 'Difference between bid and ask price', 'Stock price range', 'Daily price movement'],
          correct: 1
        },
        {
          q: 'When do Indian stock markets open?',
          options: ['8:00 AM', '9:15 AM', '10:00 AM', '9:00 AM'],
          correct: 1
        }
      ]
    },
    {
      id: 'risk-basics',
      title: 'Risk Management Quiz',
      icon: '🛡️',
      questions: [
        {
          q: 'What percentage of portfolio should you risk per trade?',
          options: ['10%', '5-10%', '1-2%', '20%'],
          correct: 2
        },
        {
          q: 'Why use a stop-loss order?',
          options: ['To maximize profits', 'To limit losses', 'To hold forever', 'To avoid taxes'],
          correct: 1
        },
        {
          q: 'Is diversification important?',
          options: ['No, focus on one stock', 'Yes, reduces overall risk', 'Only for large portfolios', 'Not really'],
          correct: 1
        }
      ]
    },
    {
      id: 'orders-101',
      title: 'Order Types Quiz',
      icon: '💱',
      questions: [
        {
          q: 'Which order executes immediately?',
          options: ['Limit Order', 'Market Order', 'Stop Loss', 'Pending Order'],
          correct: 1
        },
        {
          q: 'What is a limit order best for?',
          options: ['Fast execution', 'Price control', 'Risk reduction', 'Trend following'],
          correct: 1
        }
      ]
    }
  ]

  const scenarios = [
    {
      id: 1,
      title: 'First Trade Decision',
      situation: 'You have ₹10,000. Stock ABC is at ₹100 and trending up. What do you do?',
      options: [
        { choice: 'Buy 100 shares at market price', feedback: '⚠️ Risky! You put all eggs in one basket. Better to use 20-30% max.', good: false },
        { choice: 'Research first, buy 30-40 shares with stop loss at ₹95', feedback: '✅ Great! You sized position properly and set stop loss to limit risk.', good: true },
        { choice: 'Buy on margin (borrow money to buy more)', feedback: '❌ Too risky for beginners! Can lead to huge losses.', good: false },
        { choice: 'Wait for dip, then buy 30 shares', feedback: '✅ Good patience! But don\'t wait forever - a good buy is better than a perfect one.', good: true }
      ]
    },
    {
      id: 2,
      title: 'Loss Management',
      situation: 'You bought a stock at ₹100, but it dropped to ₹92. Your stop loss is at ₹90. What do you do?',
      options: [
        { choice: 'Hold and hope it goes back up', feedback: '❌ Hoping is not a strategy. Stick to your plan!', good: false },
        { choice: 'Add more money to average down', feedback: '⚠️ Risky! Can increase losses. Only for experienced traders.', good: false },
        { choice: 'Sell now at ₹92 to limit loss', feedback: '✅ Smart! Taking a small loss is better than a big one.', good: true },
        { choice: 'Move stop loss to ₹80 to give more room', feedback: '❌ Moving stops is emotional trading. Stick to your plan!', good: false }
      ]
    },
    {
      id: 3,
      title: 'Emotion Control',
      situation: 'Your winning trade is up 15%! Friends say "hold for 100% profit." What do you do?',
      options: [
        { choice: 'Hold until 100% profit target', feedback: '⚠️ Greed often turns winners into losers. Lock in profits!', good: false },
        { choice: 'Sell half, let half run with trailing stop', feedback: '✅ Perfect! Lock profits, reduce risk, but keep upside.', good: true },
        { choice: 'Follow friends\' advice blindly', feedback: '❌ Your plan ≠ Friends\' plan. Trade your own strategy.', good: false },
        { choice: 'Sell everything immediately', feedback: '✅ Better than holding greedily, but could miss more gains.', good: true }
      ]
    }
  ]

  const handleQuizAnswer = (questionIdx, optionIdx) => {
    setQuizAnswers({ ...quizAnswers, [questionIdx]: optionIdx })
  }

  const submitQuiz = () => {
    setShowResults(true)
  }

  const calculatePositionSize = () => {
    const riskAmount = (calcInputs.portfolio * calcInputs.riskPercent) / 100
    const priceRisk = Math.abs(calcInputs.entryPrice - calcInputs.stopPrice)
    const shares = Math.floor(riskAmount / priceRisk)
    const maxLoss = shares * priceRisk
    return { shares, riskAmount, maxLoss }
  }

  const calc = calculatePositionSize()
  const quizData = currentQuiz ? quizzes.find(q => q.id === currentQuiz) : null
  const correctAnswers = quizData ? Object.entries(quizAnswers).filter(([idx, ans]) => ans === quizData.questions[idx].correct).length : 0
  const quizScore = quizData ? Math.round((correctAnswers / quizData.questions.length) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl tracking-wider text-white">LEARNING CENTER</h2>
        <p className="text-muted text-sm mt-1">Learn by doing! Interactive lessons, quizzes, calculators & trading scenarios</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {[
          { id: 'lessons', label: '📚 Lessons', icon: '📚' },
          { id: 'quizzes', label: '🎯 Quizzes', icon: '🎯' },
          { id: 'calculators', label: '🧮 Calculators', icon: '🧮' },
          { id: 'scenarios', label: '🎬 Scenarios', icon: '🎬' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCurrentQuiz(null); setShowResults(false); setActiveScenario(null) }}
            className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LESSONS TAB */}
      {activeTab === 'lessons' && (
        <div className="space-y-3">
          {modules.map((module, idx) => (
            <div key={module.id} className="border border-border rounded-xl overflow-hidden bg-surface/50 hover:bg-surface transition-colors">
              <button
                onClick={() => setExpandedModule(expandedModule === idx ? -1 : idx)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl">{module.icon}</span>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-white">{module.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${(module.completed / module.lessons.length) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted">{module.completed}/{module.lessons.length}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-accent text-xl transition-transform ${expandedModule === idx ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {expandedModule === idx && (
                <div className="border-t border-border bg-white/2">
                  {module.lessons.map((lesson, lessonIdx) => (
                    <div key={lessonIdx} className={`px-5 py-4 ${lessonIdx !== module.lessons.length - 1 ? 'border-b border-border/50' : ''}`}>
                      <h5 className="font-semibold text-white mb-2 text-sm flex items-center gap-2">
                        {lessonIdx < module.completed ? '✅' : '📖'} {lesson.title}
                      </h5>
                      <p className="text-muted text-sm leading-relaxed">{lesson.content}</p>
                      {lessonIdx < module.completed && <span className="text-accent text-xs mt-2 block">Completed</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* QUIZZES TAB */}
      {activeTab === 'quizzes' && (
        <div className="space-y-3">
          {!currentQuiz ? (
            quizzes.map(quiz => (
              <button
                key={quiz.id}
                onClick={() => { setCurrentQuiz(quiz.id); setQuizAnswers({}); setShowResults(false) }}
                className="w-full border border-border rounded-xl p-5 text-left bg-surface/50 hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{quiz.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{quiz.title}</h4>
                    <p className="text-muted text-sm">{quiz.questions.length} questions • 5 min</p>
                  </div>
                  <span className="text-accent">→</span>
                </div>
              </button>
            ))
          ) : (
            <div className="border border-border rounded-xl bg-surface/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white text-lg">{quizData?.title}</h3>
                <button onClick={() => setCurrentQuiz(null)} className="text-muted hover:text-white">✕</button>
              </div>

              {!showResults ? (
                <div className="space-y-6">
                  {quizData?.questions.map((q, idx) => (
                    <div key={idx}>
                      <p className="font-semibold text-white mb-3">{idx + 1}. {q.q}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleQuizAnswer(idx, optIdx)}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              quizAnswers[idx] === optIdx
                                ? 'bg-accent text-black font-semibold'
                                : 'bg-white/5 text-muted hover:bg-white/10'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={submitQuiz}
                    className="w-full py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-colors mt-6"
                  >
                    Submit Quiz
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-6 bg-white/5 rounded-lg">
                    <div className="text-5xl font-bold text-accent mb-2">{quizScore}%</div>
                    <p className="text-white font-semibold">
                      {quizScore >= 80 ? '🎉 Excellent! You passed!' : quizScore >= 60 ? '👍 Good effort! Review the material.' : '📚 Keep learning!'}
                    </p>
                    <p className="text-muted text-sm mt-1">{correctAnswers}/{quizData?.questions.length} correct</p>
                  </div>
                  <div className="space-y-2">
                    {quizData?.questions.map((q, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${quizAnswers[idx] === q.correct ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                        <p className="text-sm font-semibold text-white mb-1">{idx + 1}. {q.options[quizAnswers[idx]]}</p>
                        <p className="text-xs text-muted">Correct: {q.options[q.correct]}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentQuiz(null)}
                    className="w-full py-2 bg-accent/20 text-accent font-semibold rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    Back to Quizzes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CALCULATORS TAB */}
      {activeTab === 'calculators' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Position Size Calculator */}
          <div className="border border-border rounded-xl bg-surface/50 p-6">
            <h3 className="font-semibold text-white mb-4 text-lg">📊 Position Size Calculator</h3>
            <div className="space-y-4">
              <div>
                <label className="text-muted text-sm">Total Portfolio: ₹{calcInputs.portfolio.toLocaleString()}</label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={calcInputs.portfolio}
                  onChange={(e) => setCalcInputs({ ...calcInputs, portfolio: parseInt(e.target.value) })}
                  className="w-full mt-2 accent-accent"
                />
              </div>
              <div>
                <label className="text-muted text-sm">Risk Per Trade: {calcInputs.riskPercent}%</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={calcInputs.riskPercent}
                  onChange={(e) => setCalcInputs({ ...calcInputs, riskPercent: parseFloat(e.target.value) })}
                  className="w-full mt-2 accent-accent"
                />
              </div>
              <div>
                <label className="text-muted text-sm">Entry Price: ₹</label>
                <input
                  type="number"
                  value={calcInputs.entryPrice}
                  onChange={(e) => setCalcInputs({ ...calcInputs, entryPrice: parseFloat(e.target.value) })}
                  className="w-full mt-1 bg-white/5 border border-border rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-muted text-sm">Stop Loss Price: ₹</label>
                <input
                  type="number"
                  value={calcInputs.stopPrice}
                  onChange={(e) => setCalcInputs({ ...calcInputs, stopPrice: parseFloat(e.target.value) })}
                  className="w-full mt-1 bg-white/5 border border-border rounded px-3 py-2 text-white"
                />
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Shares to Buy:</span>
                  <span className="text-white font-semibold">{calc.shares} shares</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Risk Amount:</span>
                  <span className="text-white font-semibold">₹{calc.riskAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between border-t border-accent/20 pt-2 mt-2">
                  <span className="text-muted">Max Loss:</span>
                  <span className="text-red-400 font-semibold">-₹{calc.maxLoss.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk/Reward Calculator */}
          <div className="border border-border rounded-xl bg-surface/50 p-6">
            <h3 className="font-semibold text-white mb-4 text-lg">💰 Risk/Reward Ratio</h3>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-lg p-4">
                <p className="text-muted text-sm mb-2">Entry: ₹{calcInputs.entryPrice}</p>
                <p className="text-muted text-sm mb-3">Stop Loss: ₹{calcInputs.stopPrice}</p>
                <div className="bg-white/5 rounded p-3 mb-3">
                  <p className="text-xs text-muted mb-1">Risk per share:</p>
                  <p className="text-lg font-semibold text-white">₹{(calcInputs.entryPrice - calcInputs.stopPrice).toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-muted text-sm mb-4">Recommended Take Profit (1:2 ratio):</p>
                <p className="text-2xl font-bold text-accent">₹{(calcInputs.entryPrice + (calcInputs.entryPrice - calcInputs.stopPrice) * 2).toFixed(2)}</p>
                <p className="text-xs text-muted mt-2">Potential Profit: ₹{((calcInputs.entryPrice - calcInputs.stopPrice) * 2 * calc.shares).toFixed(0)}</p>
              </div>
              <div className="text-center py-3 bg-white/5 rounded">
                <p className="text-muted text-sm">Risk/Reward Ratio</p>
                <p className="text-3xl font-bold text-accent">1 : 2</p>
                <p className="text-xs text-muted mt-1">✅ Good for trading!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIOS TAB */}
      {activeTab === 'scenarios' && (
        <div className="space-y-4">
          {!activeScenario ? (
            scenarios.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario.id)}
                className="w-full border border-border rounded-xl p-5 text-left bg-surface/50 hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎬</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{scenario.title}</h4>
                    <p className="text-muted text-sm mt-1">{scenario.situation.substring(0, 60)}...</p>
                  </div>
                  <span className="text-accent">→</span>
                </div>
              </button>
            ))
          ) : (
            <div className="border border-border rounded-xl bg-surface/50 p-6">
              {(() => {
                const scenario = scenarios.find(s => s.id === activeScenario)
                return (
                  <div>
                    <button onClick={() => setActiveScenario(null)} className="text-muted hover:text-white mb-4">← Back</button>
                    <h3 className="font-semibold text-white text-lg mb-2">{scenario.title}</h3>
                    <p className="text-white bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">{scenario.situation}</p>
                    <div className="space-y-3">
                      {scenario.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => alert(option.feedback)}
                          className="w-full text-left p-4 rounded-lg border border-border bg-white/3 hover:bg-white/5 transition-colors"
                        >
                          <p className="font-semibold text-white mb-2">{option.choice}</p>
                          <p className="text-sm text-muted">Click to see feedback →</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-accent/10 to-accent2/10 border border-accent/30 rounded-xl p-6 text-center">
        <h3 className="font-semibold text-white mb-2">Ready to Apply What You've Learned?</h3>
        <p className="text-muted text-sm mb-4">Start with small positions and practice the concepts above in real market conditions.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/market" className="px-5 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm">
            View Market
          </a>
          <a href="/portfolio" className="px-5 py-2 bg-accent2/20 text-accent2 font-semibold rounded-lg hover:bg-accent2/30 transition-colors text-sm border border-accent2/30">
            Your Portfolio
          </a>
        </div>
      </div>
    </div>
  )
}
