# ⚡️ [50 миллионов токенов Kimi K3 бесплатно](https://t.me/c/2438954630/8873)

TokenRouter запустил раздачу 50 миллионов токенов для работы с Kimi K3 через API

— Kimi K3 входит в число сильнейших моделей для кодинга и агентских задач
— Для получения API-ключа не нужны банковская карта и подтверждение личности
— Достаточно зарегистрироваться и активировать бонус

Бесплатно

Забираем — тут (https://www.tokenrouter.com/models?search=kimi-k3)

⚡️ Выключатель (https://t.me/+A6xum1owmlIwODcy)


```python
from openai import OpenAI

client = OpenAI(
    base_url='https://api.tokenrouter.com/v1',
    api_key='<YOUR_API_KEY>',
)

messages = [
    {"role": "system", "content": "You are an intelligent assistant, please reply concisely."},
    {"role": "user", "content": "Hello, what kind of model are you?"},
]

stream = client.chat.completions.create(
    model="moonshotai/kimi-k3-free",
    messages=messages,
    stream=True,
    stream_options={"include_usage": True},
    extra_body={}
)

content_parts = []
for chunk in stream:
    if chunk.choices:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            content_parts.append(delta.content)

full_content = "".join(content_parts)

print(full_content)
```

```curl
curl 'https://api.tokenrouter.com/v1/chat/completions' \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
      "model":"moonshotai/kimi-k3-free",
      "messages":[
          {
              "role":"user",
              "content":[
                  {
                      "type":"text",
                      "text":"Hello, what kind of model are you?"
                  }
               ]
            }
       ]
  }'
```