# Processor

The **Processor** is an advanced, optional step that runs **after** a title is resolved from your [template](./Templates.md) and transforms it further. Reach for it only when templates alone can't get the result you want — for example stripping a prefix, reformatting a date, or building a title with custom logic.

It has one mode, **Replace**, which applies a regular expression. By default, the processor is disabled.

> The JavaScript modes, **Function** and **Function V2**, were removed in 1.0.2. If one was selected, the processor is switched off when you update; use **Replace** or a [template](./Templates.md) instead.

## Replace

In this mode processor will use RegExp to modify title.

Plugin uses the following template:

```typescript
title.replace(new RegExp("#pattern#", "#flags#"), "#relacement#");
```

Where:

- `title` - resolved title by settings. Not original filename.
- `replace` - [Doc](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)
- `new Regexp` - [Doc](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
- `#pattern#` - value from `Pattern` setting inside Processor
- `#flags#` - value from `Flags` setting inside Processor
- `#replacement#` - value from `Replacement` setting inside Processor

For example, you have set up plugin to pull new title from `new_title` path and this key has `foo` value.
After plugin resolves `foo` title it will execute the following construction:

```typescript
//It will return "bar" as new value
'foo'.replace(new RegExp('foo'), 'bar');
```

In this case `bar` value will be used as shown title
