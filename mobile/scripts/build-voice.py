"""Announcer voice lines ("COMBO!", "FEVER!"…) for the game.

Spoken offline by the Piper text-to-speech voice en_US-ljspeech-high, then made "arcade":
a little lower, a little saturation and an echo.

Licence: the voice is trained on the LJ Speech dataset, which is in the public domain, so the
lines can ship in a paid app. Do not swap in a voice whose dataset is "NC" (non-commercial),
such as "ryan": check the MODEL_CARD next to the voice first.

    python3 -m venv /tmp/tts && /tmp/tts/bin/pip install piper-tts numpy
    # voice files from https://huggingface.co/rhasspy/piper-voices (en/en_US/ljspeech/high)
    /tmp/tts/bin/python scripts/build-voice.py /path/to/en_US-ljspeech-high.onnx
"""
import io
import sys
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

LINES = {
    'voice_combo': 'Great combo!',
    'voice_fever': 'Fever time!',
    'voice_unstoppable': 'Unstoppable!',
    'voice_perfect': 'Perfect!',
    'voice_amazing': 'Amazing!',
}
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'sounds'
RATE = 22050


def speak(voice, text):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=0.85, noise_scale=0.5))
    buf.seek(0)
    with wave.open(buf, 'rb') as r:
        rate = r.getframerate()
        data = np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    return data, rate


def arcade(x, rate):
    # Trim silence around the word.
    loud = np.where(np.abs(x) > 0.02)[0]
    x = x[max(0, loud[0] - int(0.01 * rate)): loud[-1] + int(0.03 * rate)]
    # 2 semitones lower (and a touch slower): a bigger voice.
    factor = 2 ** (-2 / 12)
    n = int(len(x) / factor)
    x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    # Punch: soft saturation.
    x = x / (np.max(np.abs(x)) + 1e-9)
    x = np.tanh(2.4 * x) / np.tanh(2.4)
    # Stadium echo.
    out = np.concatenate([x, np.zeros(int(0.45 * rate))])
    for delay, gain in ((0.11, 0.35), (0.22, 0.18), (0.33, 0.08)):
        d = int(delay * rate)
        out[d:d + len(x)] += gain * x
    # Fade out the echo tail, normalise to -1 dB.
    fade = int(0.08 * rate)
    out[-fade:] *= np.linspace(1, 0, fade)
    out = out / np.max(np.abs(out)) * 10 ** (-1 / 20)
    if rate != RATE:
        out = np.interp(np.linspace(0, len(out) - 1, int(len(out) * RATE / rate)), np.arange(len(out)), out)
    return out


def main():
    voice = PiperVoice.load(sys.argv[1])
    for name, text in LINES.items():
        x, rate = speak(voice, text)
        y = arcade(x, rate)
        with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes((y * 32767).astype(np.int16).tobytes())
        print(f'{name}.wav  {len(y) / RATE:.2f} s')


if __name__ == '__main__':
    main()
