# SPA Routing Fix Documentation

## Problem
The application experienced 404 errors when users refreshed pages at non-root routes (e.g., `/hunt/123/clue/456`, `/hunt/123`, `/profile`). This is a common issue with Single Page Applications (SPAs) using client-side routing.

## Root Cause
- The app uses React Router with BrowserRouter for client-side routing
- When deployed, the server/static hosting looks for files at the requested path
- Only `index.html` exists at the root, causing 404 errors for deep routes

## Solution Implemented

### 1. Vite Preview Server Configuration
Added a custom plugin (`spaFallbackPlugin`) to `vite.config.ts` that:
- Intercepts all requests to the preview server
- Serves `index.html` for any route that doesn't have a file extension
- Preserves static asset serving (files with extensions like `.js`, `.css`, `.png`)

### 2. PWA Configuration
Updated the PWA Workbox configuration to include `navigateFallback: "/index.html"` to handle offline navigation.

### 3. Deployment Configuration Files
Created platform-specific configuration files in `frontend/public/`:

#### Netlify (`_redirects`)
```
/*    /index.html   200
```

#### Vercel (`vercel.json`)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Apache (`.htaccess`)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

## Testing
All routes now return HTTP 200 and serve the correct HTML:
- `/` - Home page
- `/hunt/123` - Hunt details page
- `/hunt/123/clue/456` - Clue page
- `/hunt/123/end` - Hunt end page
- `/profile` - Profile/rewards page
- `/about` - About page
- `/hunt/create` - Create hunt page

Static assets continue to work correctly:
- `/favicon.ico`
- `/manifest.webmanifest`
- All JavaScript and CSS bundles in `/assets/`

## Deployment Instructions

### For Preview Server (Development)
```bash
npm run build
npm run preview
```
The preview server now handles all routes correctly.

### For Production Deployments

**Netlify**: The `_redirects` file will be automatically used.

**Vercel**: The `vercel.json` file will be automatically detected.

**Apache/Traditional Hosting**: The `.htaccess` file will be used if mod_rewrite is enabled.

**Other Static Hosts**: Configure the server to serve `index.html` for all routes that don't match files.

## Notes
- The fix is minimal and doesn't affect the application logic
- Static assets are still served normally
- The configuration files are copied to `dist/` during the build process
- All existing functionality remains unchanged
