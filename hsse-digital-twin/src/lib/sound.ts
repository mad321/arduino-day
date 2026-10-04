/**
 * Tiny WebAudio cue synth — no audio assets. The AudioContext is only created
 * after the operator unmutes (a user gesture), so autoplay policies are satisfied.
 */
export type Cue = 'select' | 'approve' | 'flag' | 'critical' | 'close' | 'toggle'

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number }

const PATTERNS: Record<Cue, Note[]> = {
  select: [{ f: 880, t: 0, d: 0.05, type: 'triangle', g: 0.05 }],
  toggle: [{ f: 660, t: 0, d: 0.04, type: 'triangle', g: 0.04 }],
  approve: [
    { f: 523, t: 0, d: 0.09, type: 'triangle' },
    { f: 659, t: 0.08, d: 0.09, type: 'triangle' },
    { f: 784, t: 0.16, d: 0.16, type: 'triangle' },
  ],
  close: [
    { f: 784, t: 0, d: 0.07, type: 'sine' },
    { f: 1047, t: 0.07, d: 0.14, type: 'sine' },
  ],
  flag: [
    { f: 440, t: 0, d: 0.12, type: 'square', g: 0.035 },
    { f: 440, t: 0.18, d: 0.12, type: 'square', g: 0.035 },
  ],
  critical: [
    { f: 880, t: 0, d: 0.16, type: 'sawtooth', g: 0.035 },
    { f: 622, t: 0.18, d: 0.16, type: 'sawtooth', g: 0.035 },
    { f: 880, t: 0.36, d: 0.16, type: 'sawtooth', g: 0.035 },
    { f: 622, t: 0.54, d: 0.2, type: 'sawtooth', g: 0.035 },
  ],
}

let ctx: AudioContext | null = null

function audio() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function playCue(cue: Cue) {
  try {
    const ac = audio()
    const t0 = ac.currentTime + 0.01
    for (const n of PATTERNS[cue]) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = n.type ?? 'sine'
      osc.frequency.value = n.f
      const peak = n.g ?? 0.06
      gain.gain.setValueAtTime(0, t0 + n.t)
      gain.gain.linearRampToValueAtTime(peak, t0 + n.t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + n.d)
      osc.connect(gain).connect(ac.destination)
      osc.start(t0 + n.t)
      osc.stop(t0 + n.t + n.d + 0.02)
    }
  } catch {
    // Audio is a nice-to-have; never let it break an action.
  }
}
