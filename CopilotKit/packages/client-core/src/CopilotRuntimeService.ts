import { BehaviorSubject } from "rxjs";
import {
  CopilotRuntimeClient,
  CopilotRuntimeClientOptions,
  Message,
  convertMessagesToGqlInput,
  convertGqlOutputToMessages,
  filterAdjacentAgentStateMessages,
} from "@copilotkit/runtime-client-gql";

export interface CopilotRuntimeServiceOptions extends CopilotRuntimeClientOptions {
  /** Initial messages for the chat */
  initialMessages?: Message[];
}

export class CopilotRuntimeService {
  private runtime: CopilotRuntimeClient;
  private abortController: AbortController | null = null;

  private messagesSubject: BehaviorSubject<Message[]>;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  /** Observable stream of chat messages */
  readonly messages$: ReturnType<BehaviorSubject<Message[]>['asObservable']>;
  /** Observable loading state */
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(options: CopilotRuntimeServiceOptions) {
    this.runtime = new CopilotRuntimeClient(options);
    this.messagesSubject = new BehaviorSubject<Message[]>(options.initialMessages ?? []);
    this.messages$ = this.messagesSubject.asObservable();
  }

  /** Current messages value */
  get messages(): Message[] {
    return this.messagesSubject.getValue();
  }

  /** Append a message and optionally trigger a completion */
  append(message: Message, followUp = true) {
    this.messagesSubject.next([...this.messagesSubject.getValue(), message]);
    if (followUp) {
      void this.runCompletion();
    }
  }

  /** Abort any in-flight request */
  stop() {
    this.abortController?.abort();
  }

  /** Execute chat completion using the runtime client */
  async runCompletion(): Promise<Message[]> {
    this.stop();
    this.abortController = new AbortController();
    const prev = this.messagesSubject.getValue();
    this.loadingSubject.next(true);

    const stream = this.runtime.asStream(
      this.runtime.generateCopilotResponse({
        data: { messages: convertMessagesToGqlInput(prev) },
        signal: this.abortController.signal,
      }),
    );

    const reader = stream.getReader();
    const newMessages: Message[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value?.generateCopilotResponse) continue;
        const chunk = convertGqlOutputToMessages(
          filterAdjacentAgentStateMessages(value.generateCopilotResponse.messages),
        );
        newMessages.push(...chunk);
        this.messagesSubject.next([...prev, ...newMessages]);
      }
    } finally {
      this.loadingSubject.next(false);
      this.abortController = null;
    }

    return newMessages;
  }
}
