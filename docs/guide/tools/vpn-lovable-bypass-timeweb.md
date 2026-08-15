---
title: "vpn-lovable-bypass-timeweb"
source: "C:/Projects/Marazmati4ka/raw-docs/doc-pdf-xls/vpn-lovable-bypass-timeweb.docx"
type: docx
converted_at: "2026-08-14T15:28:25"
---

# vpn-lovable-bypass-timeweb

# VPN + WARP + SOCKS5 для доступа к lovable.dev (Timeweb Cloud)

Этот скилл проводит человека через полное развёртывание персональной VPN-инфраструктуры с нуля — от создания сервера до рабочего браузера, который грузит проекты на lovable.dev без шиммеров. Все шаги проверены на боевом сервере, все подводные камни задокументированы.

**Целевая аудитория:** разработчик с Mac, у которого есть только аккаунт Timeweb Cloud и желание получить стабильный доступ к lovable.dev. Предварительных знаний по сетям и Linux не требуется — ты ведёшь его за руку, по одной команде за раз.

**Важно про темп.** Давай команды строго по одной, с коротким пояснением, и жди подтверждения результата перед следующей. Никаких многокомандных блоков на 20+ строк — серийная веб-консоль Timeweb их обрезает (см. «Карту мин»).

## 0. Главное про рабочий браузер (прочитай первым)

Конечная цель всей цепочки — браузер, в котором lovable.dev грузит проекты. Есть **два способа** заставить браузер ходить через прокси:

- **Способ A — CLI-флаг (**`--proxy-server`**).** Браузер запускается из терминала с флагом, и **100% трафика процесса** идёт через прокси. Это проверенный, надёжный метод — именно он стоит в боевой эксплуатации.
- **Способ B — прокси-расширение (ZeroOmega).** Расширение маршрутизирует трафик по правилам (например, только `*.lovable.dev`). Удобнее в быту, но **на lovable.dev оказалось ненадёжным**: часть запросов (в т.ч. к API) проскакивает мимо прокси, Vercel видит датацентровый IP и отдаёт 403 → проекты не грузятся.

Оба способа описаны ниже (Этап 7). **Если коллега хочет надёжно — Способ A. Если хочет расширение — Способ B, но с готовым запасным вариантом (A) на случай 403.** Серверная часть (Этапы 1–6) одинакова для обоих способов.

## Все ресурсы и ссылки для скачивания

Собери это **до начала** — без них дальше не пройти.

### На сервере (ставится по SSH, команды в этапах ниже)

| Ресурс | Откуда | Примечание |
| --- | --- | --- |
| VPS | https://timeweb.cloud | Ubuntu 24.04, минимальный тариф (~200₽/мес) |
| WireGuard | apt install wireguard wireguard-tools | Этап 2 |
| Cloudflare WARP | apt-репозиторий Cloudflare | Этап 3, команды добавления репо там же |
| socat | apt install socat | Этап 4 |

### На Mac (клиент)

| Ресурс | Ссылка | Примечание |
| --- | --- | --- |
| WireGuard для Mac | App Store: https://apps.apple.com/app/wireguard/id1451685025 — или https://www.wireguard.com/install/ | Официальный, разработчик WireGuard Development Team |
| Яндекс Браузер | https://browser.yandex.ru/ | Подойдёт любой Chromium (см. ниже) |
| — Google Chrome (альтернатива) | https://www.google.com/chrome/ |  |
| — Brave (альтернатива) | https://brave.com/download/ |  |
| Прокси-расширение только для Способа B | см. блок ниже | Классический SwitchyOmega уже не работает! |

### Прокси-расширение для Способа B — читай внимательно

Историческое название — **Proxy SwitchyOmega**. Но:

- **Классический Proxy SwitchyOmega больше не работает в Chromium-браузерах** (Chrome, Яндекс, Brave, Edge). Его автор объявил о прекращении поддержки в январе 2025, а Google окончательно отключил расширения Manifest V2 в июле 2025 (Chrome 138). Старая ссылка на него теперь бесполезна для Chromium.
- Рабочая замена — форк **«Proxy SwitchyOmega 3 (ZeroOmega)»**, переписанный под Manifest V3. Поддерживается, актуальная версия 3.5.x (2026), интерфейс почти идентичен оригиналу.
- **Осторожно с подделками.** В магазине много фейковых форков под похожими именами; один такой фейк в декабре 2024 участвовал в supply-chain атаке на миллионы устройств. **Ставь только настоящий ZeroOmega** и проверяй, что в описании указан исходник `github.com/zero-peak/ZeroOmega`.

