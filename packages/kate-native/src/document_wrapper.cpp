#include "document_wrapper.h"
#include "qt_runner.h"

#ifdef HAVE_KTEXTEDITOR
#include <KTextEditor/Document>
#include <KTextEditor/Editor>
#include <KTextEditor/Range>
#include <KTextEditor/Cursor>
#include <QString>
#include <QUrl>
#endif

namespace KateNative {

#ifdef HAVE_KTEXTEDITOR
KTextEditor::Editor* DocumentWrapper::s_editor = nullptr;
#endif

Napi::Object DocumentWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "KateDocument", {
        // Document operations
        InstanceMethod("getText", &DocumentWrapper::GetText),
        InstanceMethod("setText", &DocumentWrapper::SetText),
        InstanceMethod("line", &DocumentWrapper::GetLine),
        InstanceMethod("insertText", &DocumentWrapper::InsertText),
        InstanceMethod("removeText", &DocumentWrapper::RemoveText),
        
        // Properties
        InstanceMethod("lineCount", &DocumentWrapper::GetLineCount),
        InstanceMethod("length", &DocumentWrapper::GetLength),
        InstanceMethod("isModified", &DocumentWrapper::IsModified),
        
        // Syntax highlighting
        InstanceMethod("mode", &DocumentWrapper::GetMode),
        InstanceMethod("setMode", &DocumentWrapper::SetMode),
        InstanceMethod("modes", &DocumentWrapper::GetModes),
        
        // File operations
        InstanceMethod("openUrl", &DocumentWrapper::OpenUrl),
        InstanceMethod("saveUrl", &DocumentWrapper::SaveUrl),
        InstanceMethod("url", &DocumentWrapper::GetUrl),
        
        // Undo/Redo
        InstanceMethod("undo", &DocumentWrapper::Undo),
        InstanceMethod("redo", &DocumentWrapper::Redo),
        
        // Phase 7: Advanced features
        InstanceMethod("getSyntaxTokens", &DocumentWrapper::GetSyntaxTokens),
        InstanceMethod("getFoldingRegions", &DocumentWrapper::GetFoldingRegions),
    });
    
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);
    
    exports.Set("KateDocument", func);
    return exports;
}

Napi::Object DocumentWrapper::NewInstance(Napi::Env env) {
    Napi::EscapableHandleScope scope(env);
    Napi::Object obj = env.GetInstanceData<Napi::FunctionReference>()->New({});
    return scope.Escape(napi_value(obj)).ToObject();
}

DocumentWrapper::DocumentWrapper(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<DocumentWrapper>(info) {
    
#ifdef HAVE_KTEXTEDITOR
    // Ensure Qt is running
    if (!QtRunner::IsRunning()) {
        QtRunner::Initialize();
    }
    
    // Initialize editor singleton if needed
    if (!s_editor) {
        s_editor = KTextEditor::Editor::instance();
    }
    
    // Create document
    m_document = std::shared_ptr<KTextEditor::Document>(
        s_editor->createDocument(nullptr)
    );
#else
    // Fallback when KTextEditor is not available
    Napi::TypeError::New(info.Env(), 
        "KTextEditor library not available. Native bindings require Qt5/KF5.")
        .ThrowAsJavaScriptException();
#endif
}

DocumentWrapper::~DocumentWrapper() {
    m_document.reset();
}

Napi::Value DocumentWrapper::GetText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    QString text = m_document->text();
    return Napi::String::New(env, text.toStdString());
#else
    return Napi::String::New(env, "");
#endif
}

void DocumentWrapper::SetText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return;
    }
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return;
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    m_document->setText(QString::fromStdString(text));
#endif
}

Napi::Value DocumentWrapper::GetLine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int lineNum = info[0].As<Napi::Number>().Int32Value();
    QString line = m_document->line(lineNum);
    return Napi::String::New(env, line.toStdString());
#else
    return Napi::String::New(env, "");
#endif
}

void DocumentWrapper::InsertText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected (line, column, text)").ThrowAsJavaScriptException();
        return;
    }
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return;
    }
    
    int line = info[0].As<Napi::Number>().Int32Value();
    int column = info[1].As<Napi::Number>().Int32Value();
    std::string text = info[2].As<Napi::String>().Utf8Value();
    
    KTextEditor::Cursor cursor(line, column);
    m_document->insertText(cursor, QString::fromStdString(text));
#endif
}

void DocumentWrapper::RemoveText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 4) {
        Napi::TypeError::New(env, 
            "Expected (startLine, startColumn, endLine, endColumn)")
            .ThrowAsJavaScriptException();
        return;
    }
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return;
    }
    
    int startLine = info[0].As<Napi::Number>().Int32Value();
    int startColumn = info[1].As<Napi::Number>().Int32Value();
    int endLine = info[2].As<Napi::Number>().Int32Value();
    int endColumn = info[3].As<Napi::Number>().Int32Value();
    
    KTextEditor::Range range(
        KTextEditor::Cursor(startLine, startColumn),
        KTextEditor::Cursor(endLine, endColumn)
    );
    
    m_document->removeText(range);
#endif
}

Napi::Value DocumentWrapper::GetLineCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        return Napi::Number::New(env, 0);
    }
    
    return Napi::Number::New(env, m_document->lines());
#else
    return Napi::Number::New(env, 0);
#endif
}

Napi::Value DocumentWrapper::GetLength(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        return Napi::Number::New(env, 0);
    }
    
    return Napi::Number::New(env, m_document->text().length());
