/*
 * Accessible ambient sound selector.
 */

import { useEffect, useState } from 'react';
import { noiseGenerator } from './utils/noiseUtils';

function applyNoise(noiseType, volume) {
  if (noiseType === 'none') return noiseGenerator.stop();
  noiseGenerator.play(noiseType);
  noiseGenerator.setVolume(volume);
}

function stopNoise() {
  noiseGenerator.stop();
}

const options = [
  { value: 'none', label: 'None' },
  { value: 'pink', label: 'Pink Noise' },
  { value: 'brown', label: 'Brown Noise' },
  { value: 'white', label: 'White Noise' },
];

export function SoundSelector() {
  const volume = 0.5;
  const [noiseType, setNoiseType] = useState('none');

  useEffect(() => {
    applyNoise(noiseType, volume);
    return stopNoise;
  }, [noiseType, volume]);

  return (
    <select value={noiseType} onChange={(event) => setNoiseType(event.target.value)} aria-label="Ambient sound selector">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}
