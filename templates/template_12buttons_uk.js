// Shared quiz template for 12-button keypad quizzes
(function(){
  const DEFAULT_CONFIG = {
    title: 'Вікторина',
    keySymbols: ["1","2","3","4","5","6","7","8","9","0",",","Стерти"],
    buildQuestions: () => [],
    normalizeAnswer: (str) => str.replace(/\s+/g,'').replace(/,/g,'.'),
    onCheck: () => {}
  };

  const cfg = { ...DEFAULT_CONFIG, ...(window.QUIZ_CONFIG || {}) };

  const isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent));
  let websocket = null, websocketConnected = false, isConnectingPort = false, mobileActionsStack = [];

  function sendAndClearStack(){
    try { while (mobileActionsStack.length) websocket.send(mobileActionsStack.shift()); } catch(e){}
  }
  function openWebsocket(port){
    if (!port || isConnectingPort === port) return;
    isConnectingPort = port;
    if (websocket && websocketConnected && websocket.readyState === WebSocket.OPEN) return;
    const ws = 'ws://127.0.0.1:' + port + '/ue4?';
    try { websocket = new WebSocket(ws); } catch(e){ isConnectingPort = false; return; }
    websocket.onopen = function(){ websocketConnected = true; isConnectingPort = false; setTimeout(sendAndClearStack, 1000); };
    websocket.onerror = websocket.onclose = function(){ websocketConnected = false; isConnectingPort = false; };
  }
  function getParameter(a){
    const o={functionsName:'',id:'',className:'',value:'',args:''},t=[];
    if(a.length>0){
      for(let i=1;i<=a.length;i++){
        const p=a[i];
        if(typeof p==='object'&&p){
          o.id=p.id||'';
          o.className=typeof p.className==='string'?p.className:(p.className&&p.className.baseVal)||'';
          o.value=(p.value!=null)?String(p.value):'';
        }else{t.push(p);}
      }
    }
    o.functionsName=a[0];o.args=t.join('.;_|');return o;
  }
  function triggerUE4EventWithTag(){ /* right / wrong / back */
    const o=getParameter(Array.prototype.slice.call(arguments,0));
    if(isMobile){
      const data64="UE4HTMLMenuUE4ConnectorOnUrlChangeue4EventName'();:triggerue4eventwithtag'();:"+o.functionsName+"'();:"+o.id+"'();:"+o.className+"'();:"+o.value+"'();:"+o.args;
      if(websocketConnected && websocket && websocket.readyState===WebSocket.OPEN) websocket.send("#js"+data64);
      else mobileActionsStack.push("#js"+data64);
    } else if (window.ue && window.ue.uecom && typeof window.ue.uecom.triggerue4eventwithtag==="function"){
      window.ue.uecom.triggerue4eventwithtag(o.functionsName,o.id,o.className,o.value,o.args);
    }
  }

  // Optional: prevent user zoom (keeps fixed scale under UE)
  window.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive:false });
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key==='+'||e.key==='-'||e.key==='='||e.key==='0')) e.preventDefault();
  }, { passive:false });

  document.addEventListener('DOMContentLoaded', function(){
    if(isMobile){
      const p=(window.location && window.location.port) ? parseInt(window.location.port,10) : 0;
      if (p) openWebsocket(p);
    }
    initQuiz();
  });

  function fitInit(){
    const DESIGN_W = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--scene-w')) || 1440;
    const DESIGN_H = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--scene-h')) || 820;
    const SCALE_TWEAK = 0.90;
    const scene = document.getElementById('scene');
    function fit(){
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H) * SCALE_TWEAK;
      const x = Math.max(0, (vw - DESIGN_W * scale) / 2);
      const y = Math.max(0, (vh - DESIGN_H * scale) / 2);
      scene.style.transform = 'translate(' + Math.floor(x) + 'px,' + Math.floor(y) + 'px) scale(' + scale + ')';
    }
    window.addEventListener('resize', fit);
    fit();
  }

  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildKeypad(keySymbols, handler){
    const grid = document.getElementById('keypadGrid');
    grid.innerHTML = '';
    keySymbols.forEach(symbol => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'key-btn';
      button.textContent = symbol;
      button.addEventListener('click', () => handler(symbol));
      grid.appendChild(button);
    });
  }

  // Quiz state
  let index = 0;
  let currentInput = "";
  let BANK = [];

  let titleEl, questionPrompt, questionInstruction, answerDisplay, panelFoot, checkBtn, flash;

  function initQuiz(){
    fitInit();
    titleEl = document.getElementById('title');
    questionPrompt = document.getElementById('questionPrompt');
    questionInstruction = document.getElementById('questionInstruction');
    answerDisplay = document.getElementById('answerDisplay');
    panelFoot = document.getElementById('panelFoot');
    checkBtn = document.getElementById('checkBtn');
    flash = document.getElementById('flash');

    BANK = shuffle(cfg.buildQuestions().slice()).map(q => ({ ...q, normalized: cfg.normalizeAnswer(q.answer) }));

    buildKeypad(cfg.keySymbols, handleSymbol);

    checkBtn.addEventListener('click', onCheck);

    renderQuestion();
  }

  function handleSymbol(symbol){
    if (symbol === 'Стерти'){
      currentInput = "";
      updateDisplay();
      setFooter('Поле очищено. Почніть спочатку.', 'warn');
      return;
    }
    const status = canAppend(symbol);
    if (status !== 'ok'){
      const message = status === 'comma'
        ? 'Лише одна кома у відповіді.'
        : 'Досягнуто максимальну довжину введення.';
      setFooter(message, 'warn');
      return;
    }
    currentInput += symbol;
    updateDisplay();
    setFooter('Можна вводити далі або натиснути «Перевірити».');
  }

  function canAppend(symbol){
    const MAX_INPUT_LENGTH = cfg.maxInputLength || 12;
    if (currentInput.length >= MAX_INPUT_LENGTH) return 'limit';
    if (symbol === ',' && currentInput.includes(',')) return 'comma';
    return 'ok';
  }

  function onCheck(){
    const q = BANK[index];
    if (!currentInput.length){
      setFooter('Спершу введіть відповідь.', 'warn');
      return;
    }
    const normalized = cfg.normalizeAnswer(currentInput);
    const correct = (normalized === q.normalized);
    triggerUE4EventWithTag(correct ? 'right' : 'wrong', checkBtn, 'param');
    flash.className = 'flash ' + (correct ? 'ok' : 'bad') + ' show';
    setTimeout(() => { flash.classList.remove('show'); }, 240);
    if (correct){
      setFooter('Правильно! Далі наступне завдання...', 'ok');
      setTimeout(() => {
        index = (index + 1) % BANK.length;
        renderQuestion();
      }, 420);
    } else {
      setFooter('Неправильно. Перевірте введення.', 'bad');
    }
    if (typeof cfg.onCheck === 'function') cfg.onCheck({ correct, q, input: currentInput });
  }

  function normalizeAnswer(str){
    return str.replace(/\s+/g,'').replace(/,/g,'.');
  }

  function updateDisplay(){
    if (!currentInput.length){
      answerDisplay.textContent = 'Уведіть відповідь за допомогою клавіатури';
      answerDisplay.classList.add('placeholder');
    } else {
      answerDisplay.textContent = currentInput;
      answerDisplay.classList.remove('placeholder');
    }
  }

  function setFooter(text, state){
    panelFoot.textContent = text;
    panelFoot.className = 'panel-foot-text' + (state ? ' ' + state : '');
  }

  function renderQuestion(){
    const q = BANK[index];
    titleEl.textContent = cfg.title || 'Вікторина';
    questionPrompt.textContent = q.prompt;
    questionInstruction.textContent = q.instruction;
    currentInput = "";
    updateDisplay();
    setFooter('Користуйтеся клавіатурою й натискайте «Перевірити».');
  }
})();
