type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    message: string;
    level: LogLevel;
    context?: Record<string, any>;
    timestamp: string;
}

class Logger {
    private log(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            message,
            level,
            context,
            timestamp: new Date().toISOString(),
        };

        if (process.env.NODE_ENV === 'development') {
            const color = {
                info: '\x1b[36m', // Cyan
                warn: '\x1b[33m', // Yellow
                error: '\x1b[31m', // Red
                debug: '\x1b[90m', // Gray
            }[level];

            console.log(`${color}[${level.toUpperCase()}]\x1b[0m`, message, context || '');
        } else {
            // In production, we would send this to Sentry or a log aggregator
            // For now, structured JSON logging is best for modern infrastructure
            console.log(JSON.stringify(entry));
        }
    }

    info(message: string, context?: Record<string, any>) {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, any>) {
        this.log('warn', message, context);
    }

    error(message: string, error?: Error | unknown, context?: Record<string, any>) {
        this.log('error', message, { ...context, error: error instanceof Error ? error.stack : error });
    }

    debug(message: string, context?: Record<string, any>) {
        this.log('debug', message, context);
    }
}

export const logger = new Logger();
