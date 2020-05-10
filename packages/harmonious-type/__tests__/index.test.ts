import { isObject, isFunction } from 'lodash';
import { HarmoniousType } from '../src';

describe('harmonious-type', () => {
  it('should return an object with all documented members', () => {
    let actual = new HarmoniousType();
    expect(isObject(actual.config)).toBeTruthy();
    expect(isFunction(actual.rhythm)).toBeTruthy();
    expect(isFunction(actual.establishBaseline)).toBeTruthy();
    expect(isFunction(actual.linesForFontSize)).toBeTruthy();
    expect(isFunction(actual.adjustFontSizeTo)).toBeTruthy();
    expect(isFunction(actual.scale)).toBeTruthy();
    expect(isFunction(actual.toJSON)).toBeTruthy();
    expect(isFunction(actual.toString)).toBeTruthy();
  });
});

describe('HarmoniousType.rhythm', () => {
  it('should provide a valid rhythm unit', () => {
    let rhythm = new HarmoniousType().rhythm();
    expect(rhythm).toEqual('1.5rem');
  });

  it('should accept custom scales', () => {
    let { fontSize, lineHeight } = new HarmoniousType({
      scaleRatio: 2,
    }).scale(1.333);
    expect(fontSize).toEqual('2.51926rem');
    expect(lineHeight).toEqual(3);
  });
});

describe('HarmoniousType.scale', () => {
  it('should scale', () => {
    let { fontSize, lineHeight } = new HarmoniousType().scale();
    expect(fontSize).toEqual('1rem');
    expect(lineHeight).toEqual(1.5);
  });

  it('should accept custom scales', () => {
    let { fontSize, lineHeight } = new HarmoniousType({
      scaleRatio: 2,
    }).scale(1.333);
    expect(fontSize).toEqual('2.51926rem');
    expect(lineHeight).toEqual(3);
  });
});

describe('HarmoniousType.toJSON', () => {
  it('should return CSS as JSON', () => {
    let json = new HarmoniousType().toJSON();
    expect(isObject(json)).toBeTruthy();
    expect(json.html).toBeTruthy();
    // TODO: Use snapshot tests after stable is released
    // expect(json).toMatchSnapshot();
  });
});

describe('HarmoniousType.toString', () => {
  it('should return CSS as a string', () => {
    let string = new HarmoniousType().toString();
    expect(typeof string).toEqual('string');
    // TODO: Use snapshot tests after stable is released
    // expect(string).toMatchSnapshot();
  });
});
