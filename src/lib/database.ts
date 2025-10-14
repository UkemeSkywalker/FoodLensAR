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
      .insert(data)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating menu item:', error)
      return null
    }
    
    return menuItem
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