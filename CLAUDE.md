# Project Guidelines — Calculadora Preço Teto

## Stack

- React + TypeScript + Vite
- Chakra UI v3 (3.35.0) — use v3 API only (`createSystem`, `Dialog`, etc.)
- react-icons — Lucide only (`react-icons/lu`)
- yarn

## Folder Structure

```
src/
  pages/
    PageName/
      index.tsx          ← page component, export default
      components/
        SubComponent/
          index.tsx      ← sub-component, export default
  components/
    ComponentName/
      index.tsx          ← shared component, export default
    ModalNomeDoModal/
      index.tsx          ← modals ficam direto em components/, sem subpasta modals/
  hooks/
  lib/
  types/
```

Each component folder contains **only one file: `index.tsx`**. No separate `ComponentName.tsx` + `index.ts` split.

## Component Pattern

Every component must follow this exact pattern:

```tsx
import React from 'react';

interface Props {
  // ...
}

const ComponentName: React.FC<Props> = ({ ... }) => {
  return ( ... );
};

export default ComponentName;
```

Rules:
- Always `import React from 'react'`
- Always `React.FC<Props>`
- Always `interface Props` (not `interface ComponentNameProps`)
- Always `export default ComponentName` at the bottom
- Semicolons everywhere

## Imports

Default imports for components (no named imports from component folders):

```ts
import Dashboard from '@pages/Dashboard';
import CurrencyInput from '@components/CurrencyInput';
import ImportModal from '@components/modals/ImportModal';
```

## Code Style

- `const` over `let`
- Hardcoded values → named `const` in SCREAMING_SNAKE_CASE at the top of the file
- Destructure arrays: `const [item] = array`, never `array[0]`
- `new Map` over plain objects for key-value structures
- `!=` / `==` for null checks (not `!==` / `===`)
- No `any` — use `unknown`, generics, or explicit types
- No `for`/`forEach` — use `map`, `filter`, `reduce`
- No raw HTML tags for styling — use Chakra props or CSS
- No comments unless the WHY is non-obvious

## Icons

Lucide only via `react-icons/lu`:

```ts
import { LuArrowLeft, LuPlus } from 'react-icons/lu';
```

Never use other icon sets (Fi, Md, Bi, etc.).

## Path Aliases

```ts
@components  → src/components
@pages       → src/pages
@hooks       → src/hooks
@utils       → src/utils
@theme       → src/theme.ts
@appTypes    → src/types/index.ts
```
