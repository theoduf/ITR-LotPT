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
const brickwidth_rad = 2 * Math.PI / 256;

let angular_velocity = 2.5 * brickwidth_rad; // Unit: radians / second
let angular_acceleration = 0; // Unit: rads / s^2

brick = document.createElement('canvas');
bctx = brick.getContext('2d');

brickratio = 0.5;
brick.width = 512;
brick.height = Math.floor(brickratio * brick.width);

bctx.fillStyle = '#999';
bctx.fillRect(0, 0, brick.width, brick.height);
bctx.strokeStyle = '#333';
bctx.lineWidth = Math.floor(brick.width / 10);
bctx.strokeRect(0.5, 0.5, brick.width, brick.height);

let angle = 0;

const t_start = Date.now();
let num_frames_rendered = 0;
let t_prev = t_start;
let dt = 0;
let dt_recent = new Array(480);

function render ()
{
	ctx.clearRect(0, 0, canv.width, canv.height);

	const towerwidth_px = Math.floor(0.8 * canv.width);
	const towerradius_px = Math.floor(0.5 * towerwidth_px);
	const towerstart_x_px = Math.floor((canv.width - towerwidth_px) / 2);

	const brickwidth_px = Math.floor(2 * Math.PI * towerradius_px * brickwidth_rad);
	const brickheight_px = Math.floor(brickratio * brickwidth_px);

	const middle_x_px = Math.floor(0.5 * canv.width);
	const middle_y_px = Math.floor(0.5 * canv.height);

	const brickoffs_x_pct = (angle % brickwidth_rad) / brickwidth_rad;
	const brickoffs_x_srcpx = Math.floor(brickoffs_x_pct * brick.width);

	ctx.fillStyle = '#333';
	ctx.fillRect(towerstart_x_px, 0, towerwidth_px, canv.height);

	// The two rows middle rows of bricks on screen have no vertical distortion.
	let curr_x = 0;
	for (let i = 0 ; i < 100 ; i++)
	{
		brickwidth_foreshortened_px = Math.floor(Math.cos((curr_x / towerradius_px) * 0.5 * Math.PI) * brickwidth_px);

		/*
		 * Top row.
		 */

		// Place brick on left half of screen.
		ctx.drawImage(brick,
			- 1.5 * brick.width + brickoffs_x_srcpx, 0,
			brick.width, brick.height,
			middle_x_px - (brickwidth_foreshortened_px + curr_x), middle_y_px - brickheight_px,
			brickwidth_foreshortened_px, brickheight_px);
		ctx.drawImage(brick,
			Math.floor(brickoffs_x_srcpx - 0.5 * brick.width), 0,
			brick.width, brick.height,
			middle_x_px - (brickwidth_foreshortened_px + curr_x), middle_y_px - brickheight_px,
			brickwidth_foreshortened_px, brickheight_px);
		ctx.drawImage(brick,
			Math.floor(0.5 * brick.width + brickoffs_x_srcpx), 0,
			brick.width, brick.height,
			middle_x_px - (brickwidth_foreshortened_px + curr_x), middle_y_px - brickheight_px,
			brickwidth_foreshortened_px, brickheight_px);

		// Place brick on right half of screen.
		ctx.drawImage(brick,
			- 1.5 * brick.width + brickoffs_x_srcpx, 0,
			brick.width, brick.height,
			middle_x_px + curr_x, middle_y_px - brickheight_px,
			brickwidth_foreshortened_px, brickheight_px);
		ctx.drawImage(brick,
			Math.floor(brickoffs_x_srcpx - 0.5 * brick.width), 0,
			brick.width, brick.height,
			middle_x_px + curr_x, middle_y_px - brickheight_px,
			brickwidth_foreshortened_px, brickheight_px);
		ctx.drawImage(brick,
			Math.floor(0.5 * brick.width + brickoffs_x_srcpx), 0,
			brick.width, brick.height,
			middle_x_px + curr_x, middle_y_px - brickheight_px,
			brickwidth_foreshortened_px, brickheight_px);

		/*
		 * Bottom row.
		 */

		// Place brick on left half of screen.
		ctx.drawImage(brick,
			brickoffs_x_srcpx, 0,
			brick.width, brick.height,
			middle_x_px - (brickwidth_foreshortened_px + curr_x), middle_y_px,
			brickwidth_foreshortened_px, brickheight_px);
		ctx.drawImage(brick,
			-brick.width + brickoffs_x_srcpx, 0,
			brick.width, brick.height,
			middle_x_px - (brickwidth_foreshortened_px + curr_x), middle_y_px,
			brickwidth_foreshortened_px, brickheight_px);

		// Place brick on right half of screen.
		ctx.drawImage(brick,
			brickoffs_x_srcpx, 0,
			brick.width, brick.height,
			middle_x_px + curr_x, middle_y_px,
			brickwidth_foreshortened_px, brickheight_px);
		ctx.drawImage(brick,
			-brick.width + brickoffs_x_srcpx, 0,
			brick.width, brick.height,
			middle_x_px + curr_x, middle_y_px,
			brickwidth_foreshortened_px, brickheight_px);

		curr_x += brickwidth_foreshortened_px;
	}

	ctx.fillStyle = '#449';
	const t_now = Date.now();
	ctx.fillText(num_frames_rendered + ' frames rendered in ' + (t_now - t_start) + ' ms', 16, 24);
	ctx.fillText('Avg. framerate ' + Math.floor(1000 / ((t_now - t_start) / (num_frames_rendered))) + ' FPS', 16, 36);
	num_recent_dt = (num_frames_rendered < 480) ? num_frames_rendered : 480;
	ctx.fillText('Last 480 frames ' +  Math.floor(1000 / (dt_recent.reduce((acc, v) => acc + v) / num_recent_dt)) + ' FPS', 16, 48);
	ctx.fillText('Current frame ' + dt + ' ms', 16, 60);
	num_frames_rendered++;
}

function run ()
{
	const t_now = Date.now();
	dt = t_now - t_prev;

	dt_recent.shift();
	dt_recent.push(dt);

	angle = (angle + angular_velocity * dt / 1000) % (2 * Math.PI);

	// TODO: Update game object positions.

	// TODO: Check positions.

	render();

	window.requestAnimationFrame(run);

	t_prev = t_now;
}

// TODO: Title screen.

// TODO: Settings screen where keybindings can be configured.

window.requestAnimationFrame(run);
