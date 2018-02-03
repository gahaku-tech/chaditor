var errorResultCSS = [];
var errorResultJS = [];
var cm;
var editorJS;

$(function(){
  $('body').css('font-family','DotumChe');
  $('body').css('font-size','12pt');

  // 実行ボタンを押した時の処理
  $('#run').click(function() {
    document.getElementById('errorResult2').innerHTML = '';
    document.getElementById('errorResult').innerHTML = '';
    $('#demoResult').hide();
    document.getElementById('errorResult2').innerHTML = '';
    document.getElementById('errorResult').innerHTML = '';
    $('#demoResult').show();
    document.getElementById('demoResult').innerHTML = '';

    // 保存
    cm.save();
    //console.log(cm.getValue());

    // ユーザの実行環境初期化
    userWindow.removeEventListenerAll();

    // 実行とエラー描画
    demoCode();
    outputErr();
  });
  
  // リセットボタンを押した時の処理
  $('button#reset').click(function() {
    document.getElementById('errorResult2').innerHTML = '';
    document.getElementById('errorResult').innerHTML = '';
    $('#demoResult').hide();
  });

});

function setEditorData(data, editor){
  editorJS = data;
  cm = editor;

}

/* ------- window manager ------- */
var userWindow = Object.create(window, {
  eventList: {
    writable: true,
    configurable: true,
    value:{}
  },
  addEventListener: {
    writable: false,
    configurable: false,
    value: function(eventName, callback){
      this.eventList[eventName] = this.eventList[eventName] || [];
      this.eventList[eventName].push(callback);
      window.addEventListener(eventName, callback);
    }
  },
  removeEventListener: {
    writable: false,
    configurable: false,
    value: function(eventName, func){
      //もしfuncが与えられれば、funcを消す。そうじゃなかったら、全部消す
      this.eventList[eventName].forEach(function(eventCb){
        window.removeEventListener(eventName, eventCb); 
      }.bind(this));
      this.eventList[eventName] = [];
    }
  },
  removeEventListenerAll: {
    writable: false,
    configurable: false,
    value: function(){
      Object.keys(userWindow.eventList).forEach(function(eventName){
        this.removeEventListener(eventName);
      }.bind(this));
    }
  }
});

/**
 * @function demoCode
 * 
 * 実行ボタンを押した時の処理
 */
function demoCode(){

  // htmlを読む
  var formattedHTML = document.getElementById("code1").value;

  // javascriptを読む
  var studentWriteJS = cm.getValue();
  var formattedJS = formatJS(studentWriteJS);
      formattedJS = formattedJS.replace(/<pclass=/g, "<p class=");

  // 実行結果描画
  $("div#demoResult").append(`<div>${formattedHTML}</div>`);
  var script = document.createElement('script');
      script.innerHTML = formattedJS;
  $("div#demoResult").append(script);
}


/**
 * @function formatJS
 * 
 * コード整形: JS
 */
function formatJS(jsCode){ 
  var replaceConsoleJs = codeFormatReplace(jsCode);
  var tryHead = "try{"
  var tryTail = "} catch(e){ document.getElementById('errorResult2').innerHTML += '<p id=\"err\">error:[Run JavaScript]<br>message:' + e.name + ': ' + e.message + '</p>'; }";  // ログ送信
  var FormattedJS = tryCatch(replaceConsoleJs);
      FormattedJS = tryHead + '\n' + FormattedJS + '\n' + tryTail;

  return FormattedJS;
}

/**
 * @function formatFormatReplace
 * 
 * コード整形: JSのconsole.log / document.writeの表示場所を変える
 */
function codeFormatReplace(source){
  // console.log → getElementbyId
  // document.write → getElementbyId
  var code2Rep = source;
      code2Rep = code2Rep.replace(/console\.log\((["]*.*["]*)\)/g, `$('#errorResult2').append(\'<p id=\\\'info\\\'>info[JavaScript]\\nConsole Log:\'+$1+\'</p>\')`);
      code2Rep = code2Rep.replace(/window/g, "userWindow");
      code2Rep = code2Rep.replace(/document\.write\((.*)\)/g, `document.getElementById('demoResult').innerHTML += $1;`);
  return code2Rep;
}

/**
 * @function tryCatch
 * 
 * コード整形: try-catchを仕込む
 */
