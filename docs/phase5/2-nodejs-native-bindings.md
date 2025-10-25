# Node.js Native Binding Options for KTextEditor

## Overview

This document explores the available options for creating native bindings between Node.js and the C++ KTextEditor framework, comparing approaches, providing examples, and making recommendations.

## Native Binding Technologies

### 1. N-API (Node-API)

#### Description
- **Official API**: Stable ABI (Application Binary Interface) for native modules
- **Language**: C (can be used from C++)
- **Version Independence**: Binary modules work across Node.js versions
- **Maintenance**: Maintained by Node.js core team
- **Status**: Recommended approach since Node.js 10

#### Advantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **ABI Stability**: No need to recompile for different Node.js versions
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Long-term Support**: Part of Node.js core, guaranteed stability
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Platform Independent**: Works on all platforms
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **No Dependencies**: Part of Node.js runtime
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Good Performance**: Direct C API with minimal overhead

#### Disadvantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **C-Style API**: Verbose, manual memory management
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Lower-level**: More boilerplate code required
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Learning Curve**: Requires understanding of N-API concepts

#### Example: Basic N-API Module

```c
// napi_example.c
#include <node_api.h>

// Simple function that adds two numbers
napi_value Add(napi_env env, napi_callback_info info) {
    napi_status status;
    
    // Get arguments
    size_t argc = 2;
    napi_value args[2];
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    
    // Convert arguments to numbers
    double value1, value2;
    status = napi_get_value_double(env, args[0], &value1);
    status = napi_get_value_double(env, args[1], &value2);
    
    // Create return value
    napi_value result;
    status = napi_create_double(env, value1 + value2, &result);
    
    return result;
}

// Module initialization
napi_value Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;
    
    // Create function
    status = napi_create_function(env, NULL, 0, Add, NULL, &fn);
    
    // Set property on exports
    status = napi_set_named_property(env, exports, "add", fn);
    
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

#### Example: KTextEditor Document Wrapper (N-API)

```c
// kate_document_napi.c
#include <node_api.h>

// Forward declaration
typedef struct KateDocumentWrapper {
    void* kate_document;  // Pointer to KTextEditor::Document
    napi_ref js_object;
} KateDocumentWrapper;

// Create new document
napi_value CreateDocument(napi_env env, napi_callback_info info) {
    napi_status status;
    
    // Create wrapper
    KateDocumentWrapper* wrapper = malloc(sizeof(KateDocumentWrapper));
    
    // TODO: Create actual KTextEditor::Document instance
    // wrapper->kate_document = createKateDocument();
    
    // Create JavaScript object
    napi_value js_object;
    status = napi_create_object(env, &js_object);
    
    // Wrap native object
    status = napi_wrap(env, js_object, wrapper, 
                       NULL, NULL, &wrapper->js_object);
    
    return js_object;
}

// Get document text
napi_value GetText(napi_env env, napi_callback_info info) {
    napi_status status;
    
    // Get 'this'
    napi_value jsthis;
    status = napi_get_cb_info(env, info, NULL, NULL, &jsthis, NULL);
    
    // Unwrap native object
    KateDocumentWrapper* wrapper;
    status = napi_unwrap(env, jsthis, (void**)&wrapper);
    
    // TODO: Get text from KTextEditor::Document
    // const char* text = getDocumentText(wrapper->kate_document);
    const char* text = "Sample text";
    
    // Create JavaScript string
    napi_value result;
    status = napi_create_string_utf8(env, text, NAPI_AUTO_LENGTH, &result);
    
    return result;
}
```

### 2. node-addon-api (C++ Wrapper)

#### Description
- **C++ Wrapper**: Header-only C++ wrapper around N-API
- **Language**: Modern C++ (C++11/14/17)
- **Abstraction**: Object-oriented interface
- **Exceptions**: C++ exception support
- **Status**: Recommended for C++ projects

#### Advantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Modern C++**: RAII, exceptions, templates
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Less Boilerplate**: Higher-level abstractions
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Type Safety**: C++ type system
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **ABI Stable**: Built on N-API
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Easier Integration**: Works well with C++ libraries like Qt
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Better Ergonomics**: Object-oriented API

#### Disadvantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Extra Dependency**: Requires node-addon-api package
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Compile-time Overhead**: Header-only library increases build time
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Slightly Larger Binaries**: More code generation

#### Example: Basic node-addon-api Module

```cpp
// addon_example.cpp
#include <napi.h>

// Simple function that adds two numbers
Napi::Number Add(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Check arguments
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected two numbers").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    // Get arguments
    double arg0 = info[0].As<Napi::Number>().DoubleValue();
    double arg1 = info[1].As<Napi::Number>().DoubleValue();
    
    // Return result
    return Napi::Number::New(env, arg0 + arg1);
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("add", Napi::Function::New(env, Add));
    return exports;
}

