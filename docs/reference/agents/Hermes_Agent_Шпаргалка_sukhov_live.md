---
title: "Hermes_Agent_Шпаргалка_sukhov_live"
source: "C:/Projects/Marazmati4ka/raw-docs/doc-pdf-xls/Hermes_Agent_Шпаргалка_sukhov_live.pdf"
type: pdf
converted_at: "2026-08-14T15:27:50"
pages: 7
---

# Hermes_Agent_Шпаргалка_sukhov_live

## Page 1

HERMES AGENT
# Полная шпаргалка

Промт для контекста, три моих любимых скилла, все команды установки
и запуск канбана. В одном файле, чтобы не искать по описанию ролика.

### Что внутри

1. Промт для генерации user.md / memory.md. Скидываете в ChatGPT, он проводит
интервью из 7 вопросов и собирает текст, который вы отправляете Hermes одним
сообщением. Агент сразу знает, кто вы.
1. Три моих любимых скилла. Уже встроены в Hermes из коробки, ничего ставить
отдельно не нужно.
1. Шпаргалка установки. Каждый шаг с реальной командой и пояснением, что делает.
1. Запуск канбан-доски. Веб-интерфейс с задачами на день, проброс порта,
демо-команды.

### Перед стартом понадобится

VPS на Beget или любом провайдере с Ubuntu 24.04. Подписка ChatGPT Plus.
Telegram-аккаунт. Терминал на компе (Terminal на Mac, PowerShell или PuTTY на
Windows). Минимальная конфигурация сервера: 2 CPU, 4 ГБ RAM, 40 ГБ SSD, около 600
рублей в месяц.

В ChatGPT заранее включи: Settings → Security → Allow CLI access. Без этой галочки
авторизация Codex не пройдёт. Самая частая ошибка новичков.

Hermes Agent · полная шпаргалка · @sukhov_live · 24-ai.ru
стр. 1

## Page 2

ЧАСТЬ 1
# Промт для генерации

# user.md и memory.md

Скиньте этот промт в свою AI (ChatGPT-5, Claude, Gemini) одним сообщением. Она
проведёт интервью из 7 вопросов и соберёт готовый текст, который вы потом одним
сообщением отправите своему Hermes.

Ты — мой помощник по настройке Hermes Agent. Проведи интервью из 7 вопросов и собери
ответы в готовый brain dump.

Правила:
- Один вопрос за раз
- Не комментируй ответы по ходу
- Короткий ответ — задай уточняющий
- В конце собери всё в финальный структурированный текст

Вопросы:
1. Кто ты, чем занимаешься?
1. 1–3 главных проекта сейчас?
1. Как выглядит твой рабочий день, какие инструменты?
1. Цели на 3–6 месяцев?
1. Что важно в работе и общении?
1. Как предпочитаешь общаться с AI?
1. Что ещё стоит знать про тебя?

После моих ответов собери всё в структурированный текст:
- Кто я
- Мои проекты
- Как я работаю
- Цели на ближайшие месяцы
- Что для меня важно
- Как со мной общаться
- Дополнительно

В конце добавь инструкцию для Hermes: обновить user.md и memory.md по этой
информации, запомнить мой стиль общения, при новых задачах сначала смотреть текущий
контекст.

Начинай с первого вопроса.

Совет: заранее подумайте ответы. Чем глубже расскажете о себе на этом этапе, тем
меньше будете переучивать агента потом. 10 минут на интервью экономят часы переписки
в первую неделю.

Hermes Agent · полная шпаргалка · @sukhov_live · 24-ai.ru
стр. 2

## Page 3

ЧАСТЬ 2
# Три моих любимых скилла

Все три уже встроены в Hermes из коробки. Ставить ничего не нужно, просто
пользоваться.

1. youtube-content

Кидаете ссылку на YouTube-ролик, получаете выжимку с тезисами, цитатами и
таймкодами. Разбор чужого видео занимает в 5 раз меньше времени.

1. google-workspace

Полный доступ к Gmail, Calendar, Drive, Docs и Sheets. Делегируете: «разгреби
входящую за вчера», «забронируй слот на пятницу», «собери табличку по этим
документам». Сильно меняет ощущение от рабочего дня.

