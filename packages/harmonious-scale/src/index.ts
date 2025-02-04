// Not sure if we'll keep this utility since it's pretty much identical to the
// original, but I did fix an incorrect ratio value that has had an open PR for
// quite a while so 🤷‍♂️
// https://github.com/KyleAMathews/modularscale/pull/4

import isNumber from 'lodash/isNumber';

export const ratios = {
  'augmented fourth': Math.sqrt(2),
  'double octave': 4,
  golden: 1.61803398875,
  'major eleventh': 8 / 3,
  'major second': 9 / 8,
  'major seventh': 15 / 8,
  'major sixth': 5 / 3,
  'major tenth': 5 / 2,
  'major third': 5 / 4,
  'major twelfth': 3,
  'minor second': 16 / 15,
  'minor seventh': 16 / 9,
  'minor sixth': 8 / 5,
  'minor third': 6 / 5,
  octave: 2,
  'perfect fifth': 3 / 2,
  'perfect fourth': 4 / 3,
  phi: 1.61803398875,
};

export function harmoniousScale(
  value = 0,
  ratio: number | keyof Ratios = 'golden'
) {
  let r: number;
  if (isNumber(ratio)) {
    r = ratio;
  } else if (ratios[ratio]) {
    r = ratios[ratio];
  } else {
    if (__DEV__) {
      console.warn('Invalid ratio provided to `harmoniousScale`.')
    }
    r = ratios.golden;
  }
  return Math.pow(r, value);
}

export default harmoniousScale;

export type Ratios = typeof ratios;
