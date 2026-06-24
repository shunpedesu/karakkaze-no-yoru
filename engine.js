/* ── BGM管理 ── */
const BGM_MAP = {
  'winter-outside': 'bgm/bgm_silence.mp3',
  'lobby':          'bgm/bgm_daily.mp3',
  'corridor':       'bgm/bgm_tension.mp3',
  'dining':         'bgm/bgm_tension.mp3',
  'onsen':          'bgm/bgm_horror.mp3',
  'room':           'bgm/bgm_horror.mp3',
  'office':         'bgm/bgm_sorrow.mp3',
  'dawn':           'bgm/bgm_dawn.mp3',
};

class BgmPlayer {
  constructor() {
    this._audio = null;
    this._current = null;
    this.enabled = false;
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val && this._audio) {
      this._fadeOut(this._audio);
    } else if (val && this._current) {
      this._play(this._current);
    }
  }

  changeTo(bgClass) {
    const file = BGM_MAP[bgClass];
    if (!file || file === this._current) return;
    this._current = file;
    if (!this.enabled) return;
    this._play(file);
  }

  changeToFile(file) {
    if (!file || file === this._current) return;
    this._current = file;
    if (!this.enabled) return;
    this._play(file);
  }

  _play(file) {
    const prev = this._audio;
    const next = new Audio(file);
    next.loop = true;
    next.volume = 0;
    next.play().catch(() => {});
    this._audio = next;

    let vol = 0;
    const fadeIn = setInterval(() => {
      vol = Math.min(vol + 0.02, 0.5);
      next.volume = vol;
      if (vol >= 0.5) clearInterval(fadeIn);
    }, 80);

    if (prev) this._fadeOut(prev);
  }

  _fadeOut(audio) {
    const fade = setInterval(() => {
      audio.volume = Math.max(audio.volume - 0.03, 0);
      if (audio.volume <= 0) {
        audio.pause();
        clearInterval(fade);
      }
    }, 80);
  }
}

/* ── チャプター名 ── */
const CHAPTER_NAMES = ['プロローグ', '第1夜', '第2夜', '第3夜'];

/* ── 生存者リスト ── */
const SURVIVOR_LIST = [
  { id: '渋川かつじ',    label: '渋川' },
  { id: '岩島つるこ',    label: '岩島' },
  { id: '中之条まんじ',  label: '中之条' },
  { id: '長野原キャベ蔵', label: 'キャベ蔵' },
  { id: '長野原豚子',   label: '豚子' },
  { id: '原町ラスク',   label: 'ラスク' },
  { id: '太田こんにゃく', label: '太田' },
];

/* ── シルエット対応表 ── */
const SILHOUETTE_MAP = {
  '渋川支配人':    'silhouettes/shibukawa.svg',
  '岩島つるこ':    'silhouettes/iwajima.svg',
  '原町ラスク':    'silhouettes/haramachi.svg',
  '太田こんにゃく': 'silhouettes/ota.svg',
  '長野原キャベ蔵': 'silhouettes/naganohara_k.svg',
  '長野原豚子':    'silhouettes/naganohara_b.svg',
  '中之条まんじ':  'silhouettes/nakanojo.svg',
};

/* ── バックログ ── */
class BacklogManager {
  constructor() {
    this.entries = [];
    this._overlay = document.getElementById('backlog-overlay');
    this._content = document.getElementById('backlog-content');
    document.getElementById('backlog-close').addEventListener('click', () => this.hide());
    this._overlay.addEventListener('click', e => { if (e.target === this._overlay) this.hide(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); });
  }

  add(speaker, text) {
    this.entries.push({ speaker, text });
    if (this.entries.length > 150) this.entries.shift();
  }

