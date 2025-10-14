'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types'

interface MenuItemCardProps {
  menuItem: MenuItem
  onEdit: (menuItem: MenuItem) => void
  onDelete: (itemId: string) => void
  isDeleting?: boolean
}

export default function MenuItemCard({ menuItem, onEdit, onDelete, isDeleting }: MenuItemCardProps) {
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'generating':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Image Ready'
      case 'generating':
        return 'Generating...'
      case 'failed':
        return 'Generation Failed'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <div className="aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden relative">
        {menuItem.image_url && !imageError ? (
          <Image
            src={menuItem.image_url}
            alt={menuItem.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400">No image</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-black line-clamp-2">{menuItem.name}</h3>
          <span className="text-lg font-bold text-red-500 ml-2">{formatPrice(menuItem.price)}</span>
        </div>

        {/* Description */}
        {menuItem.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{menuItem.description}</p>
        )}

        {/* Ingredients */}
        {menuItem.ingredients && menuItem.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {menuItem.ingredients.slice(0, 3).map((ingredient, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {ingredient}
              </span>
            ))}
            {menuItem.ingredients.length > 3 && (
              <span className="inline-block text-gray-400 text-xs px-2 py-1">
                +{menuItem.ingredients.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(menuItem.image_generation_status)}`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
              menuItem.image_generation_status === 'generating' ? 'animate-pulse bg-current' : 'bg-current'
            }`}></div>
            {getStatusText(menuItem.image_generation_status)}
          </span>
          
          <div className="text-xs text-gray-400">
            {new Date(menuItem.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => onEdit(menuItem)}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(menuItem.id)}
            disabled={isDeleting}
            className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}