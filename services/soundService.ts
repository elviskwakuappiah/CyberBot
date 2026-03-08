
import { RobotUnit } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

class SoundService {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playRockBackingTrack(ctx: AudioContext, duration: number) {
    const tempo = 132; 
    const beatDuration = 60 / tempo;
    const startTime = ctx.currentTime;

    // Distortion node for "metal" feel
    const distortion = ctx.createWaveShaper();
    function makeDistortionCurve(amount: number) {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }
    distortion.curve = makeDistortionCurve(400);
    distortion.oversample = '4x';
    distortion.connect(ctx.destination);

    const playDrum = (freq: number, time: number, type: 'kick' | 'snare' | 'hihat') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === 'kick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      } else if (type === 'snare') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, time);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        const snareGain = ctx.createGain();
        snareGain.gain.setValueAtTime(0.3, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        noise.connect(filter);
        filter.connect(snareGain);
        snareGain.connect(ctx.destination);
        noise.start(time);
        noise.stop(time + 0.2);
      } else {
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        const hhGain = ctx.createGain();
        hhGain.gain.setValueAtTime(0.1, time);
        hhGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        noise.connect(filter);
        filter.connect(hhGain);
        hhGain.connect(ctx.destination);
        noise.start(time);
        noise.stop(time + 0.05);
      }
      
      if (type !== 'hihat') {
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.3);
      }
    };

    const playBass = (freq: number, time: number, len: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq / 2, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
      gain.gain.linearRampToValueAtTime(0, time + len);
      osc.connect(gain);
      gain.connect(distortion);
      osc.start(time);
      osc.stop(time + len);
    };

    const playChord = (freqs: number[], time: number, len: number) => {
      freqs.forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.05);
        gain.gain.linearRampToValueAtTime(0.06, time + len - 0.05);
        gain.gain.linearRampToValueAtTime(0, time + len);
        osc.connect(gain);
        gain.connect(distortion);
        osc.start(time);
        osc.stop(time + len);
      });
    };

    const chords = [
      [261.63, 329.63, 392.00], // C Maj
      [196.00, 246.94, 293.66], // G Maj
      [220.00, 261.63, 329.63], // A Min
      [174.61, 220.00, 261.63]  // F Maj
    ];

    for (let i = 0; i < duration / beatDuration; i++) {
      const time = startTime + i * beatDuration;
      if (i % 2 === 0) playDrum(150, time, 'kick');
      else playDrum(250, time, 'snare');
      playDrum(0, time + beatDuration/2, 'hihat');

      if (i % 4 === 0) {
        const chordIdx = Math.floor(i / 4) % chords.length;
        playChord(chords[chordIdx], time, beatDuration * 3.8);
      }
      playBass(chords[Math.floor(i / 4) % chords.length][0], time, beatDuration * 0.9);
    }
  }

  async playTheTouch() {
    if (!this.soundEnabled) return;
    const ctx = this.init();
    // Use GEMINI_API_KEY as primary, fallback to API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.error("No API key found for Gemini TTS");
      return;
    }
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: "SING ENTHUSIASTICALLY AND LOUDLY AS AN 80S ARENA ROCK STAR WITH A GRAVELLY INTENSE VOICE: You've got the touch! You've got the power! After all is said and done, you've never walked, you've never run, you're a winner!" }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' },
              },
          },
        },
      });

      // Find the audio part by checking for inlineData
      const parts = response.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find(p => p.inlineData);
      const base64Audio = audioPart?.inlineData?.data;

      if (base64Audio) {
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          ctx,
          24000,
          1,
        );
        
        this.playRockBackingTrack(ctx, audioBuffer.duration + 2);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        // Use a compressor to avoid clipping and make it sound "produced"
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-20, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.value = 1.8; 
        
        source.connect(compressor);
        compressor.connect(gain);
        gain.connect(ctx.destination);
        
        source.start(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.error("Failed to play The Touch via TTS", e);
    }
  }

  playShoot() {
    if (!this.soundEnabled) return;
    const ctx = this.init();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playTransform(unit: RobotUnit, isEnteringAlt: boolean) {
    if (!this.soundEnabled) return;
    const ctx = this.init();
    const osc1 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    let freqStart = 200;
    let freqEnd = 400;
    let type: OscillatorType = 'sawtooth';

    switch(unit) {
      case RobotUnit.TITAN:
      case RobotUnit.VANGUARD:
        freqStart = 100; freqEnd = 150; type = 'square'; break;
      case RobotUnit.STRIKER:
      case RobotUnit.BLAZE:
        freqStart = 400; freqEnd = 800; type = 'sine'; break;
      case RobotUnit.FALCON:
      case RobotUnit.GLITCH:
        freqStart = 300; freqEnd = 600; type = 'triangle'; break;
      case RobotUnit.OMEGA:
        freqStart = 80; freqEnd = 120; type = 'square'; break;
      case RobotUnit.SENTINEL:
      case RobotUnit.SPECTER:
      case RobotUnit.NIGHTSHADE:
        freqStart = 250; freqEnd = 450; type = 'sawtooth'; break;
    }

    if (!isEnteringAlt) {
       const temp = freqStart;
       freqStart = freqEnd;
       freqEnd = temp;
    }

    osc1.type = type;
    osc1.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc1.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);
  }

  playDrive(intensity: number = 1) {
    if (!this.soundEnabled) return;
    const ctx = this.init();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40 + (intensity * 20), ctx.currentTime);
    
    gain.gain.setValueAtTime(0.03 * intensity, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playFly() {
    if (!this.soundEnabled) return;
    const ctx = this.init();
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.setValueAtTime(1, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  playLose() {
    if (!this.soundEnabled) return;
    const ctx = this.init();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  playVictory() {
    if (!this.soundEnabled) return;
    const ctx = this.init();
    const playNote = (freq: number, startTime: number, duration: number, volume: number = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const notes = [261.63, 329.63, 392.00, 523.25];
    const duration = 6;
    const tempo = 0.2;
    
    for (let i = 0; i < duration / tempo; i++) {
      const note = notes[i % notes.length];
      playNote(note * (1 + Math.floor(i / notes.length) * 0.5), ctx.currentTime + (i * tempo), tempo, 0.08);
    }
  }
}

export const soundService = new SoundService();
