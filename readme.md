Renders animated SVGs to video using Puppeteer and FFmpeg.
Only tested with [SMIL](https://developer.mozilla.org/en-US/docs/Web/SVG/SVG_animation_with_SMIL) animations so far.


# Setup
```shell
npm install
```

# Run
```shell
npx vite-node src/main.ts \
	--input=../animation.svg \
	--duration=20 \
	--fps=30
```

This will create `animation.mov` in the same directory.
The codec used is ProRes 422 HQ, 10 Bit.
