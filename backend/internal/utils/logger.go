package utils

import (
    "os"

    "github.com/sirupsen/logrus"
)

// NewLogger creates a new configured logger
func NewLogger() *logrus.Logger {
    logger := logrus.New()

    // Set log level
    level := os.Getenv("LOG_LEVEL")
    switch level {
    case "debug":
        logger.SetLevel(logrus.DebugLevel)
    case "info":
        logger.SetLevel(logrus.InfoLevel)
    case "warn":
        logger.SetLevel(logrus.WarnLevel)
    case "error":
        logger.SetLevel(logrus.ErrorLevel)
    default:
        logger.SetLevel(logrus.InfoLevel)
    }

    // Set formatter
    if os.Getenv("LOG_FORMAT") == "json" {
        logger.SetFormatter(&logrus.JSONFormatter{
            TimestampFormat: "2006-01-02 15:04:05",
        })
    } else {
        logger.SetFormatter(&logrus.TextFormatter{
            FullTimestamp:   true,
            TimestampFormat: "2006-01-02 15:04:05",
        })
    }

    // Set output
    logger.SetOutput(os.Stdout)

    return logger
}
