import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;

  debug(message: string, ...optionalParams: unknown[]): void {
    this.log('debug', message, optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.log('info', message, optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.log('warn', message, optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.log('error', message, optionalParams);
  }

  private log(level: LogLevel, message: string, optionalParams: unknown[]): void {
    if (this.isProduction && level === 'debug') {
      return;
    }

    const prefix = `[${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...optionalParams);
        break;
      case 'info':
        console.info(prefix, message, ...optionalParams);
        break;
      case 'warn':
        console.warn(prefix, message, ...optionalParams);
        break;
      case 'error':
        console.error(prefix, message, ...optionalParams);
        break;
      default:
        console.log(prefix, message, ...optionalParams);
    }
  }
}
