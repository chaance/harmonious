import {
  DEFAULT_BASE_FONT_SIZE,
  CSSUnitConverter,
  getCSSLengthConverter,
  getDefiniteNumberWithFallback,
  unit,
  unitLess,
} from 'harmonious-utils';
import { harmoniousScale, ratios } from 'harmonious-scale';

export const defaultConfig: Omit<
  HarmoniousRhythmConfig,
  'baseLineHeightInPx'
> = {
  baseFontSize: DEFAULT_BASE_FONT_SIZE,
  baseLineHeight: 1.5,
  defaultRhythmBorderWidth: 1,
  minLinePadding: 2,
  rhythmUnit: 'rem',
  roundToNearestHalfLine: true,
  scaleRatio: ratios.golden,
};

/**
 * Create a harmonious vertical rhythm from a provided `baseFontSize` and
 * `baseLineHeight`.
 *
 * Based largely on functions from the Compass Vertical Rhythm utility.
 *
 * @see compass-vertical-rhythm - https://github.com/KyleAMathews/compass-vertical-rhythm
 * @see Compass - http://compass-style.org/reference/compass/typography/vertical_rhythm/#function-rhythm
 */
export class HarmoniousRhythm {
  /**
   * The configuration object for the HarmoniousRhythm instance.
   *
   * @private
   * @type {HarmoniousRhythmConfig}
   * @memberof HarmoniousRhythm
   */
  private readonly config: HarmoniousRhythmConfig;

  /**
   * Convert from one unit to another given a base font size for relativity.
   * @example
   * rhythm.convert('18px', 'rem', '16px') === '1.125rem'
   *
   * @type {CSSUnitConverter}
   * @memberof HarmoniousRhythm
   */
  public readonly convert: CSSUnitConverter;

  /**
   * The default font size for all text in pixels. Derived from the config
   * object.
   *
   * @private
   * @type {number}
   * @memberof HarmoniousRhythm
   */
  public readonly baseFontSize: number;

  /**
   * Class constructor.
   *
   * @param options
   */
  public constructor(options?: Partial<HarmoniousRhythmOptions>) {
    const [config, convert] = getConfig(options);
    this.config = config;
    this.convert = convert;
    this.baseFontSize = config.baseFontSize;
    this.rhythm = this.rhythm.bind(this);
    this.rhythmicLineHeight = this.rhythmicLineHeight.bind(this);
    this.establishBaseline = this.establishBaseline.bind(this);
    this.linesForFontSize = this.linesForFontSize.bind(this);
    this.adjustFontSizeTo = this.adjustFontSizeTo.bind(this);
    this.getLineHeightFromValue = this.getLineHeightFromValue.bind(this);
    this.convert = this.convert.bind(this);
    this.scale = this.scale.bind(this);
  }

  /**
   * Get a harmonious rhythm value.
   *
   * @param lines
   * @param fontSize
   * @param offset
   */
  public rhythm(
    lines = 1,
    fontSize?: string | number | undefined,
    offset?: number | undefined
  ) {
    const {
      baseFontSize,
      convert,
      config: { baseLineHeightInPx, rhythmUnit },
    } = this;
    lines = lines ?? 1;
    fontSize = fontSize ?? baseFontSize;
    offset = offset || 0;

    let length = lines * unitLess(baseLineHeightInPx) - offset + 'px';
    let rhythmLength = convert(length, rhythmUnit, fontSize);
    if (unit(rhythmLength) === 'px') {
      rhythmLength = Math.floor(unitLess(rhythmLength)) + unit(rhythmLength);
    }

    // Limit to 5 decimals.
    return (
      parseFloat(unitLess(rhythmLength).toFixed(5)) +
      (unit(rhythmLength) || 'px')
    );
  }

  /**
   *
   *
   * @param value
   */
  public scale(value: number = 0) {
    const { baseFontSize, scaleRatio } = this.config;
    // This doesn't pick the right scale ratio if a theme has more than one ratio.
    // Perhaps add optional parameter for a width and it'll get the ratio
    // for this width. Tricky part is maxWidth could be set in non-pixels.
    return this.adjustFontSizeTo(
      harmoniousScale(value, scaleRatio) * baseFontSize
    );
  }

  /**
   * Get the line-height equivalent to a rhythm value.
   *
   * @param lines
   * @param fontSize
   * @param offset
   */
  public rhythmicLineHeight(
    lines = 1,
    fontSize?: string | number | undefined,
    offset?: number | undefined
  ) {
    return this.getLineHeightFromValue(this.rhythm(lines, fontSize, offset));
  }

  /**
   * Establishes a font baseline for the base font-size.
   */
  public establishBaseline() {
    const {
      baseFontSize,
      config: { baseLineHeight },
    } = this;
    return {
      // 16px is the default browser font size.
      // Set base fontsize in percent as older browsers (or just IE6) behave
      // weird otherwise.
      fontSize: (baseFontSize / 16) * 100 + '%',
      lineHeight: baseLineHeight,
    };
  }

