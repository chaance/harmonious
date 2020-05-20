import {
  HarmoniousRhythm,
  HarmoniousRhythmOptions,
  defaultConfig as defaultRhythmConfig,
} from 'harmonious-rhythm';
import { ratios } from 'harmonious-scale';
import { isNumber, isObject, isString, kebabCase, pick } from 'lodash';
import * as CSS from 'csstype';
import {
  CSSUnitConverter,
  getDefiniteNumberWithFallback,
  unit,
} from 'harmonious-utils';

const rhythmConfigKeys = Object.keys(defaultRhythmConfig);

const defaultConfig = {
  title: 'harmonious-type-default',
  baseFontSize: defaultRhythmConfig.baseFontSize,
  baseLineHeight: defaultRhythmConfig.baseLineHeight,
  headerLineHeight: 1.1,
  rhythmUnit: defaultRhythmConfig.rhythmUnit,
  scaleRatio: ratios.golden,
  blockMarginBottom: 1,
  breakpoints: {} as Record<
    string | number,
    Omit<HarmoniousTypeOptions, 'breakpoints'>
  >,
  breakpointUnit: 'px' as const,
};

export class HarmoniousType {
  /**
   * The configuration object for the HarmoniousType instance.
   *
   * @type {HarmoniousTypeConfig}
   * @memberof HarmoniousType
   */
  private readonly config: HarmoniousTypeConfig;

  /**
   * Unit conversion method based on the base font size.
   *
   * @type {CSSUnitConverter}
   * @memberof HarmoniousType
   */
  public readonly convert: CSSUnitConverter;

  /**
   * Base font size
   * @type {number}
   * @memberof HarmoniousType
   */
  public readonly baseFontSize: number;

  /**
   * The breakpoints defined as an ascending array
   *
   * @type {[0, ...number[]]}
   * @memberof HarmoniousType
   */
  public readonly breakpoints: [0, ...number[]];

  public readonly rhythm: (
    lines?: number,
    fontSize?: string | number | undefined,
    offset?: number | undefined
  ) => string;

  public readonly rhythmicLineHeight: (
    lines?: number,
    fontSize?: string | number | undefined,
    offset?: number | undefined
  ) => number;

  public readonly establishBaseline: () => {
    fontSize: string;
    lineHeight: number;
  };

  public readonly linesForFontSize: (fontSize: string | number) => number;

  public readonly adjustFontSizeTo: FontSizeAdjustmentFunction;

  public readonly getLineHeightFromValue: (value: string | number) => number;

  public readonly rhythms: {
    0: HarmoniousRhythm;
    [key: number]: HarmoniousRhythm;
  };

  public readonly scale: (
    value?: number
  ) => {
    fontSize: string | number;
    lineHeight: number;
  };

  public constructor(opts?: HarmoniousTypeOptions) {
    this.config = getConfig(opts);

    const breakpoints: [0, ...number[]] = Object.keys(this.config.breakpoints)
      .map((i) => parseInt(i, 10))
      .filter((num) => !isNaN(num))
      .sort() as any;

    this.rhythms = breakpoints.reduce((prev, cur) => {
      return {
        ...prev,
        [cur]: new HarmoniousRhythm(
          pick(this.config.breakpoints[cur], rhythmConfigKeys)
        ),
      };
    }, {}) as any;

    const baseRhythm = this.rhythms[0];

    this.breakpoints = breakpoints;
    this.baseFontSize = baseRhythm.baseFontSize;
    this.convert = baseRhythm.convert;
    this.rhythm = baseRhythm.rhythm;
    this.scale = baseRhythm.scale;
    this.rhythmicLineHeight = baseRhythm.rhythmicLineHeight;
    this.establishBaseline = baseRhythm.establishBaseline;
    this.linesForFontSize = baseRhythm.linesForFontSize;
    this.adjustFontSizeTo = baseRhythm.adjustFontSizeTo;
    this.getLineHeightFromValue = baseRhythm.getLineHeightFromValue;
  }

