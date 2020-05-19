<div align="center">
  <img src="https://raw.githubusercontent.com/chancestrickland/harmonious/master/static/harmonious.svg" width="440" height="98" alt="Harmonious" />
</div>

<div align="center">

[![Latest Release](https://img.shields.io/npm/v/harmonious-type.svg)](https://npm.im/harmonious-type) [![gzip size](http://img.badgesize.io/https://unpkg.com/harmonious-type@latest/dist/harmonious-type.cjs.production.min.js?compression=gzip)](https://unpkg.com/harmonious-type@latest/dist/harmonious-type.cjs.production.min.js) [![license](https://badgen.now.sh/badge/license/MIT)](./LICENSE) ![Release](https://github.com/chancestrickland/harmonious/workflows/Release/badge.svg)

</div>

<h4 align="center">
  Tools for painlessly creating harmonious topographic relationships.
</h4>


```js
const harmoniousType = new HarmoniousType({
  baseFontSize: 16,
  baseLineHeight: 1.3,
  headerLineHeight: 1.1,
  scaleRatio: 1.5,
  breakpoints: {
    600: {
      baseLineHeight: 1.6,
      headerLineHeight: 1.2,
      scaleRatio: 1.8,
    },
    1000: {
      baseFontSize: 18,
      scaleRatio: 2,
    },
    1600: {
      baseFontSize: 22,
    },
  },
});
```

<br>

[**TODO:** Link to docs]

---

[**TODO:** Include docs for latest release inline]

---

Hello! If you are reading this, and if you've perused through the code, you might notice that this looks somewhat similar to another popular library: `Typography.js`.

Typography is a great library. I've used it on various projects over the years and would use it again today. Though I had used tools and concepts in the past with Sass, digging into the source code for Typography is what exposed me to the beautiful math behind it all. I started this fork because I want to see those concepts expanded and learn more deeply about typographical rhythm through code. Additionally, there are some key things I'd like it to do a little differently in my experiment:

- Typography lacks support for reconfiguring important options at various breakpoints, making it difficult to staticly generate media queries. I would love to explore using CSS custom properties for rhythm units, but we will need to be able to produce static CSS while maintaining some of the trickier dynamic stuff.
- It feels too opinionated about things that aren't relevant to its core strength, which is establishing "vertical rhythm" between elements with a type-based grid. In most projects, colors, font families and font weights are likely alredy defined elsewhere, and I often find myself negating Typography's styles in these cases anyway. Perhaps these could be better considered as opt-in plugins instead?
- There are a variety of ways to add styles to a website these days. It'd be great to build an API that is more easily integrated with your project's existing style architecture.
- Development on Typography appears to have stalled as of late. Its core behavior is simple enough to re-create, so it seemed like a fun project to explore a new API and new possibilities.
- Could we componentize layout elements? I have some rough ideas here but am excited to explore.
- Would love to explore [fluid typography](https://css-tricks.com/snippets/css/fluid-typography/) as a simple opt-in feature.

This is very much in an exploratory phase and I will be updating the APIs and features rapidly for the next few weeks. If you ever had any cool ideas you wanted to see in Typography, feel free to open an issue here and let's explore together!

I will also be exploring other interesting projects that solve similar problems:
-  [Raster](https://github.com/rsms/raster)
-  [Simple Modular Scale](https://github.com/jxnblk/simple-modular-scale)
- [Typetura](https://typetura.com/)

---

## Current high-level status

I have replicated the core functionality I wanted from Typography and scaled back its ambitions. Removed plugins, style overrides, and any options not related to scaling. I also added a top-level option for `breakpoints` that will override any of the other top-level settings as the screen scales.

## Core todos:
- [X] ~~*Add support for breakpoint calculations*~~ [2020-05-17]
- [X] ~~*Remove most styles unrelated to spacing/scaling*~~ [2020-05-17]
- [X] ~~*Test output as CSS-in-JS and CSS*~~ [2020-05-17]
- [ ] Explore non-pixel breakpoints (these can be problematic but I want to make sure I've got a solid argument for the restriction)
- [ ] Use in a project and identify shortcomings
- [ ] Revisit plugins and themes
- [ ] Explore fluid typography
- [ ] Explore component exports in `harmonious-react`
- [ ] Write some docs when ideas are more fleshed out

## Project housekeeping:
- Use babel for tests
- Configure test build to allow testing either source files (for development) or bundles
