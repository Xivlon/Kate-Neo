#ifndef DOCUMENT_WRAPPER_H
#define DOCUMENT_WRAPPER_H

#include <napi.h>
#include <memory>

// Forward declarations
namespace KTextEditor {
    class Document;
    class Editor;
}

namespace KateNative {

/**
 * JavaScript wrapper for KTextEditor::Document
 * 
 * Provides a clean JavaScript API for interacting with Kate documents
 * using node-addon-api ObjectWrap pattern.
 */
class DocumentWrapper : public Napi::ObjectWrap<DocumentWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object NewInstance(Napi::Env env);
    
    DocumentWrapper(const Napi::CallbackInfo& info);
    ~DocumentWrapper();

private:
    // Document operations
    Napi::Value GetText(const Napi::CallbackInfo& info);
    void SetText(const Napi::CallbackInfo& info);
    Napi::Value GetLine(const Napi::CallbackInfo& info);
    void InsertText(const Napi::CallbackInfo& info);
    void RemoveText(const Napi::CallbackInfo& info);
    
    // Document properties
    Napi::Value GetLineCount(const Napi::CallbackInfo& info);
    Napi::Value GetLength(const Napi::CallbackInfo& info);
    Napi::Value IsModified(const Napi::CallbackInfo& info);
    
    // Syntax highlighting
    Napi::Value GetMode(const Napi::CallbackInfo& info);
    void SetMode(const Napi::CallbackInfo& info);
    Napi::Value GetModes(const Napi::CallbackInfo& info);
    
    // File operations
    Napi::Value OpenUrl(const Napi::CallbackInfo& info);
    Napi::Value SaveUrl(const Napi::CallbackInfo& info);
    Napi::Value GetUrl(const Napi::CallbackInfo& info);
    
    // Undo/Redo
    void Undo(const Napi::CallbackInfo& info);
    void Redo(const Napi::CallbackInfo& info);
    
    std::shared_ptr<KTextEditor::Document> m_document;
    static KTextEditor::Editor* s_editor;
};

} // namespace KateNative

#endif // DOCUMENT_WRAPPER_H
