'use client'

import { useState } from 'react'
import { ChatInterface } from '@/components'
import { MenuItem } from '@/types'

// Mock menu items for testing
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    restaurant_id: 'test-restaurant',
    name: 'Margherita Pizza',
    price: 12.99,
    ingredients: ['tomato sauce', 'mozzarella', 'basil'],
    description: 'Classic Italian pizza with fresh tomatoes, mozzarella cheese, and basil leaves',
    cuisine: 'Italian',
    image_url: 'https://example.com/pizza.jpg',
    image_generation_status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    restaurant_id: 'test-restaurant',
    name: 'Caesar Salad',
    price: 8.99,
    ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'caesar dressing'],
    description: 'Fresh romaine lettuce with parmesan cheese, croutons, and caesar dressing',
    cuisine: 'American',
    image_url: 'https://example.com/salad.jpg',
    image_generation_status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export default function ChatTestPage() {
  const [showChat, setShowChat] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Interface Test</h1>
          <p className="text-gray-600">Test the AI chat interface functionality</p>
          <button
            onClick={() => setShowChat(!showChat)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>

        {showChat && (
          <div className="bg-white rounded-2xl shadow-lg h-[600px] overflow-hidden">
            <ChatInterface
              restaurantId="test-restaurant"
              menuItems={mockMenuItems}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}