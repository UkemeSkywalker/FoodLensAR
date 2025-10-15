'use client'

import { useState, useEffect } from 'react'
import { MenuItem } from '@/types'

interface MenuItemFormProps {
  menuItem?: MenuItem | null
  onSubmit: (data: MenuItemFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export interface MenuItemFormData {
  name: string
  price: string
  ingredients: string[]
  description: string
  cuisine: string
}

export default function MenuItemForm({ menuItem, onSubmit, onCancel, isSubmitting }: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    price: '',
    ingredients: [],
    description: '',
    cuisine: ''
  })
  const [ingredientInput, setIngredientInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form when editing
  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        price: menuItem.price.toString(),
        ingredients: menuItem.ingredients || [],
        description: menuItem.description || '',
        cuisine: menuItem.cuisine || ''
      })
    }
  }, [menuItem])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required'
    } else {
      const price = parseFloat(formData.price)
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Price must be a valid positive number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const addIngredient = () => {
    const ingredient = ingredientInput.trim()
    if (ingredient && !formData.ingredients.includes(ingredient)) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredient]
      }))
      setIngredientInput('')
    }
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const handleIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">
            {menuItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dish Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black ${
                errors.name ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="e.g., Margherita Pizza"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black ${
                  errors.price ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-black"
              rows={3}
              placeholder="Describe your dish..."
              disabled={isSubmitting}
            />
          </div>

          {/* Cuisine */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cuisine Type
            </label>
            <select
              value={formData.cuisine}
              onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
              disabled={isSubmitting}
            >
              <option value="">Select cuisine type (optional)</option>
              <option value="American">American</option>
              <option value="Italian">Italian</option>
              <option value="Mexican">Mexican</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Indian">Indian</option>
              <option value="French">French</option>
              <option value="Thai">Thai</option>
              <option value="Mediterranean">Mediterranean</option>
              <option value="Greek">Greek</option>
              <option value="Korean">Korean</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Spanish">Spanish</option>
              <option value="German">German</option>
              <option value="British">British</option>
              <option value="Middle Eastern">Middle Eastern</option>
              <option value="Caribbean">Caribbean</option>
              <option value="African">African</option>
              <option value="Fusion">Fusion</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Dessert">Dessert</option>
              <option value="Seafood">Seafood</option>
              <option value="BBQ">BBQ</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ingredients
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyPress={handleIngredientKeyPress}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                placeholder="Add ingredient..."
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={addIngredient}
                className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={isSubmitting || !ingredientInput.trim()}
              >
                Add
              </button>
            </div>
            {formData.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                  >
                    {ingredient}
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="ml-2 w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
                      disabled={isSubmitting}
                    >
                      <svg className="w-2 h-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (menuItem ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}