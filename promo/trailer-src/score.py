"""Original trailer score for Mythos Unbound — soft open, builds to chaotic hits.

120 bpm, D minor, 28 s. Cue points line up with the trailer's cuts:
  0-3   intro: drone, pad, sparse bell motif
  3-12  pairings: heartbeat pulse, impact on each slam (3.5, 6.5, 9.5), riser into 12
  12-20 gameplay: taiko groove + string ostinato, hits on cuts (12, 14.5, 17, 18.5)
  20-24 roster rush: chaotic 16th toms, braam stabs, snare roll riser
  24-28 title: huge braam + impact, ringing tail
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, sys

SR = 48000
DUR = 28.0
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


# ---------------------------------------------------------------- arrangement
D2, F2, A2, D3, F3, A3, D4, F4, A4 = 38, 41, 45, 50, 53, 57, 62, 65, 69

# Intro: drone and pad grow under the whole first half
drone(0.0, 12.5, [D2 - 12, D2, A2], 0.55, 140, 900)
drone(0.0, 12.5, [D3, F3, A3], 0.18, 400, 1600)
# soft wind
wind = bp(rng.standard_normal(int(12 * SR)), 300, 1200) * np.minimum(1, tt(12) / 2) * np.exp(-tt(12) / 9)
add(wind, 0.0, 0.05)
# bell motif — sparse, then answers each card
for t0, n in [(0.35, D4), (1.35, A3), (2.1, F4), (2.6, 64)]:
    bell(t0, n, 0.22, pan=rng.uniform(-0.4, 0.4))
sub_boom(0.3, 0.5, 70, 30, 1.2)

# Pairings: heartbeat pulse that tightens
for k in range(18):
    t0 = 3.0 + k * BEAT
    g = 0.25 + 0.3 * k / 18
    taiko(t0, g, 0.7)
    if k >= 6:
        taiko(t0 + 0.25, g * 0.55, 0.7)
for t0 in (3.5, 6.5, 9.5):
    impact(t0, 0.9)
    crash(t0, 0.08)
for t0, n in [(4.3, D4), (5.2, F4), (7.3, A4), (8.2, F4), (10.3, D4 + 12)]:
    bell(t0, n, 0.12)
braam(3.5, D2 + 12, 2.2, 0.6, 700)
braam(6.5, D2 + 10, 2.2, 0.65, 800)   # Bb
braam(9.5, D2 + 7, 2.0, 0.7, 900)     # G
riser(10.5, 12.0, 0.35)

# Gameplay: groove + ostinato, hits on each cut
CHORDS = [(12.0, [D3, F3, A3, D4]), (14.0, [46, D3 + 3, F3, 58]),  # Bb
          (16.0, [48, 52, 55, 60]), (18.0, [45, 49, 52, 57])]       # C, A
for c0, ch in CHORDS:
    for k in range(16):
        t0 = c0 + k * 0.125
        pluck_saw(t0, ch[k % 4] + (12 if k % 8 >= 6 else 0), 0.11, 0.12, 1800 + 300 * (c0 - 12), pan=(-0.5 if k % 2 else 0.5))
for k in range(32):  # 8 bars of 8ths... 16 beats
    t0 = 12.0 + k * 0.25
    beat = k % 8
    if beat in (0, 3, 4, 6):
        taiko(t0, 0.75, 0.8, pan=0.0)
    else:
        taiko(t0, 0.35, 1.25, pan=(-0.6 if k % 2 else 0.6))
    if beat in (2, 6):
        snare(t0, 0.18)
for t0, s in ((12.0, 1.2), (14.5, 0.8), (17.0, 0.9), (18.5, 0.8)):
    impact(t0, s)
    crash(t0, 0.1)
braam(12.0, D2 + 12, 2.0, 0.7, 1100)
riser(18.5, 20.0, 0.4)

# Roster rush: chaos
for k in range(64):  # 16ths for 4 s
    t0 = 20.0 + k * 0.0625
    acc = (k % 4 == 0)
    taiko(t0, 0.75 if acc else 0.42, 0.75 if acc else 1.1 + 0.4 * rng.random(), pan=rng.uniform(-0.7, 0.7))
for k in range(4):
    t0 = 20.0 + k
    braam(t0, [D2 + 12, D2 + 10, D2 + 7, D2 + 7][k] , 0.9, 0.75, 1400)
    crash(t0, 0.12)
    sub_boom(t0, 0.6)
for k in range(32):  # accelerating snare roll in the last 2 s
    t0 = 22.0 + 2.0 * (1 - (1 - k / 32) ** 1.6)
    snare(t0, 0.08 + 0.2 * k / 32, pan=rng.uniform(-0.3, 0.3))
for c0, ch in [(20.0, [D4, F4, A4, D4 + 12]), (21.0, [58, D4, F4, 70]), (22.0, [55, 58, D4, 67]), (23.0, [57, 61, 64, 69])]:
    for k in range(16):
        pluck_saw(c0 + k * 0.0625, ch[k % 4], 0.09, 0.08, 3200, pan=rng.uniform(-0.6, 0.6))
riser(22.0, 24.0, 0.55)

# Title: everything lands, then rings out
impact(24.0, 1.5)
sub_boom(24.0, 1.0, 60, 28, 2.0)
crash(24.0, 0.2)
braam(24.0, D2, 4.0, 1.4, 1200)
drone(24.0, 28.0, [D2 - 12, D2, A2, D3], 0.35, 600, 200)
bell(24.6, D4, 0.18)
bell(25.6, A4, 0.12)
bell(26.4, D4 + 12, 0.08)

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
fo = int(0.8 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
L2 *= fade * 0.89; R2 *= fade * 0.89
pcm = (np.stack([L2, R2], axis=1) * 32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', DUR, 's')