NODE_API_MODULE(addon, Init)
```

#### Example: KTextEditor Document Class Wrapper

```cpp
// kate_document.cpp
#include <napi.h>
#include <KTextEditor/Document>
#include <KTextEditor/Editor>

class KateDocumentWrapper : public Napi::ObjectWrap<KateDocumentWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "KateDocument", {
            InstanceMethod("getText", &KateDocumentWrapper::GetText),
            InstanceMethod("setText", &KateDocumentWrapper::SetText),
            InstanceMethod("insertText", &KateDocumentWrapper::InsertText),
            InstanceMethod("removeText", &KateDocumentWrapper::RemoveText),
            InstanceMethod("line", &KateDocumentWrapper::GetLine),
            InstanceMethod("lineCount", &KateDocumentWrapper::GetLineCount),
            InstanceMethod("setHighlightingMode", &KateDocumentWrapper::SetHighlightingMode),
        });
        
        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();
        
        exports.Set("KateDocument", func);
        return exports;
    }
    
    KateDocumentWrapper(const Napi::CallbackInfo& info) 
        : Napi::ObjectWrap<KateDocumentWrapper>(info) {
        Napi::Env env = info.Env();
        
        // Create KTextEditor document
        KTextEditor::Editor* editor = KTextEditor::Editor::instance();
        m_document = editor->createDocument(nullptr);
    }
    
    ~KateDocumentWrapper() {
        // Clean up document
        delete m_document;
    }

private:
    KTextEditor::Document* m_document;
    static Napi::FunctionReference constructor;
    
    // Get entire document text
    Napi::Value GetText(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        QString text = m_document->text();
        return Napi::String::New(env, text.toStdString());
    }
    
    // Set entire document text
    void SetText(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "Expected string argument").ThrowAsJavaScriptException();
            return;
        }
        
        std::string text = info[0].As<Napi::String>().Utf8Value();
        m_document->setText(QString::fromStdString(text));
    }
    
    // Insert text at position
    void InsertText(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 3) {
            Napi::TypeError::New(env, "Expected (line, column, text)").ThrowAsJavaScriptException();
            return;
        }
        
        int line = info[0].As<Napi::Number>().Int32Value();
        int column = info[1].As<Napi::Number>().Int32Value();
        std::string text = info[2].As<Napi::String>().Utf8Value();
        
        KTextEditor::Cursor cursor(line, column);
        m_document->insertText(cursor, QString::fromStdString(text));
    }
    
    // Remove text range
    void RemoveText(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 4) {
            Napi::TypeError::New(env, "Expected (startLine, startCol, endLine, endCol)")
                .ThrowAsJavaScriptException();
            return;
        }
        
        int startLine = info[0].As<Napi::Number>().Int32Value();
        int startCol = info[1].As<Napi::Number>().Int32Value();
        int endLine = info[2].As<Napi::Number>().Int32Value();
        int endCol = info[3].As<Napi::Number>().Int32Value();
        
        KTextEditor::Range range(
            KTextEditor::Cursor(startLine, startCol),
            KTextEditor::Cursor(endLine, endCol)
        );
        
        m_document->removeText(range);
    }
    
    // Get specific line
    Napi::Value GetLine(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected line number").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        int line = info[0].As<Napi::Number>().Int32Value();
        QString lineText = m_document->line(line);
        
        return Napi::String::New(env, lineText.toStdString());
    }
    
    // Get line count
    Napi::Value GetLineCount(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        return Napi::Number::New(env, m_document->lines());
    }
    
    // Set syntax highlighting mode
    void SetHighlightingMode(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "Expected mode name").ThrowAsJavaScriptException();
            return;
        }
        
        std::string mode = info[0].As<Napi::String>().Utf8Value();
        m_document->setHighlightingMode(QString::fromStdString(mode));
    }
};

Napi::FunctionReference KateDocumentWrapper::constructor;

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return KateDocumentWrapper::Init(env, exports);
}

NODE_API_MODULE(kate_binding, Init)
```

#### JavaScript Usage Example

```javascript
// example.js
const { KateDocument } = require('./build/Release/kate_binding');

// Create document
const doc = new KateDocument();

// Set content
doc.setText("Hello, World!\nThis is Kate.");

// Get content
console.log(doc.getText());

// Get line
console.log(doc.line(0));  // "Hello, World!"

// Insert text
doc.insertText(1, 0, "NEW LINE\n");

// Set syntax mode
doc.setHighlightingMode("JavaScript");