  public toJSON() {
    let styles: HarmoniousStyles = {};
    let { config, rhythms } = this;
    let { rhythmUnit } = config;
    let setStyles = getStylesSetter(config, rhythms);

    // Base HTML styles.
    styles = setStyles(
      styles,
      'html',
      {
        boxSizing: 'border-box',
        overflowY: 'scroll',
      },
      ({ fontSize, lineHeight }) => ({
        fontSize,
        lineHeight,
      })
    );

    // box-sizing reset.
    styles = setStyles(styles, ['*', '*:before', '*:after'], {
      boxSizing: 'inherit',
    });

    let bodyFontFeatureSettings = '"kern", "liga", "clig", "calt"';

    // Base body styles.
    styles = setStyles(styles, 'body', {
      wordWrap: 'break-word',
      fontKerning: 'normal',
      MozFontFeatureSettings: bodyFontFeatureSettings,
      ['msFontFeatureSettings' as any]: bodyFontFeatureSettings,
      WebkitFontFeatureSettings: bodyFontFeatureSettings,
      fontFeatureSettings: bodyFontFeatureSettings,
    });

    // Make images responsive.
    styles = setStyles(styles, 'img', {
      maxWidth: '100%',
    });

    styles = setStyles(
      styles,
      [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hgroup',
        'ul',
        'ol',
        'dl',
        'dd',
        'p',
        'figure',
        'pre',
        'table',
        'fieldset',
        'blockquote',
        'form',
        'noscript',
        'iframe',
        'img',
        'hr',
        'address',
      ],
      {
        // Reset margin/padding to 0.
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
      },
      ({ blockMarginBottom }) => ({
        marginBottom: blockMarginBottom,
      })
    );

    // Basic blockquote styles.
    styles = setStyles(
      styles,
      'blockquote',
      null,
      ({ blockMarginBottom, rhythm }) => ({
        marginBottom: blockMarginBottom,
        marginRight: rhythm(1),
        marginLeft: rhythm(1),
      })
    );

    // hr.
    styles = setStyles(
      styles,
      'hr',
      {
        background: 'currentColor',
        border: 'none',
        height: '1px',
      },
      ({ blockMarginBottom }) => ({
        marginBottom: `calc(${blockMarginBottom} - 1px)`,
      })
    );

    // ol, ul.
    styles = setStyles(
      styles,
      ['ol', 'ul'],
      {
        listStylePosition: 'outside',
        listStyleImage: 'none',
      },
      ({ rhythm }) => ({
        marginLeft: rhythm(1),
      })
    );

    // li.
    styles = setStyles(styles, 'li', null, ({ blockMarginBottom }) => ({
      marginBottom: `calc(${blockMarginBottom} / 2)`,
    }));

    // Remove default padding on list items.
    styles = setStyles(styles, ['ol li', 'ul li'], {
      paddingLeft: 0,
    });

    // children ol, ul.
    styles = setStyles(
      styles,
      ['li > ol', 'li > ul'],
      null,
      ({ blockMarginBottom, rhythm }) => ({
        marginLeft: rhythm(1),
        marginBottom: `calc(${blockMarginBottom} / 2)`,
        marginTop: `calc(${blockMarginBottom} / 2)`,
      })
    );

    // Remove margin-bottom on the last-child of a few block elements
    // The worst offender of this seems to be markdown => html compilers
    // as they put paragraphs within LIs amoung other oddities.
    styles = setStyles(
      styles,
      ['blockquote *:last-child', 'li *:last-child', 'p *:last-child'],
      { marginBottom: 0 }
    );

    // Ensure li > p is 1/2 margin — this is another markdown => compiler oddity.
    styles = setStyles(styles, ['li > p'], null, ({ blockMarginBottom }) => ({
      marginBottom: `calc(${blockMarginBottom} / 2)`,
    }));

    // Make generally smaller elements, smaller.
    styles = setStyles(
      styles,
      ['code', 'kbd', 'pre', 'samp'],
      null,
      ({ convert, adjustFontSize }) => ({
        ...adjustFontSizeTo(convert, adjustFontSize, '85%', rhythmUnit),
      })
    );

    // Abbr, Acronym.
    styles = setStyles(styles, ['abbr', 'acronym'], {
      borderBottom: `1px dotted`,
      cursor: 'help',
    });
    styles['abbr[title]'] = {
      borderBottom: `1px dotted`,
      cursor: 'help',
      textDecoration: 'none',
    };

    // Table styles.
    styles = setStyles(
      styles,
      ['table'],
      {
        borderCollapse: 'collapse',
        width: '100%',
      },
      ({ convert, adjustFontSize, baseFontSize }) => ({
        ...adjustFontSizeTo(
          convert,
          adjustFontSize,
          baseFontSize + 'px',
          rhythmUnit
        ),
      })
    );
    styles = setStyles(styles, 'thead', {
      textAlign: 'left',
    });
    styles = setStyles(
      styles,
      ['td', 'th'],
      {
        textAlign: 'left',
        borderBottom: '1px solid',
        fontFeatureSettings: '"tnum"',
        MozFontFeatureSettings: '"tnum"',
        ['msFontFeatureSettings' as any]: '"tnum"',
        WebkitFontFeatureSettings: '"tnum"',
      },
      ({ rhythm }) => ({
        paddingLeft: rhythm(2 / 3),
        paddingRight: rhythm(2 / 3),
        paddingTop: rhythm(1 / 2),
        paddingBottom: `calc(${rhythm(1 / 2)} - 1px)`,
      })
    );
    styles = setStyles(styles, ['th:first-child', 'td:first-child'], {
      paddingLeft: 0,
    });
    styles = setStyles(styles, ['th:last-child', 'td:last-child'], {
      paddingRight: 0,
    });

    // Create styles for headers.
    styles = setStyles(
      styles,
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      { textRendering: 'optimizeLegibility' },
      ({ headerLineHeight }) => ({
        lineHeight: headerLineHeight,
      })
    );

    // Header scale ratios
    [
      // h1
      5 / 5,
      // h2
      3 / 5,
      // h3
      2 / 5,
      // h4
      0 / 5,
      // h5
      -1 / 5,
      // h6
      -1.5 / 5,
    ].forEach((ratio, i) => {
      let headerElement = `h${i + 1}`;

      styles = setStyles(styles, headerElement, null, ({ convert, scale }) => ({
        fontSize: convert(scale(ratio).fontSize, rhythmUnit),
      }));
    });

    if (Array.isArray(config.plugins)) {
      styles = config.plugins.reduce(
        (acc, plugin) => ({
          ...acc,
          ...(plugin.setStyles?.(rhythms, config, acc) || {}),
        }),
        styles
      );
    }

    const cascadified: typeof styles = {};

    Object.keys(styles)
      .sort((a, b) => {
        if (a.startsWith('@') && b.startsWith('@')) {
          // Sort queries from smallest to largest
          let queryValueA = parseInt(a.match(/\d+/g)?.[0] || '', 10);
          let queryValueB = parseInt(a.match(/\d+/g)?.[0] || '', 10);
          return queryValueA > queryValueB
            ? -1
            : queryValueA < queryValueB
            ? 1
            : 0;
        }
        if (a.startsWith('@')) {
          return 1;
        }
        if (b.startsWith('@')) {
          return -1;
        }
        return 0;
      })
      .forEach((key) => {
        cascadified[key] = styles[key];
      });

    return cascadified;
  }