  show() {
    this._content.innerHTML = '';
    [...this.entries].reverse().forEach(entry => {
      const div = document.createElement('div');
      div.className = 'backlog-entry';
      if (entry.speaker) {
        const s = document.createElement('div');
        s.className = 'backlog-speaker';
        s.textContent = entry.speaker;
        div.appendChild(s);
      }
      const t = document.createElement('div');
      t.className = 'backlog-text';
      t.textContent = entry.text;
      div.appendChild(t);
      this._content.appendChild(div);
    });
    this._overlay.classList.add('open');
  }

  hide() { this._overlay.classList.remove('open'); }
}

/* ── セーブ/ロード ── */
class SaveManager {
  constructor() {
    this._modal = document.getElementById('save-modal');
    this._engine = null;
    document.getElementById('save-modal-close').addEventListener('click', () => this.close());
    this._modal.addEventListener('click', e => { if (e.target === this._modal) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }

  setEngine(engine) { this._engine = engine; }

  openSave() { this._open('save'); }
  openLoad() { this._open('load'); }

  _open(mode) {
    document.getElementById('save-modal-title').textContent = mode === 'save' ? 'セーブ' : 'ロード';
    this._renderSlots(mode);
    this._modal.classList.add('open');
  }

  _renderSlots(mode) {
    const slots = document.getElementById('save-slots');
    slots.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const data = this._getSlot(i);
      const slot = document.createElement('div');
      slot.className = 'save-slot';

      const num = document.createElement('span');
      num.className = 'save-slot-num';
      num.textContent = `SLOT ${i}`;

      const info = document.createElement('div');
      info.className = 'save-slot-info';
      if (data) {
        const d = new Date(data.timestamp);
        const ds = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
        info.innerHTML = `<span class="save-slot-date">${ds}</span><span class="save-slot-preview">${data.preview}</span>`;
      } else {
        info.innerHTML = `<span class="save-slot-empty">── 空き ──</span>`;
      }

      const btn = document.createElement('button');
      btn.className = 'save-slot-btn';
      btn.textContent = mode === 'save' ? 'セーブ' : 'ロード';
      if (mode === 'load' && !data) btn.disabled = true;
      btn.addEventListener('click', () => mode === 'save' ? this._save(i) : this._load(i));

      slot.appendChild(num);
      slot.appendChild(info);
      slot.appendChild(btn);
      slots.appendChild(slot);
    }
  }

  _save(slot) {
    if (!this._engine) return;
    const scene = SCENARIO[this._engine.currentSceneId] || {};
    const raw = (scene.text || '').replace(/\n/g, ' ');
    const preview = raw.length > 30 ? raw.slice(0, 30) + '…' : raw;
    localStorage.setItem(`karakaze_save_${slot}`, JSON.stringify({
      sceneId: this._engine.currentSceneId,
      preview,
      timestamp: Date.now()
    }));
    this._renderSlots('save');
  }

  _load(slot) {
    const data = this._getSlot(slot);
    if (!data || !this._engine) return;
    this.close();
    this._engine.loadScene(data.sceneId);
  }

  _getSlot(slot) {
    try { return JSON.parse(localStorage.getItem(`karakaze_save_${slot}`)); }
    catch { return null; }
  }

  close() { this._modal.classList.remove('open'); }
}

/* ── Web Audio API 風音システム ── */
class WindAudio {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.enabled = false;
    this._started = false;
  }

  _init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  start() {
    this._init();
    if (this._started) return;
    this._started = true;
    this._buildWind(0.18, 0.4,  160,  380); // 低い轟き
    this._buildWind(0.09, 0.25, 600,  900); // 中域の風鳴り
    this._buildWind(0.04, 0.12, 1400, 2200); // 高い隙間音
  }

  _buildWind(gainMin, gainMax, freqLow, freqHigh) {
    const ctx = this.ctx;

    // ノイズバッファ生成
    const bufLen = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (freqLow + freqHigh) / 2;
    filter.Q.value = 0.6;

    const gainNode = ctx.createGain();
    gainNode.gain.value = gainMin;

    src.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    src.start();

    this.nodes.push({ gainNode, gainMin, gainMax });

    // ゆっくりと揺れる音量変動（風のうねり）
    this._modulateGain(gainNode, gainMin, gainMax);
  }

