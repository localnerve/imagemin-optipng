import {Buffer} from 'node:buffer';
import fs from 'node:fs/promises';
import {execa} from 'execa';
import tempfile from 'tempfile';
import isPng from 'is-png';
import optipng from 'optipng-bin';

const main = options => async buffer => {
	options = {
		optimizationLevel: 3,
		bitDepthReduction: true,
		colorTypeReduction: true,
		paletteReduction: true,
		interlaced: false,
		errorRecovery: true,
		...options,
	};

	if (!Buffer.isBuffer(buffer)) {
		throw new TypeError('Expected a buffer');
	}

	if (!isPng(buffer)) {
		return buffer;
	}

	const outputFile = tempfile();
	const inputFile = tempfile();

	const arguments_ = [
		'-strip',
		'all',
		'-clobber',
		'-o',
		options.optimizationLevel,
		'-out',
		outputFile,
	];

	if (options.errorRecovery) {
		arguments_.push('-fix');
	}

	if (!options.bitDepthReduction) {
		arguments_.push('-nb');
	}

	if (typeof options.interlaced === 'boolean') {
		arguments_.push('-i', options.interlaced ? '1' : '0');
	}

	if (!options.colorTypeReduction) {
		arguments_.push('-nc');
	}

	if (!options.paletteReduction) {
		arguments_.push('-np');
	}

	await fs.writeFile(inputFile, buffer);
	arguments_.push(inputFile);

	await execa(optipng, arguments_);

	const result = await fs.readFile(outputFile);

	await fs.rm(outputFile, {force: true});
	await fs.rm(inputFile, {force: true});

	return result;
};

export default main;