  public toString() {
    return compileStyles(this.toJSON());
  }
}

export default HarmoniousType;

/**
 * Merge user options with our default to get a reliable config.
 * @param options
 */
function getConfig(
  options?: HarmoniousTypeOptions | undefined
): HarmoniousTypeConfig {
  let opts = {
    ...defaultConfig,
    ...(options || {}),
  };

  // Base config will be used for our zero breakpoint value
  let baseConfig = {
    baseFontSize: getDefiniteNumberWithFallback(
      opts.baseFontSize,
      defaultConfig.baseFontSize
    ),
    baseLineHeight: opts.baseLineHeight,
    headerLineHeight: opts.headerLineHeight,
    scaleRatio: opts.scaleRatio,
    blockMarginBottom: opts.blockMarginBottom,
  };

  // We want to search our breakpoints in descending order to find the largest
  // value that is less than the value being searched for
  let breakpointKeys = Object.keys(opts.breakpoints)
    .map((bp) => parseInt(bp, 10))
    .filter((num) => !isNaN(num))
    .sort((a, b) => b - a);

  let breakpoints: HarmoniousTypeConfig['breakpoints'] = breakpointKeys
    .sort()
    .reduce(
      (prev, cur) => {
        return {
          ...prev,
          [cur]: {
            baseFontSize: getDefiniteNumberWithFallback(
              findBreakpointMatch('baseFontSize', cur),
              defaultConfig.baseFontSize
            ),
            baseLineHeight: findBreakpointMatch('baseLineHeight', cur),
            headerLineHeight: findBreakpointMatch('headerLineHeight', cur),
            scaleRatio: findBreakpointMatch('scaleRatio', cur),
            blockMarginBottom: findBreakpointMatch('blockMarginBottom', cur),
          },
        };
      },
      { 0: baseConfig }
    );

  const cfg: HarmoniousTypeConfig = {
    ...pick(opts, ['title', 'rhythmUnit', 'breakpointUnit']),
    breakpoints,
    plugins: opts.plugins || [],
  };

  return cfg.plugins.reduce(
    (acc, plugin) => ({
      ...acc,
      ...(plugin.setConfig?.(acc) || {}),
    }),
    cfg
  );

  function findBreakpointMatch(property: any, breakpoint: number): any {
    let p = property as keyof BaseOptions; // 💩
    if (opts.breakpoints[breakpoint][p]) {
      return opts.breakpoints[breakpoint][p];
    }
    for (let bp of breakpointKeys) {
      if (opts.breakpoints[bp][p] && bp <= breakpoint) {
        return opts.breakpoints[bp][p];
      }
    }
    return opts[p];
  }
}

