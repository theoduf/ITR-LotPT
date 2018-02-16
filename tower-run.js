/*
 * Copyright (c) 2018 Erik Nordstrøm <erik@nordstroem.no>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

const html = document.querySelector('html');

const canv = document.getElementById('game');
const ctx = canv.getContext('2d');

canv.width = window.innerWidth;
canv.height = window.innerHeight;

// TODO: Change canvas size when window is resized.

// The width of a brick when viewed from the front is specified in radians.
const brickwidth_rad = 2 * Math.PI / 360;

const angular_velocity = 5 * brickwidth_rad; // Unit: radians / second

brick = document.createElement('canvas');
bctx = brick.getContext('2d');

brickratio = 0.5;
brick.width = 512;
brick.height = brickratio * brick.width;

bctx.fillRect(0, 0, brick.width, brick.height);
bctx.strokeRect(0, 0, brick.width, brick.height);

function render ()
{
	const towerwidth_px = 0.8 * canv.width;
	const towerradius_px = 0.5 * towerwidth_px;

	const brickwidth_px = 2 * Math.PI * towerradius_px * brickwidth_rad;
	const brickheight_px = brickratio * brickwidth_px;

	const middle_x_px = canv.width / 2;
	const middle_y_px = canv.height / 2;

	ctx.drawImage(brick, 0, 0, brick.width, brick.height,
		middle_x_px, middle_y_px, brickwidth_px, brickheight_px);
}

function run ()
{
	// TODO: Update game object positions.

	// TODO: Check positions.

	render();

	window.requestAnimationFrame(run);
}

// TODO: Title screen.

// TODO: Settings screen where keybindings can be configured.

window.requestAnimationFrame(run);
