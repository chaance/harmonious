/**
 * Hello! If you are reading this, I assume you're curious as to why I appear to
 * be creating a library that essentially does the same thing as another popular
 * library, even using much of the same code. At least, you would probably be
 * wondering that if you are familiar with Typography.js.
 *
 * Typography is a great library. I've used it on various projects over the
 * years and would use it again today. At the same time, there are some things
 * I'd like it to do a little differently:
 *
 *  - It lacks support for reconfiguring important options at various
 *    breakpoints, making it difficult to staticly generate media queries. I
 *    would love to explore using CSS custom properties for rhythm units, but we
 *    will need to be able to produce static CSS while maintaining some of the
 *    trickier dynamic stuff.
 *  - It feels too opinionated about things that aren't relevant to its core
 *    strength, which is the idea of "vertical rhythm" between typographic
 *    elements and components. In most projects, colors, font families and font
 *    weights are likely alredy defined elsewhere, and I often find myself
 *    negating Typography's styles in these cases anyway. Perhaps these could be
 *    better considered as opt-in plugins instead?
 *  - There are a variety of ways to add styles to a website these days. It'd be
 *    great to build an API that is more easily integrated with your project's
 *    existing style architecture.
 *  - Development on Typography appears to have stalled as of late. Its core
 *    behavior is simple enough to re-create, so it seemed like a fun project to
 *    explore a new API and new possibilities.
 *  - Could we componentize layout elements? I have some rough ideas here but am
 *    excited to explore.
 *  - Would love to explore fluid typography as a simple opt-in feature.
 *    https://css-tricks.com/snippets/css/fluid-typography/
 *
 * At the moment, I haven't done much other than copy a lot of Typography's
 * code, remove a lot of the stuff I don't want, and restructure the core tools
 * as classes (I know, everyone hates classes now blah blah blah). This is very
 * much in an exploratory phase and I will be updating the APIs and features
 * rapidly for the next few weeks. If you ever had any cool ideas you wanted to
 * see in Typography, feel free to open an issue here and let's explore
 * together!
 *
 * @see Typography.js https://github.com/KyleAMathews/typography.js
 */

import {
  HarmoniousRhythm,
  HarmoniousRhythmOptions,
  HarmoniousRhythmConfig,
  defaultConfig as defaultRhythmConfig,
} from 'harmonious-rhythm';
import { harmoniousScale, ratios } from 'harmonious-scale';
import { isNumber, isObject, isString, kebabCase, pick } from 'lodash';
import * as CSS from 'csstype';
import {
  CSSUnitConverter,
  getDefiniteNumberWithFallback,
  unit,
} from 'harmonious-utils';

const defaultConfig: HarmoniousTypeConfig = {
  title: 'harmonious-type-default',
  baseFontSize: defaultRhythmConfig.baseFontSize,
  baseLineHeight: defaultRhythmConfig.baseLineHeight,
  headerLineHeight: 1.1,
  rhythmUnit: defaultRhythmConfig.rhythmUnit,
  scaleRatio: ratios.golden,
  // headerFontFamily: [
  //   '-apple-system',
  //   'BlinkMacSystemFont',
  //   'Segoe UI',
  //   'Roboto',
  //   'Oxygen',
  //   'Ubuntu',
  //   'Cantarell',
  //   'Fira Sans',
  //   'Droid Sans',
  //   'Helvetica Neue',
  //   'sans-serif',
  // ],
  // bodyFontFamily: ['georgia', 'serif'],
  blockMarginBottom: 1,
};

export class HarmoniousType {
  /**
   * The configuration object for the HarmoniousRhythm instance.
   *
   * @type {HarmoniousTypeConfig}
   * @memberof HarmoniousRhythm
   */
  public readonly config: HarmoniousTypeConfig;

  private _rhythm: HarmoniousRhythm;

  /**
   * Unit conversion method based on the base font size.
   *
   * @type {CSSUnitConverter}
   * @memberof HarmoniousRhythm
   */
  public readonly convert: CSSUnitConverter;

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

  public readonly adjustFontSizeTo: (
    toSize: string | number,
    lines?: number | 'auto',
    fromSize?: string | number | undefined
  ) => { fontSize: string | number; lineHeight: number };

  public readonly getLineHeightFromValue: (value: string | number) => number;