  _modulateGain(gainNode, min, max) {
    if (!this.enabled) return;
    const duration = 3 + Math.random() * 6;
    const target = min + Math.random() * (max - min);
    gainNode.gain.linearRampToValueAtTime(target, this.ctx.currentTime + duration);
    setTimeout(() => this._modulateGain(gainNode, min, max), duration * 900);
  }

  enable() {
    this.enabled = true;
    this.start();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this.nodes.forEach(n => this._modulateGain(n.gainNode, n.gainMin, n.gainMax));
  }

  disable() {
    this.enabled = false;
    if (this.ctx) {
      this.nodes.forEach(n => {
        n.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
      });
    }
  }

  toggle() {
    if (this.enabled) { this.disable(); return false; }
    else              { this.enable();  return true;  }
  }
}

/* ── ゲームエンジン ── */
class NovelEngine {
  constructor() {
    this.currentScene = null;
    this.currentSceneId = null;
    this.isTyping = false;
    this._typingTimer = null;
    this._afterType = null;
    this._allChars = null;

    this.bgEl        = document.getElementById('background');
    this.darknessEl  = document.getElementById('darkness-overlay');
    this.titleCardEl = document.getElementById('title-card');
    this.titleInner  = document.getElementById('title-card-inner');
    this.textEl      = document.getElementById('text-content');
    this.advanceEl   = document.getElementById('advance-indicator');
    this.choicesEl   = document.getElementById('choices');
    this.inputAreaEl = document.getElementById('input-area');
    this.charListEl  = document.getElementById('character-list');
    this.nameInputEl = document.getElementById('name-input');
    this.submitBtnEl = document.getElementById('name-submit');
    this.errorEl     = document.getElementById('input-error');
    this.speakerEl   = document.getElementById('speaker-name');
    this.silhouetteEl = document.getElementById('silhouette-img');

    this._deadSet       = new Set();
    this._currentChapter = -1;

    this.wind    = new WindAudio();
    this.bgm     = new BgmPlayer();
    this.backlog = new BacklogManager();
    this.saveMan = new SaveManager();
    this.saveMan.setEngine(this);

    document.getElementById('text-box').addEventListener('click', () => this.handleClick());

    document.addEventListener('keydown', (e) => {
      if (this.inputAreaEl.style.display === 'flex') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.handleClick();
      }
    });

    const soundBtn = document.getElementById('sound-toggle');
    soundBtn.addEventListener('click', () => {
      const on = this.wind.toggle();
      this.bgm.setEnabled(on);
      soundBtn.textContent = on ? '🔊' : '🔇';
    });

    document.getElementById('backlog-btn').addEventListener('click', () => this.backlog.show());
    document.getElementById('save-btn').addEventListener('click', () => this.saveMan.openSave());
    document.getElementById('load-btn').addEventListener('click', () => this.saveMan.openLoad());

