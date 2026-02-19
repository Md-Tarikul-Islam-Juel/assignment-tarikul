// Type declarations for @nestjs/bullmq to resolve TypeScript errors
// These should be available from the package but adding explicit declarations as workaround

declare module '@nestjs/bullmq' {
  import { DynamicModule } from '@nestjs/common';
  import { Queue } from 'bullmq';

  export interface BullModuleOptions {
    connection?: {
      host?: string;
      port?: number;
      password?: string;
      db?: number;
    };
    defaultJobOptions?: {
      attempts?: number;
      backoff?: {
        type: string;
        delay: number;
      };
      removeOnComplete?: boolean | { age?: number; count?: number };
      removeOnFail?: boolean | { age?: number };
    };
  }

  export interface BullQueueOptions {
    name: string;
  }

  export class BullModule {
    static forRoot(options?: BullModuleOptions): DynamicModule;
    static forRootAsync(options: {
      useFactory: (...args: any[]) => Promise<BullModuleOptions> | BullModuleOptions;
      inject?: any[];
    }): DynamicModule;
    static registerQueue(options: BullQueueOptions): DynamicModule;
  }

  export function Processor(queueName: string): ClassDecorator;

  export abstract class WorkerHost {
    abstract process(job: any): Promise<any>;
  }

  export function InjectQueue(name: string): ParameterDecorator;
}
