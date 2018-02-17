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

let angular_velocity = 8 * brickwidth_rad; // Unit: radians / second
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

rctx.fillStyle = '#333';
rctx.fillRect(0, 0, ring.width, ring.height);

rctx.drawImage(brick,
	Math.ceil(0.5 * brick.width), 0,
	brick.width, brick.height,
	0, 0,
	brick.width, brick.height);

for (let i = 0 ; i < num_bricks_around ; i++)
{
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

let num_frames_rendered = 0;
let t_prev;
let dt = 0;
let dt_recent = new Array(480);

function bricks (angle)
{
	const brickwidth_dstpx = 64;
	const brickheight_dstpx = Math.floor(brickwidth_dstpx * brickratio);

	const num_bricks_visible_half = Math.floor(0.25 * num_bricks_around);

	const offs_x_pct = angle / (2 * Math.PI);
	const src_offs_x_by_angle_px = offs_x_pct * ring.width;

	// Number of rings on each half side of middle ring.
	// TODO: Calculate so that it covers the full height of the monitor.
	const num_rings_ydir_half = 7;

	const dst_y = Math.floor(0.5 * canv.height) - brickheight_dstpx;

	let offset_dst_x_right = -brickwidth_dstpx;
	let offset_dst_x_left = 0;

	for (let brick_pair_num = 0 ; brick_pair_num < num_bricks_visible_half ; brick_pair_num++)
	{
		const w_frac_rad = Math.cos((brick_pair_num / num_bricks_visible_half) * 0.5 * Math.PI);
		console.log(w_frac_rad);
		const brickwidth_foreshortened_dstpx = Math.ceil(brickwidth_dstpx * w_frac_rad);

		const h_frac_rad = Math.cos((brick_pair_num / num_bricks_visible_half) * 0.25 * Math.PI);
		const brickheight_foreshortened_dstpx = Math.ceil(brickheight_dstpx * h_frac_rad);

		offset_dst_x_right += brickwidth_foreshortened_dstpx;
		offset_dst_x_left -= brickwidth_foreshortened_dstpx;

		for (let j = -num_rings_ydir_half ; j < num_rings_ydir_half + 2 ; j++)
		{
			// Right half
			ctx.drawImage(ring,
				src_offs_x_by_angle_px + Math.floor(brick_pair_num * brick.width), 0,
				brick.width, ring.height,
				Math.floor(0.5 * canv.width) + offset_dst_x_right,
				dst_y + j * brickheight_foreshortened_dstpx,
				brickwidth_foreshortened_dstpx, brickheight_foreshortened_dstpx);

			ctx.fillStyle = 'blue';
			ctx.fillRect(Math.floor(0.5 * canv.width) + offset_dst_x_right - 2,
				dst_y + j * brickheight_foreshortened_dstpx - 2,
				4, 4);

			// Left half
			ctx.drawImage(ring,
				src_offs_x_by_angle_px - Math.floor((brick_pair_num + 1) * brick.width), 0,
				brick.width, ring.height,
				Math.floor(0.5 * canv.width) + offset_dst_x_left - 2,
				dst_y + j * brickheight_foreshortened_dstpx - 2,
				brickwidth_foreshortened_dstpx, brickheight_foreshortened_dstpx);

			ctx.fillStyle = 'orange';
			ctx.fillRect(Math.floor(0.5 * canv.width) + offset_dst_x_left - 2,
				dst_y + j * brickheight_foreshortened_dstpx - 2,
				4, 4);
		}
	}
}

function render ()
{
	ctx.clearRect(0, 0, canv.width, canv.height);

	const towerwidth_px = Math.floor(0.8 * canv.width);
	const towerradius_px = Math.floor(0.5 * towerwidth_px);
	const towerstart_x_px = Math.floor((canv.width - towerwidth_px) / 2);
	const towerend_x_px = towerstart_x_px + towerwidth_px;

	if (angle < 0.5 * Math.PI)
	{
		bricks(2 * Math.PI + angle);
	}

	bricks(angle);

	if (angle > (3 / 4) * 2 * Math.PI)
	{
		bricks(angle - 2 * Math.PI);
	}

	if (t_prev !== null)
	{
		ctx.fillStyle = '#449';
		const t_now = Date.now();
		num_recent_dt = (num_frames_rendered < 480) ? num_frames_rendered : 480;
		ctx.fillText('Last 480 frames ' +  Math.floor(1000 / (dt_recent.reduce((acc, v) => acc + v) / num_recent_dt)) + ' FPS', 16, 24);
		ctx.fillText('Current frame ' + dt + ' ms', 16, 36);
	}

	num_frames_rendered++;
}

let stopped = false;

function run ()
{
	if (stopped)
	{
		return;
	}

	const t_now = Date.now();

	if (t_prev !== null)
	{
		dt = t_now - t_prev;

		dt_recent.shift();
		dt_recent.push(dt);
	}

	angle = (angle + angular_velocity * dt / 1000) % (2 * Math.PI);

	// TODO: Update game object positions.

	// TODO: Check positions.

	render();

	t_prev = t_now;

	window.requestAnimationFrame(run);
}

// TODO: Title screen.

// TODO: Settings screen where keybindings can be configured.

function stop ()
{
	stopped = true;
}

function start ()
{
	t_prev = null;
	dt_recent.fill(0);
	num_frames_rendered = 0;
	stopped = false;
	run();
}

start();
