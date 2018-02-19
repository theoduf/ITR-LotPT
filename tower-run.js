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

const t_start = Date.now();

const html = document.querySelector('html');

const canv = document.getElementById('game');
const ctx = canv.getContext('2d');

canv.width = window.innerWidth;
canv.height = window.innerHeight;

/*
 * Resolution independent size of tower using the width of a single brick as reference unit.
 */

const num_bricks_around = 64;
const num_bricks_visible_half = Math.floor(0.25 * num_bricks_around);

// The width of a brick when viewed from the front is specified in radians.
const brickwidth_rad = 2 * Math.PI / num_bricks_around;

let towerradius_pu = 0;
for (let i = 0 ; i < num_bricks_visible_half ; i++)
{
	const w_frac_rad = Math.cos(((num_bricks_visible_half - i) / num_bricks_visible_half) * 0.5 * Math.PI);
	const brickwidth_foreshortened_dstpu = w_frac_rad;
	towerradius_pu += brickwidth_foreshortened_dstpu;
}

/*
 * Pixel sizes
 * TODO: Update when window is resized.
 */

// First approximation of tower radius in pixels.
let towerradius_px = Math.ceil(0.43 * 0.5 * canv.width);

// Full pixel size of bricks
const brickratio = 0.5;
const brickwidth_fullpx = 2 * Math.ceil(0.5 * towerradius_px / towerradius_pu);
const brickheight_fullpx = Math.ceil(brickwidth_fullpx * brickratio);

// Final calculation of tower radius in pixels.
towerradius_px = 0;
for (let i = 0 ; i < num_bricks_visible_half ; i++)
{
	const w_frac_rad = Math.cos(((num_bricks_visible_half - i) / num_bricks_visible_half) * 0.5 * Math.PI);
	const brickwidth_curr_foreshortened_dstpx = Math.ceil(brickwidth_fullpx * w_frac_rad);
	towerradius_px += brickwidth_curr_foreshortened_dstpx;
}

const towerstart_x_px = Math.ceil(canv.width / 2) - towerradius_px;
const towerend_x_px = Math.ceil(canv.width / 2) + towerradius_px;

// Max number of rows of bricks visible on screen at once are at the edges of the tower.
const h_frac_rad = Math.cos(0.25 * Math.PI);
const brickheight_outermost_dstpx = Math.ceil(brickheight_fullpx * h_frac_rad);
const num_rows_visible_outermost = Math.ceil(canv.height / brickheight_outermost_dstpx) + 2;

/*
 * Single brick
 */

const brick = document.createElement('canvas');
const bctx = brick.getContext('2d');

brick.width = brickwidth_fullpx;
brick.height = brickheight_fullpx;

bctx.fillStyle = '#999';
bctx.fillRect(0, 0, brick.width, brick.height);
bctx.strokeStyle = '#333';
bctx.lineWidth = 1 + Math.floor(brick.width / 25);
bctx.strokeRect(Math.floor(0.5 * bctx.lineWidth),
	Math.floor(0.5 * bctx.lineWidth),
	brick.width, brick.height);

//ctx.drawImage(brick, brickwidth_fullpx, brickheight_fullpx);

/*
 * Two rows of bricks with shadows and highlights.
 */

const atomic_ring = document.createElement('canvas');
const actx = atomic_ring.getContext('2d');

atomic_ring.width = num_bricks_around * brickwidth_fullpx;
atomic_ring.height = 2 * brickheight_fullpx;

actx.drawImage(brick, Math.ceil(0.5 * brickwidth_fullpx), 0,
	brickwidth_fullpx, brickheight_fullpx,
	0, 0, brickwidth_fullpx, brickheight_fullpx);

const fontsize = Math.ceil(0.5 * brickwidth_fullpx);
actx.font = fontsize + 'px serif';
actx.fillStyle = 'red';
for (let i = 0 ; i < num_bricks_around ; i++)
{
	// Top row.
	const curr_x_top = Math.floor(brickwidth_fullpx * (i + 0.5));
	actx.drawImage(brick,
		0, 0,
		brickwidth_fullpx, brickheight_fullpx,
		curr_x_top, 0,
		brickwidth_fullpx, brickheight_fullpx);

	// Bottom row.
	actx.drawImage(brick,
		0, 0,
		brickwidth_fullpx, brickheight_fullpx,
		brickwidth_fullpx * i, brickheight_fullpx,
		brickwidth_fullpx, brickheight_fullpx);

	// Brick-numbers (debug)
	/*
	actx.fillText(i,
		brickwidth_fullpx * i + Math.ceil(0.2 * brickwidth_fullpx),
		2 * brickheight_fullpx - Math.floor(0.2 * fontsize));
	*/
}

const a_middle_x = Math.floor(0.5 * atomic_ring.width);
const a_middle_y = Math.floor(0.5 * atomic_ring.height);

