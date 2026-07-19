import React, { useEffect, useState } from 'react';
import { getLocalSetting, setLocalSetting } from '../../services/db';

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playSynthSound = async (type) => {
  const isMuted = await getLocalSetting('audio_muted', false);
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Core volume master
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.connect(ctx.destination);

    if (type === 'tick') {
      // Sleek hover click
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      masterGain.gain.setValueAtTime(0.015, now); // Quiet
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
      
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.012);
    } else if (type === 'click') {
      // Organic retro UI pop
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      masterGain.gain.setValueAtTime(0.06, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === 'success') {
      // Uplifting arpeggio (Nothing OS success tone)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.03, now + idx * 0.05 + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.15);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.18);
      });
    } else if (type === 'alert') {
      // Dual-tone warnings
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(220, now);
      osc2.frequency.setValueAtTime(225, now); // beating frequency

      masterGain.gain.setValueAtTime(0.03, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      // Simple low pass filter to make sawtooth soft
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.26);
      osc2.stop(now + 0.26);
    } else if (type === 'panel') {
      // Apple Vision Pro panel drawer sound
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);

      masterGain.gain.setValueAtTime(0.02, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
    }
  } catch (e) {
    // Context suspended or browser does not support Audio
  }
};

export const useAudioEffects = () => {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const fetchMuteState = async () => {
      const state = await getLocalSetting('audio_muted', false);
      setMuted(state);
    };
    fetchMuteState();
  }, []);

  const toggleMute = async () => {
    const nextState = !muted;
    setMuted(nextState);
    await setLocalSetting('audio_muted', nextState);
    if (!nextState) {
      // Play a quick chime to show audio is active
      setTimeout(() => playSynthSound('click'), 100);
    }
  };

  return {
    muted,
    toggleMute,
    playClick: () => playSynthSound('click'),
    playTick: () => playSynthSound('tick'),
    playSuccess: () => playSynthSound('success'),
    playAlert: () => playSynthSound('alert'),
    playPanel: () => playSynthSound('panel')
  };
};