#else
    return Napi::Number::New(env, 0);
#endif
}

Napi::Value DocumentWrapper::IsModified(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        return Napi::Boolean::New(env, false);
    }
    
    return Napi::Boolean::New(env, m_document->isModified());
#else
    return Napi::Boolean::New(env, false);
#endif
}

Napi::Value DocumentWrapper::GetMode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        return Napi::String::New(env, "");
    }
    
    QString mode = m_document->mode();
    return Napi::String::New(env, mode.toStdString());
#else
    return Napi::String::New(env, "");
#endif
}

void DocumentWrapper::SetMode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return;
    }
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return;
    }
    
    std::string mode = info[0].As<Napi::String>().Utf8Value();
    m_document->setMode(QString::fromStdString(mode));
#endif
}

Napi::Value DocumentWrapper::GetModes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array modes = Napi::Array::New(env);
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        return modes;
    }
    
    QStringList modeList = m_document->modes();
    for (int i = 0; i < modeList.size(); ++i) {
        modes[i] = Napi::String::New(env, modeList[i].toStdString());
    }
#endif
    
    return modes;
}

Napi::Value DocumentWrapper::OpenUrl(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    std::string url = info[0].As<Napi::String>().Utf8Value();
    bool success = m_document->openUrl(QUrl::fromLocalFile(QString::fromStdString(url)));
    return Napi::Boolean::New(env, success);
#else
    return Napi::Boolean::New(env, false);
#endif
}

Napi::Value DocumentWrapper::SaveUrl(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    bool success = m_document->save();
    return Napi::Boolean::New(env, success);
#else
    return Napi::Boolean::New(env, false);
#endif
}

Napi::Value DocumentWrapper::GetUrl(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        return Napi::String::New(env, "");
    }
    
    QUrl url = m_document->url();
    return Napi::String::New(env, url.toLocalFile().toStdString());
#else
    return Napi::String::New(env, "");
#endif
}

void DocumentWrapper::Undo(const Napi::CallbackInfo& info) {
#ifdef HAVE_KTEXTEDITOR
    if (m_document) {
        m_document->undo();
    }
#endif
}

void DocumentWrapper::Redo(const Napi::CallbackInfo& info) {
#ifdef HAVE_KTEXTEDITOR
    if (m_document) {
        m_document->redo();
    }
#endif
}

Napi::Value DocumentWrapper::GetSyntaxTokens(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Parameters: lineStart, lineEnd
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected lineStart and lineEnd as numbers").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int lineStart = info[0].As<Napi::Number>().Int32Value();
    int lineEnd = info[1].As<Napi::Number>().Int32Value();
    
    Napi::Array tokens = Napi::Array::New(env);
    uint32_t tokenIndex = 0;
    
    // Extract syntax tokens for each line
    for (int line = lineStart; line <= lineEnd && line < m_document->lines(); line++) {
        QString lineText = m_document->line(line);
        
        // Iterate through each character to get highlighting
        for (int col = 0; col < lineText.length(); ) {
            auto attr = m_document->attributeAt(KTextEditor::Cursor(line, col));
            
            // Find the extent of this attribute
            int startCol = col;
            int endCol = col + 1;
            
            // Extend while attribute is the same
            while (endCol < lineText.length()) {
                auto nextAttr = m_document->attributeAt(KTextEditor::Cursor(line, endCol));
                if (nextAttr != attr) break;
                endCol++;
            }
            
            // Create token object
            Napi::Object token = Napi::Object::New(env);
            token.Set("line", Napi::Number::New(env, line));
            token.Set("startColumn", Napi::Number::New(env, startCol));
            token.Set("endColumn", Napi::Number::New(env, endCol));
            
            // Get token type from attribute name
            QString tokenType = attr ? attr->name() : QString("text");
            token.Set("tokenType", Napi::String::New(env, tokenType.toStdString()));
            
            tokens[tokenIndex++] = token;
            col = endCol;
        }
    }
    
    return tokens;
#else
    // Fallback: return empty array
    return Napi::Array::New(env);
#endif
}

Napi::Value DocumentWrapper::GetFoldingRegions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::Error::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Array regions = Napi::Array::New(env);
    uint32_t regionIndex = 0;
    
    // Iterate through lines to find folding regions
    for (int line = 0; line < m_document->lines(); line++) {
        // Check if this line starts a foldable region
        if (m_document->isLineVisible(line)) {
            // Get folding range starting at this line
            auto foldingRange = m_document->foldingRegionAt(KTextEditor::Cursor(line, 0));
            
            if (foldingRange.isValid()) {
                Napi::Object region = Napi::Object::New(env);
                region.Set("startLine", Napi::Number::New(env, foldingRange.start().line()));
                region.Set("endLine", Napi::Number::New(env, foldingRange.end().line()));
                
                // Determine folding kind based on content
                QString lineText = m_document->line(line);
                QString kind = "region";
                if (lineText.trimmed().startsWith("/*") || lineText.trimmed().startsWith("//")) {
                    kind = "comment";
                } else if (lineText.contains("import") || lineText.contains("include")) {
                    kind = "imports";
                }
                region.Set("kind", Napi::String::New(env, kind.toStdString()));
                
                regions[regionIndex++] = region;
            }
        }
    }
    
    return regions;
#else
    // Fallback: return empty array
    return Napi::Array::New(env);
#endif
}

} // namespace KateNative
