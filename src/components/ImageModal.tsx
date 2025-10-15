"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  alt,
  title,
}: ImageModalProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset image loading state when modal opens with new image
  useEffect(() => {
    if (isOpen) {
      setImageLoading(true);
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Content */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-12 -right-2 text-white hover:text-gray-300 transition-colors z-20 p-2 bg-black/50 rounded-full"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image Container */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="relative flex items-center justify-center bg-gray-900 min-h-[300px]">
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}
            <Image
              src={imageUrl}
              alt={alt}
              width={800}
              height={600}
              className={`max-w-[90vw] max-h-[calc(90vh-120px)] w-auto h-auto object-contain transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              sizes="90vw"
              style={{ maxWidth: '90vw', maxHeight: 'calc(90vh - 120px)' }}
            />
          </div>

          {/* Title */}
          <div className="p-4 bg-white">
            <h3 className="text-xl font-bold text-black text-center">
              {title}
            </h3>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