| Что | Ссылка |
| --- | --- |
| Исходники (источник истины) | https://github.com/zero-peak/ZeroOmega |
| Chrome Web Store (проверь источник = zero-peak!) | https://chromewebstore.google.com/detail/proxy-switchyomega-3-zero/pfnededegaaopdmhkdmcofjmoldfiped |

Если в магазине несколько похожих — найди «Proxy SwitchyOmega 3 (ZeroOmega)», открой карточку, убедись, что в разделе исходного кода стоит ссылка на `github.com/zero-peak/ZeroOmega`, и только тогда ставь.

## Архитектура и почему именно так

### Что НЕ работает напрямую и почему

1. **Cloudflare WARP на Mac напрямую** — Vercel (хостинг lovable.dev) блокирует датацентровые IP, а WARP отдаёт именно их. Симптом: главная страница открывается, но проекты не грузятся (шиммеры, “No workspace”), API возвращает `HTTP 403` с заголовком `x-vercel-mitigated: deny`.
1. **MTProto/любой TCP-прокси на Timeweb** — Timeweb прогоняет ВЕСЬ TCP-трафик через Qrator DDoS-защиту, которая режет нестандартный TCP на любых портах (443, 8443, 2096 — без разницы). Отключить Qrator из панели **нельзя**. Значит, решение должно использовать **UDP**.
1. **VPN до своего сервера** напрямую тоже не спасёт — твой VPS тоже датацентровый IP, Vercel заблокирует.

### Архитектура, которая работает

`Mac → WireGuard (UDP:51820) → VPS на Timeweb → Cloudflare WARP (SOCKS5)`
`                                                       ↓`
`                                          [WARP даёт «чистый» IP]`
`                                                       ↓`
`                                                 lovable.dev / Vercel`

Ключевая идея: **WireGuard обходит Qrator** (UDP не фильтруется), **WARP на VPS обходит Vercel** — но используется не как туннель, а как SOCKS5-прокси для конкретного браузера. Браузер на Mac ходит через всю цепочку.

### Почему Chromium-браузер с CLI-флагом (Способ A)

Запуск браузера из терминала с `--proxy-server` гонит через прокси **весь** трафик процесса, включая DNS (`socks5://` в Chromium делает remote resolve) и все API-вызовы. Отдельный профиль (`--user-data-dir`) изолирует это от обычного браузера. Это единственный 100% надёжный способ для lovable.dev.

## Чек-лист готовности (спроси ДО начала)

1. **Аккаунт Timeweb Cloud** с возможностью оплаты.
1. **Mac с macOS** (Linux/Windows тоже можно, но здесь описан Mac).
1. **Установленный Chromium-браузер** (Яндекс/Chrome/Brave) на Mac.
1. **Аккаунт lovable.dev** уже зарегистрирован.
1. **Терминал** на Mac (Terminal.app, входит в систему).

Чего нет — попроси поставить до старта.

## Этап 1. Создание VPS на Timeweb Cloud

### 1.1. Создать сервер

1. https://timeweb.cloud → авторизоваться.
1. **Облачные серверы** → **Создать**.
1. Параметры:
  - **ОС:** Ubuntu 24.04
  - **Тариф:** минимальный (1 vCPU, 1 GB RAM, 15 GB SSD — хватит с запасом).
  - **Локация:** любая (Москва/СПб/Амстердам подойдут).
  - **Доступ:** **по паролю** (сохранить пароль root) — SSH-ключи можно настроить потом.
1. Создать → подождать 1–2 минуты.
1. Из карточки сервера записать **IPv4-адрес** и **пароль root**.

### 1.2. Подключиться по SSH

В Terminal на Mac:

ssh root@<IPv4_СЕРВЕРА>

