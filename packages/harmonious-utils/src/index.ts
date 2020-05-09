import isNumber from 'lodash/isNumber';

export const DEFAULT_BASE_FONT_SIZE = 16;

/**
 * Get the unit from a string, assuming it is a CSS measurement value.
 * @param input The measurement to parse
 */
export function unit(input: string | number) {
  return String(input).match(/[\d.\-+]*\s*(.*)/)?.[1] || '';
}

/**
 * Strip the unit from a string and return its numeric value, assuming
 * it is a CSS measurement value.
 * @param input The measurement to parse
 */
export function unitLess(input: string | number) {
  return isNumber(input) ? input : parseFloat(input);
}

/**
 * Parse a CSS measurement string and return a tuple with its numeric
 * value and unit type.
 * @param input The measurement to parse
 */
export function parseUnit(input: string | number): [number, string] {
  return [unitLess(input), unit(input)];
}

/**
 *
 * @param baseSize
 */
export function getCSSLengthConverter(
  baseSize: number = DEFAULT_BASE_FONT_SIZE
): CSSUnitConverter {
  baseSize = baseSize ?? DEFAULT_BASE_FONT_SIZE;

  /**
   *
   * @param length - A css <length> value
   * @param toUnit - String matching a css unit keyword, e.g. 'em', 'rem', etc.
   * @param fromContext - When converting from relative units, the absolute
   *                      length (in px) to which length refers (e.g. for
   *                      lengths in em units, would normally be the font-size
   *                      of the current element).
   * @param toContext - For converting to relative units, the absolute length in
   *                    px to which the output value will refer. Defaults to the
   *                    same as fromContext, since it is rarely needed.
   */
  return function convertCSSLength(
    length,
    toUnit,
    fromContext = baseSize,
    toContext = fromContext
  ) {
    fromContext = fromContext ?? baseSize;
    toContext = toContext ?? fromContext;

    let fromUnit = unit(length);

    // Optimize for cases where `from` and `to` units are accidentally the same.
    if (fromUnit === toUnit) {
      return length;
    }

    // Convert input length to pixels.
    let pxLength = unitLess(length);

    // Warn if to or from context aren't in pixels.
    // if (unit(fromContext) !== "px") {
    // console.warn(`Parameter fromContext must resolve to a value \
    // in pixel units.`)
    // }
    // if (unit(toContext) !== "px") {
    // console.warn(`Parameter toContext must resolve to a value \
    // in pixel units.`)
    // }

    if (fromUnit !== 'px') {
      if (fromUnit === 'em') {
        pxLength = unitLess(length) * unitLess(fromContext);
      } else if (fromUnit === 'rem') {
        pxLength = unitLess(length) * unitLess(baseSize);
      } else if (fromUnit === 'ex') {
        pxLength = unitLess(length) * unitLess(fromContext) * 2;
      } else {
        return length;
      }
      // } else if (["ch", "vw", "vh", "vmin"].includes(fromUnit)) {
      // console.warn(`${fromUnit} units can't be reliably converted; Returning \
      // original value.`)
      // return length
      // } else {
      // console.warn(`${fromUnit} is an unknown or unsupported length unit; \
      // Returning original value.`)
      // return length
      // }
    }

    // Convert length in pixels to the output unit
    let outputLength = pxLength;
    if (toUnit !== 'px') {
      if (toUnit === 'em') {
        outputLength = pxLength / unitLess(toContext);
      } else if (toUnit === 'rem') {
        outputLength = pxLength / unitLess(baseSize);
      } else if (toUnit === 'ex') {
        outputLength = pxLength / unitLess(toContext) / 2;
        // } else if (["ch", "vw", "vh", "vmin"].includes(toUnit)) {
        // console.warn(`${toUnit} units can't be reliably converted; Returning \
        // original value.`)
        // return length
        // } else {
        // console.warn(`${toUnit} is an unknown or unsupported length unit; \
        // Returning original value.`)
      } else {
        return length;
      }
    }

    return parseFloat(outputLength.toFixed(5)) + toUnit;
  };
}

export type CSSUnitConverter = (
  length: string | number,
  toUnit: string,
  fromContext?: string | number,
  toContext?: string | number
) => string | number;