// Get line count
console.log("Lines:", doc.lineCount());
```

### 3. SWIG (Simplified Wrapper and Interface Generator)

#### Description
- **Code Generator**: Automatically generates bindings from C/C++ headers
- **Multi-language**: Supports many target languages
- **Mature**: Long-established project (since 1996)

#### Advantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Automatic Generation**: Less manual code
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Multi-language**: Can target Python, Ruby, etc.
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Header Parsing**: Works from existing C++ headers

#### Disadvantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Complex Setup**: Steep learning curve
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Generated Code Quality**: May not be optimal
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Limited Control**: Hard to customize behavior
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Maintenance Burden**: Interface files need updating
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Not N-API Based**: May break across Node.js versions

#### Not Recommended for This Project

### 4. FFI (Foreign Function Interface)

#### Description
- **Dynamic Loading**: Load native libraries at runtime
- **No Compilation**: Pure JavaScript with native calls
- **Examples**: node-ffi, node-ffi-napi

#### Advantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **No Compilation**: Can load existing .so/.dll files
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Dynamic**: Load libraries at runtime
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Rapid Prototyping**: Quick to test native functions

#### Disadvantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Performance**: Slower than direct bindings
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Complex Types**: Hard to map complex C++ classes
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Limited**: No C++ object wrapping
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Maintenance**: node-ffi maintenance concerns

#### Example: Basic FFI Usage

```javascript
const ffi = require('ffi-napi');
const ref = require('ref-napi');

// Define library
const libm = ffi.Library('libm', {
  'ceil': ['double', ['double']]
});

// Use function
console.log(libm.ceil(1.5));  // 2
```

#### Not Ideal for KTextEditor (Too Complex)

### 5. NAN (Native Abstractions for Node.js)

#### Description
- **Legacy Approach**: Pre-N-API abstraction layer
- **Compatibility**: Works across old Node.js versions
- **Status**: Superseded by N-API

#### Disadvantages
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Deprecated**: N-API is preferred
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **No ABI Stability**: Must recompile for each Node.js version
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Maintenance**: Being phased out

#### Not Recommended (Use N-API Instead)

## Build System Options

### 1. node-gyp

#### Description
- **Official**: Node.js build tool
- **Based on**: Google's GYP (Generate Your Projects)
- **Configuration**: binding.gyp files

#### Example: binding.gyp for KTextEditor

```python
{
  "targets": [{
    "target_name": "kate_binding",
    "sources": [
      "src/kate_document.cpp",
      "src/kate_editor.cpp",
      "src/binding.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "/usr/include/KF5/KTextEditor",
      "/usr/include/KF5",
      "/usr/include/qt5",
      "/usr/include/qt5/QtCore",
      "/usr/include/qt5/QtGui",
      "/usr/include/qt5/QtWidgets"
    ],
    "libraries": [
      "-lKF5TextEditor",
      "-lQt5Core",
      "-lQt5Gui",
      "-lQt5Widgets"
    ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "cflags": [ "-fPIC", "-std=c++17" ],
    "cflags_cc": [ "-fPIC", "-std=c++17" ],
    "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
  }]
}
```

#### package.json Configuration

```json
{
  "name": "kate-binding",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "install": "node-gyp rebuild",
    "build": "node-gyp build",
    "clean": "node-gyp clean"
  },
  "dependencies": {
    "node-addon-api": "^8.0.0"
  },
  "devDependencies": {
    "node-gyp": "^10.0.0"
  },
  "gypfile": true
}
```

### 2. CMake.js

#### Description
- **Modern Alternative**: Uses CMake instead of GYP
- **Better C++ Support**: More natural for C++ projects
- **Cross-platform**: CMake handles platform differences

#### Example: CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.15)
project(kate_binding)

set(CMAKE_CXX_STANDARD 17)

# Find Node.js
find_package(Node REQUIRED)

# Find Qt5
find_package(Qt5 COMPONENTS Core Gui Widgets REQUIRED)

# Find KF5
find_package(KF5TextEditor REQUIRED)

# Add node-addon-api
execute_process(
    COMMAND node -p "require('node-addon-api').include"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

# Sources
add_library(kate_binding SHARED
    src/kate_document.cpp
    src/kate_editor.cpp
    src/binding.cpp
)

target_include_directories(kate_binding PRIVATE
    ${NODE_ADDON_API_DIR}
    ${CMAKE_JS_INC}
)

target_link_libraries(kate_binding
    ${CMAKE_JS_LIB}
    Qt5::Core
    Qt5::Gui
    Qt5::Widgets
    KF5::TextEditor
)

set_target_properties(kate_binding PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)
```

## Recommended Approach for Kate Neo

### Choice: node-addon-api with node-gyp

