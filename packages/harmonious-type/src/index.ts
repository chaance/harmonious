import {
  HarmoniousRhythm,
  HarmoniousRhythmOptions,
  defaultConfig as defaultRhythmConfig,
} from 'harmonious-rhythm';
import { ratios } from 'harmonious-scale';
import { isNumber, isObject, kebabCase, pick } from 'lodash';
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
   * @type {Record<string, number>}
   * @memberof HarmoniousType
   */
  public readonly breakpoints: Record<string, number>;

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
    _base: HarmoniousRhythm;
    [key: string]: HarmoniousRhythm;
  };

  public readonly scale: (
    value?: number
  ) => {
    fontSize: string | number;
    lineHeight: number;
  };

  public constructor(opts?: HarmoniousTypeOptions) {
    this.config = getConfig(opts);

    this.rhythms = Object.keys(this.config.breakpoints).reduce(
      (prev, cur) => {
        return {
          ...prev,
          [cur]: new HarmoniousRhythm(
            pick(this.config.breakpoints[cur], rhythmConfigKeys)
          ),
        };
      },
      { _base: new HarmoniousRhythm(pick(this.config, rhythmConfigKeys)) }
    ) as any;

    const baseRhythm = this.rhythms._base;

    this.breakpoints = Object.keys(this.config.breakpoints).reduce(
      (prev, cur) => ({
        ...prev,
        [cur]: this.config.breakpoints[cur].width,
      }),
      {}
    );
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
      let headerElement = `h${i + 1}` as StyleSelector;

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

    const output: HarmoniousStyles = {};

    for (const key in sortStylesByMediaQueryLength(styles)) {
      output[key as StyleSelector] = styles[key as StyleSelector];
    }

    return output as Required<HarmoniousStyles>;
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
  let breakpointPairs = Object.keys(opts.breakpoints)
    .map(
      (bp) => [bp, parseInt((opts.breakpoints[bp] as any).width, 10)] as const
    )
    .filter(([, num]) => !isNaN(num))
    .sort(([, a], [, b]) => a - b);

  let breakpoints: HarmoniousTypeConfig['breakpoints'] = breakpointPairs.reduce(
    (prev, [bp, width]) => {
      return {
        ...prev,
        [bp]: {
          width,
          baseFontSize: getDefiniteNumberWithFallback(
            findBreakpointMatch('baseFontSize', [bp, width]),
            defaultConfig.baseFontSize
          ),
          baseLineHeight: findBreakpointMatch('baseLineHeight', [bp, width]),
          headerLineHeight: findBreakpointMatch('headerLineHeight', [
            bp,
            width,
          ]),
          scaleRatio: findBreakpointMatch('scaleRatio', [bp, width]),
          blockMarginBottom: findBreakpointMatch('blockMarginBottom', [
            bp,
            width,
          ]),
        },
      };
    },
    {}
  );

  const cfg: HarmoniousTypeConfig = {
    ...pick(opts, ['title', 'rhythmUnit', 'breakpointUnit']),
    ...baseConfig,
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

  function findBreakpointMatch(
    property: keyof BaseOptions,
    [breakpoint, width]: [string, number]
  ): any {
    if (opts.breakpoints[breakpoint][property]) {
      return opts.breakpoints[breakpoint][property];
    }
    // Iterate through pairs sorted from smallest to largest, then return first
    // matching value.
    for (let [bp, val] of breakpointPairs) {
      if (opts.breakpoints[bp][property] && val <= width) {
        return opts.breakpoints[bp][property];
      }
    }
    return opts[property];
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
    _base: HarmoniousRhythm;
    [key: string]: HarmoniousRhythm;
  }
) {
  return function setStyles(
    styles: HarmoniousStyles,
    selectors: StyleSelector | StyleSelector[],
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

    return (Array.isArray(selectors) ? selectors : selectors.split(',')).reduce(
      (output, selector) => {
        selector = selector.trim();
        let rules: HarmoniousStyles = {};

        for (let b in rhythms) {
          let breakpoint = b === '_base' ? 0 : config.breakpoints[b].width;
          let hm = rhythms[b];
          let { fontSize, lineHeight } = hm.establishBaseline();
          let { convert, rhythm, baseFontSize, scale } = hm;
          let { blockMarginBottom, headerLineHeight } =
            config.breakpoints[b] || config;
          let bmb = '';
          if (isNumber(blockMarginBottom)) {
            bmb = rhythm(blockMarginBottom);
          } else if (unit(blockMarginBottom)) {
            bmb = blockMarginBottom as any;
          } else {
            bmb = rhythm(1);
          }

          let scaledRules = responsiveRules
            ? responsiveRules({
                baseFontSize,
                blockMarginBottom: bmb,
                convert,
                fontSize,
                headerLineHeight,
                lineHeight,
                rhythm,
                adjustFontSize: hm.adjustFontSizeTo,
                scale,
              })
            : {};

          if (breakpoint == 0) {
            rules = {
              ...((output as any)[selector] || {}),
              ...rules,
              ...(baseRules || {}),
              ...scaledRules,
            };
          } else {
            let querySelector = getMediaQueryString(breakpoint);
            let maybeRules = {
              ...((output as any)[selector]?.[querySelector] || {}),
              ...scaledRules,
            };
            if (Object.keys(maybeRules).length) {
              rules = {
                ...((output as any)[selector] || {}),
                ...rules,
                [querySelector]: maybeRules,
              };
            }
          }
        }

        return Object.keys(rules).length
          ? {
              ...output,
              [selector]: sortStylesByMediaQueryLength(rules),
            }
          : output;
      },
      styles
    );
  };
}

function compileStyles(styles: HarmoniousStyles): string {
  let mediaQueries: { [key: string]: CSS.Properties } = {};
  let compiled = Object.entries(styles).reduce(
    (stylesStr, [selector, ruleSet = {}]) => {
      stylesStr += `${selector}{`;
      Object.entries(ruleSet).forEach(([property, value]) => {
        if (property.startsWith('@') && isObject(value)) {
          mediaQueries[property] = {
            ...(mediaQueries[property] || {}),
            [selector]: {
              ...((mediaQueries as any)[property]?.[selector] || {}),
              ...value,
            },
          };
        } else if (isObject(value)) {
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
    },
    ''
  );
  if (Object.keys(mediaQueries).length) {
    compiled += compileStyles(sortStylesByMediaQueryLength(mediaQueries));
  }
  return compiled;
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

// function sortBreakpointsObject(bp: {
//   [key: string]: BaseOptions & { width: number };
// }) {
//   const output: typeof bp = {};
//   Object.keys(bp)
//     .sort((a, b) =>
//       bp[a].width > bp[b].width ? -1 : bp[a].width < bp[b].width ? 1 : 0
//     )
//     .forEach((key) => {
//       output[key] = bp[key];
//     });
//   return output;
// }

function sortStylesByMediaQueryLength(styles: HarmoniousStyles) {
  const output: HarmoniousStyles = {};

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
      output[key as StyleSelector] = styles[key as StyleSelector];
    });

  return output;
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
  baseBreakpointKey?: string;
  breakpoints?: {
    [key: string]: BaseOptions & { width: number };
  };
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

export type HarmoniousTypeConfig = HarmoniousTypeConfigBase & {
  title: string;
  rhythmUnit: 'px' | 'em' | 'rem';
  breakpointUnit: 'px' | 'rem';
  breakpoints: Record<string, HarmoniousTypeConfigBase & { width: number }>;
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

export type HarmoniousStyles = { [key in StyleSelector]?: CSS.Properties };

export type HarmoniousTypePlugin = {
  setConfig?(config: HarmoniousTypeConfig): HarmoniousTypeConfig;
  setStyles?(
    rhythms: {
      _base: HarmoniousRhythm;
      [key: string]: HarmoniousRhythm;
    },
    config: HarmoniousTypeConfig,
    styles: HarmoniousStyles
  ): HarmoniousStyles;
};

type StyleSelector =
  | 'html'
  | '*'
  | '*:before'
  | '*:after'
  | 'body'
  | 'img'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'hgroup'
  | 'ul'
  | 'ol'
  | 'dl'
  | 'dd'
  | 'p'
  | 'figure'
  | 'pre'
  | 'table'
  | 'fieldset'
  | 'blockquote'
  | 'form'
  | 'noscript'
  | 'iframe'
  | 'hr'
  | 'address'
  | 'li'
  | 'ol li'
  | 'ul li'
  | 'li > ol'
  | 'li > ul'
  | 'blockquote *:last-child'
  | 'li *:last-child'
  | 'p *:last-child'
  | 'li > p'
  | 'code'
  | 'kbd'
  | 'samp'
  | 'abbr'
  | 'acronym'
  | 'abbr[title]'
  | 'thead'
  | 'td'
  | 'th'
  | 'th:first-child'
  | 'td:first-child'
  | 'th:last-child'
  | 'td:last-child';
