import '@/styles/globals.css'
import { useEffect } from 'react'

// Performance monitoring
const reportWebVitals = (metric) => {
  if (process.env.NODE_ENV === 'production') {
    // You can send these metrics to your analytics service
    console.log(metric)
  }
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Optimize font loading
    if (typeof window !== 'undefined') {
      // Preload critical fonts
      const fontLinks = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
      ]
      
      fontLinks.forEach(href => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'style'
        link.href = href
        document.head.appendChild(link)
        
        setTimeout(() => {
          link.rel = 'stylesheet'
        }, 0)
      })

      // Optimize viewport for mobile
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      }

      // Add performance observer for monitoring
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              reportWebVitals({
                name: 'LCP',
                value: entry.startTime,
                id: entry.id,
              })
            }
            if (entry.entryType === 'first-input') {
              reportWebVitals({
                name: 'FID',
                value: entry.processingStart - entry.startTime,
                id: entry.id,
              })
            }
          })
        })
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] })
        } catch (e) {
          // Ignore if not supported
        }
      }

      // Measure and report CLS
      let clsValue = 0
      let clsEntries = []
      let sessionValue = 0
      let sessionEntries = []

      const getCLS = (onReport) => {
        if ('PerformanceObserver' in window && 'LayoutShift' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                const firstSessionEntry = sessionEntries[0]
                const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

                if (sessionValue &&
                    entry.startTime - lastSessionEntry.startTime < 1000 &&
                    entry.startTime - firstSessionEntry.startTime < 5000) {
                  sessionValue += entry.value
                  sessionEntries.push(entry)
                } else {
                  sessionValue = entry.value
                  sessionEntries = [entry]
                }

                if (sessionValue > clsValue) {
                  clsValue = sessionValue
                  clsEntries = sessionEntries
                  reportWebVitals({
                    name: 'CLS',
                    value: clsValue,
                    entries: clsEntries,
                  })
                }
              }
            }
          })

          try {
            observer.observe({ entryTypes: ['layout-shift'] })
          } catch (e) {
            // Ignore if not supported
          }
        }
      }

      getCLS()
    }
  }, [])

  return <Component {...pageProps} />
}

export { reportWebVitals }