  public constructor(opts?: HarmoniousTypeOptions) {
    this.config = getConfig(opts);
    this._rhythm = new HarmoniousRhythm(
      pick(this.config, Object.keys(defaultRhythmConfig))
    );
    this.convert = this._rhythm.convert.bind(this);
    this.rhythm = this._rhythm.rhythm.bind(this);
    this.rhythmicLineHeight = this._rhythm.rhythmicLineHeight.bind(this);
    this.establishBaseline = this._rhythm.establishBaseline.bind(this);
    this.linesForFontSize = this._rhythm.linesForFontSize.bind(this);
    this.adjustFontSizeTo = this._rhythm.adjustFontSizeTo.bind(this);
    this.getLineHeightFromValue = this._rhythm.getLineHeightFromValue.bind(
      this
    );
  }

  public scale(value: number = 0) {
    const { baseFontSize, scaleRatio } = this.config;
    // This doesn't pick the right scale ratio if a theme has more than one ratio.
    // Perhaps add optional parameter for a width and it'll get the ratio
    // for this width. Tricky part is maxWidth could be set in non-pixels.
    return this.adjustFontSizeTo(
      harmoniousScale(value, scaleRatio) * baseFontSize
    );
  }

  public toJSON() {
    let { config, convert } = this;
    let styles: HarmoniousStyles = {};
    const { fontSize, lineHeight } = this.establishBaseline();

    // Base HTML styles.
    styles = setStyles(styles, 'html', {
      fontSize: fontSize,
      lineHeight: lineHeight,
      boxSizing: 'border-box',
      overflowY: 'scroll',
    });

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

    // All block elements get one rhythm of bottom margin by default
    // or whatever is passed in as option.
    let blockMarginBottom = '';
    if (isNumber(config.blockMarginBottom)) {
      blockMarginBottom = this.rhythm(config.blockMarginBottom);
    } else if (isString(config.blockMarginBottom)) {
      blockMarginBottom = config.blockMarginBottom;
    } else {
      blockMarginBottom = this.rhythm(1);
    }
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
        marginBottom: blockMarginBottom,
      }
    );

    // Basic blockquote styles.
    styles = setStyles(styles, 'blockquote', {
      marginRight: this.rhythm(1),
      marginBottom: blockMarginBottom,
      marginLeft: this.rhythm(1),
    });

    // hr.
    styles = setStyles(styles, 'hr', {
      background: 'currentColor',
      border: 'none',
      height: '1px',
      marginBottom: `calc(${blockMarginBottom} - 1px)`,
    });

    // ol, ul.
    styles = setStyles(styles, ['ol', 'ul'], {
      listStylePosition: 'outside',
      listStyleImage: 'none',
      marginLeft: this.rhythm(1),
    });

    // li.
    styles = setStyles(styles, 'li', {
      marginBottom: `calc(${blockMarginBottom} / 2)`,
    });

    // Remove default padding on list items.
    styles = setStyles(styles, ['ol li', 'ul li'], {
      paddingLeft: 0,
    });

    // children ol, ul.
    styles = setStyles(styles, ['li > ol', 'li > ul'], {
      marginLeft: this.rhythm(1),
      marginBottom: `calc(${blockMarginBottom} / 2)`,
      marginTop: `calc(${blockMarginBottom} / 2)`,
    });

    // Remove margin-bottom on the last-child of a few block elements
    // The worst offender of this seems to be markdown => html compilers
    // as they put paragraphs within LIs amoung other oddities.
    styles = setStyles(
      styles,
      ['blockquote *:last-child', 'li *:last-child', 'p *:last-child'],
      {
        marginBottom: 0,
      }
    );

    // Ensure li > p is 1/2 margin — this is another markdown => compiler oddity.
    styles = setStyles(styles, ['li > p'], {
      marginBottom: `calc(${blockMarginBottom} / 2)`,
    });

    // Make generally smaller elements, smaller.
    styles = setStyles(styles, ['code', 'kbd', 'pre', 'samp'], {
      ...adjustFontSizeTo(this, '85%'),
    });

    // Abbr, Acronym.
    styles = setStyles(styles, ['abbr', 'acronym'], {
      borderBottom: `1px dotted`,
      cursor: 'help',
    });
    styles['abbr[title]'] = {
      borderBottom: `1px dotte`,
      cursor: 'help',
      textDecoration: 'none',
    };

    // Table styles.
    styles = setStyles(styles, ['table'], {
      ...adjustFontSizeTo(this, config.baseFontSize + 'px'),
      borderCollapse: 'collapse',
      width: '100%',
    });
    styles = setStyles(styles, ['thead'], {
      textAlign: 'left',
    });
    styles = setStyles(styles, ['td,th'], {
      textAlign: 'left',
      borderBottom: `1px solid`,
      fontFeatureSettings: '"tnum"',
      MozFontFeatureSettings: '"tnum"',
      ['msFontFeatureSettings' as any]: '"tnum"',
      WebkitFontFeatureSettings: '"tnum"',
      paddingLeft: this.rhythm(2 / 3),
      paddingRight: this.rhythm(2 / 3),
      paddingTop: this.rhythm(1 / 2),
      paddingBottom: `calc(${this.rhythm(1 / 2)} - 1px)`,
    });
    styles = setStyles(styles, 'th:first-child,td:first-child', {
      paddingLeft: 0,
    });
    styles = setStyles(styles, 'th:last-child,td:last-child', {
      paddingRight: 0,
    });

    // Create styles for headers.
    styles = setStyles(styles, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], {
      textRendering: 'optimizeLegibility',
    });

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
      styles = {
        ...styles,
        [headerElement]: {
          ...(styles[headerElement] || null),
          fontSize: convert(this.scale(ratio).fontSize, config.rhythmUnit),
          lineHeight: config.headerLineHeight,
        },
      };
    });

    // TODO add support for Breakpoints here.

    // Call plugins if any.
    // if (Array.isArray(config.plugins)) {
    //   styles = reduce(
    //     config.plugins,
    //     (stylesObj, plugin) => merge(stylesObj, plugin(ht, config, stylesObj)),
    //     styles
    //   );
    // }

    // Call overrideStyles function on config (if set).
    // if (config.overrideStyles && isFunction(config.overrideStyles)) {
    //   styles = merge(styles, config.overrideStyles(ht, config, styles));
    // }

    // // Call overrideThemeStyles function on config (if set).
    // if (config.overrideThemeStyles && isFunction(config.overrideThemeStyles)) {
    //   styles = merge(styles, config.overrideThemeStyles(ht, config, styles));
    // }

    return styles;
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
function getConfig(options?: HarmoniousTypeOptions | undefined) {
  options = options || (defaultConfig as any);
  // Base font size is important!
  let baseFontSize = getDefiniteNumberWithFallback(
    options!.baseFontSize || defaultConfig.baseFontSize,
    defaultConfig.baseFontSize
  );

  return {
    ...defaultConfig,
    ...options,
    baseFontSize,
  } as HarmoniousTypeConfig;
}

