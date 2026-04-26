# Chatbot Embed Integration Guide

This document provides technical instructions for integrating the white-labelled AI assistant into third-party websites.

## Integration Methods

### 1. Modern Loader (Recommended)
The most efficient way to integrate. It asynchronously loads the widget and provides a floating chat button.

```html
<script src="https://kona.agency/api/embed/[CLIENT_ID]" async></script>
```

**Implementation Details:**
- **Asynchronous**: Does not block page rendering.
- **Auto-injection**: Automatically creates a container and a floating toggle button.
- **Fixed Position**: Stays in the bottom-right corner of the viewport.
- **Cache**: 1-hour public cache for optimal performance.

---

### 2. React / Next.js Implementation
For component-based frameworks, use an effect-based loader to ensure clean lifecycle management.

```tsx
"use client";

import { useEffect } from "react";

export const ChatBot = () => {
  useEffect(() => {
    // Prevent double injection
    if (document.getElementById("graft-loader")) return;

    const script = document.createElement("script");
    script.id = "graft-loader";
    script.src = "https://kona.agency/api/embed/[CLIENT_ID]";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("graft-loader");
      if (existing) document.body.removeChild(existing);
    };
  }, []);

  return null;
};
```

---

### 3. Iframe Embed
Use this if you want the chatbot to occupy a specific section of your layout instead of a floating button.

```html
<iframe 
  src="https://kona.agency/widget/[CLIENT_ID]" 
  width="100%" 
  height="600px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  allow="clipboard-write"
></iframe>
```

## Customisation
Members can customise the appearance and behaviour via the portal settings:
- **Name**: The display name of the AI assistant.
- **Greeting**: The initial message sent to users.
- **Colour**: The primary brand colour for buttons and accents.

## Security
- **Origin Validation**: The loader script respects CORS and should only be requested from authorised domains.
- **Clipboard Permissions**: The iframe requires `allow="clipboard-write"` to enable users to copy responses.
