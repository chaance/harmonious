import { parseUnit } from 'harmonious-utils';
import { HarmoniousRhythm } from '../src';

describe('rhythm', () => {
  it('should calculate rhythm for rem', () => {
    let { rhythm } = new HarmoniousRhythm({
      baseFontSize: '21px',
      baseLineHeight: 4 / 3,
      rhythmUnit: 'rem',
    });
    expect(rhythm(1)).toEqual('1.33333rem');
    expect(rhythm(0.5)).toEqual('0.66667rem');
    expect(rhythm(0.25)).toEqual('0.33333rem');
  });

  it('should calculate rhythm for em', () => {
    let { rhythm } = new HarmoniousRhythm({
      baseFontSize: '24px',
      baseLineHeight: 1.25,
      rhythmUnit: 'em',
    });
    expect(rhythm(1)).toEqual('1.25em');
    expect(rhythm(0.5)).toEqual('0.625em');
    expect(rhythm(0.25)).toEqual('0.3125em');
  });

  it('should calculate rhythm for px', () => {
    let { rhythm } = new HarmoniousRhythm({
      baseFontSize: '24px',
      baseLineHeight: 1.25,
      rhythmUnit: 'px',
    });
    expect(rhythm(1)).toEqual('30px');
    expect(rhythm(0.5)).toEqual('15px');
    expect(rhythm(0.25)).toEqual('7px');
  });

  it('should calculate rhythm if lineHeight is set in px', () => {
    let { rhythm } = new HarmoniousRhythm({
      baseFontSize: '24px',
      baseLineHeight: '30px' as any,
      rhythmUnit: 'px',
    });
    expect(rhythm(1)).toEqual('30px');
    expect(rhythm(0.5)).toEqual('15px');
    expect(rhythm(0.25)).toEqual('7px');
  });
});

describe('establishBaseline', () => {
  let { establishBaseline } = new HarmoniousRhythm({
    baseFontSize: '24px',
    baseLineHeight: 1.25,
    rhythmUnit: 'rem',
  });

  it('should return an object', () => {
    expect(establishBaseline()).toBeInstanceOf(Object);
  });
  it('should return an object with a fontSize and lineHeight defined', () => {
    let result = establishBaseline();
    expect(result.fontSize).toBeDefined();
    expect(result.lineHeight).toBeDefined();
  });

  it('should return fontSize with percent as its unit', () => {
    let result = establishBaseline();
    expect(parseUnit(result.fontSize)[1]).toEqual('%');
  });

  it('should return unitless lineHeight', () => {
    let result = establishBaseline();
    expect(parseUnit(result.lineHeight)[1]).toEqual('');
  });

  it('should return lineHeight with units if specified', () => {
    let { establishBaseline } = new HarmoniousRhythm({
      baseLineHeight: '24px' as any,
      baseFontSize: 20,
    });
    let result = establishBaseline();
    expect(parseFloat(result.lineHeight)).toEqual(1.2); // baseLineHeight / baseFontSize
  });

  it('should return sensible results', () => {
    let { fontSize, lineHeight } = establishBaseline();
    expect(fontSize).toEqual('150%');
    expect(lineHeight).toEqual('1.25');
  });
});

describe('linesForFontSize', () => {
  let { linesForFontSize } = new HarmoniousRhythm({
    baseFontSize: '21px',
    baseLineHeight: 4 / 3,
    rhythmUnit: 'rem',
  });

  it('should return a result', () => {
    expect(linesForFontSize('16px')).toBeDefined();
  });

  it('should return line value of larger than 1 if font size is larger than baseLineHeight', () => {
    expect(linesForFontSize('29px') > 1).toBe(true);
  });

  it('should return line value of 1 if font size is less than baseLineHeight', () => {
    expect(linesForFontSize('20px')).toEqual(1);
  });

  it('should return add extra lines if space taken up by font too close to edges of line (as determined by minLinePadding)', () => {
    expect(linesForFontSize('26px')).toEqual(1.5);
    expect(linesForFontSize('24px')).toEqual(1);

    // Test when minLinePadding is set to 0.
    let vrREM = new HarmoniousRhythm({
      baseFontSize: '21px',
      baseLineHeight: 4 / 3,
      rhythmUnit: 'rem',
      minLinePadding: '0px',
    });

    linesForFontSize = vrREM.linesForFontSize;
    expect(linesForFontSize('26px')).toEqual(1);
  });
});

describe('adjustFontSizeTo', () => {
  let { adjustFontSizeTo, rhythm } = new HarmoniousRhythm({
    baseFontSize: '21px',
    baseLineHeight: 4 / 3,
    rhythmUnit: 'rem',
  });

  it('should return an object', () => {
    expect(adjustFontSizeTo('16px')).toBeInstanceOf(Object);
  });

  it('should return an object with a fontSize and lineHeight defined', () => {
    let result = adjustFontSizeTo('16px');
    expect(result.fontSize).toBeDefined();
    expect(result.lineHeight).toBeDefined();
  });

  it('should accept px', () => {
    let result = adjustFontSizeTo('63px');
    expect(result.fontSize).toEqual('3rem');
    expect(result.lineHeight).toBeDefined();
  });

  it('should accept rem', () => {
    let result = adjustFontSizeTo('3rem');
    expect(result.fontSize).toEqual('3rem');
    expect(result.lineHeight).toBeDefined();
  });

  it('should accept em', () => {
    let result = adjustFontSizeTo('3em');
    expect(result.fontSize).toEqual('3rem');
    expect(result.lineHeight).toBeDefined();
  });

  it('should accept %', () => {
    let result = adjustFontSizeTo('200%');
    expect(result.fontSize).toEqual('2rem');
    expect(result.lineHeight).toBeDefined();
  });

  it('should let you set explicit # of lines', () => {
    let result = adjustFontSizeTo('3em', 3);
    expect(result.fontSize).toEqual('3rem');
    expect(result.lineHeight).toEqual(rhythm(3));

    //  Weird that Compass let's you set lineHeight to be smaller than
    //  fontSize. Guess there's potential use cases for this.
    result = adjustFontSizeTo('3em', 2);
    expect(result.fontSize).toEqual('3rem');
    expect(result.lineHeight).toEqual(rhythm(2));
  });

  it('should return values in whatever the set rhythmUnit is', () => {
    let { adjustFontSizeTo } = new HarmoniousRhythm({
      baseFontSize: '21px',
      baseLineHeight: 4 / 3,
      rhythmUnit: 'em',
    });

    let result = adjustFontSizeTo('3em', 3);
    expect(result.fontSize).toEqual('3em');
    expect(result.lineHeight).toBeDefined();
  });

  it('should work with em and fromSize', () => {
    let { adjustFontSizeTo } = new HarmoniousRhythm({
      baseFontSize: '21px',
      baseLineHeight: 4 / 3,
      rhythmUnit: 'em',
    });

    let result = adjustFontSizeTo('42px', 3, '10.5px');
    expect(result.fontSize).toEqual('4em');
    expect(result.lineHeight).toEqual('8em');
  });
});
