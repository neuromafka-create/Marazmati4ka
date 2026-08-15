https://t.me/c/1949803600/131500



Чтобы получить из GPT-5.6 максимум у меня получилась такая...

 Подробная шпаргалка - САММАРАЙЗ официального гайда по работе с GPT-5.6: рекомендации по промтингу, готовые шаблоны запросов, советы по переносу проектов на новую модель и разбор её новых возможностей.

1. НОВЫЕ ВОЗМОЖНОСТИ GPT-5.6

GPT-5.6 - новый стандарт качества и эффективности для сложных продакшн-задач. Особенно хорош в экономии токенов и создании красивых фронтенд-интерфейсов (верстка, визуальная иерархия, дизайн).

НОВАЯ СХЕМА ИМЕНОВАНИЯ:
⚪️gpt-5.6 (алиас) → направляет на gpt-5.6-sol
⚪️gpt-5.6-sol - флагманская модель, максимальные возможности
⚪️gpt-5.6-terra - баланс интеллекта и стоимости
⚪️ gpt-5.6-luna - эффективная, для высоких объёмов запросов

КЛЮЧЕВЫЕ НОВИНКИ:

1) Programmatic Tool Calling (PTC)
Модель пишет JavaScript-код для вызова инструментов, передаёт результаты между вызовами и обрабатывает промежуточные данные в hosted-рантайме. Подходит для ограниченных, инструментоёмких задач, где не нужно «думать» между шагами. Совместимо с Zero Data Retention, без доп. расходов на контейнеры.

2) Multi-agent (бета)
GPT-5.6 может координировать несколько подагентов параллельно и синтезировать их результаты. Снижает время выполнения для задач, которые делятся на независимые потоки. Доступно в Responses API.

3) Explicit Prompt Caching
Можно вручную указать, какие префиксы промптов кэшировать. Запись в кэш стоит 1.25× от обычной цены входных токенов, чтение из кэша - со скидкой. Можно продолжать использовать автоматическое (implicit) кэширование.

4) Persisted Reasoning
Модель переиспользует reasoning-элементы между ходами диалога. Улучшает качество многоходовых сессий и эффективность кэша. Управляется через reasoning.context.

5) Max Reasoning Effort
Новый уровень reasoning.effort = "max" для самых сложных задач. Шкала: none → low → medium → high → xhigh → max.

6) Pro Mode
Модель выполняет больше внутренней работы для повышения надёжности. Включается через reasoning.mode: "pro". Увеличивает задержку и расход токенов, но повышает качество для сложных задач.

7) Token Efficiency
Достигает frontier-уровня качества с меньшим количеством выходных токенов.

8) Улучшенный Frontend Design
Создаёт более красивые и юзабельные сайты/приложения - лучше верстка, визуальная иерархия, дизайнерские решения.

9) Intent Understanding
Лучше понимает цель пользователя из контекста. Не нужно прописывать каждый шаг - достаточно дать контекст, ограничения и критерии успеха.

10) Original Image Detail
Сохраняет оригинальные размеры изображений (не ресайзит). Большие картинки = больше токенов.

2. РЕКОМЕНДАЦИИ ПО ПРОМТИНГУ

ПРАВИЛО 1: Делайте промпты КОРОЧЕ (Lean Prompts)
📌Убирайте повторяющиеся инструкции и примеры
📌 Упрощайте описания инструментов
📌 Результат: +10-15% к качеству, -41-66% токенов, -33-67% стоимости
📌 Метод: удаляйте по одной группе инструкций за раз и тестируйте
📌 Каждую инструкцию формулируйте ОДИН раз
📌 Оставляйте примеры только если они закрывают конкретный пробел в качестве

ПРАВИЛО 2: Определяйте границы автономии
GPT-5.6 проактивен в многошаговых задачах. Чётко укажите, что модель может делать сама, а что требует подтверждения.

Готовый шаблон:

For requests to answer, explain, review, diagnose, or plan — inspect the relevant materials and report the result. Do not implement changes unless the request also asks for them.
For requests to change, build, or fix — make the requested in-scope local changes and run relevant non-destructive validation without asking first.
Require confirmation for external writes, destructive actions, purchases, or a material expansion of scope.


Важно: НЕ повторяйте "ask first" / "do not mutate" / "wait for approval" - это вызывает лишние запросы подтверждения.

ПРАВИЛО 3: Длина и стиль ответа
📌 GPT-5.6 по умолчанию ЛАКОНИЧНЕЕ чем GPT-5.5
📌Проверьте, нужны ли ещё инструкции типа "Be concise" — могут делать ответы слишком короткими
📌 Используйте text.verbosity: "low" / "medium" / "high" для контроля детализации
📌 Для коротких ответов указывайте, что ОБЯЗАТЕЛЬНО включить:

Готовый шаблон:
Lead with the conclusion. Include the evidence needed to support it, any material caveat, and the next action. Omit secondary detail and repetition.
Keep all required facts, decisions, caveats, and next steps. Trim introductions, repetition, generic reassurance, and optional background first.

ПРАВИЛО 4: Определяйте тон конкретно
📌 Не пишите абстрактно "friendly" или "empathetic"
📌Описывайте конкретные решения: насколько прямо отвечать, когда признавать проблему, нужны ли заверения.

Готовый шаблон:

State the answer directly. If the user reports a problem, acknowledge the specific issue before giving the next step. Use reassurance only when it is relevant. Omit generic praise and unnecessary sign-offs.


3. ГОТОВЫЕ ШАБЛОНЫ ЗАПРОСОВ

ШАБЛОН: Pro Mode запрос (сложный анализ)

Review this database migration plan for failure modes that could cause data loss or extended downtime. For each finding, cite the relevant step, estimate impact and likelihood, and recommend a specific mitigation. Return the five most important risks in severity order.

ШАБЛОН: Programmatic Tool Calling (оркестрация инструментов)

<tool_orchestration>
Use Programmatic Tool Calling for [bounded stage] using only [eligible tools].
Run independent calls concurrently when safe. Use only documented tool input and output fields.
Process and reduce the intermediate results, then emit exactly [output schema], including the evidence needed for the final answer.
Stop when [condition] is met. Retry transient failures at most [R] times.
Do not repeat completed calls or perform side-effecting actions. If a required result is still missing, return a clear structured failure.
Use direct tool calls for [semantic judgment, approval, or final validation].
</tool_orchestration>


4. СОВЕТЫ ПО МИГРАЦИИ С GPT-5.5/5.

ШАГ 1: Выбрать модель
⚪️ gpt-5.6-sol — для максимального качества
⚪️gpt-5.6-terra — баланс цена/качество
⚪️ gpt-5.6-luna — для массовых задач

ШАГ 2: Настроить reasoning.effort
⚪️ Начните с текущей настройки из GPT-5.5/5.4
⚪️ Протестируйте на уровень НИЖЕ — GPT-5.6 часто даёт то же качество с меньшим reasoning
⚪️none → low → medium → high → xhigh → max
⚪️ medium — хорошая стартовая точка
⚪️ max — только для самых сложных задач

ШАГ 3: Настроить Persisted Reasoning
⚪️ reasoning.context: "auto" — по умолчанию (модель решает сама)
⚪️ reasoning.context: "all_turns" — когда цели и приоритеты стабильны между ходами
⚪️ reasoning.context: "current_turn" — когда прошлое рассуждение неактуально
⚪️ Для ZDR: добавить include: ["reasoning.encrypted_content"] и переигрывать encrypted reasoning items

ШАГ 4: Пересмотреть кэширование
⚪️Implicit кэширование работает без изменений кода
⚪️Запись в кэш = 1.25× цены входных токенов
⚪️ Отслеживать cached_tokens и cache_write_tokens
⚪️ Заменить prompt_cache_retention на prompt_cache_options.ttl

ШАГ 5: Упростить промпты
⚪️ GPT-5.6 лучше понимает намерения - убрать лишние пошаговые инструкции
⚪️Проверить, не стали ли ответы слишком короткими из-за старых "be concise"
⚪️ Убрать повторяющиеся инструкции

ШАГ 6: Автоматическая миграция через Codex

Команда: 
$openai-docs migrate this project to the GPT-5.6 model family

Скилл: 
github.com/openai/skills/tree/main/skills/.curated/openai-docs

5. БЕЗОПАСНОСТЬ И ОГРАНИЧЕНИЯ

⚪️ Работают real-time классификаторы кибер- и био-угроз
⚪️ Могут блокировать запросы или ставить генерацию на паузу (несколько секунд)
⚪️ Иногда срабатывают на легитимную работу (security research, код-ревью)
⚪️ Для приложений с конечными пользователями: отправляйте safety_identifier с каждым запросом

6. КОГДА ЧТО ИСПОЛЬЗОВАТЬ - КРАТКАЯ ТАБЛИЦА

📌 Простые быстрые задачи → gpt-5.6-luna, reasoning: none/low
📌Стандартная работа → gpt-5.6-terra, reasoning: medium

📌Сложные задачи → gpt-5.6-sol, reasoning: high/xhigh
📌 Критически важные задачи → gpt-5.6-sol, reasoning: max + pro mode
📌 Много инструментов, фильтрация данных → Programmatic Tool Calling
📌 Параллельные независимые подзадачи → Multi-agent (beta)
📌 Многоходовые диалоги → Persisted Reasoning (all_turns)