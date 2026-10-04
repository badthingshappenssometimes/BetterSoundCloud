// Speed + Pitch sliders for BetterSoundCloud
// Speed: 0.50x to 2.00x (0.05 steps). Pitch: -12 to +12 semitones.
// Speed and pitch are coupled (like a record player): final rate = speed * 2^(semitones/12).
(function () {
  if (window.__bscSpeedPitch) return;
  window.__bscSpeedPitch = true;

  var KEY = 'bsc-speed-pitch';
  var state = { speed: 1, semitones: 0, open: true };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) {
      state.speed = Math.min(2, Math.max(0.5, +saved.speed || 1));
      state.semitones = Math.min(12, Math.max(-12, Math.round(+saved.semitones || 0)));
      state.open = saved.open !== false;
    }
  } catch (e) {}

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function rate() {
    return state.speed * Math.pow(2, state.semitones / 12);
  }

  function apply() {
    var r = rate();
    var els = document.querySelectorAll('audio, video');
    for (var i = 0; i < els.length; i++) {
      var a = els[i];
      try {
        a.preservesPitch = false;
        a.webkitPreservesPitch = false;
        a.mozPreservesPitch = false;
        if (Math.abs(a.playbackRate - r) > 0.001) a.playbackRate = r;
      } catch (e) {}
    }
  }

  // SoundCloud may reset the rate when a new track starts, so re-apply often.
  setInterval(apply, 300);
  document.addEventListener('play', apply, true);
  document.addEventListener('loadedmetadata', apply, true);
  document.addEventListener('ratechange', apply, true);

  // ---- UI ----
  var box = document.createElement('div');
  box.style.cssText =
    'position:fixed;right:16px;bottom:90px;z-index:2147483647;width:240px;' +
    'background:rgba(25,25,25,.95);color:#fff;font:13px/1.3 Arial,sans-serif;' +
    'border:1px solid #444;border-radius:8px;padding:10px;box-shadow:0 4px 14px rgba(0,0,0,.5)';

  var header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;cursor:pointer;font-weight:bold';
  header.textContent = 'Speed / Pitch';
  var arrow = document.createElement('span');
  header.appendChild(arrow);

  var body = document.createElement('div');
  body.style.marginTop = '8px';

  function row(labelText, min, max, step, value, fmt, onChange) {
    var wrap = document.createElement('div');
    wrap.style.marginBottom = '8px';
    var top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:2px';
    var name = document.createElement('span');
    name.textContent = labelText;
    var val = document.createElement('span');
    val.textContent = fmt(value);
    top.appendChild(name);
    top.appendChild(val);
    var input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.style.width = '100%';
    input.addEventListener('input', function () {
      var v = parseFloat(input.value);
      val.textContent = fmt(v);
      onChange(v);
      save();
      apply();
    });
    wrap.appendChild(top);
    wrap.appendChild(input);
    return { wrap: wrap, input: input, val: val };
  }

  var speedRow = row('Speed', 0.5, 2, 0.05, state.speed,
    function (v) { return v.toFixed(2) + 'x'; },
    function (v) { state.speed = Math.round(v * 100) / 100; });

  var pitchRow = row('Pitch', -12, 12, 1, state.semitones,
    function (v) { return (v > 0 ? '+' : '') + v + ' st'; },
    function (v) { state.semitones = Math.round(v); });

  var reset = document.createElement('button');
  reset.textContent = 'Reset';
  reset.style.cssText = 'width:100%;padding:4px;cursor:pointer;background:#333;color:#fff;border:1px solid #555;border-radius:4px';
  reset.addEventListener('click', function () {
    state.speed = 1;
    state.semitones = 0;
    speedRow.input.value = 1;
    speedRow.val.textContent = '1.00x';
    pitchRow.input.value = 0;
    pitchRow.val.textContent = '0 st';
    save();
    apply();
  });

  body.appendChild(speedRow.wrap);
  body.appendChild(pitchRow.wrap);
  body.appendChild(reset);
  box.appendChild(header);
  box.appendChild(body);

  function render() {
    body.style.display = state.open ? 'block' : 'none';
    arrow.textContent = state.open ? '\u25BE' : '\u25B8';
  }
  header.addEventListener('click', function () {
    state.open = !state.open;
    render();
    save();
  });
  render();

  function mount() {
    if (document.body) document.body.appendChild(box);
    else setTimeout(mount, 100);
  }
  mount();
  apply();
})();
