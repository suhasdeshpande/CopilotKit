# @copilotkit/client-core

Framework-agnostic runtime client for CopilotKit using RxJS. This service exposes reactive streams for chat messages and loading state so any framework can stay in sync with CopilotKit.

## Installation

```bash
pnpm add @copilotkit/client-core
```

## Basic Usage

```ts
import { CopilotRuntimeService } from "@copilotkit/client-core";

const copilot = new CopilotRuntimeService({ url: "/api/copilot" });
```

Subscribe to `messages$` and `loading$` to react to updates.

## Angular Example

```ts
// copilot.service.ts
import { Injectable } from '@angular/core';
import { CopilotRuntimeService } from '@copilotkit/client-core';

@Injectable({ providedIn: 'root' })
export class CopilotService extends CopilotRuntimeService {
  constructor() {
    super({ url: '/api/copilot' });
  }
}
```

```ts
// chat.component.ts
@Component({...})
export class ChatComponent {
  messages$ = this.copilot.messages$;
  loading$ = this.copilot.loading$;

  constructor(private copilot: CopilotService) {}

  send(text: string) {
    this.copilot.append({ role: 'user', content: text });
  }
}
```

## React Example

```tsx
import { useEffect, useState } from 'react';
import { CopilotRuntimeService } from '@copilotkit/client-core';

const service = new CopilotRuntimeService({ url: '/api/copilot' });

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sub1 = service.messages$.subscribe(setMessages);
    const sub2 = service.loading$.subscribe(setLoading);
    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }, []);

  return <div>{/* render messages */}</div>;
}
```

## Vue Example

```ts
import { CopilotRuntimeService } from '@copilotkit/client-core';
import { ref, onMounted, onUnmounted } from 'vue';

const service = new CopilotRuntimeService({ url: '/api/copilot' });

export default {
  setup() {
    const messages = ref([]);
    const loading = ref(false);
    let sub1: any, sub2: any;

    onMounted(() => {
      sub1 = service.messages$.subscribe(v => (messages.value = v));
      sub2 = service.loading$.subscribe(v => (loading.value = v));
    });

    onUnmounted(() => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    return { messages, loading };
  },
};
```

## Svelte Example

```svelte
<script lang="ts">
  import { CopilotRuntimeService } from '@copilotkit/client-core';
  import { onMount } from 'svelte';

  const service = new CopilotRuntimeService({ url: '/api/copilot' });
  let messages = [];
  let loading = false;

  onMount(() => {
    const sub1 = service.messages$.subscribe(v => (messages = v));
    const sub2 = service.loading$.subscribe(v => (loading = v));
    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  });

  function send(text: string) {
    service.append({ role: 'user', content: text });
  }
</script>
```

This package lets any framework share CopilotKit chat state through RxJS observables.