При первом подключении — `yes` на вопрос про fingerprint, затем пароль.

Если придётся работать в веб-консоли Timeweb — она **обрезает длинные вставки** (~20+ строк). Всегда работай по SSH из Terminal; в веб-консоли дроби команды по одной.

## Этап 2. WireGuard на сервере

### 2.1. Обновить и поставить

apt update && apt upgrade -y
apt install -y wireguard wireguard-tools iptables-persistent

При установке `iptables-persistent` спросит про сохранение правил — **Yes** на оба вопроса.

### 2.2. Включить IP forwarding

echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

Должно вывести `net.ipv4.ip_forward = 1`.

### 2.3. Сгенерировать ключи сервера и первого клиента

mkdir -p /opt/wireguard-clients
cd /etc/wireguard
umask 077

wg genkey | tee /opt/wg-server-private | wg pubkey > /opt/wg-server-public
wg genkey | tee /opt/wg-client1-private | wg pubkey > /opt/wg-client1-public
wg genpsk > /opt/wg-psk1

### 2.4. Узнать имя сетевого интерфейса

ip route | grep default

В выводе будет `default via X.X.X.X dev eth0` — запомни имя после `dev` (обычно `eth0`; если другое — подставь ниже).

### 2.5. Создать конфиг сервера

SERVER_PRIV=$(cat /opt/wg-server-private)
CLIENT_PUB=$(cat /opt/wg-client1-public)
PSK=$(cat /opt/wg-psk1)

cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = 10.66.66.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIV
MTU = 1200

PostUp   = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $CLIENT_PUB
PresharedKey = $PSK
AllowedIPs = 10.66.66.2/32
EOF

chmod 600 /etc/wireguard/wg0.conf

**КРИТИЧНО про MTU = 1200.** Значение по умолчанию 1420 **не работает** из-за двойной инкапсуляции (WireGuard внутри WARP + накладные расходы Qrator). 1280 — на грани. Только **1200** даёт стабильность. Не трогай это значение.

Если интерфейс не `eth0` — замени `eth0` в обеих строках iptables.

### 2.6. Запустить WireGuard

systemctl enable --now wg-quick@wg0
systemctl status wg-quick@wg0

В статусе `active (exited)` — это нормально для wg-quick.

wg show

Покажет интерфейс `wg0` и один peer без handshake (появится, когда подключится клиент).

### 2.7. Открыть порт WireGuard в файрволе

iptables -I INPUT -p udp --dport 51820 -j ACCEPT
netfilter-persistent save

## Этап 3. Cloudflare WARP

### 3.1. Добавить репозиторий и поставить

curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ noble main" | tee /etc/apt/sources.list.d/cloudflare-client.list

apt update
apt install -y cloudflare-warp

Если `noble` (24.04) не находится — попробуй `jammy`.

### 3.2. Зарегистрировать и переключить в proxy mode

warp-cli registration new
warp-cli mode proxy
warp-cli connect

Через 5–10 секунд:

warp-cli status

Должно быть `Connected`.

warp-cli settings | grep -i mode

Должно показать `WarpProxy` на порту `40000`.

### 3.3. Проверить WARP

curl --socks5 127.0.0.1:40000 -sI https://api.lovable.dev | head -3

Ожидаемо — `HTTP/2 404` (соединение прошло, просто такого endpoint нет). Если **403** — WARP не подключён, повтори `warp-cli connect`. Если таймаут — пересоздай регистрацию: `warp-cli registration delete && warp-cli registration new`.

### ❌ КРИТИЧНО — ЧТО НЕЛЬЗЯ ДЕЛАТЬ С WARP

Карта мин, оплаченная часами отладки. Не повторяй.

- ❌ **НЕ** переключать WARP в `warp` или `warp+doh` (полный туннель) — сломает ВЕСЬ трафик WireGuard-клиентов. Только `warp-cli mode proxy`.
- ❌ **НЕ** добавлять маршруты `ip route add ... dev CloudflareWARP` — ломает всё.
- ❌ **НЕ** делать `iptables -t nat -A PREROUTING -i wg0 -p tcp -j REDIRECT` — ломает трафик.
- ❌ **НЕ** ставить `redsocks` для всего трафика wg0.
- ✅ Работает **только**: WARP в proxy mode + socat-мост + явный прокси в браузере.

