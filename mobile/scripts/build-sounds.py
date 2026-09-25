"""Synthesises every sound effect of the game as a short WAV file.

Run from mobile/:  python3 scripts/build-sounds.py
"""
import math
import random
import struct
import wave

SR = 22050
random.seed(3)


def tone(f0, f1, dur, kind='sine', vol=0.35, exp=True, attack=0.004, curve=2.0):
    n = int(SR * dur)
    out, phase = [], 0.0
    for i in range(n):
        t = i / n
        f = f0 * (f1 / f0) ** t if exp else f0 + (f1 - f0) * t
        phase += f / SR
        x = phase % 1.0
        if kind == 'sine':
            s = math.sin(2 * math.pi * x)
        elif kind == 'square':
            s = 1.0 if x < 0.5 else -1.0
        elif kind == 'pulse':
            s = 1.0 if x < 0.25 else -1.0
        elif kind == 'triangle':
            s = 4 * abs(x - 0.5) - 1
        else:
            s = 2 * x - 1
        env = min(1.0, i / (SR * attack)) * (1 - t) ** curve
        out.append(s * env * vol)
    return out


def noise(dur, vol, curve=2.0, lowpass=0.3):
    n = int(SR * dur)
    out, prev = [], 0.0
    for i in range(n):
        prev += (random.random() * 2 - 1 - prev) * lowpass
        out.append(prev * vol * (1 - i / n) ** curve)
    return out


def mix(*parts):
    """parts: (start_seconds, samples)"""
    end = max(int(SR * s) + len(p) for s, p in parts)
    buf = [0.0] * end
    for s, p in parts:
        o = int(SR * s)
        for i, v in enumerate(p):
            buf[o + i] += v
    return buf


def arp(notes, step, dur, kind, vol):
    return mix(*[(k * step, tone(f, f, dur, kind, vol)) for k, f in enumerate(notes)])


def save(name, samples):
    with wave.open(f'assets/sounds/{name}.wav', 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32000)) for s in samples))


N = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731  midi → Hz

# Tiles and slots
save('pop', tone(820, 420, 0.07, 'sine', 0.45))
save('unpop', tone(420, 760, 0.07, 'sine', 0.35))
# Interface
save('click', mix((0, tone(1800, 1200, 0.025, 'triangle', 0.22)), (0, noise(0.012, 0.08))))
save('toggle', tone(1200, 1600, 0.04, 'triangle', 0.25))
save('whoosh', noise(0.28, 0.35, curve=1.2, lowpass=0.08))
# Answers
save('success', arp([N(72), N(76), N(79)], 0.06, 0.18, 'pulse', 0.28))
save('error', mix((0, tone(180, 70, 0.28, 'saw', 0.28, exp=False)), (0, tone(185, 75, 0.28, 'saw', 0.2, exp=False))))
for k, root in zip(range(2, 6), [74, 76, 79, 81]):
    save(f'combo{k}', arp([N(root), N(root + 4), N(root + 7), N(root + 12)], 0.05, 0.16, 'pulse', 0.26))
save('fever', arp([N(m) for m in [72, 76, 79, 84, 79, 84, 88, 91]], 0.055, 0.14, 'square', 0.2))
save('coin', mix((0, tone(N(83), N(83), 0.08, 'square', 0.18)), (0.07, tone(N(88), N(88), 0.25, 'square', 0.18))))
save('sparkle', arp([N(m) for m in [84, 88, 91, 96]], 0.045, 0.12, 'triangle', 0.3))
save('timeup', tone(660, 330, 0.25, 'triangle', 0.3))
save('countdown', tone(N(81), N(81), 0.09, 'square', 0.18))
save('powerup', tone(400, 900, 0.22, 'triangle', 0.4))
save('buy', mix((0, tone(600, 1200, 0.12, 'sine', 0.35)), (0.1, tone(N(88), N(88), 0.2, 'square', 0.15))))
# Big moments
save('victory', arp([N(m) for m in [72, 76, 79, 84]], 0.15, 0.3, 'square', 0.18))
save('gameover', arp([N(m) for m in [67, 65, 64, 60]], 0.2, 0.4, 'saw', 0.18))
save('win', arp([N(72), N(76), N(79)], 0.1, 0.22, 'triangle', 0.35))
# Wheel
save('tick', mix((0, tone(2400, 1500, 0.022, 'square', 0.14)), (0, noise(0.01, 0.1))))
save('spin', noise(0.45, 0.3, curve=1.0, lowpass=0.05))
print('ok')
