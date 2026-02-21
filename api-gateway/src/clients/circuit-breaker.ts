import { config } from '../config';
import { logger } from '../utils/logger';
import {
  circuitBreakerState,
  circuitBreakerFailures,
  circuitBreakerSuccesses,
} from '../utils/metrics';
import { CircuitBreakerOpenError } from '../utils/errors';

export enum CircuitState {
  CLOSED = 0,
  HALF_OPEN = 1,
  OPEN = 2,
}

export interface CircuitBreakerConfig {
  threshold: number;
  timeoutMs: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private readonly serviceName: string;
  private readonly config: CircuitBreakerConfig;

  constructor(serviceName: string, circuitConfig?: Partial<CircuitBreakerConfig>) {
    this.serviceName = serviceName;
    this.config = {
      threshold: circuitConfig?.threshold ?? config.circuitBreaker.threshold,
      timeoutMs: circuitConfig?.timeoutMs ?? config.circuitBreaker.timeoutMs,
      resetTimeoutMs: circuitConfig?.resetTimeoutMs ?? config.circuitBreaker.resetTimeoutMs,
    };

    this.updateMetrics();
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitBreakerOpenError(this.serviceName);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        if (now - this.lastFailureTime >= this.config.resetTimeoutMs) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private onSuccess(): void {
    circuitBreakerSuccesses.inc({ service: this.serviceName });

    switch (this.state) {
      case CircuitState.HALF_OPEN:
        this.successCount++;
        if (this.successCount >= 1) {
          this.reset();
        }
        break;

      case CircuitState.CLOSED:
        this.failureCount = 0;
        break;
    }
  }

  private onFailure(): void {
    circuitBreakerFailures.inc({ service: this.serviceName });
    this.failureCount++;
    this.lastFailureTime = Date.now();

    switch (this.state) {
      case CircuitState.CLOSED:
        if (this.failureCount >= this.config.threshold) {
          this.transitionTo(CircuitState.OPEN);
        }
        break;

      case CircuitState.HALF_OPEN:
        this.transitionTo(CircuitState.OPEN);
        break;
    }
  }

  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    logger.info(
      {
        service: this.serviceName,
        previousState: CircuitState[previousState],
        newState: CircuitState[newState],
        failureCount: this.failureCount,
      },
      `Circuit breaker state transition: ${CircuitState[previousState]} -> ${CircuitState[newState]}`
    );

    if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }

    this.updateMetrics();
  }

  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.transitionTo(CircuitState.CLOSED);
  }

  private updateMetrics(): void {
    circuitBreakerState.set({ service: this.serviceName }, this.state);
  }

  getState(): CircuitState {
    return this.state;
  }

  getStateName(): string {
    return CircuitState[this.state];
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  getStats(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: CircuitState[this.state],
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
