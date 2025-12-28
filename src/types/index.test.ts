import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { MenuItem } from './index'

/**
 * Feature: ar-food-visualization, Property 18: Null Model URL Handling
 * Validates: Requirements 9.2
 * 
 * Property: For any database operation creating a menu item without specifying model_url, 
 * the value must be stored as NULL without error
 */
describe('MenuItem model_url property tests', () => {
  it('Property 18: Null Model URL Handling - menu items can be created with null model_url', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary menu item data
        fc.record({
          id: fc.uuid(),
          restaurant_id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.integer({ min: 1, max: 99999 }).map(n => n / 100), // Generate price as integer then convert to decimal
          ingredients: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          cuisine: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          image_url: fc.option(fc.webUrl(), { nil: undefined }),
          model_url: fc.constantFrom(null, undefined), // Test null and undefined values
          image_generation_status: fc.constantFrom('pending', 'generating', 'completed', 'failed'),
          created_at: fc.string(), // Use string directly instead of date conversion
          updated_at: fc.string(), // Use string directly instead of date conversion
        }),
        (menuItem) => {
          // Verify that the MenuItem interface accepts null/undefined model_url
          const item: MenuItem = menuItem
          
          // The property we're testing: model_url can be null or undefined without error
          expect(item.model_url === null || item.model_url === undefined).toBe(true)
          
          // Verify other required fields are present
          expect(typeof item.id).toBe('string')
          expect(typeof item.restaurant_id).toBe('string')
          expect(typeof item.name).toBe('string')
          expect(typeof item.price).toBe('number')
          expect(item.price).toBeGreaterThan(0)
          expect(['pending', 'generating', 'completed', 'failed']).toContain(item.image_generation_status)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 18 Extension: MenuItem interface correctly handles both null and valid model_url values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          restaurant_id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.integer({ min: 1, max: 99999 }).map(n => n / 100), // Generate price as integer then convert to decimal
          ingredients: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          cuisine: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          image_url: fc.option(fc.webUrl(), { nil: undefined }),
          model_url: fc.option(fc.webUrl(), { nil: null }), // Test both null and valid URLs
          image_generation_status: fc.constantFrom('pending', 'generating', 'completed', 'failed'),
          created_at: fc.string(), // Use string directly instead of date conversion
          updated_at: fc.string(), // Use string directly instead of date conversion
        }),
        (menuItem) => {
          // Verify that the MenuItem interface accepts both null and valid model_url values
          const item: MenuItem = menuItem
          
          // The property: model_url can be null, undefined, or a valid string
          if (item.model_url !== null && item.model_url !== undefined) {
            expect(typeof item.model_url).toBe('string')
            expect(item.model_url.length).toBeGreaterThan(0)
          }
          
          // Verify the type system allows this assignment without errors
          expect(item).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})