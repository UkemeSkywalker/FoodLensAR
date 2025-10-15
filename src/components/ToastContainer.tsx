'use client'

import { useState, useCallback } from 'react'
import Toast, { ToastProps } from './Toast'

export interface ToastData {
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

export interface ToastContextType {
  showToast: (toast: ToastData) => void
}

// Extend the Window interface to include our showToast function
declare global {
  interface Window {
    showToast?: (toast: ToastData) => void
  }
}

let toastId = 0

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((toast: ToastData) => {
    const id = `toast-${++toastId}`
    const newToast: ToastProps = {
      id,
      ...toast,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }, [removeToast])

  // Make showToast available globally
  if (typeof window !== 'undefined') {
    window.showToast = showToast
  }

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

// Global toast function
export const toast = {
  success: (title: string, message?: string) => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast({ type: 'success', title, message })
    }
  },
  error: (title: string, message?: string) => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast({ type: 'error', title, message })
    }
  },
  info: (title: string, message?: string) => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast({ type: 'info', title, message })
    }
  },
  warning: (title: string, message?: string) => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast({ type: 'warning', title, message })
    }
  }
}