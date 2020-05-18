import { parseUnit, unit } from 'harmonious-utils';
import { HarmoniousRhythm } from 'harmonious-rhythm';

describe('rhythm', () => {
  it('should use rem as the default rhythm unit', () => {
    let { rhythm } = new HarmoniousRhythm();
    expect(unit(rhythm())).toEqual('rem');
  });

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
    let { fontSize, lineHeight } = establishBaseline();
    expect(fontSize).toBeDefined();
    expect(lineHeight).toBeDefined();
  });

  it('should return fontSize with percent as its unit', () => {
    let { fontSize } = establishBaseline();
    expect(parseUnit(fontSize)[1]).toEqual('%');
  });

  it('should return unitless lineHeight as a number', () => {
    let { lineHeight } = establishBaseline();
    expect(typeof lineHeight).toBe('number');
  });

  it('should return lineHeight with units if specified', () => {
    let { establishBaseline } = new HarmoniousRhythm({
      baseLineHeight: '24px' as any,
      baseFontSize: 20,
    });
    let { lineHeight } = establishBaseline();
    expect(lineHeight).toEqual(1.2); // baseLineHeight / baseFontSize
  });

  it('should return sensible results', () => {
    let { fontSize, lineHeight } = establishBaseline();
    expect(fontSize).toEqual('150%');
    expect(lineHeight).toEqual(1.25);
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

describe('getLineHeightFromValue', () => {
  let { getLineHeightFromValue } = new HarmoniousRhythm({
    baseFontSize: 18,
    baseLineHeight: 1.5,
  });

  it('should return the line-height equivalent of a given value', () => {
    expect(getLineHeightFromValue('1rem')).toEqual(1);
    expect(getLineHeightFromValue('1em')).toEqual(1);
    expect(getLineHeightFromValue('20px')).toEqual(10 / 9);
  });
});

describe('rhythmicLineHeight', () => {
  let {
    rhythm,
    getLineHeightFromValue,
    rhythmicLineHeight,
  } = new HarmoniousRhythm({
    baseFontSize: '21px',
    baseLineHeight: 4 / 3,
    rhythmUnit: 'rem',
  });

  it('should return the same as a manual calculation', () => {
    expect(rhythmicLineHeight(2)).toEqual(getLineHeightFromValue(rhythm(2)));
  });
});

describe('adjustFontSizeTo', () => {
  let { adjustFontSizeTo, rhythmicLineHeight } = new HarmoniousRhythm({
    baseFontSize: '21px',
    baseLineHeight: 4 / 3,
    rhythmUnit: 'rem',
  });

  it('should return an object', () => {
    expect(adjustFontSizeTo('16px')).toBeInstanceOf(Object);
  });

  it('should return an object with a fontSize and lineHeight defined', () => {
    let { fontSize, lineHeight } = adjustFontSizeTo('16px');
    expect(fontSize).toBeDefined();
    expect(lineHeight).toBeDefined();
  });

  it('should accept px', () => {
    let { fontSize, lineHeight } = adjustFontSizeTo('63px');
    expect(fontSize).toEqual('3rem');
    expect(lineHeight).toBeDefined();
  });

  it('should accept rem', () => {
    let { fontSize, lineHeight } = adjustFontSizeTo('3rem');
    expect(fontSize).toEqual('3rem');
    expect(lineHeight).toBeDefined();
  });

  it('should accept em', () => {
    let { fontSize, lineHeight } = adjustFontSizeTo('3em');
    expect(fontSize).toEqual('3rem');
    expect(lineHeight).toBeDefined();
  });

  it('should accept %', () => {
    let { fontSize, lineHeight } = adjustFontSizeTo('200%');
    expect(fontSize).toEqual('2rem');
    expect(lineHeight).toBeDefined();
  });

  it('should let you set explicit # of lines', () => {
    let { fontSize, lineHeight } = adjustFontSizeTo('3em', 3);
    expect(fontSize).toEqual('3rem');
    expect(lineHeight).toEqual(rhythmicLineHeight(3));

    //  Weird that Compass let's you set lineHeight to be smaller than
    //  fontSize. Guess there's potential use cases for this.
    ({ fontSize, lineHeight } = adjustFontSizeTo('3em', 2));
    expect(fontSize).toEqual('3rem');
    expect(lineHeight).toEqual(rhythmicLineHeight(2));
  });

  it('should return values in whatever the set rhythmUnit is', () => {
    let { adjustFontSizeTo } = new HarmoniousRhythm({
      baseFontSize: '21px',
      baseLineHeight: 4 / 3,
      rhythmUnit: 'em',
    });
    let { fontSize, lineHeight } = adjustFontSizeTo('3em', 3);
    expect(fontSize).toEqual('3em');
    expect(lineHeight).toBeDefined();
  });

  it('should work with em and fromSize', () => {
    let { adjustFontSizeTo } = new HarmoniousRhythm({
      baseFontSize: '21px',
      baseLineHeight: 4 / 3,
      rhythmUnit: 'em',
    });
    let { fontSize, lineHeight } = adjustFontSizeTo('42px', 3, '10.5px');
    expect(fontSize).toEqual('4em');
    expect(lineHeight).toEqual(8);
  });
});
