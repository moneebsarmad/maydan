# maydan

## Lighthouse

Run Lighthouse against a locally running Maydan instance with:

```bash
LIGHTHOUSE_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run lighthouse
```

Defaults:
- target URL: `http://127.0.0.1:3000/dashboard`
- report output: `.lighthouse/`

You can override the page or pass through normal Lighthouse flags:

```bash
npm run lighthouse -- http://127.0.0.1:3000/events/new --only-categories=performance,accessibility
```

If Chrome is installed in a standard macOS location, the script will auto-detect it. Otherwise set `LIGHTHOUSE_CHROME_PATH` explicitly.

## Microsoft 365 Calendar Sync

Maydan can sync newly approved events into a shared Microsoft 365 / Outlook calendar. The sync is:
- one-way
- server-side
- triggered only after final approval
- not tied to individual staff calendars

Required environment variables:
- `MICROSOFT_GRAPH_TENANT_ID`
- `MICROSOFT_GRAPH_CLIENT_ID`
- `MICROSOFT_GRAPH_CLIENT_SECRET`
- `MICROSOFT_GRAPH_CALENDAR_OWNER`

Optional environment variables:
- `MICROSOFT_GRAPH_CALENDAR_ID`
- `MICROSOFT_GRAPH_TIME_ZONE` (defaults to `Central Standard Time`)

Azure / Entra setup:
- register an app for Microsoft Graph
- grant the application permission `Calendars.ReadWrite`
- grant admin consent
- point `MICROSOFT_GRAPH_CALENDAR_OWNER` at the mailbox that owns the shared school calendar
- set `MICROSOFT_GRAPH_CALENDAR_ID` if you want a non-default calendar under that mailbox
