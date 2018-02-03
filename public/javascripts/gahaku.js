var socket = io({forceNew: true});
    $('form').submit(() => {
          socket.emit('chat message', $('#m').val());
          $('#m').val('');
          return false;
      });
      socket.on('chat message', (msg) => {
        $('#messages').append($('<li>').text(msg));
      });


    socket.on('doc', function(data) {
      // CodeMirrorの初期化&設定

      var cm = CodeMirror.fromTextArea(document.getElementById('note'), {
        theme: "monokai",
        mode:  "javascript",
        lineNumbers: true,
        styleActiveLine: true,
        selectionPointer: true,
        lineWrapping: true,
        keyMap: "sublime",
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        tabSize: 2,
        gutters: ["CodeMirror-lint-markers"],
        readOnly: true,
        lint: true
      });

      // ショートカット を指定
      cm.setOption('extraKeys', {
          'Cmd-E': function () {
      snippet(cm, snippets);
          },
          'Ctrl-E': function () {
      snippet(cm, snippets);
          }
      });
      // スニペットの配列
      var snippets = [
          { text: 'const', displayText: 'const declarations' },
          { text: 'let', displayText: 'let declarations' },
          { text: 'var', displayText: 'var declarations' },
      ];

      cm.setValue(data.str);
      setEditorData(data.str, cm);

      // otの初期化
      var adapter = new ot.SocketIOAdapter(socket);
      var cmAdapter = new ot.CodeMirrorAdapter(cm);
      var client = new ot.EditorClient(data.revision, data.clients, adapter, cmAdapter);
    });

function snippet(cm, snippets) {
  CodeMirror.showHint(cm, function () {
    var cursor = cm.getCursor();
    var token = cm.getTokenAt(cursor);
    var start = token.start;
    var end = cursor.ch;
    var line = cursor.line;
    var currentWord = token.string;
    // 入力した文字列をスニペット配列から探す
    var list = snippets.filter(function (item) {
      return item.text.indexOf(currentWord) >= 0;
    });
    return {
        list: list.length ? list : snippets,
        from: CodeMirror.Pos(line, start),
        to: CodeMirror.Pos(line, end)
    };
  }, { completeSingle: false });
}