#### Reasons
1. **Modern C++**: KTextEditor is C++, node-addon-api provides excellent C++ support
2. **ABI Stable**: Based on N-API, works across Node.js versions
3. **Good Ergonomics**: Object-oriented API makes wrapping easier
4. **Ecosystem**: Well-supported, active development
5. **Documentation**: Comprehensive examples and guides

### Implementation Strategy

#### Phase 1: Basic Wrapper
- Wrap KTextEditor::Document class
- Basic text operations (get, set, insert, remove)
- Line access methods
- Syntax highlighting mode setting

#### Phase 2: Event System
- Connect Qt signals to JavaScript callbacks
- Document change notifications
- Syntax highlighting updates

#### Phase 3: Advanced Features
- Cursor and Range classes
- Search and replace
- Undo/redo
- Code folding

#### Phase 4: Optimization
- Async operations for heavy tasks
- Efficient text transfer
- Caching and memoization

## Qt Event Loop Integration

### Challenge
KTextEditor requires Qt's event loop, but Node.js has its own event loop.

### Solution Options

#### Option 1: Run Qt in Separate Thread
```cpp
#include <QThread>
#include <QCoreApplication>

class QtThread : public QThread {
    void run() override {
        int argc = 0;
        QCoreApplication app(argc, nullptr);
        app.exec();
    }
};

// Start Qt thread
QtThread qtThread;
qtThread.start();
```

#### Option 2: Integrate Qt Event Loop with libuv
```cpp
#include <uv.h>
#include <QCoreApplication>

uv_timer_t qt_timer;

void processQtEvents(uv_timer_t* handle) {
    QCoreApplication::processEvents();
}

// In initialization
uv_timer_init(uv_default_loop(), &qt_timer);
uv_timer_start(&qt_timer, processQtEvents, 0, 10);  // Every 10ms
```

#### Option 3: Headless Mode (Recommended)
- Use QCoreApplication instead of QApplication
- No GUI components
- Document operations only
- Custom rendering in web frontend

```cpp
#include <QCoreApplication>

// In module initialization
int argc = 0;
char* argv[] = {nullptr};
QCoreApplication app(argc, argv);
```

## Memory Management Strategy

### Reference Counting
```cpp
class KateDocumentWrapper : public Napi::ObjectWrap<KateDocumentWrapper> {
public:
    // Constructor increments ref count
    KateDocumentWrapper(const Napi::CallbackInfo& info) 
        : Napi::ObjectWrap<KateDocumentWrapper>(info) {
        m_document = createDocument();
        m_document->setParent(nullptr);  // We manage lifetime
    }
    
    // Destructor decrements ref count
    ~KateDocumentWrapper() {
        if (m_document) {
            delete m_document;
            m_document = nullptr;
        }
    }
};
```

### Weak References for Callbacks
```cpp
// Store weak reference to avoid circular refs
class DocumentChangeNotifier {
    Napi::ObjectReference m_callback;
    
    void setCallback(const Napi::Function& cb) {
        m_callback = Napi::Weak(cb);
    }
    
    void notify() {
        Napi::Function cb = m_callback.Value();
        if (!cb.IsEmpty()) {
            cb.Call({});
        }
    }
};
```

## Testing Strategy

### Unit Tests (C++)
```cpp
// test/document_test.cpp
#include <gtest/gtest.h>
#include "kate_document.h"

TEST(KateDocument, CreateDocument) {
    // Test document creation
}

TEST(KateDocument, TextOperations) {
    // Test text insertion, removal
}
```

### Integration Tests (JavaScript)
```javascript
// test/integration.test.js
const { KateDocument } = require('../');

describe('KateDocument', () => {
    it('should create document', () => {
        const doc = new KateDocument();
        expect(doc).toBeDefined();
    });
    
    it('should set and get text', () => {
        const doc = new KateDocument();
        doc.setText('Hello');
        expect(doc.getText()).toBe('Hello');
    });
});
```

## Next Steps

1. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Set up development environment (Qt5, KF5)
2. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Create simple binding.gyp configuration
3. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Implement basic KateDocument wrapper
4. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Test document operations
5. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Add event system
6. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Implement complete API surface
7. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Performance testing and optimization
8. <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Documentation and examples

## Resources

- [N-API Documentation](https://nodejs.org/api/n-api.html)
- [node-addon-api GitHub](https://github.com/nodejs/node-addon-api)
- [node-addon-api Documentation](https://github.com/nodejs/node-addon-api/blob/main/doc/README.md)
- [node-gyp Documentation](https://github.com/nodejs/node-gyp)
- [Native Modules Best Practices](https://nodejs.org/en/docs/guides/addon-best-practices/)