  /**
   * TODO: Docblock this
   *
   * @param fontSize
   */
  public linesForFontSize(fontSize: string | number) {
    const {
      convert,
      config: { baseLineHeightInPx, minLinePadding, roundToNearestHalfLine },
    } = this;
    let fontSizeInPx = unitLess(convert(fontSize, 'px'));
    let lines = roundToNearestHalfLine
      ? Math.ceil((2 * fontSizeInPx) / baseLineHeightInPx) / 2
      : Math.ceil(fontSizeInPx / baseLineHeightInPx);

    // If lines are cramped, include some extra lead.
    if (lines * baseLineHeightInPx - fontSizeInPx < minLinePadding * 2) {
      if (roundToNearestHalfLine) {
        lines += 0.5;
      } else {
        lines += 1;
      }
    }

    return lines;
  }

  /**
   * TODO: Docblock this
   *
   * @param toSize
   * @param lines
   * @param fromSize
   */
  public adjustFontSizeTo(
    toSize: string | number,
    lines: number | 'auto' = 'auto',
    fromSize?: string | number | undefined
  ) {
    const {
      convert,
      baseFontSize,
      config: { rhythmUnit, baseLineHeight },
    } = this;

    lines = lines ?? 'auto';
    fromSize = fromSize ?? baseFontSize;

    if (unit(toSize) === '%') {
      toSize = baseFontSize * (unitLess(toSize) / 100) + 'px';
    }

    fromSize = convert(fromSize, 'px');
    toSize = convert(toSize, 'px', fromSize);

    if (lines === 'auto') {
      lines = this.linesForFontSize(toSize);
    }

    let fontSize = convert(toSize, rhythmUnit, fromSize);
    let lineHeightWithPossibleUnit = this.rhythm(lines, fromSize);
    let lineHeight = this.getLineHeightFromValue(lineHeightWithPossibleUnit);

    return {
      fontSize,
      lineHeight,
    };
  }

  /**
   * TODO: Docblock this
   *
   * @param value
   * @param baseFontSize
   * @param fallback
   */
  public getLineHeightFromValue(value: string | number) {
    const {
      convert,
      baseFontSize,
      config: { baseLineHeight },
    } = this;

    let lineHeight: number;
    if (unit(value)) {
      let lineHeightInPx = unitLess(convert(value, 'px'));
      lineHeight = lineHeightInPx / baseFontSize;
    } else {
      let l = unitLess(value);
      lineHeight = !isNaN(l) ? l / baseFontSize : baseLineHeight;
    }
    return lineHeight;
  }
}

export default HarmoniousRhythm;

/**
 * @param options
 */
function getConfig(options: Partial<HarmoniousRhythmOptions> = defaultConfig) {
  options = options || defaultConfig;

  // Base font size is important!
  let baseFontSize = getDefiniteNumberWithFallback(
    options.baseFontSize || defaultConfig.baseFontSize,
    defaultConfig.baseFontSize
  );
  let convert = getCSSLengthConverter(baseFontSize);

  let baseLineHeight = options.baseLineHeight || defaultConfig.baseLineHeight;
  let baseLineHeightInPx = baseLineHeight;

  // If a user passes a string for baseLineHeight we'll treat it as a unit rather
  // than throw an error immediately. We need the base line height and its pixel-
  // value equivalent.
  if (unit(baseLineHeight)) {
    baseLineHeightInPx = unitLess(convert(baseLineHeight, 'px'));
    baseLineHeight = baseLineHeightInPx / baseFontSize;
  } else {
    baseLineHeightInPx =
      baseFontSize *
      getDefiniteNumberWithFallback(
        baseLineHeight,
        defaultConfig.baseLineHeight
      );
  }

  return [
    {
      ...defaultConfig,
      ...options,
      baseFontSize,
      baseLineHeight,
      baseLineHeightInPx,
      minLinePadding: unitLess(
        convert(options.minLinePadding ?? defaultConfig.minLinePadding, 'px')
      ),
      defaultRhythmBorderWidth: unitLess(
        convert(
          options.defaultRhythmBorderWidth ??
            defaultConfig.defaultRhythmBorderWidth,
          'px'
        )
      ),
    } as HarmoniousRhythmConfig,
    convert,
  ] as const;
}

export type HarmoniousRhythmOptions = {
  /**
   * The base font size in pixels, defaults to `16px`.
   */
  baseFontSize: string | number;
  /**
   * The base line height value without a unit. Defaults to `1.5`.
   */
  baseLineHeight: number;
  /**
   * The standard border size for most separator/block elements. Borders may
   * factor in to rhythm calculations where possible. Defaults to `1px`.
   */
  defaultRhythmBorderWidth: string | number;
  /**
   * The minimum amount of padding required between lines. Defaults to `2px`.
   */
  minLinePadding: string | number;
  /**
   * The unit that will utlimately be used for calculated rhythm and scale
   * values.
   */
  rhythmUnit: 'px' | 'em' | 'rem';
  /**
   * Whether or not to round calculations to the nearest half-line of text.
   * Defaults to `true`.
   */
  roundToNearestHalfLine: boolean;
  /**
   * The “scale ratio”, or the the ratio between the `h1` font size and the
   * `baseFontSize`. So if the scale ratio is `2` and the `baseFontSize` is
   * `16px` then the `h1` font size is `32px`. Defaults to the "golden" ratio
   * which is `1.61803398875`.
   */
  scaleRatio?: number;
};

export type HarmoniousRhythmConfig = {
  baseFontSize: number;
  baseLineHeight: number;
  baseLineHeightInPx: number;
  defaultRhythmBorderWidth: number;
  minLinePadding: number;
  rhythmUnit: 'px' | 'em' | 'rem';
  roundToNearestHalfLine: boolean;
  scaleRatio: number;
};
