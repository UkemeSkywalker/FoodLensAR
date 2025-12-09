'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types'
import { ImageModal } from '@/components'

interface CustomerMenuItemCardProps {
  menuItem: MenuItem
  viewMode?: 'grid' | 'list'
  onAskAI?: (menuItem: MenuItem) => void
}

export default function CustomerMenuItemCard({ menuItem, viewMode = 'grid', onAskAI }: CustomerMenuItemCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isClickDisabled, setIsClickDisabled] = useState(false)

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Prevent rapid clicking
    if (isClickDisabled) return
    
    setIsClickDisabled(true)
    setTimeout(() => setIsClickDisabled(false), 300)
    
    if (menuItem.image_url && !imageError) {
      setShowImageModal(true)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  const handleCloseModal = () => {
    setShowImageModal(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
        <div className="flex">
          {/* Image Section - List View */}
          <div 
            className="w-32 h-32 bg-gray-50 relative overflow-hidden flex-shrink-0"
            onClick={handleImageClick}
          >
            {menuItem.image_url && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  </div>
                )}
                <Image
                  src={menuItem.image_url}
                  alt={menuItem.name}
                  fill
                  className={`object-cover transition-all duration-500 group-hover:scale-110 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true)
                    setImageLoading(false)
                  }}
                  sizes="128px"
                  unoptimized={true}
                  loading="lazy"
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Content Section - List View */}
          <div className="flex-1 p-4 flex justify-between">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-black group-hover:text-red-600 transition-colors">
                  {menuItem.name}
                </h3>
                <div className="flex items-center space-x-2 ml-4">
                  {menuItem.cuisine && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                      {menuItem.cuisine}
                    </span>
                  )}
                  <span className="text-xl font-bold text-red-500">{formatPrice(menuItem.price)}</span>
                </div>
              </div>
              
              {menuItem.description && (
                <p className={`text-gray-600 text-sm leading-relaxed mb-2 ${
                  isExpanded ? '' : 'line-clamp-2'
                }`}>
                  {menuItem.description}
                </p>
              )}

              {menuItem.ingredients && menuItem.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {(isExpanded ? menuItem.ingredients : menuItem.ingredients.slice(0, 3)).map((ingredient, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      {ingredient}
                    </span>
                  ))}
                  {!isExpanded && menuItem.ingredients.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsExpanded(true)
                      }}
                      className="inline-block text-red-500 text-xs px-2 py-1 font-medium hover:text-red-600 transition-colors"
                    >
                      +{menuItem.ingredients.length - 3}
                    </button>
                  )}
                </div>
              )}

              {/* Ask AI Button for List View */}
              {onAskAI && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAskAI(menuItem)
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Ask AI</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 group cursor-pointer">
      {/* Image Section */}
      <div 
        className="aspect-square bg-gray-50 relative overflow-hidden"
        onClick={handleImageClick}
      >
        {menuItem.image_url && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}
            <Image
              src={menuItem.image_url}
              alt={menuItem.name}
              fill
              className={`object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              unoptimized={true}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400 font-medium">Image Coming Soon</p>
            </div>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
            <span className="text-lg font-bold text-red-500">{formatPrice(menuItem.price)}</span>
          </div>
        </div>

        {/* Cuisine Badge */}
        {menuItem.cuisine && (
          <div className="absolute top-4 left-4">
            <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">{menuItem.cuisine}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-black mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
            {menuItem.name}
          </h3>
          
          {/* Description */}
          {menuItem.description && (
            <div>
              <p className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${
                isExpanded ? '' : 'line-clamp-3'
              }`}>
                {menuItem.description}
              </p>
              {menuItem.description.length > 150 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                  className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors mt-1"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Ingredients */}
        {menuItem.ingredients && menuItem.ingredients.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {(isExpanded ? menuItem.ingredients : menuItem.ingredients.slice(0, 4)).map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                  title={`Contains ${ingredient}`}
                >
                  {ingredient}
                </span>
              ))}
              {!isExpanded && menuItem.ingredients.length > 4 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(true)
                  }}
                  className="inline-block text-red-500 text-xs px-3 py-1 font-medium hover:text-red-600 transition-colors"
                >
                  +{menuItem.ingredients.length - 4} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {onAskAI && (
          <div className="mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAskAI(menuItem)
              }}
              className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Ask AI About This Dish</span>
            </button>
          </div>
        )}

        {/* Footer with subtle details */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
          <span>Added {new Date(menuItem.created_at).toLocaleDateString()}</span>
          {menuItem.image_generation_status === 'completed' && menuItem.image_url && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>AI Generated</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {/* Click to view indicator */}
      {menuItem.image_url && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {menuItem.image_url && !imageError && (
        <ImageModal
          isOpen={showImageModal}
          onClose={handleCloseModal}
          imageUrl={menuItem.image_url}
          alt={menuItem.name}
          title={menuItem.name}
        />
      )}
    </div>
  )
}