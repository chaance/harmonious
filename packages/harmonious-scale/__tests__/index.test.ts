import { harmoniousScale, ratios } from '../src';

describe('harmonious-scale', () => {
  it('should exist', () => {
    expect(harmoniousScale).toBeDefined();
  });

  it('should default to the golden ratio', () => {
    expect(harmoniousScale(2)).toEqual(Math.pow(ratios.golden, 2));
  });

  it('should produce the corrent ratio values', () => {
    expect(harmoniousScale(1, 'golden')).toEqual(1.61803398875);
    expect(harmoniousScale(2, 'golden')).toEqual(2.618033988750235);
  });

  it('should use a musical ratio', () => {
    expect(harmoniousScale(1, 'minor second')).toEqual(Math.pow(16 / 15, 1));
    expect(harmoniousScale(2, 'minor second')).toEqual(Math.pow(16 / 15, 2));
    expect(harmoniousScale(1, 'minor seventh')).toEqual(Math.pow(16 / 9, 1));
    expect(harmoniousScale(2, 'minor seventh')).toEqual(Math.pow(16 / 9, 2));
  });

  it('should ignore invalid ratios and use the golden ratio', () => {
    let _warn = console.warn;
    console.warn = () => void null;
    expect(harmoniousScale(2, 'what' as any)).toEqual(Math.pow(ratios.golden, 2));
    console.warn = _warn;
  });
});
