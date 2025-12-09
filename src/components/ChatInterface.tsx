'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MenuItem, AIQueryRequest, AIQueryResponse } from '@/types'
import { AudioPlayer } from '@/components'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  dishContext?: {
    itemId: string
    name: string
  }
  audioUrl?: string
  isLoading?: boolean
}

interface ChatInterfaceProps {
  restaurantId: string
  menuItems: MenuItem[]
  className?: string
  initialSelectedDish?: MenuItem
}

export default function ChatInterface({ restaurantId, menuItems, className = '', initialSelectedDish }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: "Hi! I'm your AI food advisor. I can help you with nutritional information, dietary advice, and answer questions about our menu items. What would you like to know?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(initialSelectedDish || null)
  const [showDishSelector, setShowDishSelector] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      dishContext: selectedDish ? {
        itemId: selectedDish.id,
        name: selectedDish.name
      } : undefined
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    
    // Clear input and show loading
    const query = inputValue.trim()
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    // Add loading message
    const loadingMessage: Message = {
      id: generateMessageId(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      const requestBody: AIQueryRequest = {
        query,
        restaurantId,
        dishContext: selectedDish ? {
          itemId: selectedDish.id,
          name: selectedDish.name
        } : undefined
      }

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: AIQueryResponse = await response.json()

      // Remove loading message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingMessage.id)
        const aiMessage: Message = {
          id: generateMessageId(),
          type: 'ai',
          content: data.textResponse || 'I apologize, but I encountered an issue processing your request.',
          timestamp: new Date(),
          audioUrl: data.audioUrl
        }
        return [...filtered, aiMessage]
      })

    } catch (error) {
      console.error('Chat error:', error)
      
      // Remove loading message and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingMessage.id)
        const errorMessage: Message = {
          id: generateMessageId(),
          type: 'ai',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        }
        return [...filtered, errorMessage]
      })
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const selectDish = (dish: MenuItem) => {
    setSelectedDish(dish)
    setShowDishSelector(false)
    inputRef.current?.focus()
  }

  const clearDishSelection = () => {
    setSelectedDish(null)
    inputRef.current?.focus()
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Food Advisor</h3>
              <p className="text-sm text-gray-500">
                {isTyping ? 'Typing...' : 'Ask me about nutrition, ingredients, or dietary advice'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDishSelector(!showDishSelector)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedDish 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {selectedDish ? `About: ${selectedDish.name}` : 'Select Dish'}
          </button>
        </div>

        {/* Selected Dish Context */}
        {selectedDish && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-red-900">{selectedDish.name}</p>
                  <p className="text-sm text-red-700">${selectedDish.price.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={clearDishSelection}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Dish Selector Dropdown */}
        {showDishSelector && (
          <div className="mt-3 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Select a dish to ask specific questions:</p>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectDish(item)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-sm text-gray-500">${item.price.toFixed(2)}</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{item.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Message Bubble */}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                } ${message.isLoading ? 'animate-pulse' : ''}`}
              >
                {message.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {/* Message Metadata */}
              <div className={`flex items-center mt-1 space-x-2 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                {message.dishContext && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    About: {message.dishContext.name}
                  </span>
                )}
              </div>

              {/* Audio Player for AI responses */}
              {message.type === 'ai' && message.audioUrl && !message.isLoading && (
                <div className="mt-3">
                  <AudioPlayer
                    text={message.content}
                    className="max-w-full"
                    showText={false}
                    useStreaming={true}
                  />
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'user' 
                ? 'bg-red-500 text-white order-1 ml-3' 
                : 'bg-gray-300 text-gray-600 order-2 mr-3'
            }`}>
              {message.type === 'user' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="flex-shrink-0 border-t border-gray-100 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedDish ? `Ask about ${selectedDish.name}...` : "Ask about nutrition, ingredients, or dietary advice..."}
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-900 placeholder-gray-500"
                maxLength={500}
              />
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {inputValue.length}/500
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-12 h-12 bg-red-500 text-white rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>

        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "What's the healthiest option?",
            "Any vegetarian dishes?",
            "Tell me about allergens",
            "What's your most popular item?"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isLoading) {
                  setInputValue(suggestion)
                  inputRef.current?.focus()
                }
              }}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}