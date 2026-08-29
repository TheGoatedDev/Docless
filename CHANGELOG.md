# Changelog

## [1.3.0](https://github.com/TheGoatedDev/Docless/compare/v1.2.0...v1.3.0) (2026-08-29)


### Features

* auto-retry transient OCR failures and retry-all button ([93fa760](https://github.com/TheGoatedDev/Docless/commit/93fa76036379ddd4151dd1ceca7f253c4886dd40))
* auto-update from GitHub releases ([4aa98ad](https://github.com/TheGoatedDev/Docless/commit/4aa98ad04a8615fa69d834f01c50bba8b0a61b7e))
* switch OCR model to LightOnOCR-2 ([e88ed95](https://github.com/TheGoatedDev/Docless/commit/e88ed95def3f5f2a6dae14cef2f8f4d684c7e38f))


### Bug Fixes

* ollama empty prompt loaded model instead of ocr ([2524386](https://github.com/TheGoatedDev/Docless/commit/2524386dd79b8e588c7922db2a7276faeadb3e8e))

## [1.2.0](https://github.com/TheGoatedDev/Docless/compare/v1.1.0...v1.2.0) (2026-08-19)


### Features

* add AppSidebar with Home and Status nav ([c598053](https://github.com/TheGoatedDev/Docless/commit/c598053f0b6e9267d78e54fc1554a91501ca2589))
* add dev-only /dev page ([2fb798d](https://github.com/TheGoatedDev/Docless/commit/2fb798deb861635e14811c39600c5dd016a0907d))
* add pino logger with file rotation and renderer IPC ([94bf8ff](https://github.com/TheGoatedDev/Docless/commit/94bf8ffab557e2f600c8a4884908e92868e945cb))
* add search input to app topbar ([3e5adb7](https://github.com/TheGoatedDev/Docless/commit/3e5adb7abda52d5f36a88b00ade176fecc1684f2))
* add settings page to manage watchPaths ([3d5e6eb](https://github.com/TheGoatedDev/Docless/commit/3d5e6eb60c11210a754c8abba0d97ddbcf122daf))
* add system tray with compact mobile window ([21c38aa](https://github.com/TheGoatedDev/Docless/commit/21c38aa2182b14b8ecd821523cdbb092af2e487e))
* add watchPaths to settings state ([a39286b](https://github.com/TheGoatedDev/Docless/commit/a39286b3571d3653c26d5f763363e659d1318e0a))
* app shell with collapsible sidebar ([2b1a3e5](https://github.com/TheGoatedDev/Docless/commit/2b1a3e590ecd7f4a1bee045e48bf1b8b43f7def1))
* frameless tray popover for quick view ([2eb634e](https://github.com/TheGoatedDev/Docless/commit/2eb634e501a79e6f5ef20b886fe7697e2ad736b3))
* hide native titlebar, use drag header chrome ([6f4192a](https://github.com/TheGoatedDev/Docless/commit/6f4192a560b4b19f358ca59f5a2867c4d69ee77b))
* log watch path add/remove ([6316ae1](https://github.com/TheGoatedDev/Docless/commit/6316ae13b898820d91f205657fdbb64b2be6606f))
* ocr pending docs via local glm-ocr (TGD-99) ([f09de9a](https://github.com/TheGoatedDev/Docless/commit/f09de9aea19c6c9c2da04adcb65570491429f105))
* open a document and its OCR text (TGD-102) ([812ad07](https://github.com/TheGoatedDev/Docless/commit/812ad073cbe87e409f9e523934c48c9d353aa544))
* open document detail with OCR text ([0bba1ee](https://github.com/TheGoatedDev/Docless/commit/0bba1ee7d6d00011d3c81a78a5d45ee33c71b1c0))
* open per-root .docless sqlite sidecar (TGD-96) ([d3c7850](https://github.com/TheGoatedDev/Docless/commit/d3c785056c871badfbea34ad6c459205b5af40a5))
* open per-root .docless sqlite sidecar (TGD-96) ([c9a824e](https://github.com/TheGoatedDev/Docless/commit/c9a824e13f5d38b7b312eedd1d91b38a2830fc26))
* pin Dev and Status nav items to sidebar footer ([2351cd0](https://github.com/TheGoatedDev/Docless/commit/2351cd035a6be6d917a4552cef57e2ec9af6cb26))
* queue polish and retry OCR (TGD-100) ([ef50e71](https://github.com/TheGoatedDev/Docless/commit/ef50e7146214630a15696e5fefef99d23c042c5d))
* retry failed OCR jobs from the document list (TGD-100) ([5ad5305](https://github.com/TheGoatedDev/Docless/commit/5ad53059b881ee133f6c23efd560b8db04fa5f2e))
* rotate sidebar toggle chevron on open/close ([4f1e55c](https://github.com/TheGoatedDev/Docless/commit/4f1e55c17ee3fc11e8249838156bb33bee7cb514))
* run up to two OCR jobs in parallel ([bab2c35](https://github.com/TheGoatedDev/Docless/commit/bab2c356f001424741d0678b4ad9ccc2eae599a1))
* search by document text (TGD-101) ([12ba19f](https://github.com/TheGoatedDev/Docless/commit/12ba19fd7723f1da10110fb9a93442637200dfd1))
* search documents by OCR text with local FTS5 (TGD-101) ([0d249d0](https://github.com/TheGoatedDev/Docless/commit/0d249d010762f8c561421ddae2b5a2b5f226d13b))
* show Ollama status badge in app topbar ([8ddca69](https://github.com/TheGoatedDev/Docless/commit/8ddca6989eff036a41d03043a7df6286ad71fd4d))
* show ollama status in topbar badge tooltip ([4c15438](https://github.com/TheGoatedDev/Docless/commit/4c154382cbb32989b4ce7afd1dfee4385e288166))
* show pending OCR count badge when queue non-empty ([2228da7](https://github.com/TheGoatedDev/Docless/commit/2228da773ed374cedfeff5ac7ae18dab0afd4778))
* show raw zustand state cards on dev page ([95b44ad](https://github.com/TheGoatedDev/Docless/commit/95b44adf2ad1dc9fe78cbd7b13a0d6064a81661b))
* show running OCR count badge in topbar ([75ee27e](https://github.com/TheGoatedDev/Docless/commit/75ee27e01a885cd05701a57e3d51718c080fb9fb))
* show tracked documents on Home (TGD-98) ([422e171](https://github.com/TheGoatedDev/Docless/commit/422e1717ba21523bd8790d615fc2dcab0f2ada46))
* show tracked documents on Home (TGD-98) ([c7b7e7f](https://github.com/TheGoatedDev/Docless/commit/c7b7e7f797dab756081a767337d9d7d57751289f))
* track files under watch paths into sidecar (TGD-97) ([983d835](https://github.com/TheGoatedDev/Docless/commit/983d835bdcce6941834d1e8705215607ca38ab9b))
* track files under watch paths into sidecar (TGD-97) ([0b32db8](https://github.com/TheGoatedDev/Docless/commit/0b32db82c477154892c3adb2f8dc02915a437be4))
* watch folders with chokidar and ensure .docless ([1bb1b6a](https://github.com/TheGoatedDev/Docless/commit/1bb1b6aa2c05cf1279c576fa592bae16daf7de54))
* wire app shell with topbar and sidebar ([53944a5](https://github.com/TheGoatedDev/Docless/commit/53944a5d531dcd9cb36b861babeac0eb6777669c))


### Bug Fixes

* add gap between sidebar menu items ([1f60d07](https://github.com/TheGoatedDev/Docless/commit/1f60d071fdd16e780a82ef0c03fca39ed9bbd9cb))
* add top padding to sidebar content ([550cd9b](https://github.com/TheGoatedDev/Docless/commit/550cd9bca31a907eb694df31a1d8dd5c10b9b488))
* add vertical margin to mobile sidebar sheet ([ff917bd](https://github.com/TheGoatedDev/Docless/commit/ff917bd0ea4be87413ea0c24c8cf3916965e08ad))
* balance titlebar vertical padding ([707b612](https://github.com/TheGoatedDev/Docless/commit/707b61236a138c62701011b41f7e45d1bd88bb1f))
* center mac traffic lights in h-11 titlebar ([a1d8e63](https://github.com/TheGoatedDev/Docless/commit/a1d8e6393e152d07d1ff277247a7a1f7b967d53b))
* close compact sidebar on window blur ([3215483](https://github.com/TheGoatedDev/Docless/commit/321548387851d52e9d85b73a96f8c7ce5411c3b8))
* deep-merge settings with defaults on load/save ([920d0f4](https://github.com/TheGoatedDev/Docless/commit/920d0f46f74a4173a6b50d6b71afcd76d40e9680))
* drop Quick view from tray menu ([00209e9](https://github.com/TheGoatedDev/Docless/commit/00209e9c8a10339e2ab6ddf214fdb7b5cc4ac280))
* flush mobile sidebar sheet to bottom on main ([3c30ae8](https://github.com/TheGoatedDev/Docless/commit/3c30ae8cad63c5d540042c303ba81cf9e34be92a))
* hide Docless title in compact window ([f66633e](https://github.com/TheGoatedDev/Docless/commit/f66633e6b37c8d727419fa3d5a1863dada907da0))
* increase mobile sidebar sheet vertical inset ([1b6df9d](https://github.com/TheGoatedDev/Docless/commit/1b6df9d31aa7139e2a7f50464f76d7ea47f260d7))
* keep app topbar sticky with solid background ([cbcaf4e](https://github.com/TheGoatedDev/Docless/commit/cbcaf4e4890465f998811f159d5e03bfa7a2e29f))
* keep stock sidebar; mobile open via header trigger ([b8d8bc8](https://github.com/TheGoatedDev/Docless/commit/b8d8bc88717bf459e046cf60f1c95abb6698a878))
* log watch path changes after logger init ([b24a4f1](https://github.com/TheGoatedDev/Docless/commit/b24a4f138000d6a5d6a8313263b162cc54d84cc3))
* mobile sidebar icon rail with expand overlay ([4da607d](https://github.com/TheGoatedDev/Docless/commit/4da607d70f97fc2779968c0539eb4575d8e49a5f))
* more left padding on mac titlebar title ([ffb78a1](https://github.com/TheGoatedDev/Docless/commit/ffb78a13459a23c0611daad387885872cd24fc8e))
* move page container width into app layout ([3a3bb68](https://github.com/TheGoatedDev/Docless/commit/3a3bb68982af0cfa8b563cddd2399ecb5f991513))
* move sidebar toggle to mid-right edge ([5e194cb](https://github.com/TheGoatedDev/Docless/commit/5e194cb3e85f994d97dcb74168a2b644b7ab1ab0))
* narrow expanded sidebar width ([3563051](https://github.com/TheGoatedDev/Docless/commit/3563051e85f133a459c077051b0c0849b7d101f1))
* no sheet inset on compact window ([eb6b8d3](https://github.com/TheGoatedDev/Docless/commit/eb6b8d380c3179984e760c3ef8f903691ddcdffb))
* ocr newest-first and downscale before glm-ocr ([d121fbf](https://github.com/TheGoatedDev/Docless/commit/d121fbf7d457bf0c1045d9f28d42913c7c461609))
* offset sidebar below custom titlebar ([80fd4e2](https://github.com/TheGoatedDev/Docless/commit/80fd4e29389fa60092ec0f001c5d5a176661f8a1))
* override sheet side insets so main clears titlebar ([4f88f8b](https://github.com/TheGoatedDev/Docless/commit/4f88f8b1089a3375245cac2a02575c9aa3653fdb))
* pin topbar by scrolling content pane only ([f8e5b84](https://github.com/TheGoatedDev/Docless/commit/f8e5b84b4d915f615140214adbcf6d29c64aee4b))
* resize tray icon to 16px ([1b1176e](https://github.com/TheGoatedDev/Docless/commit/1b1176e0109d3a7e0d676a20aa82fed7ef38ca98))
* restore shadcn sidebar shell ([087bbff](https://github.com/TheGoatedDev/Docless/commit/087bbff7f7a72b411398f63e0708872e6c3be207))
* set titlebar height to h-10 ([1f274f9](https://github.com/TheGoatedDev/Docless/commit/1f274f9b2aa97770c30c65fcd6a44c7331b198a6))
* set titlebar height to h-11 ([ed00a64](https://github.com/TheGoatedDev/Docless/commit/ed00a642a15e724e966a5d9e1de7ccac93d41b3e))
* sheet top offset only on main window titlebar ([fe954dc](https://github.com/TheGoatedDev/Docless/commit/fe954dc79c2d7766d893eeafe21bdaddc0b3b4de))
* show app name in topbar on mobile ([00d0b5e](https://github.com/TheGoatedDev/Docless/commit/00d0b5e8a33995b61b87414f9ea549d61afb0886))
* shrink titlebar to native-ish 32px ([727b315](https://github.com/TheGoatedDev/Docless/commit/727b3153085073451325ffa3f7c1cb0acee7f3db))
* sidebar edge toggle chevrons, match bg, no motion ([c22c9a7](https://github.com/TheGoatedDev/Docless/commit/c22c9a72ae351a395ea6c9dce04914819c97c5a8))
* skip traffic-light titlebar padding in compact window ([c204593](https://github.com/TheGoatedDev/Docless/commit/c20459359020c17ef556b0fdee1684720cf56fbd))
* stop sidebar toggle jumping on click ([91f7bdb](https://github.com/TheGoatedDev/Docless/commit/91f7bdba8b3e48eaf2bb9c2cc80b1d9dfd0a8a90))
* sync logger setup for CJS main (no TLA) ([9fb7586](https://github.com/TheGoatedDev/Docless/commit/9fb758697c435da3a00225c3960f640e6054dd4c))
* top padding only on mobile sidebar sheet ([6483238](https://github.com/TheGoatedDev/Docless/commit/648323848b3b69643918a43f63f766fe4320a85e))
* tray primary click toggles popover only ([49c5957](https://github.com/TheGoatedDev/Docless/commit/49c59576cbe07072628c8acb4d957dbff62776d6))
* type window.api.windowRole ([333d7fb](https://github.com/TheGoatedDev/Docless/commit/333d7fb2fc735a3ca63c81c2073402942dc72cd4))
* widen app content max width to 4xl ([923b110](https://github.com/TheGoatedDev/Docless/commit/923b1108f1482436e4ad55db3e7013c0c1359921))


### Performance Improvements

* raise OCR concurrency from 2 to 4 ([89b750e](https://github.com/TheGoatedDev/Docless/commit/89b750e03384e771ad17bb1ec146970661fb2f62))
* raise OCR concurrency to 8 ([25a80c3](https://github.com/TheGoatedDev/Docless/commit/25a80c3c1f84ad69c5537256e0204a036d60464e))


### Reverts

* keep OCR concurrency at 2 ([0978265](https://github.com/TheGoatedDev/Docless/commit/09782657d6d59fafba7acd1aa002b4fcad684b55))

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
