/**
 * Environment variable to configure the log level of the console logger.
 *
 * If this variable is unset the console logger is disable.
 */
export const consoleLogLevel = process.env.MELOS_CODE_CONSOLE_LOG_LEVEL

export const melosExecutableName =
  process.platform === 'win32' ? 'melos.bat' : 'melos'
