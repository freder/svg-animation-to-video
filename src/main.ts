import fs from 'fs';
import path from 'path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import { rimraf } from 'rimraf';

import { extractDimensions } from './utils';


const args = yargs(hideBin(process.argv))
	.option('input', {
		alias: 'i',
		type: 'string',
		description: 'Input .svg file',
	})
	.option('fps', {
		type: 'number',
		description: 'Capture and output FPS',
		default: 30,
	})
	.option('duration', {
		alias: 'd',
		type: 'number',
		description: 'Duration in seconds',
	})
	.parseSync();

const filePath = args.input as string;
const fps = args.fps as number;
const duration = args.duration as number;

const basenameNoExt = path.basename(filePath, '.svg');
const filePathAbs = path.resolve(filePath);
console.log(filePathAbs);

const frameDurationMs = 1000 / fps;
const outputDurationMs = duration * 1000;
const totalFrames = Math.round(outputDurationMs / frameDurationMs);
const zeroPadding = totalFrames.toString().length;
const framesOutputDir = 'frames';
const videoOutputFilePath = `${basenameNoExt}.mov`;
const ffmpegOutputOpts = [
	'-r', fps.toString(),
	'-c:v', 'prores_ks',
	'-profile:v', '4444', // with alpha
	'-pix_fmt', 'yuva444p10le', // 10-bit color
];

main();


async function main() {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	const svgFilePath = `file://${filePathAbs}`;
	await page.goto(svgFilePath, { waitUntil: 'networkidle0' });

	const svgStr = fs.readFileSync(filePathAbs).toString();
	const dims = extractDimensions(svgStr);
	console.log(dims);
	await page.setViewport(dims);

	rimraf.sync(framesOutputDir);
	fs.mkdirSync(framesOutputDir);

	for (let i = 0; i < totalFrames; i++) {
		const frameNumber = String(i).padStart(zeroPadding, '0');
		const currentTime = i * frameDurationMs;

		const currentTimeSec = currentTime / 1000;
		await page.evaluate((time) => {
			const svg = document.documentElement as unknown as SVGSVGElement;
			svg.setCurrentTime(time);

			const svgs = svg.querySelectorAll('svg');
			for (const svg of svgs) {
				svg.setCurrentTime(time);
			}
		}, currentTimeSec);

		await page.screenshot({
			path: path.join(framesOutputDir, `frame_${frameNumber}.png`),
			omitBackground: true,
		});

		console.log(`Captured frame ${i + 1} of ${totalFrames} at time ${(currentTimeSec).toFixed(2)}s`);
	}

	await browser.close();

	console.log('generating video...');
	generateVideo(fps, framesOutputDir);
}


function generateVideo(fps: number, framesDir: string) {
	ffmpeg(
		path.join(framesDir, `frame_%0${zeroPadding}d.png`)
	)
		.inputOptions([
			'-y',
			'-framerate', fps.toString(),
		])
		.outputOptions(ffmpegOutputOpts)
		.output(videoOutputFilePath)
		.on('start', (commandLine) => {
			console.log('FFmpeg process started:', commandLine);
		})
		.on('progress', (progress) => {
			console.log(`Processing: ${progress.percent?.toFixed(1)}% done`);
		})
		.on('end', () => {
			console.log('Processing finished successfully');
		})
		.on('error', (err, stdout, stderr) => {
			console.log('Error occurred:', err.message);
			console.log('ffmpeg output:', stdout);
			console.log('ffmpeg stderr:', stderr);
		})
		.run();
}