function getMediaQueryString(value: string | number) {
  return `@media screen and (min-width: ${
    unit(value) ? (value as string) : value + 'px'
  })`;
}

function getStylesSetter(
  config: HarmoniousTypeConfig,
  rhythms: {
    [key: number]: HarmoniousRhythm;
    0: HarmoniousRhythm;
  }
) {
  return function setStyles(
    styles: HarmoniousStyles,
    selectors: string | string[],
    baseRules: CSS.Properties | null,
    responsiveRules?: (sizes: {
      baseFontSize: number;
      fontSize: string;
      lineHeight: number;
      headerLineHeight: number;
      convert: CSSUnitConverter;
      blockMarginBottom: string;
      rhythm: RhythmFunction;
      adjustFontSize: FontSizeAdjustmentFunction;
      scale: ScaleFunction;
    }) => CSS.Properties
  ): HarmoniousStyles {
    let selector = Array.isArray(selectors) ? selectors.join(',') : selectors;

    return Object.keys(rhythms).reduce((output, breakpoint) => {
      let bp = parseInt(breakpoint, 10);
      let hm = rhythms[bp];
      let { fontSize, lineHeight } = hm.establishBaseline();
      let { convert, rhythm, baseFontSize, scale } = hm;
      let { blockMarginBottom: bmb, headerLineHeight } = config.breakpoints[bp];
      let blockMarginBottom = '';
      if (isNumber(bmb)) {
        blockMarginBottom = rhythm(bmb);
      } else if (unit(bmb)) {
        blockMarginBottom = bmb as any;
      } else {
        blockMarginBottom = rhythm(1);
      }

      hm.adjustFontSizeTo;

      let scaledRules = responsiveRules
        ? responsiveRules({
            baseFontSize,
            blockMarginBottom,
            convert,
            fontSize,
            headerLineHeight,
            lineHeight,
            rhythm,
            adjustFontSize: hm.adjustFontSizeTo,
            scale,
          })
        : {};

      if (bp == 0) {
        let rules = {
          ...((output as any)[selector] || {}),
          ...(baseRules || {}),
          ...scaledRules,
        };
        return Object.keys(rules).length
          ? {
              ...output,
              [selector]: {
                ...((output as any)[selector] || {}),
                ...(baseRules || {}),
                ...scaledRules,
              },
            }
          : output;
      }

      let querySelector = getMediaQueryString(breakpoint);
      let selectorRules = {
        ...((output as any)[querySelector]?.[selector] || {}),
        ...scaledRules,
      };
      let selectorStyles = Object.keys(selectorRules).length
        ? { [selector]: selectorRules }
        : {};
      let queryStyles = {
        ...((output as any)[querySelector] || {}),
        ...selectorStyles,
      };
      return Object.keys(queryStyles).length
        ? { ...output, [querySelector]: queryStyles }
        : output;
    }, styles);
  };
}

