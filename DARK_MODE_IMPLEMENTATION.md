# Dark Mode Implementation Guide

## Overview
The Orchestrator application now has a fully functional dark mode system that allows users to switch between light, dark, and auto (system preference) themes seamlessly.

## Features

✅ **Three Theme Options**:
- **Light Mode**: Traditional light theme
- **Dark Mode**: Eye-friendly dark theme
- **Auto Mode**: Automatically follows system preference

✅ **Persistent Settings**: Theme preference is saved in localStorage
✅ **Real-time Switching**: Changes apply instantly without page reload
✅ **System Preference Detection**: Auto mode listens to OS theme changes
✅ **Comprehensive Coverage**: All UI components support dark mode

---

## Implementation Details

### 1. **ThemeContext** (`frontend_orchestrator/src/context/ThemeContext.js`)

The core theme management system:

```javascript
import { useTheme } from "../../context/ThemeContext";

const { theme, setTheme } = useTheme();
```

**Features**:
- Manages global theme state
- Persists theme to localStorage
- Applies theme to document root (adds/removes `dark` class)
- Listens for system preference changes in auto mode
- Provides `useTheme()` hook for components

**How it works**:
1. Theme is stored in React context
2. When theme changes, the `dark` class is added/removed from `<html>` element
3. Tailwind CSS `dark:` variant selectors activate based on this class
4. Theme choice is persisted to `localStorage` for next visit

---

### 2. **Tailwind Configuration** (`frontend_orchestrator/tailwind.config.js`)

```javascript
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  // ... rest of config
}
```

**Key Setting**: `darkMode: 'class'` - Enables Tailwind's dark mode using the class strategy.

---

### 3. **Global Styles** (`frontend_orchestrator/src/index.css`)

Dark mode styles applied globally:

```css
body {
  @apply bg-gray-50 dark:bg-gray-900;
  @apply text-gray-900 dark:text-gray-100;
}
```

**Features**:
- Background colors adapt to theme
- Text colors adjust for readability
- Scrollbar styles change with theme
- Focus outlines use theme-appropriate colors

---

### 4. **App.js Integration**

```javascript
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* ... rest of app */}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

The `ThemeProvider` wraps the entire app to make theme available everywhere.

---

## Using Dark Mode in Components

### Basic Pattern

Add `dark:` variants to your Tailwind classes:

```javascript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Hello World
</div>
```

### Examples from the Codebase

#### **Sidebar Navigation**
```javascript
className={({ isActive }) => 
  `flex items-center px-4 py-3 rounded-lg ${
    isActive 
      ? "bg-blue-600 dark:bg-blue-700 text-white" 
      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
  }`
}
```

#### **Input Fields**
```javascript
<input
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
             dark:bg-gray-700 dark:text-gray-200 rounded-md 
             focus:ring-2 focus:ring-blue-500"
/>
```

#### **Cards & Containers**
```javascript
<div className="bg-white dark:bg-gray-800 border border-gray-200 
                dark:border-gray-700 rounded-lg shadow-sm">
  {/* Content */}
</div>
```

---

## Color Palette

### Light Mode
- Background: `gray-50` (#f9fafb)
- Cards: `white` (#ffffff)
- Text: `gray-900` (#111827)
- Borders: `gray-200` (#e5e7eb)

### Dark Mode
- Background: `gray-900` (#111827)
- Cards: `gray-800` (#1f2937)
- Text: `gray-100` (#f3f4f6)
- Borders: `gray-700` (#374151)

### Accent Colors (Theme-Aware)
- Primary Blue: `blue-600` → `blue-700` (dark)
- Success Green: `green-600` → `green-700` (dark)
- Warning Yellow: `yellow-600` → `yellow-700` (dark)
- Danger Red: `red-600` → `red-700` (dark)

---

## User Experience

### Changing Theme

1. Navigate to **Settings** page
2. Click on **Appearance** tab
3. Select theme from dropdown:
   - **Light**: Always use light theme
   - **Dark**: Always use dark theme
   - **Auto (System)**: Follow OS/browser preference

4. Theme changes **instantly** - no save button needed
5. Preference is **automatically saved** and persists across sessions

### Auto Mode Behavior

When "Auto" is selected:
- App checks system preference: `prefers-color-scheme: dark`
- If system is in dark mode → app uses dark theme
- If system is in light mode → app uses light theme
- **Real-time updates**: If user changes OS theme, app automatically switches

---

## Components with Dark Mode Support

✅ **Layout Components**:
- Sidebar
- Topbar
- Main content areas

✅ **Settings Page**:
- All tabs (Notifications, Appearance, Docker, User Management)
- Form inputs and selects
- Buttons and actions
- User management table

✅ **Common Elements**:
- Navigation links
- Cards and containers
- Buttons and form controls
- Modals and dialogs
- Tables and lists

---

## Best Practices

### 1. **Always Provide Dark Variants**

❌ **Bad**:
```javascript
<div className="bg-white text-gray-900">
```

✅ **Good**:
```javascript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

