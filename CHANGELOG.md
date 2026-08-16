# Changelog

## [1.1.0](https://github.com/TheGoatedDev/Docless/releases/tag/v1.1.0) (2026-08-16)


### Features

* add /setup route group for ollama and ocr model steps ([e8ff7c8](https://github.com/TheGoatedDev/Docless/commit/e8ff7c89b048ebfa4f1cec913721352fadf093bf))
* add app shell layout and status diagnostics page ([80ad182](https://github.com/TheGoatedDev/Docless/commit/80ad182f0286f2c745ac1b4f9a99d3ca4e2fb2db))
* add focus-aware sonner and OS notifications ([c113be7](https://github.com/TheGoatedDev/Docless/commit/c113be75d357a88219abfc1986cf2cb8a22dea83))
* add shadcn/ui with Tailwind v4 and opencode skill ([a7149fd](https://github.com/TheGoatedDev/Docless/commit/a7149fd3e629269fc7234ed3292c17e289e01855))
* redirect to setup step when ollama is not ready ([3be1d52](https://github.com/TheGoatedDev/Docless/commit/3be1d52045ad52f1a179d0b86a42856ad6171599))
* show ollama version on status runtime card ([d77e2bd](https://github.com/TheGoatedDev/Docless/commit/d77e2bd59aaefc4defcb17a6827b67510c241d9a))
* split ollama ensure into runtime and model ops ([33daab7](https://github.com/TheGoatedDev/Docless/commit/33daab77fc301a1e5f8b6172a8f9cc12e579eaf6))


### Bug Fixes

* auto-start ollama when runtime already installed ([4e0c36a](https://github.com/TheGoatedDev/Docless/commit/4e0c36a803d9199d65ca841ab67b8aaf9aebfe39))
* clear stale ollama runtime starting after ready ([eec2ca0](https://github.com/TheGoatedDev/Docless/commit/eec2ca000ad4b0d85de0117ff2341186aa51e492))
* install electron binary after electron 43 dropped postinstall ([b2197e7](https://github.com/TheGoatedDev/Docless/commit/b2197e76823189adafb4da54c239582668337d53))
* re-register ollama ipc handlers idempotently ([48cb2f8](https://github.com/TheGoatedDev/Docless/commit/48cb2f8966cb122cf47b9da40a9c673545b25e42))
* resolve ollama version when runtime becomes ready ([749f3e2](https://github.com/TheGoatedDev/Docless/commit/749f3e20b0fdd7acb60c7d71c0ec242d2b0edbc0))
* stop mapping ollama stdout access logs to runtime progress ([6008611](https://github.com/TheGoatedDev/Docless/commit/600861134ba79eae56856ef7f57e24194ec34a17))
* stop stale hydrate from sticking ollama busy true ([0caf66f](https://github.com/TheGoatedDev/Docless/commit/0caf66fdd14a711a3d55fdf2f00b14d5f4c22bb9))
