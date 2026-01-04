/**
 * Sound effects using Web Audio API
 * No external audio files needed - sounds are generated programmatically
 */

let audioContext: AudioContext | null = null;

// Track active sounds to prevent collisions
type SoundPriority = 'match' | 'rowClear' | 'stageComplete' | 'gameStart' | 'gameOver';
const PRIORITY_ORDER: SoundPriority[] = ['match', 'rowClear', 'stageComplete', 'gameStart', 'gameOver'];

let activeSounds: { nodes: AudioNode[]; priority: SoundPriority } | null = null;
let activeTimeouts: number[] = [];

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function getPriorityLevel(priority: SoundPriority): number {
  return PRIORITY_ORDER.indexOf(priority);
}

function stopActiveSounds(): void {
  if (activeSounds) {
    activeSounds.nodes.forEach((node) => {
      try {
        if (node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch {
        // Node may already be stopped
      }
    });
    activeSounds = null;
  }
  // Clear any pending timeouts
  activeTimeouts.forEach((id) => clearTimeout(id));
  activeTimeouts = [];
}

function canPlaySound(priority: SoundPriority): boolean {
  if (!activeSounds) return true;
  // Higher priority sounds can interrupt lower priority ones
  return getPriorityLevel(priority) >= getPriorityLevel(activeSounds.priority);
}

function registerSound(nodes: AudioNode[], priority: SoundPriority, duration: number): void {
  activeSounds = { nodes, priority };
  // Auto-clear after sound duration
  const timeoutId = window.setTimeout(() => {
    if (activeSounds?.nodes === nodes) {
      activeSounds = null;
    }
  }, duration);
  activeTimeouts.push(timeoutId);
}

function registerTimeout(callback: () => void, delay: number): void {
  const timeoutId = window.setTimeout(callback, delay);
  activeTimeouts.push(timeoutId);
}

/**
 * Play an invalid match sound - short buzz/error tone
 */
export function playInvalidMatchSound(): void {
  try {
    if (!canPlaySound('match')) return;
    stopActiveSounds();

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create a short buzzy error sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Low frequency buzz
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.linearRampToValueAtTime(100, now + 0.15);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);

    registerSound([oscillator, gainNode], 'match', 150);
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

/**
 * Play a match sound - higher pitch for longer distances
 * @param distance - The match distance (0 = adjacent, higher = farther)
 */
export function playMatchSound(distance: number): void {
  try {
    if (!canPlaySound('match')) return;
    stopActiveSounds();

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Base frequency increases with distance (more satisfying for long matches)
    const baseFreq = 440 + distance * 40; // A4 + distance bonus

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(baseFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);

    registerSound([oscillator, gainNode], 'match', 150);
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

/**
 * Play a row clear sound - satisfying sweep effect
 */
export function playRowClearSound(): void {
  try {
    if (!canPlaySound('rowClear')) return;
    stopActiveSounds();

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play a descending sweep
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);

    // Add a second tone for richness
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.35);

    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc2.start(now);
    osc2.stop(now + 0.35);

    registerSound([oscillator, gainNode, osc2, gain2], 'rowClear', 350);
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

/**
 * Play a stage complete sound - celebratory fanfare
 */
export function playStageCompleteSound(): void {
  try {
    if (!canPlaySound('stageComplete')) return;
    stopActiveSounds();

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const allNodes: AudioNode[] = [];

    // Play a major chord arpeggio (C-E-G-C)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const delays = [0, 0.1, 0.2, 0.3];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(0.2, now + delays[i] + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delays[i] + 0.5);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 0.5);

      allNodes.push(osc, gain);
    });

    // Add a final chord
    registerTimeout(() => {
      const chordFreqs = [523.25, 659.25, 783.99];
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      });
    }, 400);

    registerSound(allNodes, 'stageComplete', 1000);
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

/**
 * Play a game start sound - energizing whoosh with ascending tones
 */
export function playGameStartSound(): void {
  try {
    if (!canPlaySound('gameStart')) return;
    stopActiveSounds();

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const allNodes: AudioNode[] = [];

    // Ascending sweep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.25);

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc1.start(now);
    osc1.stop(now + 0.3);
    allNodes.push(osc1, gain1);

    // Add a bright chime at the end
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.15);

    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
    allNodes.push(osc2, gain2);

    registerSound(allNodes, 'gameStart', 450);
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

/**
 * Play a game over sound - somber descending tones
 */
export function playGameOverSound(): void {
  try {
    if (!canPlaySound('gameOver')) return;
    stopActiveSounds();

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const allNodes: AudioNode[] = [];

    // Descending minor notes (sad feeling)
    const notes = [392, 349.23, 311.13]; // G4, F4, Eb4 (minor descent)
    const delays = [0, 0.2, 0.4];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(0.2, now + delays[i] + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delays[i] + 0.35);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 0.4);

      allNodes.push(osc, gain);
    });

    // Add a low bass note at the end for finality
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();

    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);

    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(98, now + 0.5); // G2

    bassGain.gain.setValueAtTime(0, now + 0.5);
    bassGain.gain.linearRampToValueAtTime(0.15, now + 0.55);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    bassOsc.start(now + 0.5);
    bassOsc.stop(now + 1.0);
    allNodes.push(bassOsc, bassGain);

    registerSound(allNodes, 'gameOver', 1000);
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

/**
 * Play a high score sound - triumphant fanfare
 */
export function playHighScoreSound(): void {
  try {
    if (!canPlaySound('gameOver')) return;
    stopActiveSounds();

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const allNodes: AudioNode[] = [];

    // Triumphant fanfare arpeggio (C major with octave jump)
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    const delays = [0, 0.08, 0.16, 0.24, 0.32];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(0.2, now + delays[i] + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.08, now + delays[i] + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delays[i] + 0.5);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 0.5);

      allNodes.push(osc, gain);
    });

    // Add sparkle effect with high frequencies
    registerTimeout(() => {
      const sparkleFreqs = [1760, 2093, 2637]; // A6, C7, E7
      sparkleFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.2);

        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.2);
      });
    }, 400);

    // Final triumphant chord
    registerTimeout(() => {
      const chordFreqs = [523.25, 659.25, 783.99, 1046.5]; // C major
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      });
    }, 550);

    registerSound(allNodes, 'gameOver', 1400);
  } catch {
    // Audio not supported or blocked - fail silently
  }
}
