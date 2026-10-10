"""Mythos Unbound revised trailer score — 26 seconds, 120 BPM, D minor."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, sys

SR = 48000
DUR = 26.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)
BEAT = 0.5


def note(n):  # MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), 'high', output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    lg = gain * np.sqrt((1 - pan) / 2)
    rg = gain * np.sqrt((1 + pan) / 2)
    L[i:i + len(sig)] += sig * lg
    R[i:i + len(sig)] += sig * rg


def tt(d):
    return np.arange(int(d * SR)) / SR


def saw(f, d, detune=0.0):
    t = tt(d)
    ph = (f * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def env_ad(d, a, dec):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / dec)
    return e


# ---------------------------------------------------------------- instruments
def drone(t0, t1, notes, gain, cut0, cut1):
    d = t1 - t0
    t = tt(d)
    x = sum(saw(note(n), d, dt) for n in notes for dt in (-0.004, 0.0, 0.0035))
    # filter opens over time: process in blocks
    out = np.zeros_like(x)
    blk = SR // 10
    for s in range(0, len(x), blk):
        u = s / len(x)
        out[s:s + blk] = lp(x[s:s + blk], cut0 + (cut1 - cut0) * u ** 1.5)
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 0.6)
    add(out * fade, t0, gain / len(notes), -0.2)
    add(out * fade, t0 + 0.012, gain / len(notes), 0.2)


def bell(t0, n, gain, pan=0.0):
    d = 3.0
    t = tt(d)
    f = note(n)
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t * 2)
         + 0.25 * np.sin(2 * np.pi * 3.98 * f * t) * np.exp(-t * 4))
    add(x * env_ad(d, 0.004, 0.9), t0, gain, pan)


def sub_boom(t0, gain, f0=90, f1=32, dec=0.9):
    d = dec * 4
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    add(np.sin(ph) * env_ad(d, 0.003, dec), t0, gain)


def noise_burst(t0, gain, dec=0.25, lo=200, hi=6000):
    d = dec * 5
    x = bp(rng.standard_normal(int(d * SR)), lo, hi) * env_ad(d, 0.002, dec)
    add(x, t0, gain, -0.3)
    add(np.roll(x, 300), t0, gain, 0.3)


def clang(t0, gain):
    d = 2.5
    t = tt(d)
    parts = [(181, 1), (397, .7), (613, .5), (877, .45), (1253, .3), (1789, .2)]
    x = sum(a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * (1.2 + f / 900)) for f, a in parts)
    add(x * env_ad(d, 0.001, 1.0), t0, gain)


def impact(t0, size=1.0):
    sub_boom(t0, 0.9 * size)
    noise_burst(t0, 0.35 * size)
    clang(t0, 0.18 * size)


def taiko(t0, gain, pitch=1.0, pan=0.0):
    d = 0.9
    t = tt(d)
    f = (55 + 70 * np.exp(-t * 25)) * pitch
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(d, 0.002, 0.22)
    skin = bp(rng.standard_normal(len(t)), 300, 2500) * env_ad(d, 0.001, 0.03)
    add(body + 0.5 * skin, t0, gain, pan)


def snare(t0, gain, pan=0.0):
    d = 0.4
    t = tt(d)
    x = hp(rng.standard_normal(len(t)), 1200) * env_ad(d, 0.001, 0.07)
    x += 0.4 * np.sin(2 * np.pi * 190 * t) * env_ad(d, 0.001, 0.05)
    add(x, t0, gain, pan)


def crash(t0, gain):
    d = 3.0
    x = hp(rng.standard_normal(int(d * SR)), 5000) * env_ad(d, 0.002, 0.8)
    add(x, t0, gain, -0.4)
    add(np.roll(x, 500), t0, gain, 0.4)


def braam(t0, root, d, gain, cut=900):
    t = tt(d)
    notes = [root - 12, root, root + 7, root + 12]
    x = sum(saw(note(n), d, dt) for n in notes for dt in (-0.006, 0.0, 0.006))
    e = np.minimum(1, t / 0.03) * np.exp(-t / (d * 0.45))
    swell = lp(x, cut) * e
    add(swell, t0, gain / 12, -0.25)
    add(np.roll(swell, 200), t0, gain / 12, 0.25)


def pluck_saw(t0, n, gain, dur=0.22, cut=2200, pan=0.0):
    t = tt(dur + 0.2)
    x = saw(note(n), dur + 0.2, 0.002) + saw(note(n), dur + 0.2, -0.002)
    add(lp(x, cut) * env_ad(dur + 0.2, 0.003, dur * 0.6), t0, gain, pan)


def riser(t0, t1, gain):
    d = t1 - t0
    t = tt(d)
    u = t / d
    x = rng.standard_normal(len(t))
    out = np.zeros_like(x)
    blk = SR // 50
    for s in range(0, len(x), blk):
        c = 300 + 7000 * (s / len(x)) ** 2
        out[s:s + blk] = bp(x[s:s + blk], c * 0.7, c * 1.3)
    f = 110 * 2 ** (u * 2)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    add((out * 0.6 + tone * 0.15) * u ** 2, t0, gain)


# Same instruments as the original score; all cues follow the revised 26-second cut.
D2, F2, A2, D3, F3, A3, D4, F4, A4 = 38, 41, 45, 50, 53, 57, 62, 65, 69

# Immediate battle teaser, then a brief breath for the family hook.
impact(0.0, 0.7)
braam(0.0, D2 + 12, 0.9, 0.6, 1000)
for k in range(4):
    taiko(k * .25, .45 if k % 2 == 0 else .2, .8)
drone(1.0, 13.5, [D2 - 12, D2, A2], .4, 140, 800)
drone(1.0, 13.5, [D3, F3, A3], .12, 400, 1300)
for t0, n in [(1.1, D4), (1.8, A3), (2.2, F4)]:
    bell(t0, n, .2)

# Names and relationship cards land gently; gameplay carries the stronger accents.
for k in range(22):
    taiko(2.5 + k * .5, .22 + .12 * k / 22, .7)
for t0, root in [(2.7, D2 + 12), (5.2, D2 + 10), (9.2, D2 + 7)]:
    impact(t0, .5)
    braam(t0, root, 1.5, .45, 750)
for t0, n in [(3.3, D4), (4.1, F4), (5.8, A4), (6.4, F4), (9.8, D4 + 12)]:
    bell(t0, n, .1)
riser(6.5, 7.0, .22)
riser(10.5, 11.0, .28)

# Spliced battle examples: entrances at 7 and 11, vengeance lands at 13.03.
for start, end, chord in [(7, 9, [D3, F3, A3, D4]), (11, 13.5, [48, 52, 55, 60]), (16.5, 18, [45, 49, 52, 57])]:
    for k in range(round((end - start) / .125)):
        pluck_saw(start + k * .125, chord[k % 4], .09, .12, 1900, pan=(-.4 if k % 2 else .4))
    for k in range(round((end - start) / .25)):
        taiko(start + k * .25, .65 if k % 4 in (0, 3) else .27, .8, pan=(-.3 if k % 2 else .3))
        if k % 4 == 2:
            snare(start + k * .25, .14)
for t0, size in [(7, .9), (11, .9), (13.03, 1.1), (16.5, .6)]:
    impact(t0, size)
    crash(t0, .08)

# Drafting: give the tree room; the click at 14.57 gets a small bell.
impact(13.5, .28)
for t0, n in [(13.6, D4), (14.57, A4), (15.5, F4)]:
    bell(t0, n, .17)
for k in range(6):
    taiko(13.5 + k * .5, .23, .7)
riser(17.5, 18, .3)

# Three readable portraits, then the complete roster reveal.
for k in range(28):
    t0 = 18 + k * .125
    taiko(t0, .6 if k % 4 == 0 else .25, .8 if k % 4 == 0 else 1.15, pan=(-.4 if k % 2 else .4))
for t0, root in [(18, D2 + 12), (18.5, D2 + 10), (19, D2 + 7), (19.5, D2 + 12)]:
    braam(t0, root, .8, .55, 1200)
    impact(t0, .4)
for k in range(16):
    snare(20.5 + k / 16, .07 + .13 * k / 16, pan=(-.2 if k % 2 else .2))
riser(20.5, 21.5, .42)

# Title: one strong landing, then a clear 4.5-second call to play.
impact(21.5, 1.25)
sub_boom(21.5, .8, 60, 28, 1.8)
crash(21.5, .16)
braam(21.5, D2, 4.5, 1.2, 1100)
drone(21.5, 26, [D2 - 12, D2, A2, D3], .28, 550, 180)
for t0, n, g in [(22, D4, .16), (23.2, A4, .11), (24.3, D4 + 12, .07)]:
    bell(t0, n, g)

# ---------------------------------------------------------------- master
ir_t = tt(2.6)
irL = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6)
irR = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6)
irL = lp(irL, 5000); irR = lp(irR, 5000)
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
wetL = fftconvolve(L, irL)[:N]
wetR = fftconvolve(R, irR)[:N]
L2 = L + 0.28 * wetL
R2 = R + 0.28 * wetR
L2 = hp(L2, 25); R2 = hp(R2, 25)
peak = max(np.abs(L2).max(), np.abs(R2).max())
L2 = np.tanh(1.6 * L2 / peak) / np.tanh(1.6)
R2 = np.tanh(1.6 * R2 / peak) / np.tanh(1.6)
fade = np.ones(N)
fo = int(0.5 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
L2 *= fade * 0.89; R2 *= fade * 0.89
pcm = (np.stack([L2, R2], axis=1) * 32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', DUR, 's')
