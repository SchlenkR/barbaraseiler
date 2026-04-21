// Resonance Chamber — fullscreen shader. Driven by scroll, time, audio, reduced-motion.
// A single fullscreen plane. Fragment shader does all the work.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uScrollProgress; // 0..1 across the document
  uniform float uBreath;         // 0..1 low-freq sine (6s period)
  uniform float uAudioLevel;     // 0..1 smoothed FFT energy (0 if off)
  uniform float uQuality;        // 1.0 full, 0.5 reduced-motion/mobile
  uniform vec2  uResolution;

  // ------- palette: 5 anchor colors, mixed by scroll progress -------
  // 1 Atem (breath)   — deep indigo drift
  // 2 Ton  (tone)     — violet ember
  // 3 Raum (space)    — rose mist
  // 4 Klang (chord)   — amber
  // 5 Begegnung       — warm cream
  vec3 paletteAt(float t) {
    vec3 c0 = vec3(0.102, 0.078, 0.200); // #1a1433
    vec3 c1 = vec3(0.282, 0.145, 0.349); // #482559
    vec3 c2 = vec3(0.690, 0.349, 0.420); // #b0596b
    vec3 c3 = vec3(0.922, 0.639, 0.400); // #eba366
    vec3 c4 = vec3(0.961, 0.953, 0.933); // #f5f3ee
    float s = clamp(t, 0.0, 1.0) * 4.0;
    if (s < 1.0) return mix(c0, c1, s);
    if (s < 2.0) return mix(c1, c2, s - 1.0);
    if (s < 3.0) return mix(c2, c3, s - 2.0);
    return mix(c3, c4, s - 3.0);
  }

  // cheap hash for particle noise
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // soft ribbon: returns intensity on a sinuous band whose centerline is y = f(x, t)
  float ribbon(vec2 uv, float freq, float amp, float phase, float thickness, float t) {
    // center line flows horizontally, distorted by layered sines
    float center = 0.5
      + amp * sin(uv.x * freq + phase + t * 0.35)
      + amp * 0.45 * sin(uv.x * freq * 1.9 - t * 0.22 + phase * 1.7)
      + amp * 0.22 * sin(uv.x * freq * 3.3 + t * 0.11);
    float d = abs(uv.y - center);
    // gaussian-ish band
    return exp(-(d * d) / (thickness * thickness));
  }

  // particle field — dust caught in the current
  float particles(vec2 uv, float scale, float density, float t) {
    vec2 g = floor(uv * scale);
    float h = hash21(g);
    // drift cells with time so particles feel alive
    vec2 f = fract(uv * scale) - 0.5;
    float jitter = hash21(g + 17.0);
    f += 0.3 * vec2(sin(t * 0.6 + jitter * 6.28), cos(t * 0.4 + jitter * 6.28));
    float d = length(f);
    float star = smoothstep(density, 0.0, d) * step(0.985, h);
    return star;
  }

  void main() {
    // aspect-correct uv centered in [0,1] horizontally, but keep vertical in screen space
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    // ---- breathing & audio inject into time ----
    float breathSwell = 0.85 + 0.30 * uBreath + 0.45 * uAudioLevel;
    float t = uTime;

    // ---- scroll stages 0..4, we read progress 0..1 ----
    float sp = clamp(uScrollProgress, 0.0, 1.0);

    // base vertical gradient — anchors the scene
    vec3 bg = paletteAt(sp * 0.9 + 0.05 * uv.y);

    // subtle large noise so gradient breathes
    float largeN = 0.02 * (hash21(floor(uv * 8.0)) - 0.5);
    bg += largeN;

    // ---- ribbons: aurora-like bands ----
    // ribbon count scales with quality
    float rib = 0.0;
    // primary ribbon — slowly widens from Atem -> Raum, tightens again at Begegnung
    float baseAmp = mix(0.12, 0.22, sp) * (1.0 - 0.35 * smoothstep(0.85, 1.0, sp));
    float thickness1 = mix(0.08, 0.18, sp) * breathSwell;
    rib += ribbon(uv, mix(2.5, 4.5, sp), baseAmp, 0.0, thickness1, t) * 1.0;

    // secondary ribbon — tone/klang (helix-ish), more active mid-scroll
    float midActivity = smoothstep(0.15, 0.55, sp) * (1.0 - smoothstep(0.85, 1.0, sp));
    float thickness2 = 0.045 * breathSwell;
    rib += ribbon(uv, mix(6.0, 11.0, sp), 0.08, 1.7, thickness2, t * 1.3) * (0.55 + 0.35 * midActivity);

    // tertiary — high frequency shimmer, only at higher quality
    if (uQuality > 0.75) {
      float thickness3 = 0.022 * breathSwell;
      rib += ribbon(uv, mix(14.0, 22.0, sp), 0.05, 3.14, thickness3, -t * 0.9) * (0.35 * midActivity);
    }

    // final ribbon phase: collapses into a focal point near end (Begegnung)
    float focalFalloff = smoothstep(0.85, 1.0, sp);
    vec2 focal = vec2(0.5, 0.5);
    float focalDist = distance(uv * vec2(aspect, 1.0), focal * vec2(aspect, 1.0));
    float focalGlow = exp(-focalDist * focalDist * mix(4.0, 28.0, focalFalloff));
    rib = mix(rib, focalGlow * 1.4, focalFalloff);

    // ribbon color — brighter warm tint driven by scroll
    vec3 ribbonColor = mix(
      vec3(0.70, 0.55, 0.95),   // violet glow early
      vec3(1.00, 0.85, 0.65),   // warm cream glow late
      sp
    );
    ribbonColor *= breathSwell;

    vec3 col = bg + ribbonColor * rib * (0.9 + 0.4 * uAudioLevel);

    // ---- particles — grow with scroll, peak at Klang (phase 4), thin again at Begegnung ----
    float particleAmount = smoothstep(0.1, 0.7, sp) * (1.0 - 0.6 * focalFalloff);
    float scale = mix(40.0, 90.0, sp);
    float p = particles(uv * vec2(aspect, 1.0), scale, 0.08, t) * particleAmount;
    if (uQuality > 0.75) {
      p += particles(uv * vec2(aspect, 1.0) + 3.1, scale * 1.6, 0.06, t * 0.7) * particleAmount * 0.6;
    }
    col += vec3(1.0, 0.95, 0.85) * p * (0.9 + 0.5 * uAudioLevel);

    // ---- vignette & breath darkening ----
    float vig = smoothstep(1.15, 0.25, length((uv - 0.5) * vec2(aspect, 1.0)));
    col *= mix(0.78, 1.02, vig);
    col *= mix(0.92, 1.06, uBreath);

    // ---- tiny film grain so it doesn't look plastic ----
    float grain = (hash21(uv * uResolution.xy + t) - 0.5) * 0.035;
    col += grain;

    gl_FragColor = vec4(col, 1.0);
  }
`;
