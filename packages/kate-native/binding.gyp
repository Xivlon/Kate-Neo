{
  "targets": [{
    "target_name": "kate_native",
    "sources": [
      "src/addon.cpp",
      "src/qt_runner.cpp",
      "src/document_wrapper.cpp",
      "src/editor_wrapper.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")"
    ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "cflags": [ "-fPIC", "-std=c++17" ],
    "cflags_cc": [ "-fPIC", "-std=c++17" ],
    "defines": [ 
      "NAPI_CPP_EXCEPTIONS",
      "QT_NO_KEYWORDS"
    ],
    "conditions": [
      ['OS=="linux"', {
        "include_dirs": [
          "<!@(pkg-config --cflags-only-I Qt5Core Qt5Gui KF5TextEditor 2>/dev/null | sed 's/-I//g' || echo '')"
        ],
        "libraries": [
          "<!@(pkg-config --libs Qt5Core Qt5Gui KF5TextEditor 2>/dev/null || echo '-lQt5Core -lQt5Gui -lKF5TextEditor')"
        ],
        "defines": [
          "<!@(pkg-config --exists KF5TextEditor 2>/dev/null && echo 'HAVE_KTEXTEDITOR' || echo '')"
        ]
      }],
      ['OS=="mac"', {
        "include_dirs": [
          "<!@(pkg-config --cflags-only-I Qt5Core Qt5Gui KF5TextEditor 2>/dev/null | sed 's/-I//g' || echo '')"
        ],
        "libraries": [
          "<!@(pkg-config --libs Qt5Core Qt5Gui KF5TextEditor 2>/dev/null || echo '')"
        ]
      }],
      ['OS=="win"', {
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1
          }
        }
      }]
    ]
  }]
}
