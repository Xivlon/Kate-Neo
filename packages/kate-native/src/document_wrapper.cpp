#include "document_wrapper.h"
#include "qt_runner.h"

#ifdef HAVE_KTEXTEDITOR
#include <KTextEditor/Document>
#include <KTextEditor/Editor>
#include <KTextEditor/Range>
#include <KTextEditor/Cursor>
#include <QString>
#include <QUrl>
#include <QRegularExpression>
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
        
        // Phase 8: Advanced editing features
        InstanceMethod("search", &DocumentWrapper::Search),
        InstanceMethod("replace", &DocumentWrapper::Replace),
        InstanceMethod("replaceAll", &DocumentWrapper::ReplaceAll),
        InstanceMethod("getIndentation", &DocumentWrapper::GetIndentation),
        InstanceMethod("setIndentation", &DocumentWrapper::SetIndentation),
        InstanceMethod("indentLine", &DocumentWrapper::IndentLine),
        InstanceMethod("indentLines", &DocumentWrapper::IndentLines),
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
    
    const int MAX_SCAN_LENGTH = 10000; // Prevent excessive scanning
    
    // Extract syntax tokens for each line
    for (int line = lineStart; line <= lineEnd && line < m_document->lines(); line++) {
        QString lineText = m_document->line(line);
        int lineLength = qMin(lineText.length(), MAX_SCAN_LENGTH);
        
        // Iterate through each character to get highlighting
        for (int col = 0; col < lineLength; ) {
            auto attr = m_document->attributeAt(KTextEditor::Cursor(line, col));
            
            // Find the extent of this attribute
            int startCol = col;
            int endCol = col + 1;
            
            // Extend while attribute is the same (with limit)
            while (endCol < lineLength && (endCol - startCol) < 1000) {
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
    
    const int MAX_LINES = 50000; // Limit for performance
    int maxLine = qMin(m_document->lines(), MAX_LINES);
    
    // Iterate through lines to find folding regions
    // Note: In a real implementation, we'd use Kate's folding API more efficiently
    for (int line = 0; line < maxLine; line++) {
        // Check if this line starts a foldable region
        if (m_document->isLineVisible(line)) {
            // Get folding range starting at this line
            auto foldingRange = m_document->foldingRegionAt(KTextEditor::Cursor(line, 0));
            
            if (foldingRange.isValid() && foldingRange.start().line() == line) {
                Napi::Object region = Napi::Object::New(env);
                region.Set("startLine", Napi::Number::New(env, foldingRange.start().line()));
                region.Set("endLine", Napi::Number::New(env, foldingRange.end().line()));
                
                // Use default kind - proper classification would require language-specific logic
                region.Set("kind", Napi::String::New(env, "region"));
                
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

// Phase 8: Search and Replace Methods

Napi::Value DocumentWrapper::Search(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::TypeError::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "First argument must be a search string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string searchText = info[0].As<Napi::String>().Utf8Value();
    
    // Parse options
    bool caseSensitive = false;
    bool wholeWords = false;
    bool useRegex = false;
    
    if (info.Length() >= 2 && info[1].IsObject()) {
        Napi::Object options = info[1].As<Napi::Object>();
        
        if (options.Has("caseSensitive") && options.Get("caseSensitive").IsBoolean()) {
            caseSensitive = options.Get("caseSensitive").As<Napi::Boolean>().Value();
        }
        
        if (options.Has("wholeWords") && options.Get("wholeWords").IsBoolean()) {
            wholeWords = options.Get("wholeWords").As<Napi::Boolean>().Value();
        }
        
        if (options.Has("regex") && options.Get("regex").IsBoolean()) {
            useRegex = options.Get("regex").As<Napi::Boolean>().Value();
        }
    }
    
    // Search through document
    Napi::Array results = Napi::Array::New(env);
    uint32_t resultIndex = 0;
    
    QString qSearchText = QString::fromStdString(searchText);
    int lineCount = m_document->lines();
    
    for (int line = 0; line < lineCount; line++) {
        QString lineText = m_document->line(line);
        
        if (useRegex) {
            QRegularExpression regex(qSearchText, caseSensitive ? QRegularExpression::NoPatternOption : QRegularExpression::CaseInsensitiveOption);
            QRegularExpressionMatchIterator matches = regex.globalMatch(lineText);
            
            while (matches.hasNext()) {
                QRegularExpressionMatch match = matches.next();
                Napi::Object result = Napi::Object::New(env);
                result.Set("line", Napi::Number::New(env, line));
                result.Set("column", Napi::Number::New(env, match.capturedStart()));
                result.Set("length", Napi::Number::New(env, match.capturedLength()));
                result.Set("text", Napi::String::New(env, match.captured().toStdString()));
                results[resultIndex++] = result;
            }
        } else {
            Qt::CaseSensitivity cs = caseSensitive ? Qt::CaseSensitive : Qt::CaseInsensitive();
            int startPos = 0;
            
            while (true) {
                int pos = lineText.indexOf(qSearchText, startPos, cs);
                if (pos < 0) break;
                
                // Check whole word match if requested
                if (wholeWords) {
                    bool isWordStart = (pos == 0 || !lineText[pos - 1].isLetterOrNumber());
                    bool isWordEnd = (pos + qSearchText.length() >= lineText.length() || 
                                     !lineText[pos + qSearchText.length()].isLetterOrNumber());
                    if (!isWordStart || !isWordEnd) {
                        startPos = pos + 1;
                        continue;
                    }
                }
                
                Napi::Object result = Napi::Object::New(env);
                result.Set("line", Napi::Number::New(env, line));
                result.Set("column", Napi::Number::New(env, pos));
                result.Set("length", Napi::Number::New(env, qSearchText.length()));
                result.Set("text", Napi::String::New(env, qSearchText.toStdString()));
                results[resultIndex++] = result;
                
                startPos = pos + 1;
            }
        }
    }
    
    return results;
#else
    return Napi::Array::New(env);
#endif
}

Napi::Value DocumentWrapper::Replace(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::TypeError::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    if (info.Length() < 4 || !info[0].IsNumber() || !info[1].IsNumber() || 
        !info[2].IsNumber() || !info[3].IsString()) {
        Napi::TypeError::New(env, "Arguments: line, column, length, replacement").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    int line = info[0].As<Napi::Number>().Int32Value();
    int column = info[1].As<Napi::Number>().Int32Value();
    int length = info[2].As<Napi::Number>().Int32Value();
    std::string replacement = info[3].As<Napi::String>().Utf8Value();
    
    KTextEditor::Range range(line, column, line, column + length);
    bool success = m_document->replaceText(range, QString::fromStdString(replacement));
    
    return Napi::Boolean::New(env, success);
#else
    return Napi::Boolean::New(env, false);
#endif
}

Napi::Value DocumentWrapper::ReplaceAll(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::TypeError::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Arguments: searchText, replacementText").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    std::string searchText = info[0].As<Napi::String>().Utf8Value();
    std::string replacementText = info[1].As<Napi::String>().Utf8Value();
    
    // Parse options
    bool caseSensitive = false;
    bool wholeWords = false;
    
    if (info.Length() >= 3 && info[2].IsObject()) {
        Napi::Object options = info[2].As<Napi::Object>();
        
        if (options.Has("caseSensitive") && options.Get("caseSensitive").IsBoolean()) {
            caseSensitive = options.Get("caseSensitive").As<Napi::Boolean>().Value();
        }
        
        if (options.Has("wholeWords") && options.Get("wholeWords").IsBoolean()) {
            wholeWords = options.Get("wholeWords").As<Napi::Boolean>().Value();
        }
    }
    
    // First, find all occurrences (in reverse order to maintain positions)
    Napi::Value searchResults = Search(info);
    Napi::Array results = searchResults.As<Napi::Array>();
    
    int replacedCount = 0;
    
    // Replace from end to start to maintain positions
    for (int i = results.Length() - 1; i >= 0; i--) {
        Napi::Object result = results.Get(i).As<Napi::Object>();
        int line = result.Get("line").As<Napi::Number>().Int32Value();
        int column = result.Get("column").As<Napi::Number>().Int32Value();
        int length = result.Get("length").As<Napi::Number>().Int32Value();
        
        KTextEditor::Range range(line, column, line, column + length);
        if (m_document->replaceText(range, QString::fromStdString(replacementText))) {
            replacedCount++;
        }
    }
    
    return Napi::Number::New(env, replacedCount);
#else
    return Napi::Number::New(env, 0);
#endif
}

// Phase 8: Indentation Methods

Napi::Value DocumentWrapper::GetIndentation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::TypeError::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Line number required").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    int line = info[0].As<Napi::Number>().Int32Value();
    
    if (line < 0 || line >= m_document->lines()) {
        return Napi::Number::New(env, 0);
    }
    
    QString lineText = m_document->line(line);
    int indentation = 0;
    
    for (int i = 0; i < lineText.length(); i++) {
        if (lineText[i] == ' ') {
            indentation++;
        } else if (lineText[i] == '\t') {
            indentation += 4; // Tab = 4 spaces
        } else {
            break;
        }
    }
    
    return Napi::Number::New(env, indentation);
#else
    return Napi::Number::New(env, 0);
#endif
}

void DocumentWrapper::SetIndentation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::TypeError::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return;
    }
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Arguments: line, spaces").ThrowAsJavaScriptException();
        return;
    }
    
    int line = info[0].As<Napi::Number>().Int32Value();
    int spaces = info[1].As<Napi::Number>().Int32Value();
    
    if (line < 0 || line >= m_document->lines()) {
        return;
    }
    
    QString lineText = m_document->line(line);
    
    // Find where text starts (after indentation)
    int textStart = 0;
    for (int i = 0; i < lineText.length(); i++) {
        if (!lineText[i].isSpace()) {
            textStart = i;
            break;
        }
    }
    
    // Create new indentation
    QString newIndent = QString(spaces, ' ');
    QString newText = newIndent + lineText.mid(textStart);
    
    // Replace the line
    KTextEditor::Range range(line, 0, line, lineText.length());
    m_document->replaceText(range, newText);
#endif
}

void DocumentWrapper::IndentLine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::TypeError::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return;
    }
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Line number required").ThrowAsJavaScriptException();
        return;
    }
    
    int line = info[0].As<Napi::Number>().Int32Value();
    
    if (line < 0 || line >= m_document->lines()) {
        return;
    }
    
    // Use Kate's smart indentation
    KTextEditor::Range range(line, 0, line, 0);
    m_document->indent(range, 1);
#endif
}

void DocumentWrapper::IndentLines(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef HAVE_KTEXTEDITOR
    if (!m_document) {
        Napi::TypeError::New(env, "Document not initialized").ThrowAsJavaScriptException();
        return;
    }
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Arguments: startLine, endLine").ThrowAsJavaScriptException();
        return;
    }
    
    int startLine = info[0].As<Napi::Number>().Int32Value();
    int endLine = info[1].As<Napi::Number>().Int32Value();
    
    if (startLine < 0 || endLine >= m_document->lines() || startLine > endLine) {
        return;
    }
    
    // Use Kate's smart indentation for range
    KTextEditor::Range range(startLine, 0, endLine, m_document->lineLength(endLine));
    m_document->indent(range, 1);
#endif
}

} // namespace KateNative