function tryCatch(jsCode){
  var tokenArray = splitJsCode(jsCode);

  // 関数の始めの{と終わりの}、配列の何要素目かを合わせて記録
  var countAllArray = [];
  for (var i=0; i<tokenArray.length; i++){
    if (tokenArray[i] == 'function' || tokenArray[i] == '{' || tokenArray[i] == '}'){
      countAllArray.push(tokenArray[i]);
      countAllArray.push(i);
    }
  }

  var num = [];
  var word = [];  

  // "function", "{", "}" の配列と元の配列の何要素目かを管理
  for (var i=0; i<countAllArray.length; i++){
    if (i % 2 == 1){ num.push(countAllArray[i]); }
    else if (i % 2 == 0){ word.push(countAllArray[i]); }
  }

  var counter = 0;
  var funcStack = [];
  var tryHeads = [];
  var catchTails = [];

  for(i=0; i<word.length; i++){
    if(word[i] === '{'){
      counter ++;
      if(i > 0 && word[i-1] === 'function'){
        //F{ のみに反応してスタックに入れる
        funcStack.unshift(counter);
        tryHeads.push(i);
      }
    }else if(word[i] === '}'){
      if(counter === funcStack[0]){
        funcStack.shift();
        catchTails.push(i);
      }
      counter --;
    }
  }

  // 特定のF{}の内側にtry-catch文を仕込む
  for (var i=0; i<tryHeads.length; i++){
    tokenArray[num[tryHeads[i]]] = '{ try {';
    tokenArray[num[catchTails[i]]] = `} catch(e){ document.getElementById('errorResult2').innerHTML += '<p id=\"err\">error:[Run JavaScript]<br>message:' + e.name + ': ' + e.message + '</p>'; }}`;    
  }
  
  // スペースが抜けたところを補充
  for(var i=0; i<tokenArray.length; i++){
    if (tokenArray[i] == "var"){
      tokenArray[i] = "var ";
    } else if (tokenArray[i] == "function"){
      tokenArray[i] = "function ";
    }
  }

  // try-catch文入りのJavaScriptを返す
  return tokenArray.join('');
}

/**
 * @function splitJsCode
 * 
 * コード整形: JS 最低限のトークンに切って配列に入れる
 */
function splitJsCode(jsCode){
  // コメント除去
  var splitToken = jsCode.replace(/\/\/\s*.+\n+|\/\*\s*.+\s*\*\/\n+/g,"");

  // トークン単位で改行
    splitToken = splitToken.replace(/\s/g, "\n \n");
    splitToken = splitToken.replace(/\./g, "\n.\n");
    splitToken = splitToken.replace(/\,/g, "\n,\n");
    splitToken = splitToken.replace(/\(/g, "\n(\n");
    splitToken = splitToken.replace(/\)/g, "\n)\n");
    splitToken = splitToken.replace(/:/g, "\n:\n");
    splitToken = splitToken.replace(/;/g, "\n;\n");
    splitToken = splitToken.replace(/\{/g, "\n{\n");
    splitToken = splitToken.replace(/\}/g, "\n}\n");

  // 空行を削除
    splitToken = splitToken.split(/\r\n|\r|\n/);
  // 配列へ
  var tokenArray = $.grep(splitToken, function(e){
    return e !== '';
  });

  return tokenArray;
}

// Error Massage ------------------------------ //

/**
 * @function outputErr
 * 
 * エラーの描画処理
 */
function outputErr() {
  var errOutput = document.getElementById('errorResult');
  errOutput.innerHTML = '';
  for(var i=0; i<errorResultJS.length; i++){
    if ( errorResultJS[i].match(/error:/)) {
      errOutput.innerHTML += '<p id=\"err\">' + errorResultJS[i] + '</p>';
    } else if ( errorResultJS[i].match(/warning:/)) {
      errOutput.innerHTML += '<p id=\"warning\">' + errorResultJS[i] + '</p>';
    }
  }
  for(var i=0; i<errorResultCSS.length; i++){
    if ( errorResultCSS[i].match(/error:/)) {
      errOutput.innerHTML += '<p id=\"err\">' + errorResultCSS[i] + '</p>';
    } else if ( errorResultCSS[i].match(/warning:/)) {
      errOutput.innerHTML += '<p id=\"warning\">' + errorResultCSS[i] + '</p>';
    }
  }
}