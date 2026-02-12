# IB E-Diary - React Web Application

A comprehensive task management and productivity web application converted from React Native to React web using Vite and Tailwind CSS.

## 🚀 Features

- ✅ **Task Management** - Create, edit, delete, and organize tasks with priorities and due dates
- 📝 **Notes** - Rich note-taking with image support
- 📊 **Analytics Dashboard** - Track your productivity and progress
- 🔔 **Smart Notifications** - Web notifications for task reminders
- 🤖 **AI Assistant** - AI-powered chatbot for task suggestions
- 👥 **Multi-Role Support** - Admin, EA, User, and Guest modes
- 🔐 **Secure Authentication** - JWT-based authentication with token refresh
- ☁️ **Cloud Sync** - Automatic synchronization with backend
- 🌙 **Dark Mode** - Beautiful dark theme (default)
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Icons**: React Icons
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Date Utilities**: date-fns
- **Authentication**: JWT with jwt-decode

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd ib-diary-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` if you need to change the API base URL:
   ```
   VITE_API_BASE_URL=https://ibnotes.abisexport.com
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📦 Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 🎯 Usage

### Guest Mode
- Click "Continue as Guest" on login page
- Access basic features without authentication
- Data stored locally in browser

### Authenticated Mode
- Login with your credentials
- Full access to all features
- Data synced with cloud backend
- Guest data automatically migrated on first login

### Available Routes

- `/` - Redirects to login
- `/login` - Login page
- `/dashboard` - Main dashboard with stats
- `/tasks` - Task management
- `/notes` - Notes management
- `/profile` - User profile
- `/admin` - Admin Panel
- `/journey` - Journey Visualization
- `/scheduler` - Scheduler management

## 🔑 Default Test Credentials

Contact your administrator for login credentials.

## 🏗️ Project Structure

```
ib-diary-web/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Tasks.jsx
│   │   ├── Notes.jsx
│   │   └── Profile.jsx
│   ├── context/        # React Context providers
│   │   ├── AppContext.jsx
│   │   └── ThemeContext.jsx
│   ├── services/       # API and utility services
│   │   ├── api.js
│   │   ├── storage.js
│   │   ├── tokenStorage.js
│   │   ├── notificationService.js
│   │   └── eventEmitter.js
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  primary: '#3B82F6',    // Blue
  secondary: '#1E293B',  // Dark slate
  // ... more colors
}
```

### API Endpoint

Change the backend URL in `.env`:

```
VITE_API_BASE_URL=https://your-api-url.com
```

## 🔔 Web Notifications

To enable browser notifications:

1. Click "Allow" when prompted for notification permission
2. Notifications will appear for task reminders
3. Works even when browser tab is not active

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
npm run dev -- --port 3000
```

### Build Errors

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Notifications Not Working

- Check browser notification permissions
- Ensure HTTPS (required for service workers in production)
- Some browsers block notifications by default

## 📱 Mobile Responsiveness

The app is fully responsive and works on:
- Desktop (1920x1080+)
- Tablet (768x1024)
- Mobile (375x667+)

## 🔒 Security

- JWT tokens stored in localStorage
- Automatic token refresh
- Session expiry handling
- Secure API communication

## 🚧 Upcoming Features

- [x] Complete task management UI
- [x] Rich text editor for notes
- [x] Scheduler functionality
- [x] AI chatbot integration
- [x] Journey visualization
- [x] Admin dashboard
- [x] Service worker for offline support
- [x] Progressive Web App (PWA) support

## 📄 License

MIT

## 👥 Support

For questions or support, contact the development team.

## 🙏 Acknowledgments

Converted from React Native mobile app to React web application while maintaining feature parity and improving web-specific functionality.