### 2. **Maintain Contrast**

Ensure text remains readable:
- Light backgrounds → dark text
- Dark backgrounds → light text
- Sufficient contrast ratios (WCAG AA: 4.5:1)

### 3. **Test Both Themes**

Always test your components in both modes:
```javascript
// Quick test: Toggle class on HTML element
document.documentElement.classList.toggle('dark');
```

### 4. **Use Semantic Color Names**

Use Tailwind's semantic grays rather than absolute values:
- `gray-50` to `gray-900` scale
- Easier to maintain consistency
- Automatic adaptation with dark: variants

### 5. **Handle Images/Icons**

For images that don't work in dark mode:
```javascript
<img 
  src={theme === 'dark' ? darkLogo : lightLogo} 
  alt="Logo" 
/>
```

---

## Testing Dark Mode

### Manual Testing

1. **Switch Themes in Settings**:
   - Go to Settings → Appearance
   - Try all three theme options
   - Verify instant switching

2. **Check Persistence**:
   - Select a theme
   - Refresh the page
   - Verify theme persists

3. **Test Auto Mode**:
   - Select "Auto" theme
   - Change OS/browser theme
   - Verify app follows system preference

### Browser DevTools

Toggle dark mode in browser:
```javascript
// In browser console
document.documentElement.classList.toggle('dark');
```

Or use browser extensions for quick theme switching.

---

## Troubleshooting

### Issue: Theme not applying

**Solution**: Check that:
1. `ThemeProvider` wraps your app in `App.js`
2. Tailwind config has `darkMode: 'class'`
3. Component imports `useTheme()` correctly

### Issue: Styles look wrong in dark mode

**Solution**: 
- Ensure all color classes have `dark:` variants
- Check that contrast is sufficient
- Verify borders, backgrounds, and text colors are all theme-aware

### Issue: Theme not persisting

**Solution**:
- Check localStorage in DevTools
- Verify `ThemeContext` saves to localStorage
- Check for localStorage errors (quota, permissions)

### Issue: Auto mode not working

**Solution**:
- Check browser supports `prefers-color-scheme`
- Verify system has a dark/light mode setting
- Test with browser DevTools appearance emulation

---

## Future Enhancements

Potential improvements for dark mode:

1. **Custom Theme Colors**: Allow users to customize accent colors
2. **Multiple Dark Themes**: Offer variations (OLED black, soft dark, etc.)
3. **Scheduled Themes**: Auto-switch based on time of day
4. **Per-Page Themes**: Different themes for different sections
5. **High Contrast Mode**: Enhanced accessibility option

---

## Summary

✅ **Fully Functional**: Dark mode works across entire application
✅ **User Friendly**: Easy to switch, persists across sessions  
✅ **System Integration**: Auto mode follows OS preference  
✅ **Well Implemented**: Uses Tailwind best practices  
✅ **Accessible**: Maintains proper contrast and readability  

**To change theme**: Settings → Appearance → Select theme from dropdown

**For developers**: Use `dark:` Tailwind variants on all color-related classes for automatic theme support.



