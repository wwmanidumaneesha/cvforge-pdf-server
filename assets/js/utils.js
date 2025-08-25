// utils.js — helpers, pub/sub, history (undo/redo), and keyboard shortcuts
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // Simple pub/sub
  const bus = document.createElement('div');
  const on = (type, fn) => bus.addEventListener(type, fn);
  const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type,{detail}));

  // History manager for form state
  const HISTORY_LIMIT = 50;
  const history = { stack: [], index: -1 };
  const pushHistory = (state) => {
    // avoid duplicates
    const s = JSON.stringify(state);
    if (history.stack[history.index] === s) return;
    history.stack = history.stack.slice(0, history.index + 1);
    history.stack.push(s);
    if (history.stack.length > HISTORY_LIMIT) history.stack.shift();
    history.index = history.stack.length - 1;
  };
  const undo = () => {
    if (history.index > 0) {
      history.index--;
      return JSON.parse(history.stack[history.index]);
    }
    return null;
  };
  const redo = () => {
    if (history.index < history.stack.length - 1) {
      history.index++;
      return JSON.parse(history.stack[history.index]);
    }
    return null;
  };

  window.CVForge = { $, $$, on, emit, pushHistory, undo, redo };
})();