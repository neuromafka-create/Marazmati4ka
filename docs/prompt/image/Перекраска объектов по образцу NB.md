Я отвечу как всемирно известный специалист по **AI-генерации изображений и prompt-engineering для diffusion-моделей**, лауреат **SIGGRAPH Technical Achievement Award за исследования в области controllable image synthesis**.

**TL;DR:** Ниже универсальный профессиональный промпт для **Nano Banana**, который заставляет модель **менять только цветовую схему**, полностью сохраняя **форму, композицию, перспективу и текстуры** Картинки1, используя **цвета Картинки2 как референс**.

---

### Профессиональный промпт для Nano Banana

```
Task: recolor the object in Image1 using the color scheme from Image2.

Use Image2 only as a color reference.

Strict requirements:
- Preserve the exact geometry, proportions, shape, perspective and composition of Image1.
- Do NOT change camera angle, lighting direction, background, environment or framing.
- Do NOT redesign or regenerate the object.
- Do NOT modify details, textures, dirt, scratches, reflections or materials.
- Keep all visual elements exactly as in Image1.

Only replace the paint color and color palette of the main object in Image1 so that it matches the colors from Image2.

Important:
- Apply the color distribution from Image2 (primary body color, secondary panels, accents if present).
- Preserve realistic shading, highlights and shadows from Image1.
- Maintain photorealistic texture and existing wear.

Result must look like the same original Image1 object that was simply repainted in the colors from Image2.
```

---

### Если речь именно о машине (более точная версия)

```
Repaint the vehicle in Image1 using the paint colors from Image2.

Use Image2 strictly as a color reference.

Do NOT change:
- vehicle shape
- body panels
- proportions
- perspective
- lighting
- environment
- camera angle
- dirt, mud or wear marks

Only replace the body paint color so the vehicle matches the color scheme of Image2.

All details, scratches, mud splashes and reflections from Image1 must remain unchanged.
The result must look like the same vehicle from Image1 that was simply repainted.
```

---

💡 **Маленький трюк для Nano Banana:**
в конец промпта можно добавить строку, которая резко уменьшает риск перегенерации формы:

```
color replacement only, no redesign, no geometry change, no re-render
```

---

Если хочешь — могу ещё дать:

* **более жёсткий “production prompt”**, который почти полностью убирает риск изменения формы
* **версию для Midjourney / Flux / SDXL**, которая работает лучше при перекраске техники.
