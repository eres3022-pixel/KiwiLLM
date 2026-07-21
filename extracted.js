(function(){
  var cards = Array.prototype.slice.call(document.querySelectorAll('.ring-card'));
  var N = cards.length; // 10

  // ---- real orbit parameters (percent of .stage box) ----
  var CX = 50, CY = 44, RX = 42, RY = 15;
  var HOLD = 3, TRAVEL = 1, STEP = HOLD + TRAVEL, PEAK_DEG = 270;

  function easeInOutCubic(x){
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  function easeOutQuart(x){
    return 1 - Math.pow(1 - x, 4);
  }

  function stepProgress(t){
    var k = Math.floor(t / STEP);
    var localT = t - k * STEP;
    if (localT <= HOLD) return k;
    var frac = Math.min(1, (localT - HOLD) / TRAVEL);
    return k + easeInOutCubic(frac);
  }

  var MIN_SCALE = 0.86, MAX_SCALE = 1.0;
  var MAX_ROTATE = 14;
  var FADE_WIDTH = 0.07;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var creditEl = document.getElementById('creditTitle');
  var currentCardIndex = -1, isSwapping = false, FADE_MS = 220;
  function formatCredit(v){ return '$' + v + ' API Credits'; }
  function syncCenterLabel(topIdx){
    if (topIdx === currentCardIndex || isSwapping) return;
    var newVal = cards[topIdx].getAttribute('data-credits');
    if (currentCardIndex === -1){
      currentCardIndex = topIdx;
      creditEl.textContent = formatCredit(newVal);
      return;
    }
    isSwapping = true;
    currentCardIndex = topIdx;
    creditEl.style.transition = 'opacity ' + FADE_MS + 'ms ease';
    creditEl.style.opacity = '0';
    setTimeout(function(){
      creditEl.textContent = formatCredit(newVal);
      creditEl.style.opacity = '1';
      setTimeout(function(){ isSwapping = false; }, FADE_MS);
    }, FADE_MS);
  }

  // ---- shared per-frame render, given a rotation phase (degrees) ----
  var lastTopIdx = 0;
  function renderAt(omegaDeg){
    var omega = omegaDeg * Math.PI / 180;
    var topIdx = 0, topDepth = -Infinity;
    for (var i = 0; i < N; i++){
      var baseAngle = (i / N) * 2 * Math.PI;
      var theta = baseAngle + omega;
      var cosT = Math.cos(theta), sinT = Math.sin(theta);
      var x = CX + RX * cosT;
      var y = CY + RY * sinT;
      var depth = (1 - sinT) / 2;

      var opacity;
      if (depth <= 0.5 - FADE_WIDTH) opacity = 0;
      else if (depth >= 0.5 + FADE_WIDTH) opacity = 1;
      else opacity = (depth - (0.5 - FADE_WIDTH)) / (2 * FADE_WIDTH);

      var visibleAmt = Math.max(0, Math.min(1, (depth - 0.5) / 0.5));
      var scale = MIN_SCALE + visibleAmt * (MAX_SCALE - MIN_SCALE);
      var rotate = cosT * MAX_ROTATE;

      var el = cards[i];
      el.style.left = x + '%';
      el.style.top = y + '%';
      el.style.transform = 'translate(-50%, -50%) scale(' + scale.toFixed(3) + ') rotate(' + rotate.toFixed(1) + 'deg)';
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = 'none';
      el.style.zIndex = 25;
      el.style.visibility = opacity <= 0 ? 'hidden' : 'visible';
      el.style.pointerEvents = opacity <= 0 ? 'none' : 'auto';

      if (depth > topDepth){ topDepth = depth; topIdx = i; }
    }
    lastTopIdx = topIdx;
    syncCenterLabel(topIdx);
  }

  // ---- idle ambient loop ----
  var idleRAF = null;
  var idleStartTime = 0;
  var idleStepOffset = 0;
  var spinning = false;

  function idleFrame(nowMs){
    if (spinning) return;
    var t = (nowMs - idleStartTime) / 1000;
    var omegaDeg = PEAK_DEG - (stepProgress(t) + idleStepOffset) * (360 / N);
    renderAt(omegaDeg);
    idleRAF = requestAnimationFrame(idleFrame);
  }

  function startIdle(fromIndex){
    idleStepOffset = fromIndex;
    idleStartTime = performance.now();
    if (idleRAF) cancelAnimationFrame(idleRAF);
    idleRAF = requestAnimationFrame(idleFrame);
  }

  // ================= draw mechanic =================
  var drawsLeft = 3; // demo starting balance so Draw Now can be tried immediately
  var drawBtn = document.getElementById('drawBtn');
  var drawsLeftNum = document.getElementById('drawsLeftNum');
  var toastEl = document.getElementById('toast');
  var resultOverlay = document.getElementById('resultOverlay');
  var resultAmount = document.getElementById('resultAmount');
  var resultClose = document.getElementById('resultClose');
  var resultCard = document.getElementById('resultCard');

  function updateDrawBtn(){
    drawsLeftNum.textContent = drawsLeft;
    drawBtn.disabled = drawsLeft <= 0 || spinning;
  }

  var toastTimer = null;
  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 2400);
  }

  // Prize weights, one per ring-card, in DOM order (rc-1 .. rc-10 -> $15,$50,$30,$20,$365,$100,$3,$5,$7,$10).
  // Shaped like the rules doc's tier table: common/cheap tiers most likely, the top tier very rare.
  // Edit these numbers (they don't need to sum to exactly 100 -- pickPrizeIndex normalizes them).
  var PRIZE_WEIGHTS = [7, 1.2, 2.5, 4.5, 0.2, 0.6, 34, 25, 15, 10];

  function pickPrizeIndex(){
    var total = PRIZE_WEIGHTS.reduce(function(a, b){ return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < PRIZE_WEIGHTS.length; i++){
      if (r < PRIZE_WEIGHTS[i]) return i;
      r -= PRIZE_WEIGHTS[i];
    }
    return PRIZE_WEIGHTS.length - 1;
  }

  function runSpin(targetIndex){
    spinning = true;
    updateDrawBtn();
    if (idleRAF) cancelAnimationFrame(idleRAF);

    var startFront = lastTopIdx;
    var deltaSteps = ((targetIndex - startFront) % N + N) % N;
    var extraSpins = 3; // a bit more travel distance than the bare minimum, still fixed at 10s total
    var totalSteps = deltaSteps + extraSpins * N;
    if (totalSteps < 3) totalSteps += N; // safeguard: still show visible motion on short draws
    var duration = 10000; // ms - fixed total draw time
    var t0 = performance.now();

    function spinFrame(now){
      var p = Math.min(1, (now - t0) / duration);
      var eased = easeOutQuart(p);
      var S = startFront + totalSteps * eased;
      var omegaDeg = PEAK_DEG - S * (360 / N);
      renderAt(omegaDeg);
      if (p < 1){
        requestAnimationFrame(spinFrame);
      } else {
        spinning = false;
        finishSpin(targetIndex);
      }
    }
    requestAnimationFrame(spinFrame);
  }

  function finishSpin(targetIndex){
    cards[targetIndex].classList.add('winning');
    var credits = cards[targetIndex].getAttribute('data-credits');
    resultAmount.textContent = '$' + credits;
    resultCard.style.background = getComputedStyle(cards[targetIndex]).backgroundImage;
    resultOverlay.classList.add('show');
    updateDrawBtn();
  }

  resultClose.addEventListener('click', function(){
    resultOverlay.classList.remove('show');
    var idx = lastTopIdx;
    cards.forEach(function(c){ c.classList.remove('winning'); });
    startIdle(idx);
  });

  drawBtn.addEventListener('click', function(){
    if (drawBtn.disabled) return;
    drawsLeft -= 1;
    updateDrawBtn();
    runSpin(pickPrizeIndex());
  });

  // ---- invite buttons: demo-grant a draw chance on click ----
  function grantDraw(msg){
    drawsLeft += 1;
    updateDrawBtn();
    showToast(msg);
  }

  var taskInviteBtns = document.querySelectorAll('.task-card .btn-white');
  taskInviteBtns.forEach(function(btn, idx){
    btn.addEventListener('click', function(){
      var msg = idx === 0
        ? 'Invite link copied — +1 draw chance once your friend joins (demo: granted now)'
        : 'Invite link copied — +1 draw chance once your friend subscribes (demo: granted now)';
      grantDraw(msg);
    });
  });

  var topInviteBtn = document.querySelector('.btn-invite');
  if (topInviteBtn){
    topInviteBtn.addEventListener('click', function(){
      grantDraw('Invite link copied — +1 draw chance (demo: granted now)');
    });
  }

  // ---- boot ----
  if (reduceMotion){
    cards.forEach(function(el, i){
      if (i === 0){
        el.style.left = CX + '%';
        el.style.top = (CY - RY) + '%';
        el.style.transform = 'translate(-50%, -50%) scale(' + MAX_SCALE + ')';
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.zIndex = '30';
        creditEl.textContent = formatCredit(el.getAttribute('data-credits'));
      } else {
        el.style.display = 'none';
      }
    });
  } else {
    startIdle(0);
  }

  updateDrawBtn();
})();