## Этап 4. socat-мост (WARP → WireGuard-подсеть)

WARP слушает только `127.0.0.1:40000`. Mac-клиент через WireGuard видит `10.66.66.1`. Нужен мост.

### 4.1. Поставить и запустить

apt install -y socat
socat TCP-LISTEN:40000,bind=10.66.66.1,fork,reuseaddr TCP:127.0.0.1:40000 &

Проверка:

ss -tlnp | grep 40000

Должно быть **две** строки: `127.0.0.1:40000` (warp-svc) и `10.66.66.1:40000` (socat).

### 4.2. Открыть порт 40000 в файрволе

iptables -I INPUT -p tcp --dport 40000 -j ACCEPT
netfilter-persistent save

### 4.3. КРИТИЧНО про автозапуск после ребута

`socat` запущен через `&` и **не переживёт перезагрузку**. То же с `warp-cli connect`. Минимальный вариант — cron:

crontab -l 2>/dev/null > /tmp/cron.tmp
cat >> /tmp/cron.tmp <<'EOF'
@reboot sleep 10 && /usr/bin/warp-cli connect
@reboot sleep 20 && /usr/bin/socat TCP-LISTEN:40000,bind=10.66.66.1,fork,reuseaddr TCP:127.0.0.1:40000
EOF
crontab /tmp/cron.tmp
rm /tmp/cron.tmp

Для надёжности после первой перезагрузки прогони чек-лист (раздел «После ребута»).

## Этап 5. Конфиг для Mac-клиента

**КРИТИЧНО про SERVER_IP.** Подставь IPv4 своего сервера **явно**. НЕ используй `curl ifconfig.me` — он может вернуть IPv6, и тогда `Endpoint` в конфиге будет битый и WireGuard не поднимется.

SERVER_PUB=$(cat /opt/wg-server-public)
CLIENT_PRIV=$(cat /opt/wg-client1-private)
PSK=$(cat /opt/wg-psk1)
SERVER_IP="ВАШ_IPv4_АДРЕС"   # ← подставь сюда IPv4 из карточки сервера Timeweb

cat > /opt/wireguard-clients/client-1.conf <<EOF
[Interface]
PrivateKey = $CLIENT_PRIV
Address = 10.66.66.2/32
DNS = 1.1.1.1, 8.8.8.8
MTU = 1200

[Peer]
PublicKey = $SERVER_PUB
PresharedKey = $PSK
Endpoint = $SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

cat /opt/wireguard-clients/client-1.conf

Вывод последней команды — содержимое конфига. Скопируй **весь блок** от `[Interface]` до `PersistentKeepalive = 25` включительно: он понадобится на Mac.

## Этап 6. Mac-клиент WireGuard

### 6.1. Установить WireGuard

App Store → найти **WireGuard** (разработчик WireGuard Development Team) → установить. Прямая ссылка: https://apps.apple.com/app/wireguard/id1451685025

### 6.2. Импортировать конфиг

1. Открыть WireGuard → `+` снизу слева → **Add Empty Tunnel** (не «from file» — вставим текст).
1. **Name:** `lovable-vpn`. Public key заполнится сам — игнорировать.
1. В большое текстовое поле **полностью вставить** конфиг из Этапа 5 (заменить авто-шаблон).
1. **Save**.

### 6.3. Подключиться

В списке туннелей — **Activate**. В строке меню Mac появится иконка WireGuard.

### 6.4. Проверить

curl -s ifconfig.me; echo

Должно показать IP сервера Timeweb (а не обычный IP пользователя).

ping -c 3 10.66.66.1

Должны идти ответы.

curl --socks5-hostname 10.66.66.1:40000 -sI https://lovable.dev | head -3

Должно вернуть `HTTP/2 200`. Если таймаут — проверь socat на сервере (`ss -tlnp | grep 40000`). Если 403 — на сервере `warp-cli connect`.

## Этап 7. Рабочий браузер

