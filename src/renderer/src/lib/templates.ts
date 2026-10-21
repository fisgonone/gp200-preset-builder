// Starting points for new presets. Every effect and parameter name here exists
// on the GP-200 (firmware 1.8); the same presets live in gp200-toolkit/examples.

export const CLEAN_YAML = `# Sparkly clean: '65 Twin style amp with light compression and a room.
name: Clean Twin
tempo: 120
volume: 50

slots:
  PRE:
    effect: COMP
    Sustain: 35
    Volume: 55
  AMP:
    effect: Dark Twin
    Gain: 30
    Bass: 45
    Middle: 50
    Treble: 62
    Bright: ON
  CAB:
    effect: auto          # the cabinet that matches the amp
  RVB:
    effect: Room
    Mix: 25
    Decay: 40
`

export const CRUNCH_YAML = `# Classic rock crunch: Tube Screamer style drive into a JCM800 style amp.
name: Crunch 800
tempo: 120
volume: 50

slots:
  NR:
    effect: Gate 1
    Threshold: 25
  DST:
    effect: Scream OD
    Gain: 25
    Tone: 55
    Volume: 70
  AMP:
    effect: UK 800
    Gain: 55
    Presence: 55
    Middle: 60
    Treble: 55
  CAB:
    effect: auto
  RVB:
    effect: Spring
    Mix: 18
`

export const LEAD_YAML = `# Singing lead: boosted Soldano style amp, dotted-eighth delay, big hall.
name: Lead Shimmer
author: GP-200 Builder
tempo: 120
volume: 55

slots:
  NR:
    effect: Gate 2
    Threshold: 30
  DST:
    effect: Green OD
    Gain: 20
    Tone: 60
    Volume: 75
  AMP:
    effect: Solo100 LD
    Gain: 60
    Presence: 55
    Middle: 60
  CAB:
    effect: auto
  DLY:
    effect: Pure
    Sync: ON
    Time: 1/8D            # follows the patch tempo
    Feedback: 30
    Mix: 22
    Trail: ON
  RVB:
    effect: Hall
    Mix: 25
    Decay: 55
    Trail: ON

exp:
  exp1_a: [{module: VOL, param: Volume, min: 0, max: 100}]
  exp1_b: [{module: DLY, param: Mix, min: 10, max: 50}]

ctrl:
  CTRL1: [DST]            # CTRL1 toggles the overdrive
`

export const AMBIENT_YAML = `# Ambient pad: clean amp, slow chorus, long tape echo and shimmer.
name: Ambient Pad
tempo: 90
volume: 50

slots:
  AMP:
    effect: Dark Twin
    Gain: 20
    Treble: 55
  CAB:
    effect: auto
  MOD:
    effect: G-Chorus
    Depth: 60
    Rate: 0.4
  DLY:
    effect: Tape Delay S
    Mix: 35
    Time: 600
    Feedback: 45
    Trail: ON
  RVB:
    effect: Shimmer
    Mix: 45
    Decay: 80
    Trail: ON
`

export const METAL_YAML = `# Tight modern metal: gated 5150 style amp with a mid scoop.
name: Modern Metal
tempo: 140
volume: 50

slots:
  NR:
    effect: Gate 2
    Threshold: 45
    Attack: 10
    Release: 40
  DST:
    effect: Green OD
    Gain: 0
    Tone: 60
    Volume: 80
  AMP:
    effect: EV 51
    Gain: 65
    Bass: 55
    Middle: 40
    Treble: 60
    Presence: 60
  CAB:
    effect: auto
  EQ:
    effect: Guitar EQ 1
    400Hz: -6
    800Hz: -4
    4kHz: 3
`

export const BLANK_YAML = `name: New Preset

slots:
  AMP:
    effect: Dark Twin
    Volume: 60
  CAB:
    effect: auto
`

export const TEMPLATES: { label: string; yaml: string }[] = [
  { label: 'Clean', yaml: CLEAN_YAML },
  { label: 'Crunch', yaml: CRUNCH_YAML },
  { label: 'Lead', yaml: LEAD_YAML },
  { label: 'Ambient Pad', yaml: AMBIENT_YAML },
  { label: 'Metal', yaml: METAL_YAML },
]