// Highlight
const grad_high = actx.createLinearGradient(0, a_middle_y, a_middle_x, a_middle_y);
grad_high.addColorStop(0, 'transparent');
grad_high.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
grad_high.addColorStop(1, 'transparent');
actx.fillStyle = grad_high;
actx.fillRect(0, 0, a_middle_x, atomic_ring.height);

// Shadow
const grad_shad = actx.createLinearGradient(a_middle_x, a_middle_y,
	atomic_ring.width, a_middle_y);
grad_shad.addColorStop(0, 'transparent');
grad_shad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
grad_shad.addColorStop(1, 'transparent');
actx.fillStyle = grad_shad;
actx.fillRect(a_middle_x, 0, a_middle_x, atomic_ring.height);

// Debug
ctx.drawImage(atomic_ring, 0, 0, atomic_ring.width, atomic_ring.height,
	0, 0, canv.width, atomic_ring.height);

/*
 * Slideable "megatexture".
 */

const sliding_bricks = document.createElement('canvas');
const sctx = sliding_bricks.getContext('2d');

sliding_bricks.width = 2 * atomic_ring.width;
sliding_bricks.height = atomic_ring.height * Math.floor(0.25 * num_rows_visible_outermost);

for (let i = 0 ; i < num_rows_visible_outermost ; i++)
{
	sctx.drawImage(atomic_ring, 0, i * atomic_ring.height);
	sctx.drawImage(atomic_ring, atomic_ring.width, i * atomic_ring.height);
}

//ctx.drawImage(sliding_bricks, towerstart_x_px, 0);
//ctx.drawImage(sliding_bricks, 0, 0, sliding_bricks.width, sliding_bricks.height,
//	towerstart_x_px, 0,
//	sliding_bricks.width * (brickheight_outermost_dstpx / brickheight_fullpx),
//	sliding_bricks.height * (brickheight_outermost_dstpx / brickheight_fullpx));
// Debug
ctx.drawImage(sliding_bricks, 0, 0, sliding_bricks.width, sliding_bricks.height,
	0, atomic_ring.height, canv.width, sliding_bricks.height);

/*
 * Distant background, equivalent of a skybox.
 */

const farbg = document.createElement('canvas');
const fctx = farbg.getContext('2d');

// Skybox covers 360 degrees, our view is showing 180 degrees.
// Additionally, like with the sliding bricks we draw two copies next to each other so we can slide over.
farbg.width = 4 * canv.width;
farbg.height = canv.height;

let sun = new Image();
sun.onload = () =>
{
	const sun_diam_srcpx = sun.width;
	const sun_radius_srcpx = Math.ceil(0.5 * sun_diam_srcpx);

	const sun_diam_dstpx = Math.floor(0.5 * canv.width);
	const sun_radius_dstpx = Math.ceil(0.5 * sun_diam_dstpx);

	// XXX: Sun goes in opposite direction so we place it 75% away from the *right* edge of each "skybox copy".

	fctx.drawImage(sun, 0, sun_radius_srcpx, sun_diam_srcpx, sun_radius_srcpx,
		Math.floor(0.25 * 2 * canv.width) - sun_radius_dstpx, 0, sun_diam_dstpx, sun_radius_dstpx);

	fctx.drawImage(sun, 0, sun_radius_srcpx, sun_diam_srcpx, sun_radius_srcpx,
		Math.floor(1.25 * 2 * canv.width) - sun_radius_dstpx, 0, sun_diam_dstpx, sun_radius_dstpx);

	// Debug
	ctx.drawImage(farbg, 0, 0, farbg.width, farbg.height,
		0, 0, canv.width, farbg.height);

	//render();
}
sun.src = 'assets/thirdparty/images/sun.svg';

/*
 * Render tower.
 */

let y = 0; // Unit: Pixels
let angle = 0; // Unit: radians