Выбери способ. **Если коллея хочет надёжно — Способ A.** Если хочет именно расширение — Способ B (с оговорками внизу).

### Способ A — CLI-флаг `--proxy-server` (рекомендуемый, проверенный)

#### 7A.1. Создать ярлык на Mac

В Terminal на Mac (убедись, что ты на Mac, а не в SSH — приглашение вида `имя@... %`, не `root@...#`):

cat > ~/Desktop/Lovable.command <<'EOF'
#!/bin/bash
# Закрываем все процессы браузера, иначе флаг прокси игнорируется
pkill -f "Yandex" 2>/dev/null
sleep 1
# Запускаем браузер с SOCKS5 и отдельным профилем
"/Applications/Yandex.app/Contents/MacOS/Yandex" \
  --proxy-server="socks5://10.66.66.1:40000" \
  --user-data-dir="$HOME/Library/Application Support/Yandex-Lovable" \
  https://lovable.dev &
EOF

chmod +x ~/Desktop/Lovable.command
ls -la ~/Desktop/Lovable.command

Должно быть `-rwxr-xr-x`.

Если у коллеги НЕ Яндекс — замени путь к бинарнику и имя процесса в `pkill`:

| Браузер | Путь к бинарнику | Имя для pkill |
| --- | --- | --- |
| Google Chrome | /Applications/Google Chrome.app/Contents/MacOS/Google Chrome | "Google Chrome" |
| Brave | /Applications/Brave Browser.app/Contents/MacOS/Brave Browser | "Brave Browser" |
| Vivaldi | /Applications/Vivaldi.app/Contents/MacOS/Vivaldi | "Vivaldi" |
| Edge | /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge | "Microsoft Edge" |

#### 7A.2. КРИТИЧНО — почему именно так

- ❌ **НЕ запускать без**** **`pkill` — если уже открыт браузер с обычным профилем, новый процесс подцепится к нему и флаг `--proxy-server` будет **проигнорирован** (single-process архитектура Chromium). Скрипт сначала убивает все процессы. После `pkill` можно проверить `pgrep -f "Yandex"` — пусто.
- ❌ **НЕ запускать без**** **`--user-data-dir` — иначе смешается с основным профилем, потеряются закладки/расширения. Отдельная директория изолирует.
- ✅ Работает только связка: kill → отдельный профиль → флаг прокси → URL.

#### 7A.3. Первый запуск

1. **Двойной клик** по `Lovable.command` на рабочем столе.
1. macOS может ругнуться («разработчик не подтверждён»): **Системные настройки → Конфиденциальность и безопасность** → внизу «Открыть всё равно». Альтернатива: правый клик по файлу → **Открыть**.
1. Откроется браузер на странице lovable.dev — это **отдельный профиль**, залогинься заново.

### Способ B — прокси-расширение ZeroOmega (альтернатива, удобнее, но с оговорками)

⚠️ **Прочитай оговорку в конце раздела перед тем, как выбрать этот путь.** На lovable.dev расширение исторически вело себя ненадёжно.

#### 7B.1. Поставить расширение

1. Открой в браузере: https://github.com/zero-peak/ZeroOmega (источник истины) — оттуда ведут ссылки на официальные карточки магазина.
1. Или сразу Chrome Web Store: https://chromewebstore.google.com/detail/proxy-switchyomega-3-zero/pfnededegaaopdmhkdmcofjmoldfiped
1. **Убедись, что это настоящий ZeroOmega**: в карточке расширения исходный код указывает на `github.com/zero-peak/ZeroOmega`. Похожие подделки игнорируй.
1. Установить.

#### 7B.2. Настроить профиль прокси

1. Открой настройки ZeroOmega (значок расширения → шестерёнка / Options).
1. Создай новый профиль (New profile → Proxy Profile), назови `proxy`:
  - **Protocol:** `SOCKS5`
  - **Server:** `10.66.66.1`
  - **Port:** `40000`
  - Логин/пароль — пусто.
1. **Apply changes** (слева).

#### 7B.3. Правило Auto Switch

1. Вкладка **Auto Switch**.
1. Добавь правило (Add condition):
  - **Condition:** `Host wildcard` → `*.lovable.dev`
  - **Profile:** выбрать `proxy` (не `[Direct]`!)
