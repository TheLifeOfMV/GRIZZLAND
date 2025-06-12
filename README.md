# GRIZZLAND Frontend

Premium streetwear e-commerce frontend built with Next.js 14, implementing MONOCODE principles for observable, reliable, and maintainable code.

## 🚀 Quick Start (One-Command Setup)

```bash
# Clone and setup everything
git clone <repository-url>
cd GRIZZLAND
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Features

### Core Functionality ✅
- **Hero Section**: Video/image background with responsive design
- **Product Catalog**: Filtering, sorting, and grid/list views  
- **Product Details**: Color/size selection, image gallery, add to cart
- **Shopping Cart**: Persistent cart with localStorage, quantity management
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Technical Excellence
- **Observable Implementation**: Structured logging and performance monitoring
- **Error Boundaries**: Graceful failure handling with recovery options
- **Performance Monitoring**: Real-time metrics and optimization alerts
- **TypeScript**: Strict typing with comprehensive interfaces
- **Accessibility**: WCAG 2.1 AA compliance

## 🛠 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + useReducer for cart
- **TypeScript**: Strict mode with path mapping
- **Icons**: Heroicons for consistent iconography
- **Performance**: Built-in monitoring and optimization

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx          # Homepage with hero and featured products
│   └── products/         # Product pages
├── components/           # Reusable components
│   ├── features/        # Business logic components
│   ├── layout/          # Layout components
│   └── ui/              # UI primitives
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and data
└── types/               # TypeScript definitions
```

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- npm 8+

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Quality Assurance
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm run check        # Run both lint and type-check

# Utilities
npm run setup        # One-command development setup
npm run clean        # Clean build artifacts
npm run analyze      # Bundle analysis
```

### Observable Implementation

The codebase implements observable patterns with structured logging:

```typescript
// Performance monitoring
const { timeFunction } = usePerformanceMonitor('ProductCard');

// Structured error logging
console.error('Cart: Operation failed', {
  operation: 'addToCart',
  productId,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

### Error Handling

Following "Fail Fast, Fail Loud" principle:

- **Input Validation**: All user inputs validated at component boundaries
- **Error Boundaries**: Graceful fallbacks with recovery options
- **Performance Alerts**: Automatic warnings for slow operations
- **Type Safety**: Comprehensive TypeScript coverage

## 🎨 Design System

### Colors
- **Primary Background**: `#1a2c28` (Dark green)
- **Primary Text**: `#ffffff` (White)
- **Card Background**: `#ffffff` (White)
- **Card Text**: `#1a2c28` (Dark green)

### Typography
- **Font Family**: Inter
- **Scale**: Responsive typography with uppercase tracking
- **Weights**: 300-900 range for hierarchy

### Components
- **Buttons**: Primary and secondary variants with hover states
- **Cards**: Product cards with hover effects and quick actions
- **Navigation**: Mobile-responsive with accessibility features

## 🚦 Performance

### Monitoring
- **Core Web Vitals**: Automatic tracking of paint and navigation timing
- **Component Performance**: Custom hooks for operation timing
- **Bundle Analysis**: Use `npm run analyze` for bundle inspection

### Optimization
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Efficient caching strategies for static assets

## ♿ Accessibility

- **WCAG 2.1 AA**: Compliant design and implementation
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Semantic HTML and ARIA attributes
- **Focus Management**: Visible focus indicators and logical tab order

## 🧪 Testing Strategy

### Current Implementation
- **Type Safety**: Comprehensive TypeScript coverage
- **Linting**: ESLint with accessibility rules
- **Performance**: Built-in monitoring and alerting

### Future Enhancements
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright for user flows
- **Visual Regression**: Chromatic for component testing

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
```bash
# Required for production
NEXT_PUBLIC_APP_NAME=GRIZZLAND
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_GA_ID=your-analytics-id
```

### Platform Deployment
- **Vercel**: Optimized for Next.js (recommended)
- **Netlify**: Static export support
- **AWS/GCP**: Container or serverless deployment

## 📊 Monitoring & Analytics

### Observable Implementation Logs
```javascript
// Development console
- Component lifecycle events
- Performance metrics
- Error tracking
- User interaction events

// Production monitoring (future)
- Error aggregation service
- Performance monitoring
- User analytics
```

## 🔮 Next Steps

### Phase 2 Features
- [ ] User authentication
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Checkout and payment processing
- [ ] Order management
- [ ] Search functionality

### Technical Improvements
- [ ] Unit and integration testing
- [ ] API integration
- [ ] Advanced caching strategies
- [ ] Internationalization (i18n)
- [ ] Progressive Web App (PWA)

## 🤝 Contributing

1. **Code Style**: Follow existing patterns and MONOCODE principles
2. **Logging**: Use structured logging for all state changes
3. **Error Handling**: Implement explicit error handling with context
4. **Performance**: Monitor and optimize for observable bottlenecks
5. **Accessibility**: Maintain WCAG 2.1 AA compliance

## 📝 License

This project is proprietary to GRIZZLAND. All rights reserved.

---

**Built with MONOCODE principles**: Observable Implementation, Explicit Error Handling, Dependency Transparency, and Progressive Construction.

For questions or support, contact the development team. 