1. kanban-codex-lane

Связка канбана с Codex. Выписываете задачи в triage, агент сам разбирает, переносит
по колонкам, делает то, что может сделать сам, и отчитывается.

### Проверить наличие скиллов:

hermes skills list | grep youtube-content

hermes skills list | grep google-workspace

hermes skills list | grep kanban-codex-lane

### Доустановить, если нет:

hermes skill install &lt;skill-name&gt;

### Skill Hub

hermes-agent.nousresearch.com → Skills Hub. Почти 700 скиллов: копирайтинг,
продуктивность, финансы, маркетинг.

Hermes Agent · полная шпаргалка · @sukhov_live · 24-ai.ru
стр. 3

## Page 4

ЧАСТЬ 3
# Шпаргалка установки

### Шаг 1 · Подключение к серверу

ssh root@&lt;IP_СЕРВЕРА&gt;

Пароль приходит на почту после создания VPS. При вводе пароль не отображается, это
нормально.

### Шаг 2 · Сменить пароль при первом входе

Система автоматически попросит: Current password → New → Retype new.

### Шаг 3 · Обновить систему

apt update && apt upgrade -y

### Шаг 4 · Установить Hermes одной командой

curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

Установка идёт 2-3 минуты: Python, зависимости, 89-91 предустановленный скилл. По
завершению автоматически запустится Setup Wizard.

### Шаг 5 · Setup Wizard — пошагово

|   | Вопрос мастера | Что выбрать |   |
| --- | --- | --- | --- |
|  | How would you like to set up Hermes? | Quick setup (recommended) |  |
|  | Inference Provider | OpenAI Codex |  |
|  | Codex авторизация | Открыть URL в браузере, ввести код |  |
|  | Select terminal backend | Keep current (local) |  |
|  | Connect a messaging platform? | Set up messaging now |  |
|  | Toggle messaging platforms | Space на Telegram → Enter |  |
| Важный нюанс: на шаге выбора платформы используется Space чтобы поставить галочку и только потом Enter для подтверждения. Если сразу нажать Enter, ничего не выберется. |  |  |  |

Hermes Agent · полная шпаргалка · @sukhov_live · 24-ai.ru
стр. 4

## Page 5

Шаг 6 · Авторизация в OpenAI Codex

Hermes даст URL вида https://auth.openai.com/codex/device и одноразовый код.
Открываешь URL в браузере на компе (НЕ на сервере), входишь под почтой ChatGPT
Plus, вводишь код, подтверждаешь.

Если ошибка «CLI access denied» — ChatGPT → Settings → Security → Allow CLI access.

Шаг 7 · Создать Telegram-бота через BotFather

В Telegram: @BotFather → /newbot → имя (например, Hermes) → username с _bot на
конце. Копируешь токен (вид: 1234567890:ABCdef...). Никому не показываешь, это
ключ к боту.

Шаг 8 · Узнать свой Telegram Chat ID

В Telegram: @userinfobot → Start → копируешь свой числовой ID (например, 293103275).

Шаг 9 · Вставить токен и ID в wizard

Wizard последовательно спросит: Bot token → вставляешь. Allowed user IDs →
вставляешь свой ID. Home channel (Y/n) → y (тот же ID).

Шаг 10 · Install gateway as systemd service

Install the gateway as a systemd service? [Y/n]: y

Шаг 11 · Выбор типа сервиса — ВНИМАНИЕ

На вопрос «Choose how the gateway should run in the background» выбирай System service
(второй пункт), НЕ User service. На VPS нужен именно systemd-сервис, который работает
24/7 даже после выхода из SSH.

→ System service (starts on boot; requires sudo; still runs as your user)

Шаг 12 · Run as user

Run the system gateway service as which user?: root

Шаг 13 · Start service now

Start the service now? [Y/n]: y

Шаг 14 · Проверить, что gateway работает

sudo hermes gateway status --system

Должно быть active (running) зелёным. Идёшь в Telegram, открываешь своего бота,
жмёшь Start, пишешь «Привет». Если ответил — всё работает.

