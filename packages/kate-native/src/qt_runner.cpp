#include "qt_runner.h"
#include <QCoreApplication>
#include <QTimer>
#include <thread>
#include <mutex>
#include <chrono>

namespace KateNative {

// Global state
static QCoreApplication* g_app = nullptr;
static std::thread g_qtThread;
static std::mutex g_qtMutex;
static bool g_qtRunning = false;

void QtRunner::Initialize() {
    std::lock_guard<std::mutex> lock(g_qtMutex);
    
    if (g_qtRunning) {
        return;  // Already initialized
    }
    
    // Start Qt event loop in separate thread
    g_qtThread = std::thread([]() {
        // Set offscreen platform for headless mode
        qputenv("QT_QPA_PLATFORM", "offscreen");
        
        int argc = 1;
        char* argv[] = {(char*)"kate-native"};
        
        g_app = new QCoreApplication(argc, argv);
        
        // Process events periodically
        QTimer* timer = new QTimer();
        QObject::connect(timer, &QTimer::timeout, []() {
            QCoreApplication::processEvents();
        });
        timer->start(10);  // Process every 10ms
        
        g_qtRunning = true;
        
        // Run event loop
        g_app->exec();
        
        delete timer;
        delete g_app;
        g_app = nullptr;
        g_qtRunning = false;
    });
    
    // Wait for Qt to start
    while (!g_qtRunning) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
}

void QtRunner::Shutdown() {
    std::lock_guard<std::mutex> lock(g_qtMutex);
    
    if (!g_qtRunning) {
        return;
    }
    
    if (g_app) {
        g_app->quit();
    }
    
    if (g_qtThread.joinable()) {
        g_qtThread.join();
    }
}

bool QtRunner::IsRunning() {
    std::lock_guard<std::mutex> lock(g_qtMutex);
    return g_qtRunning;
}

void QtRunner::ProcessEvents() {
    if (g_app && g_qtRunning) {
        QCoreApplication::processEvents();
    }
}

} // namespace KateNative
