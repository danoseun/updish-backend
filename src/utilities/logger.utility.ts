import { createLogger, format, transports } from 'winston';
import appRootPath from 'app-root-path';
import variables from '../variables';

export const logger = createLogger({
  level: variables.logs.logLevel,
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    }),
    format.json()
  ),
  ...(!variables.app.isTesting && {
    transports: [
      new transports.File({
        filename: `${appRootPath}/logs/error.log`,
        level: 'error',
        silent: variables.app.isTesting
      }),
      new transports.File({
        filename: `${appRootPath}/logs/combined.log`,
        silent: variables.app.isTesting
      })
    ]
  })
});

if (variables.logs.showAppLogs) {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.prettyPrint()
      )
    })
  );
}



