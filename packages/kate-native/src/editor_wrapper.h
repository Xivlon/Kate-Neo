#ifndef EDITOR_WRAPPER_H
#define EDITOR_WRAPPER_H

#include <napi.h>

namespace KateNative {

/**
 * JavaScript wrapper for KTextEditor::Editor singleton
 * 
 * Provides access to global editor functionality and information.
 */
class EditorWrapper : public Napi::ObjectWrap<EditorWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object GetInstance(Napi::Env env);
    
    EditorWrapper(const Napi::CallbackInfo& info);
    ~EditorWrapper();

private:
    // Editor information
    Napi::Value GetVersion(const Napi::CallbackInfo& info);
    Napi::Value GetApplicationName(const Napi::CallbackInfo& info);
    
    // Available modes/languages
    Napi::Value GetAvailableModes(const Napi::CallbackInfo& info);
};

} // namespace KateNative

#endif // EDITOR_WRAPPER_H
