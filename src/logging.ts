import * as vscode from 'vscode'
import { consoleLogLevel } from './env'

/**
 * Initializes the logging setup.
 */
export function initLogging(context: vscode.ExtensionContext): void {
  // Setup OutputChannel logging.
  const outputChannel = vscode.window.createOutputChannel('Melos')
  context.subscriptions.push(outputChannel)
  LogWriter.register(new OutputChannelLogWriter(outputChannel, LogLevel.info))

  // Setup console logging.
  if (consoleLogLevel) {
    LogWriter.register(new ConsoleLogWriter(parseLogLevel(consoleLogLevel)))
  }
}

/**
 * A log level.
 *
 * Log levels are ordered from most to least severe
 * and least to most verbose.
 * Lower log level include the log level above.
 */
export enum LogLevel {
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace',
}

function parseLogLevel(logLevelString: string): LogLevel {
  const logLevel = LogLevel[logLevelString as keyof typeof LogLevel]
  if (!logLevel) {
    throw new Error(`Invalid console log level: ${consoleLogLevel}`)
  }
  return logLevel
}

const orderedLogLevels = [
  LogLevel.error,
  LogLevel.warn,
  LogLevel.info,
  LogLevel.debug,
  LogLevel.trace,
]

function logLevelOrder(level: LogLevel): number {
  return orderedLogLevels.indexOf(level)
}

function logLevelIncludesOther(level: LogLevel, other: LogLevel) {
  return logLevelOrder(level) >= logLevelOrder(other)
}

export function log(
  level: LogLevel,
  message: string,
  error?: any,
  ...data: any[]
) {
  LogWriter.write({
    date: new Date(),
    level,
    message,
    error,
    data,
  })
}

export function error(message: string, error: any, ...data: any[]): void {
  log(LogLevel.error, message, error, ...data)
}

export function warn(message: string, ...data: any[]): void {
  log(LogLevel.warn, message, undefined, ...data)
}

export function info(message: string, ...data: any[]): void {
  log(LogLevel.info, message, undefined, ...data)
}

export function debug(message: string, ...data: any[]): void {
  log(LogLevel.debug, message, undefined, ...data)
}

export function trace(message: string, ...data: any[]): void {
  log(LogLevel.trace, message, undefined, ...data)
}

interface LogMessage {
  date: Date
  level: LogLevel
  message: string
  error?: any
  data: any[]
}

abstract class LogWriter {
  private static logWriters: LogWriter[] = []

  static register(writer: LogWriter): void {
    LogWriter.logWriters.push(writer)
  }

  static write(message: LogMessage): void {
    LogWriter.logWriters.forEach((writer) => {
      if (writer.shouldLog(message)) {
        writer.write(message)
      }
    })
  }

  constructor(public readonly level: LogLevel) {}

  shouldLog(message: LogMessage): boolean {
    return logLevelIncludesOther(this.level, message.level)
  }

  abstract write(message: LogMessage): void
}

const logLevelMaxLength = Object.keys(LogLevel)
  .map((level) => level.length)
  .reduce((a, b) => (a > b ? a : b))

function formatLogMessage(message: LogMessage): string {
  let result = ''

  result += `${message.date.toISOString()} `
  result += `[${message.level.toUpperCase()}]`.padStart(logLevelMaxLength + 2)
  result += ` ${message.message}`

  const error = message.error
  if (error) {
    result += `\n`
    if (error.name) {
      result += `${error.name}: `
    }
    if (error.message) {
      result += `${error.message}`
    }
    if (error.stack) {
      result += `\n${error.stack}`
    }
  }

  for (const data of message.data) {
    result += `\n${JSON.stringify(data, null, 2)}`
  }

  return result
}

class ConsoleLogWriter extends LogWriter {
  constructor(level: LogLevel) {
    super(level)
  }

  write(message: LogMessage): void {
    console[message.level](formatLogMessage(message))
  }
}

class OutputChannelLogWriter extends LogWriter {
  constructor(public readonly channel: vscode.OutputChannel, level: LogLevel) {
    super(level)
  }

  write(message: LogMessage): void {
    this.channel.appendLine(formatLogMessage(message))
  }
}
