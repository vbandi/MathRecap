using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace MathRecap.Api.Tests.TestHost;

public sealed record LogEntry(LogLevel Level, string Category, string Message, Exception? Exception);

// Records everything the app logs, at every level, so tests can check what reaches the logs.
public sealed class CapturingLoggerProvider : ILoggerProvider
{
    private readonly ConcurrentQueue<LogEntry> entries = new();

    public IReadOnlyList<LogEntry> Entries => [.. entries];

    public ILogger CreateLogger(string categoryName) => new Logger(categoryName, entries);

    public void Dispose()
    {
    }

    private sealed class Logger(string category, ConcurrentQueue<LogEntry> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            entries.Enqueue(new LogEntry(logLevel, category, formatter(state, exception), exception));
    }
}
