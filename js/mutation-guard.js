(() => {
  const NativeMutationObserver = window.MutationObserver;
  if (!NativeMutationObserver || window.__goblinSafeMutationObserverInstalled) return;

  window.__goblinSafeMutationObserverInstalled = true;

  class SafeMutationObserver {
    constructor(callback) {
      this._callback = callback;
      this._targets = [];
      this._active = true;
      this._running = false;
      this._native = new NativeMutationObserver((records) => {
        if (!this._active || this._running) return;

        this._running = true;
        this._native.disconnect();
        try {
          this._callback(records, this);
        } finally {
          this._running = false;
          if (this._active) {
            for (const entry of this._targets) {
              this._native.observe(entry.target, entry.options);
            }
          }
        }
      });
    }

    observe(target, options) {
      if (!target) return;
      this._active = true;
      const existing = this._targets.find(entry => entry.target === target);
      if (existing) existing.options = options;
      else this._targets.push({ target, options });
      this._native.observe(target, options);
    }

    disconnect() {
      this._active = false;
      this._targets = [];
      this._native.disconnect();
    }

    takeRecords() {
      return this._native.takeRecords();
    }
  }

  window.MutationObserver = SafeMutationObserver;
})();
