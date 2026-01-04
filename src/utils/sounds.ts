/**
 * Sound effects using Web Audio API
 * No external audio files needed - sounds are generated programmatically
 */

let audioContext: AudioContext | null = null;

// Track active sounds to prevent collisions
type SoundPriority = 'match' | 'rowClear' | 'stageComplete';
const PRIORITY_ORDER: SoundPriority[] = ['match', 'rowClear', 'stageComplete'];

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
