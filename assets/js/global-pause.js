/**
 * 每一頁畫面固定放兩顆按鈕（畫面下方置中）：
 *   ⏸ 暫停／▶ 繼續 —— 把「這一頁的畫面」跟「這一頁的聲音」一起凍結
 *      （蓋一層半透明遮罩擋住畫面本身，同時暫停本頁所有 <audio>/<video>
 *      跟背景配樂），再點一次從原本的畫面／進度直接接著播，不會重來。
 *   🔊 靜音／🔇 取消靜音 —— 只關掉聲音，畫面動畫照常播放。
 *
 * 改成固定按鈕、不是「點畫面任意處」，是因為「點任意地方」在畫面上有
 * 一堆本來就可以點的東西（縮圖燈箱、播放鍵、地圖熱點……）時很容易誤觸，
 * 客戶端測試時也提出一樣的疑慮——固定在下方置中，位置在左右 12% 翻頁
 * 熱區之外，不會被那兩條熱區擋住，也不會誤觸到其他按鈕。

 * 用法：只要在 pXX-live.html 的 </body> 前加一行
 *   <script src="assets/js/global-pause.js?v=1"></script>
 * 不需要另外寫任何 HTML／CSS，按鈕跟遮罩都由這支程式自己生成。
 *
 * P00 封面已經有自己專屬的靜音／暫停按鈕（跟口白播放狀態綁在一起），
 * 所以 P00 不套用這支共用腳本，避免同一頁出現兩組按鈕。
 *
 * 如果某一頁除了 <audio>/<video> 跟共用配樂之外，還有自己的計時器
 * 需要在暫停時特別處理，可以在該頁自己的 <script> 裡設定：
 *   window.__pageGlobalPauseHook = { pause() {...}, resume() {...} };
 * 這支腳本在暫停/繼續時會一併呼叫。
 */
