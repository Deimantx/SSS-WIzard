# Channeling

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

## Channeling constants

| Balance ID | Runtime value |
| --- | --- |
| BALANCE.channeling.baseNaturalRegenPerSecond | 5 |
| BALANCE.channeling.echoFocusCost | 10 |
| BALANCE.channeling.echoManaPerSecond | 5 |
| BALANCE.channeling.maxEchoes | 5 |
| BALANCE.channeling.discoveryEchoMultiplier | 1.1 |
| BALANCE.channeling.stableLeylineRegenBonus | 1 |
| BALANCE.channeling.stableLeylineThreshold | 2500 |
| BALANCE.channeling.echoResonanceDurationMs | 120000 |
| BALANCE.channeling.deepReservoirThreshold | 225 |
| BALANCE.channeling.deepReservoirCapacityBonus | 25 |

## Mana pillars

| Pillar ID | Name | Effect | Effect label | Value per level | Max level | Fragment requirements | Level costs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| leyline-conduit | Leyline Conduit | flat-regen | PASSIVE MANA REGEN | 1 | 10 | water-fragment, air-fragment | {<br>  "1": {<br>    "fragment": 5,<br>    "lifeEssence": 10<br>  },<br>  "2": {<br>    "fragment": 10,<br>    "lifeEssence": 20<br>  },<br>  "3": {<br>    "fragment": 15,<br>    "lifeEssence": 30<br>  },<br>  "4": {<br>    "fragment": 25,<br>    "lifeEssence": 50<br>  },<br>  "5": {<br>    "fragment": 40,<br>    "lifeEssence": 80<br>  },<br>  "6": {<br>    "fragment": 60,<br>    "lifeEssence": 120<br>  },<br>  "7": {<br>    "fragment": 90,<br>    "lifeEssence": 180<br>  },<br>  "8": {<br>    "fragment": 130,<br>    "lifeEssence": 260<br>  },<br>  "9": {<br>    "fragment": 180,<br>    "lifeEssence": 360<br>  },<br>  "10": {<br>    "fragment": 250,<br>    "lifeEssence": 500<br>  }<br>} |
| arcane-reservoir | Arcane Reservoir | flat-capacity | MAX MANA | 25 | 10 | earth-fragment, water-fragment | {<br>  "1": {<br>    "fragment": 5,<br>    "lifeEssence": 10<br>  },<br>  "2": {<br>    "fragment": 10,<br>    "lifeEssence": 20<br>  },<br>  "3": {<br>    "fragment": 15,<br>    "lifeEssence": 30<br>  },<br>  "4": {<br>    "fragment": 25,<br>    "lifeEssence": 50<br>  },<br>  "5": {<br>    "fragment": 40,<br>    "lifeEssence": 80<br>  },<br>  "6": {<br>    "fragment": 60,<br>    "lifeEssence": 120<br>  },<br>  "7": {<br>    "fragment": 90,<br>    "lifeEssence": 180<br>  },<br>  "8": {<br>    "fragment": 130,<br>    "lifeEssence": 260<br>  },<br>  "9": {<br>    "fragment": 180,<br>    "lifeEssence": 360<br>  },<br>  "10": {<br>    "fragment": 250,<br>    "lifeEssence": 500<br>  }<br>} |
| mana-resonance | Mana Resonance | passive-regen-percent | PASSIVE MANA AMPLIFICATION | 5 | 10 | fire-fragment, air-fragment | {<br>  "1": {<br>    "fragment": 5,<br>    "lifeEssence": 10<br>  },<br>  "2": {<br>    "fragment": 10,<br>    "lifeEssence": 20<br>  },<br>  "3": {<br>    "fragment": 15,<br>    "lifeEssence": 30<br>  },<br>  "4": {<br>    "fragment": 25,<br>    "lifeEssence": 50<br>  },<br>  "5": {<br>    "fragment": 40,<br>    "lifeEssence": 80<br>  },<br>  "6": {<br>    "fragment": 60,<br>    "lifeEssence": 120<br>  },<br>  "7": {<br>    "fragment": 90,<br>    "lifeEssence": 180<br>  },<br>  "8": {<br>    "fragment": 130,<br>    "lifeEssence": 260<br>  },<br>  "9": {<br>    "fragment": 180,<br>    "lifeEssence": 360<br>  },<br>  "10": {<br>    "fragment": 250,<br>    "lifeEssence": 500<br>  }<br>} |
| astral-expansion | Astral Expansion | capacity-percent | MAX MANA AMPLIFICATION | 5 | 10 | earth-fragment, fire-fragment | {<br>  "1": {<br>    "fragment": 5,<br>    "lifeEssence": 10<br>  },<br>  "2": {<br>    "fragment": 10,<br>    "lifeEssence": 20<br>  },<br>  "3": {<br>    "fragment": 15,<br>    "lifeEssence": 30<br>  },<br>  "4": {<br>    "fragment": 25,<br>    "lifeEssence": 50<br>  },<br>  "5": {<br>    "fragment": 40,<br>    "lifeEssence": 80<br>  },<br>  "6": {<br>    "fragment": 60,<br>    "lifeEssence": 120<br>  },<br>  "7": {<br>    "fragment": 90,<br>    "lifeEssence": 180<br>  },<br>  "8": {<br>    "fragment": 130,<br>    "lifeEssence": 260<br>  },<br>  "9": {<br>    "fragment": 180,<br>    "lifeEssence": 360<br>  },<br>  "10": {<br>    "fragment": 250,<br>    "lifeEssence": 500<br>  }<br>} |
| echo-attunement | Echo Attunement | echo-percent | ECHO MANA | 5 | 10 | fire-fragment, water-fragment, earth-fragment, air-fragment | {<br>  "1": {<br>    "fragment": 5,<br>    "lifeEssence": 10<br>  },<br>  "2": {<br>    "fragment": 10,<br>    "lifeEssence": 20<br>  },<br>  "3": {<br>    "fragment": 15,<br>    "lifeEssence": 30<br>  },<br>  "4": {<br>    "fragment": 25,<br>    "lifeEssence": 50<br>  },<br>  "5": {<br>    "fragment": 40,<br>    "lifeEssence": 80<br>  },<br>  "6": {<br>    "fragment": 60,<br>    "lifeEssence": 120<br>  },<br>  "7": {<br>    "fragment": 90,<br>    "lifeEssence": 180<br>  },<br>  "8": {<br>    "fragment": 130,<br>    "lifeEssence": 260<br>  },<br>  "9": {<br>    "fragment": 180,<br>    "lifeEssence": 360<br>  },<br>  "10": {<br>    "fragment": 250,<br>    "lifeEssence": 500<br>  }<br>} |

## Discoveries

| Discovery ID | Name | Condition | Reward |
| --- | --- | --- | --- |
| stable-leyline | Stable Leyline | Generate 2,500 Mana through Channeling. | +1 Natural Mana Regeneration / second. |
| echo-resonance | Echo Resonance | Maintain 5 Arcane Echoes simultaneously for 120 seconds. | Arcane Echo Mana generation +10%. |
| deep-reservoir | Deep Reservoir | Reach 225 Maximum Mana. | +25 Max Mana. |
