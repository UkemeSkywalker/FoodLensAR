import { supabase } from './supabase'
import type { Restaurant, MenuItem } from '@/types'

// Restaurant operations
export const restaurantService = {
  async create(data: { name: string; email: string }): Promise<Restaurant | null> {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert(data)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating restaurant:', error)
      return null
    }
    
    return restaurant
  },

  async getByEmail(email: string): Promise<Restaurant | null> {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.error('Error fetching restaurant:', error)
      return null
    }
    
    return restaurant
  },

  async update(id: string, data: Partial<Restaurant>): Promise<Restaurant | null> {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating restaurant:', error)
      return null
    }
    
    return restaurant
  }
}

// Menu item operations
export const menuItemService = {
  async create(data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem | null> {
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .insert({
        ...data,
        image_generation_status: 'pending' // Set initial status
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating menu item:', error)
      return null
    }
    
    return menuItem
  },

  async createWithImageGeneration(
    data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'image_url' | 'image_generation_status'>,
    generateImage: boolean = true
  ): Promise<MenuItem | null> {
    // First create the menu item
    const menuItem = await this.create({
      ...data,
      image_generation_status: generateImage ? 'pending' : 'completed'
    })
    
    if (!menuItem || !generateImage) {
      return menuItem
    }

    // Trigger image generation in the background
    this.generateImageForItem(menuItem.id, menuItem.name, menuItem.description)
      .catch(error => {
        console.error('Background image generation failed:', error)
      })
    
    return menuItem
  },

  async generateImageForItem(
    itemId: string,
    itemName: string,
    description?: string,
    cuisine?: string
  ): Promise<void> {
    try {
      // Update status to generating
      await this.update(itemId, { image_generation_status: 'generating' })

      // Call the image generation API
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemName,
          description,
          cuisine,
          menuItemId: itemId
        })
      })

      const result = await response.json()

      if (result.success && result.imageUrl) {
        // Update with generated image
        await this.update(itemId, {
          image_url: result.imageUrl,
          image_generation_status: 'completed'
        })
      } else {
        // Mark as failed
        await this.update(itemId, { image_generation_status: 'failed' })
        console.error('Image generation failed:', result.error)
      }
    } catch (error) {
      // Mark as failed
      await this.update(itemId, { image_generation_status: 'failed' })
      console.error('Error in image generation process:', error)
    }
  },

  async getByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching menu items:', error)
      return []
    }
    
    return menuItems || []
  },

  async update(id: string, data: Partial<MenuItem>): Promise<MenuItem | null> {
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating menu item:', error)
      return null
    }
    
    return menuItem
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting menu item:', error)
      return false
    }
    
    return true
  }
}

// Database health check
export const databaseHealth = {
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('restaurants')
        .select('count')
        .limit(1)
      
      if (error) {
        return { connected: false, error: error.message }
      }
      
      return { connected: true }
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  async checkTables(): Promise<{ tables: string[]; error?: string }> {
    try {
      const tables = []
      
      // Test restaurants table
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .select('count')
        .limit(1)
      
      if (!restaurantError) {
        tables.push('restaurants')
      }
      
      // Test menu_items table
      const { error: menuItemError } = await supabase
        .from('menu_items')
        .select('count')
        .limit(1)
      
      if (!menuItemError) {
        tables.push('menu_items')
      }
      
      return { 
        tables,
        error: tables.length === 0 ? 'No accessible tables found' : undefined
      }
    } catch (error) {
      return { 
        tables: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}