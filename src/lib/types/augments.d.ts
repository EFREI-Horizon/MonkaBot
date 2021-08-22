import type {
  ArgOptions,
  ArgumentError,
  ArgumentResult,
  IArgument,
  RepeatArgOptions,
  Result,
} from '@sapphire/framework';
import type ConfigurationManager from '@/structures/ConfigurationManager';
import type FlaggedMessage from '@/structures/FlaggedMessage';
import type MonkaCommand from '@/structures/MonkaCommand';
import type TaskStore from '@/structures/TaskStore';
import type { CodeLanguageResult, GuildTextBasedChannel, HourMinutes } from '@/types';
import type { TagDocument } from '@/types/database';


declare module 'discord.js' {
  interface Client {
    checkValidity(): void;
  }
}

declare module '@sapphire/framework' {
  enum Events {
    TaskError = 'taskError',
  }

  interface StoreRegistryEntries {
    tasks: TaskStore;
  }

  interface Args {
    pickResult<T>(type: IArgument<T>, options?: ArgOptions): Promise<Result<T, ArgumentError>>;
    pickResult<K extends keyof ArgType>(type: K, options?: ArgOptions): Promise<Result<ArgType[K], ArgumentError>>;

    restResult<T>(type: IArgument<T>, options?: ArgOptions): Promise<Result<T, ArgumentError>>;
    restResult<K extends keyof ArgType>(type: K, options?: ArgOptions): Promise<Result<ArgType[K], ArgumentError>>;

    repeatResult<T>(type: IArgument<T>, options?: RepeatArgOptions): Promise<Result<T[], ArgumentError>>;
    repeatResult<K extends keyof ArgType>(
      type: K,
      options?: RepeatArgOptions,
    ): Promise<Result<Array<ArgType[K]>, ArgumentError>>;

    peekResult<T>(type: () => ArgumentResult<T>): Promise<Result<T, ArgumentError>>;
    peekResult<T>(type: IArgument<T>, options?: ArgOptions): Promise<Result<T, ArgumentError>>;
    peekResult<K extends keyof ArgType>(
      type: K | (() => ArgumentResult<ArgType[K]>),
      options?: ArgOptions
    ): Promise<Result<ArgType[K], ArgumentError>>;
  }

  interface SapphireClient {
    configManager: ConfigurationManager;
    remainingCompilerApiCredits: number;
    reactionRolesIds: Set<string>;
    eclassRolesIds: Set<string>;
    waitingFlaggedMessages: FlaggedMessage[];
    intersectionRoles: Set<string>;
    tags: Set<TagDocument>;

    loadReactionRoles(): Promise<void>;
    loadEclassRoles(): Promise<void>;
    loadTags(): Promise<void>;
  }

  interface ArgType {
    code: string;
    codeLanguage: CodeLanguageResult;
    command: MonkaCommand;
    day: Date;
    duration: number;
    guildTextBasedChannel: GuildTextBasedChannel;
    hour: HourMinutes;
  }
}
