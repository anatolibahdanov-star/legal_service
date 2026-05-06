import { createLogger, transports, format, addColors } from 'winston';

const { combine, timestamp, colorize, printf } = format;

const customColors = {
  error: 'bold red',
  warn: 'italic yellow',
  info: 'bold blue',
  debug: 'green',
};
addColors(customColors);

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let log = `${timestamp} ${level} ${message} : `;

  // If there is additional metadata, append it as a JSON string
  const cleanMetadata = { ...metadata };
  const _metadata = (cleanMetadata[Symbol.for('splat')] as object)
  if (_metadata && typeof _metadata === 'object' && Object.keys(_metadata).length > 0) {
    // Exclude the 'splat' symbol if it exists, as it's for internal use
    log += ` ${JSON.stringify(_metadata)}`;
  }
  return log;
});

export const logger = createLogger({
  level: 'info', // Set default log level
  format: combine(
    colorize({ all: true }), // Add colors to the log levels
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add a timestamp
    myFormat, // Use the custom format,
    // splat(),
    // json()
  ),
  transports: [
    new transports.Console(), // Log to the console
    // new transports.File({ filename: 'error.log', level: 'error' }), // Log errors to a file
    // new transports.File({ filename: 'combined.log' }) // Log all levels to a combined file
  ],
});

export default logger;