1. **Default profile** оставь `[Direct]` (весь остальной трафик — напрямую).
1. **Apply changes**.

#### 7B.4. Включить режим

Справа вверху, рядом с адресной строкой — значок ZeroOmega (кружок). Нажми → выбери режим **auto switch**. Если значка не видно — нажми иконку **пазла** (расширения), найди ZeroOmega.

Открой lovable.dev.

#### ⚠️ Оговорка про Способ B (важно для коллеги)

На lovable.dev расширение **может не дать стабильного результата**: SPA приложения шлёт часть запросов (в т.ч. к API) по адресам, которые не покрываются правилом или применяются с задержкой → эти запросы уходят мимо прокси → Vercel видит датацентровый/реальный IP → `403` → проекты в вечной загрузке (шиммеры), «No workspace».

Если это происходит — два варианта: 1. В профиле ZeroOmega попробовать сделать `proxy` профилем по умолчанию (гнать через прокси **весь** трафик профиля, а не по правилу). Иногда помогает. 2. **Надёжно** — переключиться на Способ A (CLI-флаг), который гонит 100% трафика процесса через прокси. Именно поэтому в боевой эксплуатации стоит Способ A.

## Этап 8. Финальная проверка

Коллега должен: 1. Открыть рабочий браузер (двойной клик `Lovable.command` для способа A, либо браузер с включённым auto switch для способа B). 2. Залогиниться в lovable.dev. 3. Увидеть свои проекты / иметь возможность создать новый — **без шиммеров и «No workspace»**.

Работает — поздравь и расскажи про чек-лист после ребута. Не работает — раздел «Диагностика».

## Чек-лист после ребута сервера

По SSH:

systemctl status wg-quick@wg0 | head -5    # active (exited)
warp-cli status                            # Connected
ss -tlnp | grep 40000                      # ДВЕ строки (warp-svc + socat)
iptables -L INPUT -n | grep -E '51820|40000'   # две строки ACCEPT

Если что-то не поднялось — вручную:

warp-cli connect
socat TCP-LISTEN:40000,bind=10.66.66.1,fork,reuseaddr TCP:127.0.0.1:40000 &
iptables -I INPUT -p tcp --dport 40000 -j ACCEPT
iptables -I INPUT -p udp --dport 51820 -j ACCEPT

## Диагностика — типовые проблемы

### lovable.dev показывает 403 / шиммеры / «No workspace»

На сервере:

warp-cli status
warp-cli settings | grep -i mode
ss -tlnp | grep 40000
curl --socks5 127.0.0.1:40000 -sI https://api.lovable.dev | head -3

Ожидания: `Connected`; `WarpProxy on port 40000`; ДВЕ строки на 40000; `HTTP/2 404` (НЕ 403).

Если на сервере всё ок, но в браузере 403 — **клиент не использует прокси**. Почти всегда: - **Способ A:** запущен старый процесс браузера с обычным профилем → `pkill -f "Yandex"` (или имя браузера), затем запусти ярлык заново. - **Способ B:** расширение пропускает часть запросов → см. оговорку в 7B.4 (сделать прокси профилем по умолчанию или перейти на Способ A).

### Mac не подключается к VPN (нет handshake)

# на Mac
ping -c 3 <IPv4_СЕРВЕРА>

Нет ответа — сервер недоступен из сети пользователя (бывает с корпоративными файрволами).

# на сервере
wg show

Нет строки `latest handshake` после попытки подключения — проверь: - На сервере `iptables -L INPUT -n | grep 51820` — должна быть ACCEPT. - В конфиге Mac: `Endpoint` указывает на правильный **IPv4** сервера, порт 51820, UDP.

### Интернет на Mac работает частично / медленно через VPN

Это **MTU**. В WireGuard на Mac: туннель → Edit → строка `MTU = 1200` присутствует и именно 1200. Если 1420 или нет строки — добавь `MTU = 1200` в `[Interface]`, сохрани, перезапусти туннель.

### `warp-cli` виснет / ошибки

systemctl restart warp-svc
sleep 5
warp-cli status

