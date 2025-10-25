#ifndef QT_RUNNER_H
#define QT_RUNNER_H

/**
 * Qt Event Loop Manager
 * 
 * Manages the Qt event loop in a separate thread to avoid blocking
 * the Node.js event loop. This allows Qt to run headless without
 * requiring a display server.
 */
namespace KateNative {

class QtRunner {
public:
    /**
     * Initialize Qt application and start event loop
     * Must be called before any Qt/KDE operations
     */
    static void Initialize();
    
    /**
     * Shutdown Qt application and stop event loop
     * Should be called during cleanup
     */
    static void Shutdown();
    
    /**
     * Check if Qt is running
     */
    static bool IsRunning();
    
    /**
     * Process Qt events manually (if needed)
     * Normally called automatically by the event loop
     */
    static void ProcessEvents();

private:
    QtRunner() = delete;
    ~QtRunner() = delete;
};

} // namespace KateNative

#endif // QT_RUNNER_H