function setStyles(
  styles: HarmoniousStyles = {},
  els: string | string[],
  rules: CSS.Properties
) {
  let elements = Array.isArray(els) ? els : [els];
  return elements.reduce<HarmoniousStyles>((output, element) => {
    return {
      ...output,
      [element]: {
        ...(output[element] || null),
        ...rules,
      },
    };
  }, styles);
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
function adjustFontSizeTo(ht: HarmoniousType, toValue: string) {
  return Object.entries(ht.adjustFontSizeTo(toValue)).reduce<CSS.Properties>(
    (acc, [prop, value]) => {
      const {
        convert,
        config: { rhythmUnit },
      } = ht;
      return {
        ...acc,
        [prop]: unit(value) ? value : convert(value, rhythmUnit),
      };
    },
    {}
  );
}

export type HarmoniousTypeOptions = {
  title?: string;
  baseFontSize?: HarmoniousRhythmOptions['baseFontSize'];
  baseLineHeight?: HarmoniousRhythmOptions['baseLineHeight'];
  headerLineHeight?: HarmoniousRhythmOptions['baseLineHeight'];
  rhythmUnit?: HarmoniousRhythmOptions['rhythmUnit'];
  scaleRatio?: number;
  blockMarginBottom?: number;

  breakpoints?: {};

  overrideStyles?: (
    harmoniousRhythm: HarmoniousRhythm,
    options: Omit<
      HarmoniousTypeOptions,
      'overrideStyles' | 'overrideThemeStyles' | 'plugins'
    >,
    styles: any // ??
  ) => Object;
  overrideThemeStyles?: (
    harmoniousRhythm: HarmoniousRhythm,
    options: Omit<
      HarmoniousTypeOptions,
      'overrideStyles' | 'overrideThemeStyles' | 'plugins'
    >,
    styles: any // ??
  ) => Object;
  plugins?: any[];
};

export type HarmoniousTypeConfig = {
  title: string;
  baseFontSize: HarmoniousRhythmConfig['baseFontSize'];
  baseLineHeight: HarmoniousRhythmConfig['baseLineHeight'];
  headerLineHeight: HarmoniousRhythmConfig['baseLineHeight'];
  rhythmUnit: HarmoniousRhythmConfig['rhythmUnit'];
  scaleRatio: number;
  blockMarginBottom: number;
};

export type HarmoniousStyles = { [key: string]: CSS.Properties };
