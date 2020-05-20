import { isObject, isFunction } from 'lodash';
import { HarmoniousType, HarmoniousTypePlugin } from 'harmonious-type';
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import postcss from 'postcss';
import postcssJs from 'postcss-js';

describe('harmonious-type', () => {
  it('should return an object with all documented members', () => {
    let actual = new HarmoniousType();
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
  let json = new HarmoniousType({
    breakpoints: {
      600: {
        baseFontSize: 18,
        scaleRatio: 2,
      },
      1000: {
        baseFontSize: 22,
        scaleRatio: 2.5,
        baseLineHeight: 1.8,
      },
      1600: {
        baseFontSize: 22,
        scaleRatio: 2.5,
        baseLineHeight: 1.8,
      },
    },
  }).toJSON();
  it('should return CSS as JSON', async () => {
    expect(isObject(json)).toBeTruthy();
    expect(json.html).toBeTruthy();

    // TODO: Use snapshot tests after stable is released
    // expect(json).toMatchSnapshot();

    // We want the JSON to resolve to valid CSS-in-JS syntax, parsable by
    // PostCSS. We may want to consider using PostCSS in the tool directly
    // though that might be unecessary.
    let { css } = await postcss().process(json, {
      parser: postcssJs,
      from: undefined,
    });
    expect(typeof css).toBe('string');

    // Write a file we can manually inspect if we have any funky issues
    // This should also catch basic syntax errors
    expect(async () => {
      fs.writeFile(
        path.resolve(__dirname, './test-output.json'),
        prettier.format(JSON.stringify(json), { parser: 'json' }),
        () => void null
      );
    }).not.toThrow();
  });
  it('should sort media queries from smallest to largest', () => {
    let mediaQueryKeys = Object.keys(json)
      .filter((k) => k.startsWith('@'))
      .map((k) => parseInt((k.match(/\d+/g) && k.match(/\d+/g)![0]) || '', 10));
    expect(mediaQueryKeys).toEqual([600, 1000, 1600]);
  });
});

describe('HarmoniousType.toString', () => {
  it('should return CSS as a string', () => {
    let string = new HarmoniousType({
      breakpoints: {
        600: {
          baseFontSize: 18,
          scaleRatio: 2,
        },
        1000: {
          baseFontSize: 22,
          scaleRatio: 2.5,
          baseLineHeight: 1.8,
        },
      },
    }).toString();
    expect(typeof string).toEqual('string');

    // TODO: Use snapshot tests after stable is released
    // expect(string).toMatchSnapshot();

    // Write a file we can manually inspect if we have any funky issues
    // This should also catch basic syntax errors
    expect(() => {
      fs.writeFile(
        path.resolve(__dirname, './test-output.css'),
        prettier.format(string, { parser: 'css' }),
        () => void null
      );
    }).not.toThrow();
  });
});

describe('HarmoniousType plugins', () => {
  it('should be able to override styles', () => {
    let plugin: HarmoniousTypePlugin = {
      setStyles(rhythms, config, prevStyles) {
        return {
          ...prevStyles,
          html: {
            fontSize: '50px',
          },
        };
      },
    };
    let json = new HarmoniousType({
      plugins: [plugin],
    }).toJSON();
    expect(json.html.fontSize).toBe('50px');
  });
  it('should be able to override config', () => {
    let plugin: HarmoniousTypePlugin = {
      setConfig(prevConfig) {
        return {
          ...prevConfig,
          breakpoints: {
            ...prevConfig.breakpoints,
            [0]: {
              ...prevConfig.breakpoints[0],
              baseFontSize: 50,
            },
          },
        };
      },
    };
    expect(
      new HarmoniousType({
        baseFontSize: 20,
        plugins: [plugin],
      }).baseFontSize
    ).toBe(50);
  });
});