Hermes Agent · полная шпаргалка · @sukhov_live · 24-ai.ru
стр. 5

## Page 6

ЧАСТЬ 4
# Запуск канбан-доски

Канбан — это веб-интерфейс с задачами на день. Сервер крутится у тебя в VPS,
открывать дашборд надо в браузере на компе через SSH-туннель. Понадобится 3
разных окна, не путать.

Окно 1 · На сервере: запустить дашборд

hermes dashboard

Появится надпись Hermes Web UI @ http://127.0.0.1:9119. Это не команда, это адрес.
Окно не закрывай — дашборд работает, пока оно открыто.

Окно 2 · На Маке: новое окно терминала, проброс порта

ssh -L 9119:127.0.0.1:9119 root@&lt;IP_СЕРВЕРА&gt;

Введёшь пароль root. Окно тоже не закрывай — оно держит туннель между Маком и
сервером.

Окно 3 · Браузер: открыть канбан

http://127.0.0.1:9119

Открываешь Chrome или Safari, в адресной строке (НЕ в терминале) пишешь этот
адрес. Видишь канбан с колонками triage → ready → in_progress → blocked → done.

Шаг финальный · Заполнить канбан задачами

В Telegram-боте Hermes пишешь:

Добавь в triage задачи: 1. Написать сценарий ролика 2. Ответить на комментарии под
видео 3. Сделать обложку 4. Допилить лендинг

Карточки сразу появятся в браузере в колонке triage. Затем даёшь команду разобрать:

Возьми задачи из triage, посмотри в памяти, что ты по ним знаешь, дополни деталями и
переведи в ready. Затем начни работать по ним по порядку.

Hermes применит скилл kanban-codex-lane, переместит карточки в ready, потом в
in_progress, начнёт выполнять. Готовое уходит в done. Если нужны уточнения —
карточка переезжает в blocked, и бот пишет тебе.

Hermes Agent · полная шпаргалка · @sukhov_live · 24-ai.ru
стр. 6

## Page 7

# Полезные команды

| Что нужно | Команда |
| --- | --- |
| Запустить TUI чат на сервере | hermes |
| Выйти из TUI | Ctrl+C или /exit |
| Статус gateway | sudo hermes gateway status --system |
| Перезапуск gateway | sudo systemctl restart hermes-gateway |
| Логи gateway в реальном времени | sudo journalctl -u hermes-gateway -f |
| Файлы Hermes | ~/.hermes/ |
| Где user.md и memory.md | ~/.hermes/memory/ |
| Список скиллов | hermes skills list |
| Версия / обновить | hermes --version / hermes update |
| Диагностика | hermes doctor |
| Автопочинка проблем | hermes doctor --fix |
| Канбан-дашборд | hermes dashboard |
| Проброс порта 9119 | ssh -L 9119:127.0.0.1:9119 root@<IP> |

## Если что-то не работает

|   | Симптом | Решение | не в брау |
| --- | --- | --- | --- |
|  | Permission denied | sudo su - |  |
|  | Command not found: hermes | Перезайти в SSH (новая сессия подхватит PATH) |  |
|  | Бот в Telegram молчит | sudo systemctl restart hermes-gateway |  |
|  | Codex authorization failed | ChatGPT → Settings → Security → Allow CLI access |  |
|  | Дашборд не открывается в браузере | Проверить, что ssh -L 9119:... запущен в отдельном ок |  |
|  | В терминале «command not found: Herm | eСs»копировал адрес вместо команды. Адреса с http:// — |  |
|  | Setup wizard завершился пустым | На выборе платформы нужен Space перед Enter |  |
| Канал: @sukhov live · Сайт: 24-ai.ru · Клуб: digital-makers.ru _ |  |  |  |

Если шпаргалка помогла — напишите в комментариях под роликом «зашло». Лайк под
видео тоже не лишний.

Роман Сухов · @sukhov_live · 24-ai.ru · май 2026

Hermes Agent · полная шпаргалка · @sukhov_live · 24-ai.ru
стр. 7
