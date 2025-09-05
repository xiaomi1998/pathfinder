# Pathfinder Frontend

A modern Vue 3 + TypeScript + Tailwind CSS application for customer journey funnel analysis and visualization.

## 🚀 Features

- **Interactive Funnel Builder**: Drag-and-drop interface with D3.js visualizations
- **Real-time Analytics**: Live dashboards with comprehensive metrics
- **AI-Powered Insights**: Machine learning recommendations for optimization
- **Responsive Design**: Mobile-first design with dark mode support
- **TypeScript**: Full type safety throughout the application
- **Modern Stack**: Vue 3 Composition API, Pinia state management, Vue Router

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Visualization**: D3.js
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Charts**: Chart.js with vue-chartjs
- **Form Validation**: VeeValidate with Yup
- **Date Handling**: date-fns
- **Utilities**: Lodash, @vueuse/core

## 📁 Project Structure

```
src/
├── api/              # API client and service modules
├── assets/           # Static assets (images, styles, icons)
├── components/       # Reusable Vue components
│   ├── common/       # Generic UI components
│   ├── layout/       # Layout-specific components
│   ├── forms/        # Form components
│   ├── charts/       # Chart components
│   └── funnel/       # Funnel-specific components
├── composables/      # Composition API functions
├── router/           # Vue Router configuration
├── stores/           # Pinia stores
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── views/            # Page components
│   ├── auth/         # Authentication pages
│   ├── funnels/      # Funnel-related pages
│   └── errors/       # Error pages
├── App.vue          # Root component
└── main.ts          # Application entry point
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Modern web browser with ES2020+ support

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pathfinder/frontend
```

2. Install dependencies:
```bash
npm ci
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update the environment variables in `.env` as needed.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🧪 Testing

Run linting:
```bash
npm run lint
```

Run type checking:
```bash
npm run type-check
```

## 🐳 Docker Development

Build and run using Docker:
```bash
docker build -f Dockerfile.dev -t pathfinder-frontend-dev .
docker run -p 3000:3000 pathfinder-frontend-dev
```

## 📚 Key Components

### State Management (Pinia)

- **App Store**: Global application state (theme, notifications, loading)
- **Auth Store**: User authentication and permissions
- **Funnel Store**: Funnel data and builder state

### API Integration

- **HTTP Client**: Axios with interceptors for auth and error handling
- **Type-safe APIs**: Fully typed API responses and requests
- **Error Handling**: Global error handling with user-friendly messages

### UI Components

- **Design System**: Consistent styling with Tailwind CSS
- **Accessibility**: WCAG compliant components
- **Responsive**: Mobile-first responsive design
- **Dark Mode**: System preference aware dark mode

### D3.js Integration

- **Interactive Visualizations**: Funnel diagrams, flow charts, analytics charts
- **Real-time Updates**: Live data binding with Vue reactivity
- **Touch Support**: Mobile-friendly touch interactions

## 🔧 Configuration

### Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL
- `VITE_WS_URL`: WebSocket URL for real-time features
- `VITE_APP_NAME`: Application name
- `VITE_ENABLE_*`: Feature flags for conditional features

### Build Configuration

The build is optimized for:
- **Code Splitting**: Automatic chunking for better caching
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and CSS optimization
- **Modern Bundles**: ES2020+ with legacy fallback

## 🚀 Deployment

### Static Hosting

The built application can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages

### Docker Production

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Use TypeScript for all new code
3. Add appropriate tests for new features
4. Update documentation as needed
5. Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the codebase for examples

## 🚧 Roadmap

- [ ] Advanced analytics features
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] Mobile app
- [ ] API rate limiting UI
- [ ] Advanced export options