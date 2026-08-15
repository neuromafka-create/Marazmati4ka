[***Источник***](https://t.me/aisetii/2300)


# Копируем стиль и дизайн любого продукта с помощью ChatGPT

Нашли универсальный промт, который поможет сохранить общий вайб для комикса или генерить продающие картинки для маркетплейсов.

## ЧТО ДЕЛАТЬ? 
- Копируем промт в ChatGPT вместе с 1-5 картинками. Чем больше — тем лучше, с них он считает стиль;
- Запускаем генерацию, на выходе будет код. Просим ChatGPT собрать его в JSON-файл;
- Закидываем полученный файл вместе с картинкой вашего товара. Опишите его, что хотите видеть на фоне и т.д.

### Сам промт:

```
Analyze the provided images and create a "brand style profile" in the form of a JSON object. This profile should extract and describe the visual identity, structure, and aesthetic rules shown in the images, in a way that allows an AI to recreate similar visuals in the same style, but for entirely different content.  Do not include or reference any specific subjects, logos, products, people, text, or brand names present in the input. Your job is to isolate and document the style, layout principles, and design system used, so it can be reapplied to different content while maintaining the same visual language. 

The JSON should include, but not be limited to:

Color usage: dominant tones, gradients, or palettes
Typography style: font mood (bold, modern, playful, clean, etc.), placement, and usage hierarchy
Lighting & vibe: energetic / moody / clean / vibrant / soft / etc.
Subject placement: centered / floating / grouped / perspective / rotated / etc.
Background style: abstract / gradient / textured / scenic / etc.
Composition layout: symmetrical / rule of thirds / collage / exploded view / etc.
Branding elements: use of overlays, strokes, glows, shapes, burst effects, or other visual motifs
Visual tone: bold / casual / premium / loud / minimal / playful / etc.
Post-processing style: contrast, saturation, shadows, glow, noise, etc.
General style tags: genre/feel, e.g., "sports aesthetic", "editorial look", "clean tech", "pop art", etc.
The output must be a well-structured JSON that an AI can use to recreate visuals in the same stylistic language, regardless of the actual subject matter.
```