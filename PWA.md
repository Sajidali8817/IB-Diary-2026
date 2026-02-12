# PWA Features - IB E-Diary

## Overview

IB E-Diary is now a **Progressive Web App (PWA)** that can be installed on your device and works offline!

## 🚀 Features

### ✅ Install as App
- Install on desktop (Windows, Mac, Linux)
- Install on mobile (Android, iOS)
- Works like a native app
- No app store required

### 📴 Offline Support
- Works without internet connection
- Cached pages load instantly
- API responses cached for 24 hours
- Images cached for 30 days

### 🔔 Smart Notifications
- Browser notifications for task reminders
- Works even when app is closed
- Customizable notification settings

### ⚡ Performance
- Fast loading with service worker caching
- Automatic updates in background
- Optimized for mobile and desktop

---

## 📱 How to Install

### Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge browser
2. Look for the **install icon** (➕) in the address bar
3. Click **"Install"** or click the install prompt
4. The app will open in its own window
5. Find the app in your Start Menu (Windows) or Applications (Mac)

**Alternative:**
- Click the three dots menu (⋮)
- Select **"Install IB E-Diary"** or **"Add to Desktop"**

### Android

1. Open the app in Chrome browser
2. Tap the **install banner** that appears at the bottom
3. Or tap the three dots menu (⋮) → **"Add to Home screen"**
4. Tap **"Install"** or **"Add"**
5. The app icon will appear on your home screen

### iOS (iPhone/iPad)

1. Open the app in **Safari** browser
2. Tap the **Share** button (□↑) at the bottom
3. Scroll and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right
5. The app icon will appear on your home screen

> **Note:** iOS has limited PWA support. Some features may not work as expected.

---

## 🔧 PWA Features

### Install Prompt
- Custom install prompt appears after 3 seconds
- Beautiful UI matching the app design
- Can be dismissed (won't show again in same session)
- Automatically hides after installation

### Offline Indicator
- Shows when you go offline
- Displays "Back online" message when reconnected
- Auto-hides after 3 seconds

### Service Worker
- Automatically caches app files
- Caches API responses for offline use
- Updates automatically in background
- No manual updates needed

### Caching Strategy

**App Files:** Precached during installation
- HTML, CSS, JavaScript
- PWA icons and manifest
- Static assets

**API Calls:** NetworkFirst (24 hours cache)
- Tries network first
- Falls back to cache if offline
- Cache expires after 24 hours

**Images:** CacheFirst (30 days cache)
- Serves from cache if available
- Downloads if not cached
- Cache expires after 30 days

---

## 🧪 Testing PWA

### Check Installation Status

**Chrome DevTools:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Check **Manifest** section
4. Verify **Service Workers** are registered

### Test Offline Mode

1. Install the PWA
2. Open Chrome DevTools (`F12`)
3. Go to **Network** tab
4. Check **"Offline"** checkbox
5. Navigate through the app
6. Cached pages should load

### Verify Service Worker

**Chrome DevTools → Application:**
- **Service Workers:** Should show "activated and running"
- **Cache Storage:** Should show cached files
- **Manifest:** Should display app info correctly

---

## 🔄 Updating the PWA

The PWA updates automatically:
1. Service worker checks for updates on each visit
2. New version downloads in background
3. Update activates on next app restart
4. No user action required

**Manual Update:**
- Close all app windows/tabs
- Reopen the app
- New version will be active

---

## ❓ Troubleshooting

### Install Button Not Showing

**Possible reasons:**
- Already installed
- Not using HTTPS (required in production)
- Browser doesn't support PWA
- Install prompt was dismissed

**Solution:**
- Try uninstalling and reinstalling
- Clear browser cache
- Use Chrome/Edge browser

### Offline Mode Not Working

**Check:**
- Service worker is registered (DevTools → Application)
- You visited the page at least once while online
- Cache storage has files

**Solution:**
- Visit the page while online first
- Check browser console for errors
- Try clearing cache and revisiting

### App Not Updating

**Solution:**
- Close all app windows/tabs completely
- Clear browser cache
- Reopen the app

### iOS Issues

**Known limitations:**
- Limited service worker support
- No install prompt (manual only)
- Some features may not work

**Solution:**
- Use Safari browser (not Chrome)
- Add to home screen manually
- Some features are browser-dependent

---

## 🔐 Security

- PWA requires HTTPS in production
- `localhost` is treated as secure for development
- Service worker only works on secure origins
- All data encrypted in transit

---

## 📊 Browser Support

| Browser | Desktop | Mobile | Install | Offline |
|---------|---------|--------|---------|---------|
| Chrome  | ✅ Full | ✅ Full | ✅ Yes  | ✅ Yes  |
| Edge    | ✅ Full | ✅ Full | ✅ Yes  | ✅ Yes  |
| Firefox | ⚠️ Partial | ⚠️ Partial | ❌ No | ✅ Yes |
| Safari  | ⚠️ Limited | ⚠️ Limited | ⚠️ Manual | ⚠️ Limited |

---

## 💡 Tips

1. **Install for best experience** - Installed PWAs load faster and feel more native
2. **Visit while online first** - This caches the app for offline use
3. **Keep app updated** - Restart occasionally to get latest features
4. **Use Chrome/Edge** - Best PWA support on all platforms
5. **Enable notifications** - Get task reminders even when app is closed

---

## 🛠️ For Developers

### Configuration Files

- **vite.config.js** - PWA plugin configuration
- **index.html** - PWA meta tags and manifest link
- **public/manifest.webmanifest** - App manifest (auto-generated)
- **dist/sw.js** - Service worker (auto-generated)

### Build PWA

```bash
npm run build
```

This generates:
- Service worker (`sw.js`)
- Manifest file (`manifest.webmanifest`)
- Optimized app bundle

### Development Mode

PWA is enabled in development:
```bash
npm run dev
```

Service worker will register at `http://localhost:5173`

### Customization

Edit `vite.config.js` to customize:
- Manifest properties
- Caching strategies
- Runtime caching patterns
- Service worker behavior

---

## 📞 Support

For issues or questions:
- Check browser console for errors
- Verify service worker status in DevTools
- Ensure HTTPS in production
- Contact development team

---

**Enjoy your Progressive Web App! 🎉**
