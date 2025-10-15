'use client'

export default function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="h-10 bg-gray-200 rounded-lg w-64 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Search and Filter Skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="sm:w-48">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Results Count Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Menu Items Grid Skeleton */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <MenuItemCardSkeleton key={index} />
          ))}
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="h-4 bg-gray-200 rounded w-80 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

function MenuItemCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse relative">
        {/* Price Badge Skeleton */}
        <div className="absolute top-4 right-4">
          <div className="bg-gray-300 rounded-full w-16 h-8 animate-pulse"></div>
        </div>
        {/* Cuisine Badge Skeleton */}
        <div className="absolute top-4 left-4">
          <div className="bg-gray-300 rounded-full w-20 h-8 animate-pulse"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Title Skeleton */}
        <div className="mb-3">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>

        {/* Ingredients Skeleton */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}