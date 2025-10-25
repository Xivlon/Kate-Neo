#include <napi.h>
#include "qt_runner.h"
#include "document_wrapper.h"
#include "editor_wrapper.h"

namespace KateNative {

/**
 * Initialize the Kate native module
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Initialize Qt event loop
    QtRunner::Initialize();
    
    // Register classes
    DocumentWrapper::Init(env, exports);
    EditorWrapper::Init(env, exports);
    
    // Export utility functions
    exports.Set("isKateAvailable", Napi::Boolean::New(env, 
#ifdef HAVE_KTEXTEDITOR
        true
#else
        false
#endif
    ));
    
    exports.Set("qtRunning", Napi::Function::New(env, [](const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), QtRunner::IsRunning());
    }));
    
    return exports;
}

} // namespace KateNative

// Register the module
NODE_API_MODULE(kate_native, KateNative::Init)
