export type Dimensions = {
	width: number;
	height: number;
}


export function extractViewBoxDimensions(svgString: string): Dimensions | null {
	// capture viewBox value as a string
	const viewBoxRe = /viewBox="([^"]+)"/i;
	const match = viewBoxRe.exec(svgString);
	if (match) {
		const values = match[1].split(/\s+/).map(parseFloat);
		if (values.length === 4) {
			const width = values[2];
			const height = values[3];
			return { width, height };
		}
	}
	return null;
}


export function extractWidthHeight(svgString: string): Dimensions | null {
	const widthRe = /width="([\d.]+)"/;
	const widthMatch = widthRe.exec(svgString);
	const heightRe = /height="([\d.]+)"/;
	const heightMatch = heightRe.exec(svgString);
	if (widthMatch && heightMatch) {
		const width = parseFloat(widthMatch[1]);
		const height = parseFloat(heightMatch[1]);
		return { width, height };
	}
	return null;
}


export function extractDimensions(svgString: string): Dimensions | null {
	return (
		extractViewBoxDimensions(svgString)
		|| extractWidthHeight(svgString)
	);
}
