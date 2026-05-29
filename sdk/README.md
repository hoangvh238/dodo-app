# Do It Analytics SDK

## Integration (Electron App)

Copy `tracker.ts` into your Electron app's `src/main/` folder, then:

```ts
// src/main/index.ts
import { initTracker, trackEvent, Events } from './tracker';

// Set env vars before app starts
process.env.ANALYTICS_URL = 'https://your-dashboard.vercel.app';
process.env.ANALYTICS_API_KEY = 'your-secret-key';

app.on('ready', () => {
  initTracker();
  trackEvent(Events.APP_START);
});

app.on('before-quit', () => {
  trackEvent(Events.APP_QUIT);
});
```

## Opt-out

Set `DOIT_NO_ANALYTICS=1` in the environment to disable all tracking.

## Privacy

- Data collected: anonymous session ID, event type, metadata (OS, app version), IP address
- IP is used server-side for country/city geolocation only — the raw IP is stored but never exposed in the UI
- Data is used exclusively for product improvement
- Data is **never sold or shared** with any third party
- No personally identifiable information (PII) is collected
