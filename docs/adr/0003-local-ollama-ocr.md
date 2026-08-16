# Local Ollama OCR

OCR and models run only on-device via Ollama at `127.0.0.1`, fixed model `glm-ocr`. No cloud AI. When the app installs/starts the runtime it marks it `owned` and stops that instance on quit; it does not kill an Ollama the user already had running.