function compileStyles(styles: HarmoniousStyles) {
  return Object.entries(styles).reduce((stylesStr, [selector, ruleSet]) => {
    stylesStr += `${selector}{`;
    Object.entries(ruleSet).forEach(([property, value]) => {
      if (isObject(value)) {
        const newObject: any = {};
        newObject[property] = value;
        stylesStr += compileStyles(newObject);
      } else {
        let newStyle = `${kebabCase(property)}:${value};`;
        // If the property is prefixed, add an additional dash at the beginning.
        ['Webkit', 'ms', 'Moz', 'O'].forEach((prefix) => {
          if (property.startsWith(prefix)) {
            newStyle = `-${newStyle}`;
          }
        });
        stylesStr += newStyle;
      }
    });
    stylesStr += '}';
    return stylesStr;
  }, '');
}

// Shortcut for adjusting style object to reflect new font size on adjustments
function adjustFontSizeTo(
  convert: CSSUnitConverter,
  adjust: FontSizeAdjustmentFunction,
  toValue: string,
  rhythmUnit: 'px' | 'em' | 'rem'
) {
  return Object.entries(adjust(toValue)).reduce<CSS.Properties>(
    (acc, [prop, value]) => {
      return {
        ...acc,
        [prop]: unit(value) ? value : convert(value, rhythmUnit),
      };
    },
    {}
  );
}

////////////////////////////////////////////////////////////////////////////////
// Types

type BaseOptions = {
  /**
   * The title of the theme (currently not supported)
   */
  title?: string;
  /**
   * The base font size in pixels, defaults to `16px`.
   */
  baseFontSize?: HarmoniousRhythmOptions['baseFontSize'];
  /**
   * The base line height value without a unit. Defaults to `1.5`.
   */
  baseLineHeight?: number;
  /**
   * The line height value for heading elements. Defaults to `1.1`.
   */
  headerLineHeight?: number;
  /**
   * The unit that will utlimately be used for calculated rhythm and scale
   * values.
   */
  rhythmUnit?: HarmoniousRhythmOptions['rhythmUnit'];
  /**
   * The “scale ratio”, or the the ratio between the `h1` font size and the
   * `baseFontSize`. So if the scale ratio is `2` and the `baseFontSize` is
   * `16px` then the `h1` font size is `32px`. Defaults to the "golden" ratio
   * which is `1.61803398875`.
   */
  scaleRatio?: number;
  /**
   * The number of lines to be used as margins on block elements.
   *
   * TODO: Consider option for disabling this altogether. Could be useful in
   * a component context to instead use this value for stack components.
   */
  blockMarginBottom?: number;
};

export type HarmoniousTypeOptions = BaseOptions & {
  breakpoints?: Record<string | number, BaseOptions>;
  breakpointUnit?: 'px' | 'rem';
  plugins?: HarmoniousTypePlugin[];
};

type HarmoniousTypeConfigBase = {
  baseFontSize: number;
  baseLineHeight: number;
  headerLineHeight: number;
  scaleRatio: number;
  blockMarginBottom: number;
};

export type HarmoniousTypeConfig = {
  title: string;
  rhythmUnit: 'px' | 'em' | 'rem';
  breakpointUnit: 'px' | 'rem';
  breakpoints: {
    0: HarmoniousTypeConfigBase;
    [key: number]: HarmoniousTypeConfigBase;
  };
  plugins: HarmoniousTypePlugin[];
};

export type RhythmFunction = (
  lines?: number,
  fontSize?: string | number | undefined,
  offset?: number | undefined
) => string;

export type ScaleFunction = (
  value?: number
) => {
  fontSize: string;
  lineHeight: number;
};

type FontSizeAdjustmentFunction = (
  toSize: string | number,
  lines?: number | 'auto',
  fromSize?: string | number | undefined
) => { fontSize: string | number; lineHeight: number };

export type HarmoniousStyles = { [key: string]: CSS.Properties };

export type HarmoniousTypePlugin = {
  setConfig?(config: HarmoniousTypeConfig): HarmoniousTypeConfig;
  setStyles?(
    rhythms: {
      [key: number]: HarmoniousRhythm;
      0: HarmoniousRhythm;
    },
    config: HarmoniousTypeConfig,
    styles: HarmoniousStyles
  ): HarmoniousStyles;
};
