package logger

import (
	"log/slog"
	"os"
)

var Log *slog.Logger

func Init(serviceName string) {

	handler := slog.NewJSONHandler(
		os.Stdout,
		&slog.HandlerOptions{},
	)

	Log = slog.New(handler).With(
		"service",
		serviceName,
	)
}