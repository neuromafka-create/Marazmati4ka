https://t.me/prog_ai/1157


В Ollama 0.24 завезли - Codex App

Сначала скачать (https://ollama.com/download)


ollama launch codex-app


Для задач программирования и работы с агентами:
• kimi-k2.6:cloud (с поддержкой vision)
• glm-5.1:cloud
 
Если у вас еще нет платной подписки на облачные сервисы Ollama, выберите модель, поддерживающую надежный вызов tools:
• nemotron-3-super:cloud
• gemma4:31b:cloud
• qwen3.6

Для восстановления профиля Codex по умолчанию используйте параметр --restore


ollama launch codex-app --restore

Жаль, в Codex CLI это работать не будет.

https://ollama.com - вайбкодь на шару вместе с Оллама