import { isNumber, isObject, isString, kebabCase } from 'lodash';
import * as CSS from 'csstype';
import { unit, CSS_GENERIC_FONT_FAMILIES } from 'harmonious-utils';
import { HarmoniousTypeConfig, HarmoniousType } from './index';

export type HarmoniousStyles = { [key: string]: CSS.Properties };

export function createStyles(ht: HarmoniousType) {
  let { config, convert } = ht;
  let styles: HarmoniousStyles = {};
  const { fontSize, lineHeight } = ht.establishBaseline();

  // Base HTML styles.
  styles = setStyles(styles, 'html', {
    fontSize,
    lineHeight,
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
    blockMarginBottom = ht.rhythm(config.blockMarginBottom);
  } else if (isString(config.blockMarginBottom)) {
    blockMarginBottom = config.blockMarginBottom;
  } else {
    blockMarginBottom = ht.rhythm(1);
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
    marginRight: ht.rhythm(1),
    marginBottom: blockMarginBottom,
    marginLeft: ht.rhythm(1),
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
    marginLeft: ht.rhythm(1),
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
    marginLeft: ht.rhythm(1),
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
    ...adjustFontSizeTo(ht, '85%'),
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
    ...adjustFontSizeTo(ht, config.baseFontSize + 'px'),
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
    paddingLeft: ht.rhythm(2 / 3),
    paddingRight: ht.rhythm(2 / 3),
    paddingTop: ht.rhythm(1 / 2),
    paddingBottom: `calc(${ht.rhythm(1 / 2)} - 1px)`,
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
        fontSize: convert(ht.scale(ratio).fontSize, config.rhythmUnit),
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

export function compileStyles(styles: HarmoniousStyles) {
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

// function wrapFontFamily(fontFamily: string) {
//   return CSS_GENERIC_FONT_FAMILIES.indexOf(fontFamily) !== -1
//     ? fontFamily
//     : `'${fontFamily}'`;
// }