    const hideOverlay = document.getElementById('hide-overlay');
    document.getElementById('hide-btn').addEventListener('click', () => {
      document.getElementById('game-area').style.opacity = '0';
      document.getElementById('game-area').style.pointerEvents = 'none';
      hideOverlay.classList.add('active');
    });
    hideOverlay.addEventListener('click', () => {
      document.getElementById('game-area').style.opacity = '1';
      document.getElementById('game-area').style.pointerEvents = '';
      hideOverlay.classList.remove('active');
    });
  }

  start(firstId) {
    document.getElementById('story-header').classList.add('visible');
    document.getElementById('survivor-bar').classList.add('visible');
    this._renderSurvivorBar();
    this.loadScene(firstId);
  }

  loadScene(id) {
    const scene = SCENARIO[id];
    if (!scene) { console.error('Scene not found:', id); return; }
    this.currentScene = scene;
    this.currentSceneId = id;
    this.clearUI();

    if (scene.bg) {
      this.bgEl.className = 'bg-' + scene.bg;
      if (scene.bgm) {
        this.bgm.changeToFile(scene.bgm);
      } else {
        this.bgm.changeTo(scene.bg);
      }
    }
    // 物語時計
    if (scene.time) {
      document.getElementById('story-time').textContent = scene.time;
    }

    // チャプタードット
    if (scene.chapter !== undefined && scene.chapter !== this._currentChapter) {
      this._currentChapter = scene.chapter;
      document.querySelectorAll('.cdot').forEach(dot => {
        const ch = parseInt(dot.dataset.ch);
        dot.classList.toggle('active', ch === this._currentChapter);
        dot.classList.toggle('done',   ch < this._currentChapter);
      });
    }

    // 生存者
    if (scene.deaths) {
      scene.deaths.forEach(d => this._deadSet.add(d));
      this._renderSurvivorBar();
    }
    if (scene.revive) {
      scene.revive.forEach(d => this._deadSet.delete(d));
      this._renderSurvivorBar();
    }

    // pause場面は暗転してから始める
    if (scene.pause) {
      this.darknessEl.style.opacity = '1';
    } else if (scene.darkness !== undefined) {
      this.darknessEl.style.opacity = scene.darkness;
    }

    // 話者名
    if (scene.speaker) {
      this.speakerEl.textContent = scene.speaker;
      this.speakerEl.classList.add('visible');
    } else {
      this.speakerEl.textContent = '';
      this.speakerEl.classList.remove('visible');
    }

    // シルエット
    const silPath = scene.speaker ? SILHOUETTE_MAP[scene.speaker] : null;
    if (silPath) {
      if (this.silhouetteEl.dataset.src !== silPath) {
        this.silhouetteEl.classList.remove('visible');
        this.silhouetteEl.dataset.src = silPath;
        this.silhouetteEl.src = silPath;
        setTimeout(() => this.silhouetteEl.classList.add('visible'), 80);
      }
    } else {
      this.silhouetteEl.classList.remove('visible');
      this.silhouetteEl.dataset.src = '';
    }

    if (scene.type === 'title') { this.showTitleCard(scene.text, scene.next); return; }
    if (scene.type === 'input') { this.showInputScene(scene); return; }

    const startText = () => {
      this.backlog.add(scene.speaker || null, scene.text);
      this.typeText(scene.text, () => {
        if (scene.choices) {
          this.showChoices(scene.choices);
        } else if (scene.next) {
          this.advanceEl.style.display = 'block';
        }
      });
    };

    if (scene.pause) {
      setTimeout(() => {
        if (scene.darkness !== undefined) this.darknessEl.style.opacity = scene.darkness;
        setTimeout(startText, 1200);
      }, 700);
    } else {
      startText();
    }
  }

  clearUI() {
    this.choicesEl.innerHTML = '';
    this.inputAreaEl.style.display = 'none';
    this.inputAreaEl.style.opacity = '1';
    this.advanceEl.style.display = 'none';
    this.errorEl.textContent = '';
    document.body.classList.remove('climax-input');
    document.getElementById('character-list-label').textContent = 'この旅館にいた人たち';
  }

  typeText(text, callback) {
    this.isTyping = true;
    this._afterType = callback;
    this.textEl.innerHTML = '';

    let html = '';
    for (const ch of text) {
      if (ch === '\n') { html += '<br>'; }
      else { html += `<span class="char hidden">${this.esc(ch)}</span>`; }
    }
    this.textEl.innerHTML = html;

    const chars = this.textEl.querySelectorAll('.char');
    this._allChars = chars;
    let i = 0;

    const box = document.getElementById('text-box');
    const tick = () => {
      if (i < chars.length) {
        chars[i].classList.remove('hidden');
        i++;
        box.scrollTop = box.scrollHeight;
        this._typingTimer = setTimeout(tick, 38);
      } else {
        this.isTyping = false;
        this._typingTimer = null;
        if (callback) callback();
      }
    };
    tick();
  }

  skipTyping() {
    if (this._typingTimer) { clearTimeout(this._typingTimer); this._typingTimer = null; }
    if (this._allChars) this._allChars.forEach(c => c.classList.remove('hidden'));
    this.isTyping = false;
    const cb = this._afterType;
    this._afterType = null;
    if (cb) cb();
  }

  handleClick() {
    if (this.isTyping) {
      this.skipTyping();
    } else if (this.currentScene?.next && !this.currentScene.choices && this.currentScene.type !== 'input') {
      this.loadScene(this.currentScene.next);
    }
  }

  showChoices(choices) {
    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.label;
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.loadScene(c.next); });
      this.choicesEl.appendChild(btn);
    });
  }

  showTitleCard(text, nextId) {
    this.titleInner.textContent = text;
    this.titleCardEl.style.display = 'flex';
    this.titleCardEl.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.titleCardEl.style.opacity = '1';
      setTimeout(() => {
        this.titleCardEl.style.opacity = '0';
        setTimeout(() => {
          this.titleCardEl.style.display = 'none';
          if (nextId) this.loadScene(nextId);
        }, 1000);
      }, 2800);
    }));
  }

  showInputScene(scene) {
    document.body.classList.add('climax-input');
    if (scene.listLabel) {
      document.getElementById('character-list-label').textContent = scene.listLabel;
    }

    const reveal = () => {
      this.charListEl.innerHTML = scene.characters.join('<br>');
      this.inputAreaEl.style.display = 'flex';
      this.inputAreaEl.style.opacity = '0';
      setTimeout(() => { this.inputAreaEl.style.opacity = '1'; }, 60);
      this.nameInputEl.value = '';
      this.errorEl.textContent = '';
      setTimeout(() => this.nameInputEl.focus(), 200);

      const submit = () => {
        const val = this.nameInputEl.value.trim();
        if (!val) return;
        const result = this.resolveInput(val, scene);
        if (result.error) {
          this.errorEl.textContent = result.error;
          this.nameInputEl.value = '';
          this.nameInputEl.focus();
          return;
        }
        document.body.classList.remove('climax-input');
        this.inputAreaEl.style.display = 'none';
        this.loadScene(result.next);
      };

      this.submitBtnEl.onclick = (e) => { e.stopPropagation(); submit(); };
      this.nameInputEl.onkeydown = (e) => { if (e.key === 'Enter') { e.stopPropagation(); submit(); } };
    };

    if (scene.pause) {
      this.darknessEl.style.opacity = '1';
      setTimeout(() => {
        if (scene.darkness !== undefined) this.darknessEl.style.opacity = scene.darkness;
        setTimeout(() => this.typeText(scene.text, reveal), 1200);
      }, 700);
    } else {
      this.typeText(scene.text, reveal);
    }
  }

  resolveInput(val, scene) {
    if (val === scene.correct) return { next: scene.correct_next };
    if (scene.wrong?.[val])   return { next: scene.wrong[val] };
    if (scene.victims?.includes(val)) return { error: scene.victim_msg };
    if (val === scene.self)   return { error: scene.self_msg };
    return { error: scene.unknown_msg };
  }

  _renderSurvivorBar() {
    const bar = document.getElementById('survivor-bar');
    bar.innerHTML = '';
    SURVIVOR_LIST.forEach(s => {
      const dead = this._deadSet.has(s.id);
      const el = document.createElement('div');
      el.className = 'survivor-item' + (dead ? ' dead' : '');
      el.innerHTML = `<span class="sv-label">${s.label}</span><span class="sv-dot">${dead ? '×' : '●'}</span>`;
      bar.appendChild(el);
    });
  }

  esc(ch) {
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '&') return '&amp;';
    return ch;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const engine = new NovelEngine();
  const startScreen = document.getElementById('start-screen');

  document.getElementById('start-btn').addEventListener('click', () => {
    startScreen.style.opacity = '0';
    setTimeout(() => {
      startScreen.style.display = 'none';
      engine.start('p01');
    }, 1800);
  });
});