function renderTower ()
{
	const t_render_tower_begin = Date.now();

	let offs_x_left_dstpx = 0;
	let offs_x_right_dstpx = 0;
	for (let i = 0 ; i < num_bricks_visible_half ; i++)
	{
		const w_frac_rad = Math.cos(((num_bricks_visible_half - i) / num_bricks_visible_half) * 0.5 * Math.PI);
		const brickwidth_curr_foreshortened_dstpx = Math.ceil(brickwidth_fullpx * w_frac_rad);

		const h_frac_rad = Math.cos(((num_bricks_visible_half - i) / num_bricks_visible_half) * 0.25 * Math.PI);
		const brickheight_curr_perspective_dstpx = Math.ceil(brickheight_fullpx * h_frac_rad);

		const offs_x_srcpx = angle / (4 * Math.PI) * sliding_bricks.width;
		const offs_y_srcpx = y % (2 * brickheight_fullpx);

		offs_x_right_dstpx += brickwidth_curr_foreshortened_dstpx;

		const sliceheight_curr_dstpx = brickheight_curr_perspective_dstpx * 0.5 * num_rows_visible_outermost;

		const top_of_bottom_half_y_dstpx = Math.floor(canv.height / 2);
		const bottom_of_top_half_y_dstpx = canv.height - top_of_bottom_half_y_dstpx;

		/*
		 * Top half.
		 */

		// Left side
		ctx.drawImage(sliding_bricks,
			i * brickwidth_fullpx + offs_x_srcpx, -offs_y_srcpx,
			brickwidth_fullpx, sliding_bricks.height,
			towerstart_x_px + offs_x_left_dstpx, -sliceheight_curr_dstpx + bottom_of_top_half_y_dstpx,
			brickwidth_curr_foreshortened_dstpx, sliceheight_curr_dstpx);

		// Right side
		ctx.drawImage(sliding_bricks,
			(2 * num_bricks_visible_half - i - 1) * brickwidth_fullpx + offs_x_srcpx, -offs_y_srcpx,
			brickwidth_fullpx, sliding_bricks.height,
			towerend_x_px - offs_x_right_dstpx, -sliceheight_curr_dstpx + bottom_of_top_half_y_dstpx,
			brickwidth_curr_foreshortened_dstpx, sliceheight_curr_dstpx);

		/*
		 * Bottom half.
		 */

		// Left side
		ctx.drawImage(sliding_bricks,
			i * brickwidth_fullpx + offs_x_srcpx, 2 * brickheight_fullpx - offs_y_srcpx,
			brickwidth_fullpx, sliding_bricks.height,
			towerstart_x_px + offs_x_left_dstpx, top_of_bottom_half_y_dstpx,
			brickwidth_curr_foreshortened_dstpx, sliceheight_curr_dstpx);

		// Right side
		ctx.drawImage(sliding_bricks,
			(2 * num_bricks_visible_half - i - 1) * brickwidth_fullpx + offs_x_srcpx,
			2 * brickheight_fullpx - offs_y_srcpx,
			brickwidth_fullpx, sliding_bricks.height,
			towerend_x_px - offs_x_right_dstpx, top_of_bottom_half_y_dstpx,
			brickwidth_curr_foreshortened_dstpx, sliceheight_curr_dstpx);

		/*
		// Grid. Didn't bother to update the code for this right now because I don't need it very much.
		const xcolor = Math.ceil((brick_pair_num / num_bricks_visible_half) * 255);
		for (...)
		{
			const ycolor = Math.ceil(((j + num_rings_ydir_half) / (2 * num_rings_ydir_half + 1)) * 255);

			// Grid left half (debug)
			ctx.fillRect(towerstart_x_px + offset_dst_x_left - 2,
				dst_y + j * brickheight_foreshortened_dstpx - 2,
				4, 4);

			// Grid right half (debug)
			ctx.fillRect(towerend_x_px + offset_dst_x_right - 2,
				dst_y + j * brickheight_foreshortened_dstpx - 2,
				4, 4);
		}
		*/

		offs_x_left_dstpx += brickwidth_curr_foreshortened_dstpx;
	}

	const t_render_tower_end = Date.now();

	ctx.fillStyle = '#449';
	ctx.fillText('Tower rendered in ' + (t_render_tower_end - t_render_tower_begin) + ' ms', 16, 24);
}

let angular_velocity = 3 * brickwidth_rad; // Unit: rads / second
let angular_acceleration = 0; // Unit: rads / s^2

let vertical_velocity_pu = 3; // Unit: pu / second
let vertical_acceleration_pu = 0; // Unit: pu / s^2

let num_frames_rendered = 0;
let t_prev = null;
let dt = 0;
let dt_recent = new Array(480);

function render ()
{
	ctx.clearRect(0, 0, canv.width, canv.height);

	const offs_x_farbg_srcpx = (angle / (4 * Math.PI)) * farbg.width;

	ctx.drawImage(farbg, farbg.width - canv.width - offs_x_farbg_srcpx, 0, canv.width, canv.height,
		0, 0, canv.width, canv.height);

	renderTower();

	if (t_prev !== null)
	{
		ctx.fillStyle = '#449';
		num_recent_dt = (num_frames_rendered < 480) ? num_frames_rendered : 480;
		ctx.fillText('Current frame ' + dt + ' ms', 16, 36);
		ctx.fillText('Last 480 frames ' + Math.round(100 * 1000 / (dt_recent.reduce((acc, v) => acc + v) / num_recent_dt)) / 100 + ' FPS', 16, 48);
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
	y += vertical_velocity_pu * brickwidth_fullpx * dt / 1000;

	// TODO: Update game object positions.

	// TODO: Check collisions.

	render();

	t_prev = t_now;

	requestAnimationFrame(run);
}

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
