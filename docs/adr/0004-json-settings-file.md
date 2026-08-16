# JSON settings file

App settings live in `app.getPath("userData")/settings.json`, deep-merged with defaults on read/write. No settings DB or electron-store. Current shape includes `watchPaths: string[]` for future folder watching.
