// Shared 9-button formula builder template with UE bridge and mobile scaling
(function(){
  const DEFAULT_CONFIG = {
    title: 'Конструктор формул',
    name: 'Формула',
    description: '',
    tokens: [],
    normalize: (str) => str.replace(/\s+/g,'')
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

  window.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive:false });
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key==='+'||e.key==='-'||e.key==='='||e.key==='0')) e.preventDefault();
  }, { passive:false });

  document.addEventListener('DOMContentLoaded', function(){
    if(isMobile){
      const p=(window.location && window.location.port) ? parseInt(window.location.port,10) : 0;
      if (p) openWebsocket(p);
    }
    init();
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

  let titleEl, formulaNameEl, formulaDescEl, formulaDisplay, panelFoot, symbolGrid, checkBtn, flash;
  let builtTokens = [];
  let targetNormalized = '';

  function init(){
    fitInit();
    titleEl = document.getElementById('title');
    formulaNameEl = document.getElementById('formulaName');
    formulaDescEl = document.getElementById('panelDescription');
    formulaDisplay = document.getElementById('formulaDisplay');
    panelFoot = document.getElementById('panelFoot');
    symbolGrid = document.getElementById('symbolGrid');
    checkBtn = document.getElementById('checkBtn');
    flash = document.getElementById('flash');

    titleEl.textContent = cfg.title || 'Конструктор формул';
    formulaNameEl.textContent = cfg.name || '';
    formulaDescEl.textContent = cfg.description || '';
    targetNormalized = cfg.normalize((cfg.tokens || []).join(''));

    buildSymbols();
    updateDisplay();

    checkBtn.addEventListener('click', onCheck);
  }

  function buildSymbols(){
    symbolGrid.innerHTML = '';
    const baseTokens = compactTokens(cfg.tokens || []);
    baseTokens.forEach(symbol => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'symbol-btn';
      btn.textContent = symbol;
      btn.addEventListener('click', () => {
        builtTokens.push(symbol);
        updateDisplay();
        formulaDisplay.classList.remove('success','error');
        setFooter('Додавайте символи до формули...', '');
      });
      symbolGrid.appendChild(btn);
    });
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'symbol-btn';
    clearBtn.textContent = 'Очистити';
    clearBtn.addEventListener('click', onClear);
    symbolGrid.appendChild(clearBtn);
  }

  // Ensure a 9-button grid: compact extra symbols into one slot and reserve the last for Clear
  function compactTokens(tokens){
    if (tokens.length <= 8) return tokens.slice();
    const head = tokens.slice(0, 7);
    const tailCombined = tokens.slice(7).join('');
    head.push(tailCombined);
    return head;
  }

  function onClear(){
    builtTokens = [];
    updateDisplay();
    formulaDisplay.classList.remove('success','error');
    setFooter('Очищено. Почніть спочатку.', 'warn');
  }

  function onCheck(){
    if (!builtTokens.length){
      setFooter('Додайте символи перед перевіркою.', 'warn');
      return;
    }
    const current = cfg.normalize(builtTokens.join(''));
    const isCorrect = current === targetNormalized;
    triggerUE4EventWithTag(isCorrect ? 'right' : 'wrong', checkBtn, 'param');
    flash.className = 'flash ' + (isCorrect ? 'ok' : 'bad') + ' show';
    setTimeout(() => { flash.classList.remove('show'); }, 240);
    formulaDisplay.classList.remove('success','error');
    formulaDisplay.classList.add(isCorrect ? 'success' : 'error');
    if (isCorrect){
      setFooter('Правильно! Формула складена.', 'ok');
    } else {
      setFooter('Невірно. Перевірте порядок і дужки.', 'bad');
    }
  }

  function updateDisplay(){
    if (!builtTokens.length){
      formulaDisplay.textContent = cfg.placeholder || 'Додавайте символи, щоб скласти формулу';
    } else {
      formulaDisplay.textContent = builtTokens.join(' ');
    }
    formulaDisplay.classList.toggle('empty', builtTokens.length === 0);
  }

  function setFooter(text, state){
    panelFoot.textContent = text;
    panelFoot.className = 'panel-foot-text' + (state ? ' ' + state : '');
  }
})();
