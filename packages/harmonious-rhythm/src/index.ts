import {
  unit,
  unitLess,
  getCSSLengthConverter,
  CSSUnitConverter,
  DEFAULT_BASE_FONT_SIZE,
} from 'harmonious-utils';

const defaultConfig: Omit<
  HarmoniousRhythmOptionsStrict,
  'baseLineHeightInPx'
> = {
  baseFontSize: DEFAULT_BASE_FONT_SIZE,
  baseLineHeight: 1.5,
  rhythmUnit: 'rem',
  defaultRhythmBorderWidth: 1,
  defaultRhythmBorderStyle: 'solid',
  roundToNearestHalfLine: true,
  minLinePadding: 2,
};

export class HarmoniousRhythm {
  private config: HarmoniousRhythmOptionsStrict;
  private convert: CSSUnitConverter;
  private baseFontSize: number;
  public constructor(options?: Partial<HarmoniousRhythmOptions>) {
    const [config, convert] = getConfig(options);
    this.config = config;
    this.convert = convert;
    this.baseFontSize = config.baseFontSize;
    this.rhythm = this.rhythm.bind(this);
    this.establishBaseline = this.establishBaseline.bind(this);
    this.linesForFontSize = this.linesForFontSize.bind(this);
    this.adjustFontSizeTo = this.adjustFontSizeTo.bind(this);
  }

  public rhythm(
    lines = 1,
    fontSize: string | number | undefined = this.baseFontSize,
    offset: number | undefined = 0
  ) {
    const {
      convert,
      config: { baseLineHeightInPx, rhythmUnit },
    } = this;
    lines = lines ?? 1;
    fontSize = fontSize ?? this.baseFontSize;
    offset = offset || 0;

    let length = lines * unitLess(baseLineHeightInPx) - offset + 'px';
    let rhythmLength = convert(length, rhythmUnit, fontSize);
    if (unit(rhythmLength) === 'px') {
      rhythmLength = Math.floor(unitLess(rhythmLength)) + unit(rhythmLength);
    }

    // Limit to 5 decimals.
    return parseFloat(unitLess(rhythmLength).toFixed(5)) + unit(rhythmLength);
  }

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
      lineHeight: baseLineHeight.toString(),
    };
  }

  public linesForFontSize(fontSize: string | number) {
    const {
      convert,
      baseFontSize,
      config: {
        baseLineHeight,
        baseLineHeightInPx,
        minLinePadding,
        roundToNearestHalfLine,
      },
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

  public adjustFontSizeTo(
    toSize: string | number,
    lines: number | 'auto' = 'auto',
    fromSize?: string | number | undefined
  ) {
    const {
      convert,
      baseFontSize,
      config: { rhythmUnit },
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

    return {
      fontSize: String(convert(toSize, rhythmUnit, fromSize)),
      lineHeight: this.rhythm(lines, fromSize),
    };
  }
}

export default HarmoniousRhythm;

/**
 * Merge user options with our default to get a reliable config.
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
    } as HarmoniousRhythmOptionsStrict,
    convert,
  ] as const;
}

/**
 * Ensure we always get a proper unit distance a number.
 * If anything goes wrong we can just use the default.
 *
 * @param value
 */
function getDefiniteNumberWithFallback(
  value: string | number,
  fallback: number
) {
  try {
    let baseSize = unitLess(value);
    if (isNaN(baseSize)) {
      baseSize = fallback;
    }
    return baseSize;
  } catch (e) {}
  return fallback;
}

type BorderStyle =
  | 'none'
  | 'hidden'
  | 'dotted'
  | 'dashed'
  | 'solid'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'inset'
  | 'outset';

export type HarmoniousRhythmOptions = {
  baseFontSize: string | number;
  baseLineHeight: number;
  rhythmUnit: 'px' | 'em' | 'rem';
  defaultRhythmBorderWidth: string | number;
  defaultRhythmBorderStyle: BorderStyle;
  roundToNearestHalfLine: boolean;
  minLinePadding: string | number;
};

type HarmoniousRhythmOptionsStrict = {
  baseFontSize: number;
  baseLineHeight: number;
  rhythmUnit: 'px' | 'em' | 'rem';
  defaultRhythmBorderWidth: number;
  defaultRhythmBorderStyle: BorderStyle;
  roundToNearestHalfLine: boolean;
  minLinePadding: number;
  baseLineHeightInPx: number;
};