Не помогло — пересоздать регистрацию:

warp-cli registration delete
warp-cli registration new
warp-cli mode proxy
warp-cli connect

### `socat` падает с «Address already in use»

Уже запущен socat:

ps aux | grep socat | grep -v grep
# kill <PID>

Потом запусти заново.

### Telegram не работает на Mac

Telegram использует WireGuard напрямую — должен работать после подключения VPN. Если в РФ Timeweb режет TCP до Telegram-DC — настрой SOCKS5 прямо в Telegram: - Mac: **Settings → Advanced → Connection type → Use custom proxy → Add proxy → SOCKS5** → Server `10.66.66.1`, Port `40000`, логин/пароль пустые → **Enable**. - iOS/Android: **Settings → Data and Storage → Proxy** → Add SOCKS5 `10.66.66.1:40000`.

Это тот же socat+WARP-пайплайн. Работает только при активном WireGuard.

## Карта мин — общий список (запомни и не повторяй)

| Запрет | Что ломает | Что делать вместо |
| --- | --- | --- |
| WARP в режиме warp / warp+doh | Весь трафик WireGuard | Только warp-cli mode proxy |
| iptables -t nat -A PREROUTING -i wg0 ... REDIRECT | Весь трафик клиента | socat + явный SOCKS5 |
| ip route add ... dev CloudflareWARP | Маршрутизация | Не трогать таблицу маршрутов |
| redsocks для всего трафика wg0 | Всё | Прокси на уровне приложения |
| MTU 1420 / 1500 | Большие пакеты теряются | MTU = 1200 строго |
| ifconfig.me для SERVER_IP | IPv6 → битый Endpoint | Подставлять IPv4 явно |
| MTProto-прокси через TCP | Qrator блокирует | Telegram через WireGuard или SOCKS5 |
| Классический SwitchyOmega в Chromium | Не запускается (MV2 убит в 07.2025) | Только ZeroOmega (MV3-форк) |
| Случайный «SwitchyOmega» из магазина | Риск подделки/вредоноса | Проверять исходник = github.com/zero-peak/ZeroOmega |
| Расширение прокси для lovable.dev | Часть запросов мимо прокси → 403 | Способ A (CLI-флаг) для надёжности |
| Запуск браузера без pkill | Флаг прокси игнорируется | pkill -f "<browser>" перед запуском |
| Запуск браузера без --user-data-dir | Смешает профили | Отдельная директория |
| Длинные вставки в веб-консоль Timeweb | Обрезка ~20 строк | SSH из Terminal на Mac |

## Что НЕ входит в этот скилл

- **MTProto-прокси (MTG)** — на Timeweb не работает из-за Qrator. Telegram работает через WireGuard или SOCKS5.
- **Раздача доступа другим людям** — каждому новому клиенту: своя пара ключей + PSK, новый peer в `wg0.conf`, IP `10.66.66.X` (X=3,4,5…). Делается по аналогии с Этапом 5. **Всегда сверяй занятые IP в живом конфиге сервера перед выдачей нового** — коллизия IP ломает маршрутизацию у клиента.
- **Платная подписка / биллинг / wg-easy** — вне области скилла; ручная настройка надёжнее для одного-двух пользователей.

## Итоговая проверка скилла

- ✅ VPS на Timeweb, IPv4 записан.
- ✅ WireGuard слушает 51820/UDP, конфиг в `/etc/wireguard/wg0.conf`, MTU 1200.
- ✅ WARP в proxy mode, Connected, слушает 127.0.0.1:40000.
- ✅ socat-мост на 10.66.66.1:40000 (две строки в `ss -tlnp`).
- ✅ Файрвол открывает 51820/UDP и 40000/TCP.
- ✅ Cron `@reboot` для warp+socat настроен.
- ✅ На Mac установлен WireGuard, туннель `lovable-vpn` подключается.
- ✅ `curl --socks5-hostname 10.66.66.1:40000 -sI https://lovable.dev` → 200.
- ✅ Рабочий браузер выбран (A или B) и настроен, lovable.dev грузит проекты без шиммеров.

Все галочки — скилл отработан. Нет — иди по «Диагностике» сверху вниз.
