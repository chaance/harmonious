<div align="center">
  <img src="https://raw.githubusercontent.com/chancestrickland/harmonious/master/static/harmonious.svg" width="440" height="98" alt="Harmonious" />
</div>

<div align="center">

[![Latest Release](https://img.shields.io/npm/v/harmonious-type.svg)](https://npm.im/harmonious-type) [![gzip size](http://img.badgesize.io/https://unpkg.com/harmonious-type@latest/dist/harmonious-type.cjs.production.min.js?compression=gzip)](https://unpkg.com/harmonious-type@latest/dist/harmonious-type.cjs.production.min.js) [![license](https://badgen.now.sh/badge/license/MIT)](./LICENSE)

</div>

<h4 align="center">
  Tools for painlessly creating harmonious topographic relationships.
</h4>

<br>

[**TODO:** Link to docs]

---

[**TODO:** Include docs for latest release inline]

---

Hello! If you are reading this, I assume you're curious as to why I appear to be creating a library that essentially does the same thing as another popular library, even using much of the same code. At least, you would probably be wondering that if you are familiar with Typography.js.

Typography is a great library. I've used it on various projects over the years and would use it again today. At the same time, there are some things I'd like it to do a little differently:

- It lacks support for reconfiguring important options at various breakpoints, making it difficult to staticly generate media queries. I would love to explore using CSS custom properties for rhythm units, but we will need to be able to produce static CSS while maintaining some of the trickier dynamic stuff.
- It feels too opinionated about things that aren't relevant to its core strength, which is the idea of "vertical rhythm" between typographic elements and components. In most projects, colors, font families and font weights are likely alredy defined elsewhere, and I often find myself negating Typography's styles in these cases anyway. Perhaps these could be better considered as opt-in plugins instead?
- There are a variety of ways to add styles to a website these days. It'd be great to build an API that is more easily integrated with your project's existing style architecture.
- Development on Typography appears to have stalled as of late. Its core behavior is simple enough to re-create, so it seemed like a fun project to explore a new API and new possibilities.
- Could we componentize layout elements? I have some rough ideas here but am excited to explore.
- Would love to explore [fluid typography](https://css-tricks.com/snippets/css/fluid-typography/) as a simple opt-in feature.

This is very much in an exploratory phase and I will be updating the APIs and features rapidly for the next few weeks. If you ever had any cool ideas you wanted to see in Typography, feel free to open an issue here and let's explore together!

TODOS:
- [X] ~~*Add support for breakpoint calculations*~~ [2020-05-17]
- [X] ~~*Remove most styles unrelated to spacing/scaling*~~ [2020-05-17]
- [X] ~~*Test output as CSS-in-JS and CSS*~~ [2020-05-17]
- [ ] Use in a project and identify shortcomings
- [ ] Revisit plugins and themes
- [ ] Explore fluid typography
- [ ] Explore component exports in `harmonious-react`
