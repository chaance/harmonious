import { unitLess, unit, parseUnit, getCSSLengthConverter } from '../src/index';

describe('getCSSLengthConverter', () => {
  it('should pass', () => {
    // TODO:
    expect(true).toEqual(true);
  });
});

describe('parseUnit', () => {
  it('should return a valid value and unit pair', () => {
    expect(parseUnit('65px')).toEqual([65, 'px']);
    expect(parseUnit(' 65%')).toEqual([65, '%']);
    expect(parseUnit('+65rem')).toEqual([65, 'rem']);
    expect(parseUnit('-65 em ')).toEqual([-65, 'em']);
    expect(parseUnit('+65.5 px ')).toEqual([65.5, 'px']);
  });
});

describe('unitLess', () => {
  it('should return a numeric float value', () => {
    expect(unitLess('65px')).toEqual(65);
    expect(unitLess(' 65%')).toEqual(65);
    expect(unitLess('+65rem')).toEqual(65);
    expect(unitLess('-65 em ')).toEqual(-65);
    expect(unitLess('+65.5 px ')).toEqual(65.5);
  });
});

describe('unit', () => {
  it('should return a valid unit', () => {
    expect(unit('1rem')).toEqual('rem');
    expect(unit('1 em')).toEqual('em');
    expect(unit('+50 px')).toEqual('px');
    expect(unit('-25%')).toEqual('%');
  });
  it('should return an empty string if no valid unit is found', () => {
    expect(unit('10lmafo')).toEqual('');
    expect(unit(50)).toEqual('');
  });
});
