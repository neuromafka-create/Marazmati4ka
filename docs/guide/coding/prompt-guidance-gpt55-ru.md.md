---
title: "prompt-guidance-gpt55-ru.md"
source: "C:/Projects/Marazmati4ka/raw-docs/doc-pdf-xls/prompt-guidance-gpt55-ru.md.docx"
type: docx
converted_at: "2026-08-14T15:27:57"
---

# prompt-guidance-gpt55-ru.md

# Руководство по промптингу | OpenAI API

**Оригинал:** [developers.openai.com/api/docs/guides/prompt-guidance?model=gpt-5.5](https://developers.openai.com/api/docs/guides/prompt-guidance?model=gpt-5.5) **Перевод:** Роман Сухов, [@sukhov_live](https://t.me/sukhov_live)

![image]()

## Руководство по промптингу GPT-5.5

### Что нового в GPT-5.5 по сравнению с GPT-5.4

- Короткие промпты, ориентированные на результат, обычно работают лучше, чем навороченные стеки инструкций по процессу.
- Более эффективное рассуждение означает, что уровни `low` и `medium` стоит пересмотреть прежде, чем повышать.
- Преамбулы, обработка `phase` и воспроизведение assistant-item по-прежнему важны для workflow с большим количеством вызовов инструментов в Responses API.
- Явно заданная личность модели, бюджеты на поиск и правила валидации помогают формировать UX для клиентских и агентных сценариев.

GPT-5.5 лучше всего работает, когда промпт описывает целевой результат и оставляет модели пространство для выбора эффективного пути решения. По сравнению с предыдущими моделями часто можно использовать более короткие промпты, ориентированные на результат: опишите, как выглядит хороший ответ, какие ограничения важны, какие данные доступны и что должен содержать финальный ответ.

Не стоит переносить каждую инструкцию из старого стека промптов. Устаревшие промпты часто чрезмерно детализируют процесс, потому что ранние модели нуждались в большей помощи, чтобы не сбиваться с курса. С GPT-5.5 это может добавить шума, сузить пространство поиска модели или привести к механически звучащим ответам.

Подробнее об изменениях поведения GPT-5.5 читайте в [руководстве по использованию GPT-5.5](https://developers.openai.com/api/docs/guides/latest-model). Этот гайд фокусируется на изменениях промптов, вытекающих из изменений поведения модели.

Паттерны здесь это отправные точки. Адаптируйте их под свой продукт, инструменты, метрики и цели пользовательского опыта.

![image]()

## Автоматическая миграция через Codex

Codex может реализовать изменения из этого гайда с помощью [OpenAI Docs Skill](https://github.com/openai/skills/tree/main/skills/.curated/openai-docs).

$ openai-docs migrate this project to gpt-5.5

Чтобы использовать этот скилл в других кодинг-агентах, скачайте его из [репозитория OpenAI skills](https://github.com/openai/skills/tree/main/skills/.curated/openai-docs).

![image]()

## Личность и поведение

По умолчанию стиль GPT-5.5 эффективный, прямой и ориентированный на задачу. Это полезно для продуктовых систем: ответы сфокусированы, поведением легче управлять, модель избегает лишнего разговорного "наполнителя".

Для клиентских ассистентов, потоков поддержки, коучинговых сценариев и других разговорных продуктов нужно определить и личность, и стиль сотрудничества.

- **Личность** управляет тем, как звучит ассистент: тон, теплота, прямота, формальность, юмор, эмпатия и уровень "полировки".
- **Стиль сотрудничества** управляет тем, как ассистент работает: когда он задаёт вопросы, когда делает допущения, насколько проактивен, сколько контекста даёт, когда проверяет свою работу и как справляется с неопределённостью или рисками.

Оба блока должны быть короткими. Инструкции по личности формируют пользовательский опыт. Инструкции по сотрудничеству формируют поведение при выполнении задач. Ни то, ни другое не должно заменять чёткие цели, критерии успеха, правила инструментов или условия остановки.

### Пример блока личности для стабильного ассистента, ориентированного на задачи:

# Personality

You are a capable collaborator: approachable, steady, and direct. Assume the

user is competent and acting in good faith, and respond with patience, respect,

and practical helpfulness.

Prefer making progress over stopping for clarification when the request is

already clear enough to attempt. Use context and reasonable assumptions to move

forward. Ask for clarification only when the missing information would

materially change the answer or create meaningful risk, and keep any question

narrow.

Stay concise without becoming curt. Give enough context for the user to

understand and trust the answer, then stop. Use examples, comparisons, or

simple analogies when they make the point easier to grasp. When correcting the

user or disagreeing, be candid but constructive. When an error is pointed out,

acknowledge it plainly and focus on fixing it.

Match the user's tone within professional bounds. Avoid emojis and profanity by

default, unless the user explicitly asks for that style or has clearly

established it as appropriate for the conversation.

### Пример блока личности для выразительного, совместного ассистента:

# Personality

Adopt a vivid conversational presence: intelligent, curious, playful when

appropriate, and attentive to the user's thinking. Ask good questions when the

problem is blurry, then become decisive once there is enough context.

Be warm, collaborative, and polished. Conversation should feel easy and alive,

but not chatty for its own sake. Offer a real point of view rather than merely

mirroring the user, while staying responsive to their goals and constraints.

Be thoughtful and grounded when the task calls for synthesis or advice. State a

clear recommendation when you have enough context, explain important tradeoffs,

and name uncertainty without becoming evasive.

Для более выразительных продуктов добавьте теплоту, любопытство, юмор или точку зрения явно, но держите блок коротким. Используйте личность, чтобы формировать опыт, а не чтобы компенсировать нечёткие цели или недостающие инструкции к задаче.

![image]()

## Ускорение появления первого видимого токена с помощью преамбулы

В стриминговых приложениях пользователи замечают, сколько времени проходит до появления первого видимого ответа. GPT-5.5 может тратить время на рассуждение, планирование или подготовку вызовов инструментов прежде, чем начнёт выдавать видимый текст.

Для длинных или инструменто-ёмких задач попросите модель начать с короткой преамбулы: краткого видимого обновления, которое подтверждает получение запроса и описывает первый шаг. Это улучшает воспринимаемую отзывчивость, не меняя саму задачу.

Используйте этот паттерн, когда задача может потребовать более одного шага, вызовов инструментов или длительного агентного workflow.

Before any tool calls for a multi-step task, send a short user-visible update

that acknowledges the request and states the first step. Keep it to one or two

sentences.

Для кодинг-агентов, которые разделяют фазы сообщений, можно быть более явным:

You must always start with an intermediary update before any content in the

analysis channel if the task will require calling tools. The user update should

acknowledge the request and explain your first step.

![image]()

## Промпты, ориентированные на результат, и условия остановки

GPT-5.5 сильнее всего, когда промпт определяет целевой результат, критерии успеха, ограничения и доступный контекст, а затем позволяет модели самой выбрать путь.

Для многих задач описывайте пункт назначения, а не каждый шаг. Это даёт модели пространство для выбора правильного поиска, инструмента или стратегии рассуждения.

### Предпочтительный стиль:

Resolve the customer's issue end to end.

Success means:

- the eligibility decision is made from the available policy and account data
- any allowed action is completed before responding
- the final answer includes completed_actions, customer_message, and blockers
- if evidence is missing, ask for the smallest missing field

**Избегайте лишних абсолютных правил.** Старые промпты часто используют жёсткие инструкции вроде `ALWAYS`, `NEVER`, `must`, `only` для контроля поведения модели. Используйте эти слова для настоящих инвариантов: правила безопасности, обязательные поля вывода, действия, которые никогда не должны происходить. Для решений, требующих суждения (когда искать, когда уточнять, какой инструмент использовать, продолжать ли итерацию), предпочитайте правила принятия решений.

### Чего стоит избегать (если каждый шаг не является обязательным):

First inspect A, then inspect B, then compare every field, then think through

all possible exceptions, then decide which tool to call, then call the tool,

then explain the entire process to the user.

### Добавьте явные условия остановки:

Resolve the user query in the fewest useful tool loops, but do not let loop

minimization outrank correctness, accessible fallback evidence, calculations,

or required citation tags for factual claims.

After each result, ask: "Can I answer the user's core request now with useful

evidence and citations for the factual claims?" If yes, answer.

### Определите поведение при нехватке данных:

Use the minimum evidence sufficient to answer correctly, cite it precisely,

then stop.

![image]()

## Форматирование

GPT-5.5 очень хорошо поддаётся управлению форматом и структурой вывода. Используйте это, когда это улучшает восприятие или соответствует вашему продуктовому UI.

Задайте `text.verbosity`, опишите ожидаемую форму вывода и оставьте более тяжёлую структуру для случаев, когда она улучшает понимание или вашему UI нужен стабильный артефакт. По умолчанию API для `text.verbosity` используется `medium`; используйте `low`, когда предпочитаете более короткие, лаконичные ответы.

### Простое разговорное форматирование:

Let formatting serve comprehension. Use plain paragraphs as the default format

for normal conversation, explanations, reports, documentation, and technical

writeups. Keep the presentation clean and readable without making the structure

feel heavier than the content.

Use headers, bold text, bullets, and numbered lists sparingly. Reach for them

when the user requests them, when the answer needs clear comparison or ranking,

or when the information would be harder to scan as prose. Otherwise, favor short

paragraphs and natural transitions.

Respect formatting preferences from the user. If they ask for a terse answer,

minimal formatting, no bullets, no headers, or a specific structure, follow

that preference unless there is a strong reason not to.

### Добавьте явные указания на аудиторию и длину:

Write for a senior business audience. Keep the answer under 400 words. Use

short paragraphs and only include bullets when they improve scannability.

Prioritize the conclusion first, then the reasoning, then caveats.

Для редактирования, рерайта, саммари или клиентских сообщений скажите модели, что сохранить, прежде чем просить улучшить стиль. Этот паттерн полезен, когда вы хотите шлифовку без раздувания текста.

Preserve the requested artifact, length, structure, and genre first. Quietly

improve clarity, flow, and correctness. Do not add new claims, extra sections,

or a more promotional tone unless explicitly requested.

![image]()

## Заземление (grounding), цитирование и бюджеты на поиск

Для обоснованных ответов правила цитирования должны быть частью промпта. Определите, что требует подтверждения, что считается достаточным доказательством, и как модель должна действовать при отсутствии доказательств. Отсутствие доказательств не должно автоматически превращаться в фактическое "нет". Подробнее и с примерами смотрите [руководство по форматированию цитат](https://developers.openai.com/api/docs/guides/citation-formatting).

### Добавьте явный бюджет на поиск

Бюджеты на поиск это правила остановки для поисковых запросов. Они говорят модели, когда доказательств достаточно.

For ordinary Q&A, start with one broad search using short, discriminative

keywords. If the top results contain enough citable support for the core

request, answer from those results instead of searching again.

Make another retrieval call only when:

- The top results do not answer the core question.
- A required fact, parameter, owner, date, ID, or source is missing.
- The user asked for exhaustive coverage, a comparison, or a comprehensive

list.

- A specific document, URL, email, meeting, record, or code artifact must be

read.

- The answer would otherwise contain an important unsupported factual claim.

Do not search again to improve phrasing, add examples, cite nonessential

details, or support wording that can safely be made more generic.

![image]()

## Защитные механизмы для креативных черновиков

Для задач по созданию черновиков скажите модели, какие утверждения должны быть из источников, а какие части можно писать свободно. Это особенно важно для слайдов, launch-копирайтинга, клиентских саммари, скриптов для звонков, блёрбов для руководства и формирования нарратива.

For creative or generative requests such as slides, leadership blurbs,

outbound copy, summaries for sharing, talk tracks, or narrative framing,

distinguish source-backed facts from creative wording.

- Use retrieved or provided facts for concrete product, customer, metric,

roadmap, date, capability, and competitive claims, and cite those claims.

- Do not invent specific names, first-party data claims, metrics, roadmap

status, customer outcomes, or product capabilities to make the draft sound

stronger.

- If there is little or no citable support, write a useful generic draft with

placeholders or clearly labeled assumptions rather than unsupported specifics.

![image]()

## Фронтенд-разработка и визуальный вкус

Для фронтенд-задач обращайтесь к [примерам инструкций](https://developers.openai.com/api/docs/guides/frontend-prompt) с практическими способами управления качеством UI. Они охватывают продуктовый и пользовательский контекст, соответствие дизайн-системе, юзабилити первого экрана, привычные контролы, ожидаемые состояния, адаптивное поведение, а также типичные дефолты генеративного UI, которых стоит избегать: шаблонные "героические" блоки, вложенные карточки, декоративные градиенты, видимый инструкционный текст и поломанные макеты.

![image]()

## Попросите модель проверить свою работу

Дайте GPT-5.5 доступ к инструментам, которые позволяют ему проверять результат, когда валидация возможна.

### Для кодинг-агентов попросите конкретные команды валидации:

After making changes, run the most relevant validation available:

- targeted unit tests for changed behavior
- type checks or lint checks when applicable
- build checks for affected packages
- a minimal smoke test when full validation is too expensive

If validation cannot be run, explain why and describe the next best check.

### Для визуальных артефактов попросите инспекцию после рендеринга:

Render the artifact before finalizing. Inspect the rendered output for layout,

clipping, spacing, missing content, and visual consistency. Revise until the

rendered output matches the requirements.

### Для инженерных и планировочных задач сделайте планы реализации прослеживаемыми:

For implementation plans, include:

- requirements and where each is addressed
- named resources, files, APIs, or systems involved
- state transitions or data flow where relevant
- validation commands or checks
- failure behavior
- privacy and security considerations
- open questions that materially affect implementation

![image]()

## Параметр phase

Начиная с GPT-5.4, длительные или инструменто-ёмкие workflow в Responses API могут использовать значения `phase` в assistant-item для разграничения промежуточных обновлений и финального ответа. GPT-5.5 использует тот же паттерн.

Если вы используете `previous_response_id`, API автоматически сохраняет предыдущее состояние ассистента. Если ваше приложение вручную воспроизводит output items ассистента в следующем запросе, сохраняйте каждое оригинальное значение `phase` и передавайте его обратно без изменений. Это важнее всего, когда ответ включает преамбулы, повторные вызовы инструментов или финальный ответ после промежуточных обновлений ассистента.

If manually replaying assistant items:

- Preserve assistant `phase` values exactly.
- Use `phase: "commentary"` for intermediate user-visible updates.
- Use `phase: "final_answer"` for the completed answer.
- Do not add `phase` to user messages.

![image]()

## Рекомендуемая структура промпта

Используйте эту структуру как отправную точку для сложных промптов. Держите каждую секцию короткой. Добавляйте детали только там, где они меняют поведение.

Role: [1-2 предложения, определяющие функцию модели, контекст и задачу]

# Personality

[тон, манера и стиль сотрудничества]

# Goal

[видимый пользователю результат]

# Success criteria

[что должно быть верным до финального ответа]

# Constraints

[политика, безопасность, бизнес, доказательства и ограничения побочных

эффектов]

# Output

[секции, длина и тон]

# Stop rules

[когда повторять, делать fallback, воздерживаться, спрашивать или

останавливаться]

![image]()

**Перевод выполнен для Telegram-канала **[**@sukhov_live**](https://t.me/sukhov_live) Источник: OpenAI Developers — Prompt Guidance (GPT-5.5)
