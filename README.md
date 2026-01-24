# ZLKcyber AI - Next.js AI Chat & Image Generation App

A modern, feature-rich AI application built with Next.js, React, and Tailwind CSS. Generate images with AI and chat with multiple language models while enjoying persistent chat history and beautiful markdown rendering.

## ✨ Features

### 💬 AI Chat
- **Multiple AI Models**: Choose from 8 different text models:
  - Amazon Nova Micro
  - Mistral Small
  - Google Gemini 2.5
  - Qwen3 Coder
  - xAI Grok
  - GPT-5 Mini
  - Perplexity
  - GPT-5 Nano
- **Persistent Chat History**: All conversations are automatically saved to localStorage and restored on reload
- **Context-Aware Responses**: Full conversation history is sent to the AI for better understanding
- **Markdown Support**: Full markdown rendering with:
  - Syntax highlighting for code blocks (100+ languages)
  - Copy button for easy code sharing
  - Bold, italic, lists, blockquotes, links
  - GitHub Flavored Markdown (tables, strikethrough, etc.)
- **Clear Chat**: One-click button to start fresh conversations
- **Auto-scroll**: Messages auto-scroll to the latest message

### 🎨 AI Image Generation
- **Multiple Image Models**:
  - Flux Schnell
  - Z-Image Turbo
  - SDXL Turbo
- **Customizable Settings**:
  - Width: 512px - 1536px
  - Height: 512px - 1536px
  - Auto-generated random seeds for variations
- **Generate Variations**: Click "Again" button to regenerate with different seed
- **Auto-save to Gallery**: Generated images automatically saved
- **Download Images**: Easy download with timestamp naming

### 🖼️ Image Gallery
- **Browse Creations**: Grid view of all generated images
- **Search**: Filter images by prompt text
- **Preview Modal**: Click any image for detailed view
- **Download**: Save images to your device
- **Delete**: Remove images from gallery
- **Clear All**: One-click gallery cleanup

### 🎨 Design & UX
- **Dark Theme**: Beautiful dark UI with purple-pink gradients
- **Glassmorphism**: Modern glass effect styling with backdrop blur
- **Responsive Design**: Fully mobile-optimized with responsive breakpoints (sm, md, lg)
- **Touch-Friendly**: Large buttons and optimized layouts for mobile
- **Smooth Animations**: Fade-in and slide animations for messages
- **Gradient Text**: Eye-catching gradient text elements

### ⚙️ Technical Features
- **Backend API Routes**: Secure API calls with Pollinations.ai key protection
- **Request Timeouts**: 
  - Chat: 45 second timeout
  - Image generation: 75 second timeout
- **Error Handling**: Graceful error messages and fallbacks
- **Type-Safe**: Full TypeScript support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_POLLINATION_API_KEY=your_api_key_here
```

Get your API key from [Pollinations.ai](https://pollinations.ai)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
my-app/
├── app/
│   ├── page.tsx              # Landing page
│   ├── chat/
│   │   └── page.tsx          # Chat interface
│   ├── generate/
│   │   └── page.tsx          # Image generation
│   ├── gallery/
│   │   └── page.tsx          # Image gallery
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts      # Chat API endpoint
│   │   └── image/
│   │       └── route.ts      # Image generation API endpoint
│   ├── layout.tsx            # Root layout with navigation
│   └── globals.css           # Global styles & animations
├── lib/
│   └── pollination.ts        # AI service layer
├── public/
│   └── favicon.svg           # ZLKcyber logo
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Markdown**: react-markdown with remark-gfm
- **Code Highlighting**: react-syntax-highlighter
- **Language**: TypeScript

## 🔧 Configuration

### Tailwind CSS
Custom animations and configurations in `app/globals.css`:
- Gradient text animation
- Custom scrollbar styling
- Purple-pink color scheme

### Environment Variables
```env
NEXT_PUBLIC_POLLINATION_API_KEY=your_pollinations_api_key
```

## 🚀 Deployment

### Deploy on Vercel (Recommended)
```bash
npm run build
npm run start
```

Or use the Vercel CLI:
```bash
vercel
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎯 Usage Tips

### Chat Tips
- Use markdown formatting for better readability
- Include code blocks with triple backticks and language name
- Reference previous messages for context
- Click "Clear" to start a new conversation

### Image Generation Tips
- Be descriptive in your prompts for better results
- Adjust width/height for different aspect ratios
- Use "Again" button to try variations
- Save favorite images to the gallery

## 🔐 Security

- API key is stored server-side only (never exposed to client)
- All external API calls go through backend routes
- Input validation on all API endpoints
- Safe localStorage for gallery and chat history

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📞 Support

For issues or questions, please create an issue in the repository.

---

<div align="center">

### 🔗 Connect With Us

[![GitHub](https://img.shields.io/badge/GitHub-ZLKcyber-181717?style=flat-square&logo=github)](https://github.com/Zlkcyber)

**ZLKcyber AI** © 2026 | All Rights Reserved

*Built with ❤️ by ZLKcyber*

</div>
