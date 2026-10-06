"""Makes the chest sounds of the app (mobile/assets/sounds/chest_*.wav), from code only:
no sample, no licence. Same format as the other sounds: 22 050 Hz, mono, 16 bits.

    python3 store/outils/sons/coffres.py
"""
import math
import os
import random
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '../../../mobile/assets/sounds')
rnd = random.Random(20261006)


def silence(sec):
    return [0.0] * int(sec * RATE)


def mix(dst, src, at=0.0, gain=1.0):
    i0 = int(at * RATE)
    if len(dst) < i0 + len(src):
        dst.extend([0.0] * (i0 + len(src) - len(dst)))
    for i, v in enumerate(src):
        dst[i0 + i] += v * gain
    return dst


def lowpass(x, cutoff):
    a = 1 - math.exp(-2 * math.pi * cutoff / RATE)
    y, out = 0.0, []
    for v in x:
        y += a * (v - y)
        out.append(y)
    return out


def highpass(x, cutoff):
    low = lowpass(x, cutoff)
    return [a - b for a, b in zip(x, low)]


def env(n, attack, decay):
    """Fast attack, exponential decay (seconds)."""
    out = []
    for i in range(n):
        t = i / RATE
        a = min(1.0, t / attack) if attack > 0 else 1.0
        out.append(a * math.exp(-t / decay))
    return out


def noise(sec):
    return [rnd.uniform(-1, 1) for _ in range(int(sec * RATE))]


def tone(freq, sec, decay, attack=0.002, partials=((1, 1.0),), glide=0.0):
    """A pitched sound: partials (ratio, gain), optional pitch glide (fraction lost over the sound)."""
    n = int(sec * RATE)
    e = env(n, attack, decay)
    out, ph = [], [0.0] * len(partials)
    for i in range(n):
        f = freq * (1 - glide * i / n)
        v = 0.0
        for k, (ratio, g) in enumerate(partials):
            ph[k] += 2 * math.pi * f * ratio / RATE
            v += g * math.sin(ph[k])
        out.append(v * e[i])
    return out


def normalize(x, peak=0.89):
    m = max(abs(v) for v in x) or 1
    return [v * peak / m for v in x]


def fade_out(x, sec=0.05):
    n = int(sec * RATE)
    for i in range(min(n, len(x))):
        x[-1 - i] *= i / n
    return x


def save(name, x):
    x = fade_out(normalize(x))
    with wave.open(os.path.join(OUT, f'{name}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v)) * 32767)) for v in x))
    print('wrote', name, f'{len(x) / RATE:.2f} s')


# 1. Knock: the chest hits the floor (a deep wooden thump with a short "tock").
def knock():
    body = tone(95, 0.45, 0.11, partials=((1, 1.0), (1.5, 0.35)), glide=0.4)
    thud = lowpass([v * e for v, e in zip(noise(0.45), env(int(0.45 * RATE), 0.001, 0.05))], 900)
    tock = tone(420, 0.12, 0.025, partials=((1, 1.0), (2.3, 0.4)))
    x = mix(mix(body, thud, 0, 0.9), tock, 0.002, 0.45)
    return x


# 2. Lock: a metallic double clack (the latch jumps).
def lock():
    def clack(level):
        n = int(0.16 * RATE)
        click = highpass([v * e for v, e in zip(noise(0.16), env(n, 0.0005, 0.012))], 2000)
        ring = tone(2650, 0.16, 0.05, partials=((1, 1.0), (1.51, 0.6), (2.27, 0.4), (3.1, 0.25)))
        return mix([v * level for v in click], ring, 0, 0.35 * level)
    return mix(clack(1.0), clack(0.7), 0.075)


# 3. Creak: the old hinge as the lid swings (stick-slip pulses through a wooden resonance).
def creak():
    sec = 0.5
    n = int(sec * RATE)
    x = [0.0] * n
    t, rate = 0.0, 150.0
    while t < sec:
        i = int(t * RATE)
        if i < n:
            x[i] = 1.0
        rate = 150 + 110 * math.sin(t * 9) + rnd.uniform(-20, 20)
        t += 1 / max(60, rate)
    res = []
    y1 = y2 = 0.0
    f, q = 700, 18
    w = 2 * math.pi * f / RATE
    r = math.exp(-w / (2 * q))
    for v in x:
        y = v + 2 * r * math.cos(w) * y1 - r * r * y2
        y2, y1 = y1, y
        res.append(y)
    e = env(n, 0.04, 0.25)
    return [v * g for v, g in zip(res, e)]


def bell(freq, sec, decay):
    return tone(freq, sec, decay, attack=0.003, partials=((1, 1.0), (2.0, 0.35), (2.76, 0.25), (5.4, 0.08)))


def shimmer(sec, density, lo=2500, hi=6500):
    x = silence(sec)
    for _ in range(int(sec * density)):
        at = rnd.uniform(0, sec * 0.85)
        mix(x, tone(rnd.uniform(lo, hi), 0.25, 0.06), at, rnd.uniform(0.05, 0.16))
    return x


# 4. Open: a swell of air, then a bright magic chord and sparkles.
def opening(legend=False):
    sec = 2.4 if legend else 1.7
    x = silence(sec)
    swell_n = int(0.35 * RATE)
    swell = noise(0.35)
    swell = [v * (i / swell_n) ** 2 for i, v in enumerate(swell)]
    mix(x, lowpass(swell, 2500), 0, 0.5)
    if legend:
        mix(x, tone(55, 1.4, 0.45, partials=((1, 1.0), (2, 0.3)), glide=0.25), 0.3, 0.9)
    notes = [523.25, 659.25, 783.99, 1046.5, 1318.5] + ([1567.98, 2093.0] if legend else [])
    for k, f in enumerate(notes):
        mix(x, bell(f, sec - 0.3, 0.55 if legend else 0.42), 0.3 + k * 0.045, 0.32)
    if legend:
        # A soft pad under the chord.
        for f in (261.63, 392.0, 523.25):
            pad = tone(f, 1.8, 0.9, attack=0.25, partials=((1, 1.0), (1.003, 0.8), (2, 0.2)))
            mix(x, pad, 0.3, 0.12)
    mix(x, shimmer(sec - 0.3, 28 if legend else 18), 0.32, 1.0)
    return x


# 5. Coins: a shower of little coins landing, thick at first, then thinner.
def coins():
    sec = 1.4
    x = silence(sec)
    for k in range(34):
        at = 0.9 * (k / 34) ** 1.6 + rnd.uniform(0, 0.05)
        f = rnd.uniform(3000, 4200)
        ping = tone(f, 0.22, 0.05, partials=((1, 1.0), (1.48, 0.5), (2.1, 0.3)))
        mix(x, ping, at, rnd.uniform(0.25, 0.6))
    return x


save('chest_knock', knock())
save('chest_lock', lock())
save('chest_creak', creak())
save('chest_open', opening())
save('chest_open_legend', opening(True))
save('chest_coins', coins())