(function () {
  if (window.__globalPauseInit) return; // 避免同一頁重複初始化
  window.__globalPauseInit = true;

  var paused = false;
  var muted = false;
  var pausedMedia = [];

  function allMedia() {
    return Array.prototype.slice.call(document.querySelectorAll('audio,video'));
  }

  function parentSound() {
    try { return (parent && parent !== window) ? parent.SoundEngine : null; } catch (e) { return null; }
  }

  function showOverlay() {
    var ov = document.getElementById('gpOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'gpOverlay';
      ov.setAttribute('aria-hidden', 'true');
      var badge = document.createElement('div');
      badge.className = 'gp-badge';
      badge.innerHTML = '<span class="gp-badge-icon">⏸</span><span class="gp-badge-text">已暫停．點播放鈕繼續</span>';
      ov.appendChild(badge);
      document.body.appendChild(ov);
    }
    ov.style.display = 'flex';
  }
  function hideOverlay() {
    var ov = document.getElementById('gpOverlay');
    if (ov) ov.style.display = 'none';
  }

  function doPause() {
    paused = true;
    pausedMedia = [];
    allMedia().forEach(function (m) {
      if (!m.paused) { pausedMedia.push(m); m.pause(); }
    });
    var se = parentSound();
    try { se && se.pauseTrack && se.pauseTrack(); } catch (e) {}
    if (window.__pageGlobalPauseHook && window.__pageGlobalPauseHook.pause) {
      try { window.__pageGlobalPauseHook.pause(); } catch (e) {}
    }
    showOverlay();
    updateButtons();
  }

  function doResume() {
    paused = false;
    pausedMedia.forEach(function (m) { m.play().catch(function () {}); });
    pausedMedia = [];
    var se = parentSound();
    try { se && se.resumeTrack && se.resumeTrack(); } catch (e) {}
    if (window.__pageGlobalPauseHook && window.__pageGlobalPauseHook.resume) {
      try { window.__pageGlobalPauseHook.resume(); } catch (e) {}
    }
    hideOverlay();
    updateButtons();
  }

  function doMute() {
    muted = true;
    allMedia().forEach(function (m) { m.muted = true; });
    var se = parentSound();
    try { se && se.muteTrack && se.muteTrack(); } catch (e) {}
    updateButtons();
  }

  function doUnmute() {
    muted = false;
    allMedia().forEach(function (m) { m.muted = false; });
    var se = parentSound();
    try { se && se.unmuteTrack && se.unmuteTrack(); } catch (e) {}
    updateButtons();
  }

  var $pauseBtn, $muteBtn;
  function updateButtons() {
    if ($pauseBtn) {
      $pauseBtn.textContent = paused ? '▶' : '⏸';
      $pauseBtn.title = paused ? '繼續播放' : '暫停畫面與聲音';
      $pauseBtn.setAttribute('aria-label', paused ? '繼續播放' : '暫停畫面與聲音');
      $pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    }
    if ($muteBtn) {
      $muteBtn.textContent = muted ? '🔇' : '🔊';
      $muteBtn.title = muted ? '取消靜音' : '靜音';
      $muteBtn.setAttribute('aria-label', muted ? '取消靜音' : '靜音');
      $muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
  }

  function injectStyle() {
    var style = document.createElement('style');
    style.textContent =
      '#gpControls{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);' +
        'z-index:99991;display:flex;gap:12px;}' +
      '.gp-btn{width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,255,255,0.6);' +
        'background:rgba(10,10,10,0.55);color:#fff;font-size:1.15rem;display:flex;' +
        'align-items:center;justify-content:center;cursor:pointer;padding:0;' +
        'transition:transform .15s ease,box-shadow .15s ease;box-shadow:0 4px 14px rgba(0,0,0,0.35);}' +
      '.gp-btn:hover{transform:scale(1.08);box-shadow:0 4px 18px rgba(0,0,0,0.5);}' +
      '#gpOverlay{display:none;position:fixed;inset:0;z-index:99990;' +
        'background:rgba(0,0,0,0.6);align-items:center;justify-content:center;}' +
      '#gpOverlay .gp-badge{display:flex;flex-direction:column;align-items:center;gap:8px;' +
        'color:#fff;font-family:"PingFang TC","Heiti TC","Microsoft JhengHei",sans-serif;' +
        'text-shadow:0 2px 10px rgba(0,0,0,0.6);}' +
      '#gpOverlay .gp-badge-icon{font-size:2.6rem;}' +
      '#gpOverlay .gp-badge-text{font-size:0.85rem;letter-spacing:0.05em;opacity:0.9;}' +
      '@media (max-width:880px){.gp-btn{width:40px;height:40px;font-size:1rem;}' +
        '#gpControls{bottom:10px;gap:9px;}' +
        '#gpOverlay .gp-badge-icon{font-size:2.1rem;}}';
    document.head.appendChild(style);
  }

  function buildUI() {
    injectStyle();
    var wrap = document.createElement('div');
    wrap.id = 'gpControls';

    $pauseBtn = document.createElement('button');
    $pauseBtn.type = 'button';
    $pauseBtn.className = 'gp-btn';
    $pauseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (paused) doResume(); else doPause();
    });

    $muteBtn = document.createElement('button');
    $muteBtn.type = 'button';
    $muteBtn.className = 'gp-btn';
    $muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (muted) doUnmute(); else doMute();
    });

    wrap.appendChild($pauseBtn);
    wrap.appendChild($muteBtn);
    document.body.appendChild(wrap);

    // 點遮罩本身也能直接繼續播放，不用特地找按鈕
    document.addEventListener('click', function (e) {
      if (paused && e.target && e.target.id === 'gpOverlay') doResume();
    });

    updateButtons();
  }

  /* 離頁／進頁一律靜靜歸零成「未暫停、未靜音」，不觸發 resume 的聲音
     副作用——真正要停掉這一頁自己的計時器/配樂，交給該頁原本就有的
     __onSpreadActivated／__onSpreadDeactivated 邏輯處理，這裡只負責
     把「暫停按鈕」自己的畫面狀態（遮罩、按鈕圖示）清乾淨。 */
  function resetSilently() {
    paused = false;
    muted = false;
    pausedMedia = [];
    hideOverlay();
    updateButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }

  var prevActivate = window.__onSpreadActivated;
  window.__onSpreadActivated = function () {
    resetSilently();
    if (prevActivate) prevActivate();
  };
  var prevDeactivate = window.__onSpreadDeactivated;
  window.__onSpreadDeactivated = function () {
    resetSilently();
    if (prevDeactivate) prevDeactivate();
  };
})();
