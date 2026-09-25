"""Composes the two original chiptune loops (menu + game) as WAV files.

Run from mobile/:  python3 scripts/build-music.py
Everything is synthesised here, so the music is ours and royalty-free.
"""
import math
import random
import struct
import wave

SR = 22050
random.seed(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def osc(kind, phase, duty=0.5):
    x = phase % 1.0
    if kind == 'square':
        return 1.0 if x < duty else -1.0
    if kind == 'triangle':
        return 4 * abs(x - 0.5) - 1
    return math.sin(2 * math.pi * x)


def note(buf, start, dur, freq, kind, vol, duty=0.5, attack=0.005, release=0.06, vibrato=0.0):
    """Adds one note to buf (samples may run past dur for the release tail)."""
    n = int(SR * (dur + release))
    s0 = int(SR * start)
    phase = 0.0
    for i in range(n):
        t = i / SR
        f = freq * (1 + vibrato * math.sin(2 * math.pi * 5.5 * t)) if t > 0.12 else freq
        phase += f / SR
        if t < attack:
            env = t / attack
        elif t < dur:
            env = 1.0 - 0.35 * (t - attack) / max(dur, 1e-3)
        else:
            env = 0.65 * (1 - (t - dur) / release)
        buf[(s0 + i) % len(buf)] += osc(kind, phase, duty) * env * vol


def hat(buf, start, vol):
    s0 = int(SR * start)
    for i in range(int(SR * 0.03)):
        buf[(s0 + i) % len(buf)] += (random.random() * 2 - 1) * vol * (1 - i / (SR * 0.03)) ** 2


def kick(buf, start, vol):
    s0 = int(SR * start)
    phase = 0.0
    n = int(SR * 0.14)
    for i in range(n):
        t = i / SR
        phase += (120 * (1 - t / 0.14) + 45) / SR
        buf[(s0 + i) % len(buf)] += math.sin(2 * math.pi * phase) * vol * (1 - i / n) ** 2


CHORDS = {'C': [48, 52, 55], 'Am': [45, 48, 52], 'F': [41, 45, 48], 'G': [43, 47, 50], 'E': [40, 44, 47]}


def render(name, bpm, chords, melody, drums):
    eighth = 60 / bpm / 2
    bars = len(chords)
    buf = [0.0] * int(SR * eighth * 8 * bars)  # exact loop length; tails wrap to the start
    for b, ch in enumerate(chords):
        root = CHORDS[ch][0]
        bar0 = b * 8 * eighth
        # Bass: bouncing root / octave on eighths.
        for k in range(8):
            n = root - 12 + (12 if k % 2 else 0)
            note(buf, bar0 + k * eighth, eighth * 0.8, midi(n), 'triangle', 0.32, release=0.03)
        # Soft arpeggio on sixteenths.
        arp = CHORDS[ch] + [CHORDS[ch][1] + 12]
        for k in range(16):
            note(buf, bar0 + k * eighth / 2, eighth * 0.4, midi(arp[k % 4] + 12), 'square', 0.045, duty=0.25, release=0.02)
        # Lead melody.
        for k, n in enumerate(melody[b]):
            if n is None:
                continue
            length = 1
            while k + length < 8 and melody[b][k + length] == '-':
                length += 1
            if n == '-':
                continue
            note(buf, bar0 + k * eighth, eighth * length * 0.9, midi(n), 'square', 0.16, duty=0.25, vibrato=0.004)
        if drums:
            for k in range(8):
                if k % 2 == 1:
                    hat(buf, bar0 + k * eighth, 0.07)
                if k % 4 == 0:
                    kick(buf, bar0 + k * eighth, 0.45)
                if k in (2, 6):
                    hat(buf, bar0 + k * eighth, 0.12)
        else:
            for k in range(8):
                if k % 2 == 1:
                    hat(buf, bar0 + k * eighth, 0.04)
    peak = max(abs(s) for s in buf) or 1
    with wave.open(f'assets/music/{name}.wav', 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(s / peak * 0.8 * 32767)) for s in buf))
    print(name, f'{len(buf) / SR:.1f}s')


_ = None
MENU = [
    [76, _, 79, 76, 72, _, 74, 76],
    [81, '-', 79, 76, 74, _, 72, _],
    [77, _, 81, 77, 72, _, 77, 79],
    [79, '-', '-', 74, 71, 74, 79, _],
    [84, _, 79, 76, 79, _, 76, 72],
    [76, 74, 72, 74, 76, '-', 69, _],
    [72, _, 77, _, 81, 79, 77, 74],
    [74, _, 71, _, 67, '-', '-', _],
]
GAME = [
    [69, 72, 76, 72, 81, _, 79, 76],
    [77, _, 76, 77, 72, _, 69, _],
    [72, 76, 79, 76, 84, '-', 79, _],
    [79, _, 74, _, 71, 74, 76, _],
    [81, _, 81, 79, 76, _, 72, 76],
    [77, _, 77, 76, 72, _, 77, 81],
    [79, _, 74, 79, 83, '-', 79, _],
    [86, _, 83, _, 79, _, 74, _],
]

render('menu', 104, ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'], MENU, drums=False)
render('game', 132, ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'], GAME, drums=True)
