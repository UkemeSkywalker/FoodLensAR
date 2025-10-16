import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-bold text-white">Food Lens</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/auth/login"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main 
        className="pt-32 pb-20 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/generated-image-1760562093144.webp')",
        }}
      >
        {/* Background overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
              AI-Powered
              <span className="block text-red-400">Restaurant</span>
              <span className="block text-gray-200">Platform</span>
            </h1>

            <p className="text-xl text-gray-100 mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform your restaurant menu with automatically generated augumented reality food
              experiences and intelligent AI agent advisory. The future of restaurant
              technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-600 transition-colors shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-white/30 text-white bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 hover:border-white/50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-red-100 transition-colors">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                AI Image Generation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically generate stunning, professional food images for
                your menu items using advanced AI technology.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-100 transition-colors">
                <svg
                  className="w-8 h-8 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Smart Food Advisory
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Intelligent AI assistant that answers customer questions about
                dishes, ingredients, and dietary preferences.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-800 transition-colors">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Voice Responses
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Natural voice synthesis provides audio responses for enhanced
                accessibility and customer experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-black mb-4">10x</div>
              <div className="text-gray-600 text-lg">Faster Menu Updates</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-red-500 mb-4">95%</div>
              <div className="text-gray-600 text-lg">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-black mb-4">24/7</div>
              <div className="text-gray-600 text-lg">
                AI Assistant Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="text-gray-600 font-medium">Food Lens</span>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Advanced AI Technology
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
