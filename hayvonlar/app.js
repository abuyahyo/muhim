(function () {
  'use strict';

  const animals = [
    { id: 'cat', name: 'Mushuk', emoji: '🐱', caption: 'Miyov', color: '#fbbf24' },
    { id: 'dog', name: 'It', emoji: '🐶', caption: 'Vov', color: '#60a5fa' },
    { id: 'cow', name: 'Sigir', emoji: '🐮', caption: 'Muu', color: '#cbd5e1' },
    { id: 'rooster', name: 'Xo'ro'z', emoji: '🐓', caption: 'Kukuruku', color: '#fca5a5' },
    { id: 'horse', name: 'Ot', emoji: '🐴', caption: 'Ih', color: '#a78bfa' },
    { id: 'duck', name: 'O'rdak', emoji: '🦆', caption: 'Qak-qak', color: '#7dd3fc' }
  ];

  const state = { audioCtx: null };

  function ensureAudioContext() {
    if (!state.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      state.audioCtx = new Ctx();
    }
    return state.audioCtx;
  }

  function playTone({ frequency, duration, type, volume, start, sweepTo, sweepTime }) {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }

    const t0 = ctx.currentTime + (start || 0);
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, t0);

    if (sweepTo && sweepTime) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + sweepTime);
    }

    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.exponentialRampToValueAtTime(volume || 0.07, t0 + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + (duration || 0.2));

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(t0);
    oscillator.stop(t0 + (duration || 0.2) + 0.03);
  }

  function playAnimalSound(id) {
    const pattern = {
      cat: [
        { frequency: 780, duration: 0.13, type: 'sine', volume: 0.06, sweepTo: 420, sweepTime: 0.12 },
        { frequency: 560, duration: 0.16, type: 'triangle', volume: 0.05, sweepTo: 300, sweepTime: 0.14 }
      ],
      dog: [
        { frequency: 240, duration: 0.1, type: 'square', volume: 0.045, sweepTo: 120, sweepTime: 0.1 },
        { frequency: 180, duration: 0.12, type: 'square', volume: 0.05, sweepTo: 110, sweepTime: 0.12 }
      ],
      cow: [
        { frequency: 180, duration: 0.16, type: 'sine', volume: 0.05, sweepTo: 140, sweepTime: 0.16 },
        { frequency: 150, duration: 0.18, type: 'sine', volume: 0.05, sweepTo: 110, sweepTime: 0.18 }
      ],
      rooster: [
        { frequency: 640, duration: 0.08, type: 'square', volume: 0.045, sweepTo: 820, sweepTime: 0.08 },
        { frequency: 1120, duration: 0.08, type: 'square', volume: 0.04, sweepTo: 930, sweepTime: 0.08 },
        { frequency: 960, duration: 0.12, type: 'triangle', volume: 0.035, sweepTo: 720, sweepTime: 0.1 }
      ],
      horse: [
        { frequency: 210, duration: 0.12, type: 'sawtooth', volume: 0.04, sweepTo: 170, sweepTime: 0.11 },
        { frequency: 230, duration: 0.12, type: 'sawtooth', volume: 0.04, sweepTo: 180, sweepTime: 0.1 }
      ],
      duck: [
        { frequency: 520, duration: 0.07, type: 'triangle', volume: 0.04, sweepTo: 420, sweepTime: 0.07 },
        { frequency: 460, duration: 0.09, type: 'triangle', volume: 0.035, sweepTo: 360, sweepTime: 0.08 },
        { frequency: 430, duration: 0.12, type: 'triangle', volume: 0.03, sweepTo: 310, sweepTime: 0.1 }
      ]
    };

    const sequence = pattern[id] || pattern.cat;
    sequence.forEach(function (item, index) {
      playTone({
        frequency: item.frequency,
        duration: item.duration,
        type: item.type,
        volume: item.volume,
        start: index * 0.11,
        sweepTo: item.sweepTo,
        sweepTime: item.sweepTime
      });
    });
  }

  function renderAnimals() {
    const mount = document.getElementById('animal-list');
    if (!mount) return;

    mount.innerHTML = animals.map(function (animal) {
      return '<button class="animal-card" data-id="' + animal.id + '" aria-label="' + animal.name + ' ovozi" type="button">' +
        '<span class="animal-emoji" aria-hidden="true">' + animal.emoji + '</span>' +
        '<span class="animal-name">' + animal.name + '</span>' +
        '<span class="animal-caption">' + animal.caption + '</span>' +
        '</button>';
    }).join('');

    mount.addEventListener('click', function (event) {
      const button = event.target.closest('.animal-card');
      if (!button) return;

      const id = button.getAttribute('data-id');
      if (!id) return;

      animals.forEach(function (animal) {
        if (animal.id === id) {
          button.classList.add('is-playing');
          setTimeout(function () { button.classList.remove('is-playing'); }, 200);
        }
      });

      playAnimalSound(id);
    });
  }

  renderAnimals();
})();
