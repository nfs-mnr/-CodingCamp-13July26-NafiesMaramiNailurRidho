(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Storage — localStorage helpers dengan error handling
  // ---------------------------------------------------------------------------
  const Storage = {
    KEYS: {
      TASKS:          'tdld_tasks',
      LINKS:          'tdld_links',
      THEME:          'tdld_theme',
      TIMER_DURATION: 'tdld_timer_duration',
    },

    get(key, fallback) {
      if (fallback === undefined) fallback = null;
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
        return true;
      } catch (e) {
        Storage._showBanner('Gagal menyimpan data. Storage mungkin penuh atau diblokir.');
        return false;
      }
    },

    readJSON(key) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (e) {
        Storage._showBanner('Gagal membaca data tersimpan. Data mungkin rusak.');
        return null;
      }
    },

    writeJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        Storage._showBanner('Gagal menyimpan data. Storage mungkin penuh atau diblokir.');
        return false;
      }
    },

    _showBanner(message) {
      var banner = document.getElementById('storage-error-banner');
      var msg    = document.getElementById('storage-error-message');
      var close  = document.getElementById('storage-error-close');
      if (!banner || !msg) return;
      msg.textContent = message;
      banner.hidden = false;
      if (close) {
        close.onclick = function () { banner.hidden = true; };
      }
    },
  };

  // ---------------------------------------------------------------------------
  // Theme_Manager — light/dark mode
  // ---------------------------------------------------------------------------
  var Theme_Manager = {
    _btn: null,

    init() {
      Theme_Manager._btn = document.getElementById('theme-toggle');
      if (!Theme_Manager._btn) return;
      Theme_Manager._updateLabel();
      Theme_Manager._btn.addEventListener('click', Theme_Manager.toggle);
    },

    toggle() {
      var isDark = document.documentElement.classList.contains('dark');
      var next = isDark ? 'light' : 'dark';
      Theme_Manager.applyTheme(next);
      Storage.set(Storage.KEYS.THEME, next);
      Theme_Manager._updateLabel();
    },

    applyTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    getTheme() {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    },

    _updateLabel() {
      if (!Theme_Manager._btn) return;
      var isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        Theme_Manager._btn.textContent = '☀️ Mode Terang';
        Theme_Manager._btn.setAttribute('aria-label', 'Aktifkan mode terang');
      } else {
        Theme_Manager._btn.textContent = '🌙 Mode Gelap';
        Theme_Manager._btn.setAttribute('aria-label', 'Aktifkan mode gelap');
      }
    },
  };

  // ---------------------------------------------------------------------------
  // Greeting — jam dan sapaan
  // ---------------------------------------------------------------------------
  var Greeting = {
    _els: {},

    getGreeting(hour) {
      if (hour >= 5  && hour <= 11) return 'Selamat Pagi';
      if (hour >= 12 && hour <= 17) return 'Selamat Siang';
      if (hour >= 18 && hour <= 21) return 'Selamat Sore';
      return 'Selamat Malam';
    },

    formatTime(date) {
      var h = String(date.getHours()).padStart(2, '0');
      var m = String(date.getMinutes()).padStart(2, '0');
      var s = String(date.getSeconds()).padStart(2, '0');
      return h + ':' + m + ':' + s;
    },

    formatDate(date) {
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
        year:    'numeric',
      });
    },

    render() {
      var now = new Date();
      if (Greeting._els.time) Greeting._els.time.textContent = Greeting.formatTime(now);
      if (Greeting._els.date) Greeting._els.date.textContent = Greeting.formatDate(now);
      if (Greeting._els.text) Greeting._els.text.textContent = Greeting.getGreeting(now.getHours());
    },

    init() {
      Greeting._els.time = document.getElementById('greeting-time');
      Greeting._els.date = document.getElementById('greeting-date');
      Greeting._els.text = document.getElementById('greeting-text');
      Greeting.render();
      setInterval(Greeting.render, 1000);
    },
  };

  // ---------------------------------------------------------------------------
  // FocusTimer — countdown + custom duration
  // ---------------------------------------------------------------------------
  var FocusTimer = {
    customDuration: 25,
    state: {
      remaining:  25 * 60,
      running:    false,
      finished:   false,
      intervalId: null,
    },
    _els: {},

    _formatTime(seconds) {
      var mm = String(Math.floor(seconds / 60)).padStart(2, '0');
      var ss = String(seconds % 60).padStart(2, '0');
      return mm + ':' + ss;
    },

    _render() {
      if (FocusTimer._els.display) {
        FocusTimer._els.display.textContent = FocusTimer._formatTime(FocusTimer.state.remaining);
      }
      var r = FocusTimer.state.running;
      var f = FocusTimer.state.finished;
      if (FocusTimer._els.startBtn)    FocusTimer._els.startBtn.disabled    = r || f;
      if (FocusTimer._els.stopBtn)     FocusTimer._els.stopBtn.disabled     = !r;
      if (FocusTimer._els.resetBtn)    FocusTimer._els.resetBtn.disabled    = false;
      if (FocusTimer._els.durationInput) FocusTimer._els.durationInput.disabled = r;
      if (FocusTimer._els.durationSet)   FocusTimer._els.durationSet.disabled   = r;
    },

    _renderDurationDisplay() {
      if (FocusTimer._els.durationDisplay) {
        FocusTimer._els.durationDisplay.textContent = 'Durasi aktif: ' + FocusTimer.customDuration + ' menit';
      }
    },

    _tick() {
      FocusTimer.state.remaining -= 1;
      if (FocusTimer.state.remaining <= 0) {
        FocusTimer.state.remaining = 0;
        clearInterval(FocusTimer.state.intervalId);
        FocusTimer.state.intervalId = null;
        FocusTimer.state.running  = false;
        FocusTimer.state.finished = true;
        if (FocusTimer._els.banner) FocusTimer._els.banner.hidden = false;
      }
      FocusTimer._render();
    },

    start() {
      if (FocusTimer.state.running || FocusTimer.state.finished) return;
      FocusTimer.state.running    = true;
      FocusTimer.state.intervalId = setInterval(FocusTimer._tick, 1000);
      FocusTimer._render();
    },

    stop() {
      clearInterval(FocusTimer.state.intervalId);
      FocusTimer.state.intervalId = null;
      FocusTimer.state.running    = false;
      FocusTimer._render();
    },

    reset() {
      clearInterval(FocusTimer.state.intervalId);
      FocusTimer.state.intervalId = null;
      FocusTimer.state.remaining  = FocusTimer.customDuration * 60;
      FocusTimer.state.running    = false;
      FocusTimer.state.finished   = false;
      if (FocusTimer._els.banner) FocusTimer._els.banner.hidden = true;
      FocusTimer._render();
    },

    setDuration(val) {
      var n = parseInt(val, 10);
      var errEl = FocusTimer._els.durationError;
      if (!Number.isInteger(n) || n < 1 || n > 180) {
        if (errEl) { errEl.textContent = 'Durasi harus bilangan bulat antara 1 dan 180 menit.'; errEl.hidden = false; }
        return false;
      }
      if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
      FocusTimer.customDuration      = n;
      FocusTimer.state.remaining     = n * 60;
      FocusTimer.state.running       = false;
      FocusTimer.state.finished      = false;
      clearInterval(FocusTimer.state.intervalId);
      FocusTimer.state.intervalId    = null;
      if (FocusTimer._els.banner) FocusTimer._els.banner.hidden = true;
      Storage.set(Storage.KEYS.TIMER_DURATION, n);
      FocusTimer._renderDurationDisplay();
      FocusTimer._render();
      return true;
    },

    init() {
      FocusTimer._els.display         = document.getElementById('timer-display');
      FocusTimer._els.banner          = document.getElementById('timer-finished-banner');
      FocusTimer._els.startBtn        = document.getElementById('timer-start');
      FocusTimer._els.stopBtn         = document.getElementById('timer-stop');
      FocusTimer._els.resetBtn        = document.getElementById('timer-reset');
      FocusTimer._els.durationInput   = document.getElementById('timer-duration-input');
      FocusTimer._els.durationSet     = document.getElementById('timer-duration-set');
      FocusTimer._els.durationDisplay = document.getElementById('timer-duration-display');
      FocusTimer._els.durationError   = document.getElementById('timer-duration-error');

      // Baca durasi tersimpan
      var saved = Storage.get(Storage.KEYS.TIMER_DURATION);
      var n = parseInt(saved, 10);
      if (Number.isInteger(n) && n >= 1 && n <= 180) {
        FocusTimer.customDuration = n;
      }
      FocusTimer.state.remaining = FocusTimer.customDuration * 60;

      if (FocusTimer._els.durationInput) {
        FocusTimer._els.durationInput.value = FocusTimer.customDuration;
      }

      if (FocusTimer._els.startBtn)  FocusTimer._els.startBtn.addEventListener('click',  FocusTimer.start);
      if (FocusTimer._els.stopBtn)   FocusTimer._els.stopBtn.addEventListener('click',   FocusTimer.stop);
      if (FocusTimer._els.resetBtn)  FocusTimer._els.resetBtn.addEventListener('click',  FocusTimer.reset);
      if (FocusTimer._els.durationSet) {
        FocusTimer._els.durationSet.addEventListener('click', function () {
          FocusTimer.setDuration(FocusTimer._els.durationInput.value);
        });
      }
      if (FocusTimer._els.durationInput) {
        FocusTimer._els.durationInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            FocusTimer.setDuration(FocusTimer._els.durationInput.value);
          }
        });
      }

      FocusTimer._renderDurationDisplay();
      FocusTimer._render();
    },
  };

  // ---------------------------------------------------------------------------
  // TodoList — CRUD + duplicate prevention
  // ---------------------------------------------------------------------------
  var TodoList = {
    tasks: [],
    _editingId: null,
    _els: {},

    _generateId() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    isDuplicate(description, excludeId) {
      var normalized = description.toLowerCase().trim();
      return TodoList.tasks.some(function (t) {
        return t.id !== excludeId && t.description.toLowerCase().trim() === normalized;
      });
    },

    _validate(description) {
      if (!description || description.trim().length === 0) {
        return 'Deskripsi tugas tidak boleh kosong.';
      }
      if (description.trim().length > 200) {
        return 'Deskripsi tugas tidak boleh lebih dari 200 karakter.';
      }
      return null;
    },

    _load() {
      var data = Storage.readJSON(Storage.KEYS.TASKS);
      TodoList.tasks = Array.isArray(data) ? data : [];
    },

    _save() {
      Storage.writeJSON(Storage.KEYS.TASKS, TodoList.tasks);
    },

    _render() {
      var list = TodoList._els.list;
      if (!list) return;
      list.innerHTML = '';
      TodoList.tasks.forEach(function (task) {
        list.appendChild(TodoList._renderTask(task));
      });
    },

    _renderTask(task) {
      var li = document.createElement('li');
      li.dataset.taskId = task.id;

      var checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.checked = !!task.done;
      checkbox.setAttribute('aria-label', 'Tandai selesai');
      checkbox.addEventListener('change', function () { TodoList._toggleDone(task.id); });

      var span = document.createElement('span');
      span.className   = 'task-text' + (task.done ? ' task-done' : '');
      span.textContent = task.description;

      var editBtn = document.createElement('button');
      editBtn.type        = 'button';
      editBtn.textContent = 'Edit';
      editBtn.className   = 'btn-task-action';
      editBtn.addEventListener('click', function () { TodoList._beginEdit(task.id); });

      var delBtn = document.createElement('button');
      delBtn.type        = 'button';
      delBtn.textContent = 'Hapus';
      delBtn.className   = 'btn-task-action btn-delete';
      delBtn.addEventListener('click', function () { TodoList._delete(task.id); });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(delBtn);
      return li;
    },

    add(description) {
      var errEl = TodoList._els.error;
      var valErr = TodoList._validate(description);
      if (valErr) {
        if (errEl) errEl.textContent = valErr;
        return false;
      }
      var trimmed = description.trim();
      if (TodoList.isDuplicate(trimmed, null)) {
        if (errEl) errEl.textContent = "Tugas '" + trimmed + "' sudah ada dalam daftar.";
        return false;
      }
      if (errEl) errEl.textContent = '';
      var task = {
        id:          TodoList._generateId(),
        description: trimmed,
        done:        false,
        createdAt:   Date.now(),
      };
      TodoList.tasks.push(task);
      TodoList._save();
      TodoList._render();
      if (TodoList._els.input) TodoList._els.input.value = '';
      return true;
    },

    _toggleDone(id) {
      var task = TodoList.tasks.find(function (t) { return t.id === id; });
      if (task) { task.done = !task.done; TodoList._save(); TodoList._render(); }
    },

    _delete(id) {
      TodoList.tasks = TodoList.tasks.filter(function (t) { return t.id !== id; });
      TodoList._save();
      TodoList._render();
    },

    _beginEdit(id) {
      if (TodoList._editingId && TodoList._editingId !== id) {
        TodoList._editingId = null;
        TodoList._render();
      }
      TodoList._editingId = id;
      var task = TodoList.tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      var li = TodoList._els.list && TodoList._els.list.querySelector('[data-task-id="' + id + '"]');
      if (!li) return;

      var form     = document.createElement('form');
      form.className = 'edit-form';
      var input    = document.createElement('input');
      input.type      = 'text';
      input.value     = task.description;
      input.maxLength = 200;
      var errSpan  = document.createElement('span');
      errSpan.className = 'field-error';
      var saveBtn  = document.createElement('button');
      saveBtn.type = 'button'; saveBtn.textContent = 'Simpan';
      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button'; cancelBtn.textContent = 'Batal';

      saveBtn.addEventListener('click', function () {
        TodoList._saveEdit(id, input.value, errSpan);
      });
      cancelBtn.addEventListener('click', function () {
        TodoList._editingId = null; TodoList._render();
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        TodoList._saveEdit(id, input.value, errSpan);
      });

      form.appendChild(input);
      form.appendChild(saveBtn);
      form.appendChild(cancelBtn);
      form.appendChild(errSpan);
      li.innerHTML = '';
      li.appendChild(form);
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    },

    _saveEdit(id, description, errSpan) {
      var valErr = TodoList._validate(description);
      if (valErr) { if (errSpan) errSpan.textContent = valErr; return; }
      var trimmed = description.trim();
      if (TodoList.isDuplicate(trimmed, id)) {
        if (errSpan) errSpan.textContent = "Tugas '" + trimmed + "' sudah ada dalam daftar.";
        return;
      }
      var task = TodoList.tasks.find(function (t) { return t.id === id; });
      if (task) {
        task.description = trimmed;
        TodoList._editingId = null;
        TodoList._save();
        TodoList._render();
      }
    },

    init() {
      TodoList._els.form  = document.getElementById('todo-form');
      TodoList._els.input = document.getElementById('todo-input');
      TodoList._els.error = document.getElementById('todo-input-error');
      TodoList._els.list  = document.getElementById('todo-list-items');
      if (TodoList._els.form) {
        TodoList._els.form.addEventListener('submit', function (e) {
          e.preventDefault();
          TodoList.add(TodoList._els.input ? TodoList._els.input.value : '');
        });
      }
      TodoList._load();
      TodoList._render();
    },
  };

  // ---------------------------------------------------------------------------
  // QuickLinks — link CRUD
  // ---------------------------------------------------------------------------
  var QuickLinks = {
    links: [],
    _els: {},

    _generateId() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    _validateLabel(label) {
      if (!label || label.trim().length === 0) return 'Label tidak boleh kosong.';
      if (label.trim().length > 50)             return 'Label tidak boleh lebih dari 50 karakter.';
      return null;
    },

    _validateUrl(url) {
      if (!url || url.trim().length === 0) return 'URL tidak boleh kosong.';
      if (url.trim().length > 2048)         return 'URL terlalu panjang.';
      var trimmed = url.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return 'URL harus dimulai dengan http:// atau https://';
      }
      return null;
    },

    _load() {
      var data = Storage.readJSON(Storage.KEYS.LINKS);
      QuickLinks.links = Array.isArray(data) ? data : [];
    },

    _save() {
      Storage.writeJSON(Storage.KEYS.LINKS, QuickLinks.links);
    },

    _render() {
      var container = QuickLinks._els.container;
      if (!container) return;
      container.innerHTML = '';
      QuickLinks.links.forEach(function (link) {
        container.appendChild(QuickLinks._renderLink(link));
      });
    },

    _renderLink(link) {
      var wrapper = document.createElement('div');
      wrapper.className = 'link-item';
      var anchor = document.createElement('a');
      anchor.href      = link.url;
      anchor.textContent = link.label;
      anchor.target    = '_blank';
      anchor.rel       = 'noopener noreferrer';
      anchor.className = 'link-btn';
      var delBtn = document.createElement('button');
      delBtn.type        = 'button';
      delBtn.textContent = '×';
      delBtn.className   = 'link-delete';
      delBtn.setAttribute('aria-label', 'Hapus tautan ' + link.label);
      delBtn.addEventListener('click', function () { QuickLinks._delete(link.id); });
      wrapper.appendChild(anchor);
      wrapper.appendChild(delBtn);
      return wrapper;
    },

    add(label, url) {
      var labelErr = QuickLinks._validateLabel(label);
      var urlErr   = QuickLinks._validateUrl(url);
      if (QuickLinks._els.labelError) QuickLinks._els.labelError.textContent = labelErr || '';
      if (QuickLinks._els.urlError)   QuickLinks._els.urlError.textContent   = urlErr   || '';
      if (labelErr || urlErr) return false;
      var link = {
        id:        QuickLinks._generateId(),
        label:     label.trim(),
        url:       url.trim(),
        createdAt: Date.now(),
      };
      QuickLinks.links.push(link);
      QuickLinks._save();
      QuickLinks._render();
      if (QuickLinks._els.labelInput) QuickLinks._els.labelInput.value = '';
      if (QuickLinks._els.urlInput)   QuickLinks._els.urlInput.value   = '';
      return true;
    },

    _delete(id) {
      QuickLinks.links = QuickLinks.links.filter(function (l) { return l.id !== id; });
      QuickLinks._save();
      QuickLinks._render();
    },

    init() {
      QuickLinks._els.form       = document.getElementById('link-form');
      QuickLinks._els.labelInput = document.getElementById('link-label-input');
      QuickLinks._els.urlInput   = document.getElementById('link-url-input');
      QuickLinks._els.labelError = document.getElementById('link-label-error');
      QuickLinks._els.urlError   = document.getElementById('link-url-error');
      QuickLinks._els.container  = document.getElementById('link-buttons');
      if (QuickLinks._els.form) {
        QuickLinks._els.form.addEventListener('submit', function (e) {
          e.preventDefault();
          QuickLinks.add(
            QuickLinks._els.labelInput ? QuickLinks._els.labelInput.value : '',
            QuickLinks._els.urlInput   ? QuickLinks._els.urlInput.value   : ''
          );
        });
      }
      QuickLinks._load();
      QuickLinks._render();
    },
  };

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    Theme_Manager.init();
    Greeting.init();
    FocusTimer.init();
    TodoList.init();
    QuickLinks.init();
  });

})();
