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
//const canv = document.createElement('canvas');
const ctx = canv.getContext('2d');

canv.width = window.innerWidth;
canv.height = window.innerHeight;

// TODO: Change canvas size when window is resized.

// The width of a brick when viewed from the front is specified in radians.
const num_bricks_around = 64;
const brickwidth_rad = 2 * Math.PI / num_bricks_around;

let angular_velocity = 3 * brickwidth_rad; // Unit: radians / second
let angular_acceleration = 0; // Unit: rads / s^2

// Bricks

brick = document.createElement('canvas');
bctx = brick.getContext('2d');

brickratio = 0.8;
brick.width = 64;
brick.height = Math.floor(brickratio * brick.width);

bctx.fillStyle = '#999';
bctx.fillRect(0, 0, brick.width, brick.height);
bctx.strokeStyle = '#333';
bctx.lineWidth = Math.floor(brick.width / 10);
bctx.strokeRect(0.5, 0.5, brick.width, brick.height);

// Rings of bricks

const ring = document.createElement('canvas');
//const ring = document.getElementById('ring');
const rctx = ring.getContext('2d');

ring.width = num_bricks_around * brick.width;
ring.height = 2 * brick.height;

rctx.drawImage(brick,
	Math.ceil(0.5 * brick.width), 0,
	brick.width, brick.height,
	0, 0,
	brick.width, brick.height);

for (let i = 0 ; i < num_bricks_around ; i++)
{
	ctx.fillStyle = '#333';
	ctx.fillRect(0, 0, ring.width, ring.height);

	/*
	 * Top row.
	 */

	const curr_x_top = Math.floor(brick.width * (i + 0.5));
	rctx.drawImage(brick,
		0, 0,
		brick.width, brick.height,
		curr_x_top, 0,
		brick.width, brick.height);

	/*
	 * Bottom row.
	 */

	rctx.drawImage(brick,
		0, 0,
		brick.width, brick.height,
		brick.width * i, brick.height,
		brick.width, brick.height);

	rctx.fillStyle = 'red';
	rctx.font = '24px serif';
	rctx.fillText(i, brick.width * i + 24, 1.5 * brick.height + 6)
}

/*
 * Highlight and shadow on the brick ring.
 */

const middle_x = Math.floor(0.5 * ring.width);
const middle_y = Math.floor(0.5 * ring.height);

const grad_high = ctx.createLinearGradient(0, middle_y, middle_x, middle_y);
grad_high.addColorStop(0, 'transparent');
grad_high.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
grad_high.addColorStop(1, 'transparent');
rctx.fillStyle = grad_high;
rctx.fillRect(0, 0, middle_x, ring.height);

const grad_shad = ctx.createLinearGradient(middle_x, middle_y, ring.width, middle_y);
grad_shad.addColorStop(0, 'transparent');
grad_shad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
grad_shad.addColorStop(1, 'transparent');
rctx.fillStyle = grad_shad;
rctx.fillRect(middle_x, 0, middle_x, ring.height);

// Game

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
	const towerend_x_px = towerstart_x_px + towerwidth_px;

	/*
	ctx.fillStyle = '#333';
	ctx.fillRect(towerstart_x_px, 0, towerwidth_px, canv.height);
	*/

	const brickwidth_dstpx = 64;
	const brickheight_dstpx = Math.floor(brickwidth_dstpx * brickratio);

	const offs_x_pct = angle / (2 * Math.PI);
	const src_offs_x_by_angle_px = offs_x_pct * ring.width;

	const num_bricks_visible_half = Math.floor(0.25 * num_bricks_around);

	let dstpos_x_px = 0;

	for (let brick_pair_num = 0 ; brick_pair_num < num_bricks_visible_half ; brick_pair_num++)
	{
		const brickwidth_foreshortened_dstpx = Math.ceil(brickwidth_dstpx *
			Math.cos((brick_pair_num / num_bricks_visible_half) * 0.5 * Math.PI));

		const dst_y = Math.floor(0.5 * canv.height) - brickheight_dstpx;

		// Right half
		ctx.drawImage(ring,
			src_offs_x_by_angle_px + Math.floor(brick_pair_num * brick.width), 0,
			brick.width, ring.height,
			Math.floor(0.5 * canv.width) + dstpos_x_px, dst_y,
			brickwidth_foreshortened_dstpx, brickheight_dstpx);

		dstpos_x_px += brickwidth_foreshortened_dstpx;

		// Left half
		ctx.drawImage(ring,
			src_offs_x_by_angle_px - Math.floor((brick_pair_num + 1) * brick.width), 0,
			brick.width, ring.height,
			Math.floor(0.5 * canv.width) - dstpos_x_px, dst_y,
			brickwidth_foreshortened_dstpx, brickheight_dstpx);
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
