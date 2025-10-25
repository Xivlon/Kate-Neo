#include "editor_wrapper.h"
#include "qt_runner.h"

#ifdef HAVE_KTEXTEDITOR
#include <KTextEditor/Editor>
#include <QString>
#endif

namespace KateNative {

Napi::Object EditorWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "KateEditor", {
        InstanceMethod("version", &EditorWrapper::GetVersion),
        InstanceMethod("applicationName", &EditorWrapper::GetApplicationName),
        InstanceMethod("availableModes", &EditorWrapper::GetAvailableModes),
    });
    
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    
    exports.Set("KateEditor", func);
    return exports;
}

Napi::Object EditorWrapper::GetInstance(Napi::Env env) {
    Napi::EscapableHandleScope scope(env);
    Napi::FunctionReference* constructor = env.GetInstanceData<Napi::FunctionReference>();
    Napi::Object obj = constructor->New({});
    return scope.Escape(napi_value(obj)).ToObject();
}

EditorWrapper::EditorWrapper(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<EditorWrapper>(info) {
    
#ifdef HAVE_KTEXTEDITOR
    // Ensure Qt is running
    if (!QtRunner::IsRunning()) {
        QtRunner::Initialize();
    }
#else
    Napi::TypeError::New(info.Env(), 
        "KTextEditor library not available. Native bindings require Qt5/KF5.")
        .ThrowAsJavaScriptException();
#endif
}

EditorWrapper::~EditorWrapper() {
}

Napi::Value EditorWrapper::GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    KTextEditor::Editor* editor = KTextEditor::Editor::instance();
    if (editor) {
        QString version = editor->aboutData().version();
        return Napi::String::New(env, version.toStdString());
    }
#endif
    
    return Napi::String::New(env, "unknown");
}

Napi::Value EditorWrapper::GetApplicationName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    KTextEditor::Editor* editor = KTextEditor::Editor::instance();
    if (editor) {
        QString name = editor->aboutData().displayName();
        return Napi::String::New(env, name.toStdString());
    }
#endif
    
    return Napi::String::New(env, "Kate Editor");
}

Napi::Value EditorWrapper::GetAvailableModes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array modes = Napi::Array::New(env);
    
#ifdef HAVE_KTEXTEDITOR
    // Note: This is a simplified version. In a real implementation,
    // we would query the syntax highlighting system for all available modes.
    // For now, return an empty array as a placeholder.
#endif
    
    return modes;
}

} // namespace KateNative
