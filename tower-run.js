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

// Debug
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
/*
ctx.drawImage(atomic_ring, 0, 0, atomic_ring.width, atomic_ring.height,
	0, 0, canv.width, atomic_ring.height);
*/

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

// Debug
/*
ctx.drawImage(sliding_bricks, 0, 0, sliding_bricks.width, sliding_bricks.height,
	0, atomic_ring.height, canv.width, sliding_bricks.height);
*/

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
	const sun_offs_y_srcpx = Math.ceil(0.42 * sun_diam_srcpx);

	const sun_diam_dstpx = Math.floor(0.35 * canv.width);
	const sun_radius_dstpx = Math.ceil(0.5 * sun_diam_dstpx);
	const sun_offs_y_dstpx = Math.ceil(0.42 * sun_diam_dstpx);

	// XXX: Sun goes in opposite direction so we place it 75% away from the *right* edge of each "skybox copy".

	fctx.drawImage(sun,
		0, sun_offs_y_srcpx,
		sun_diam_srcpx, sun_diam_srcpx - sun_offs_y_srcpx,
		Math.floor(0.25 * 2 * canv.width) - sun_radius_dstpx, 0,
		sun_diam_dstpx, sun_diam_dstpx - sun_offs_y_dstpx);

	fctx.drawImage(sun,
		0, sun_offs_y_srcpx,
		sun_diam_srcpx, sun_diam_srcpx - sun_offs_y_srcpx,
		Math.floor(1.25 * 2 * canv.width) - sun_radius_dstpx, 0,
		sun_diam_dstpx, sun_diam_dstpx - sun_offs_y_dstpx);

	// Debug
	//ctx.drawImage(farbg, 0, 0, farbg.width, farbg.height,
	//	0, 0, canv.width, farbg.height);

	//render();
}
sun.src = 'assets/thirdparty/images/sun.svg';

/*
 * Render tower.
 */

let y = 0; // Unit: Pixels
let angle = 0; // Unit: radians

const middlex = canv.width / 2;
const middley = canv.height / 2;

const x_max = 25, y_max = 25;
const vertical_distortion = 0.05;
const horizontal_distortion = 0.65;

const angle_max_y_distortion = Math.acos(1 - vertical_distortion);
const angle_max_x_distortion = Math.acos(1 - horizontal_distortion);

function distortionXY (x, y)
{
	const distortion_x = Math.cos(angle_max_x_distortion * x / x_max);// / (1 - horizontal_distortion);
	const distortion_y = Math.cos(angle_max_y_distortion * y / y_max);// / (1 - vertical_distortion);

	return distortion_x + distortion_y;
}

function renderTower ()
{
	const t_render_tower_begin = Date.now();

	let distorted_x_prev = 0, distorted_y_prev = 0;

	ctx.strokeStyle = "#00ffff";
	ctx.beginPath();
	for (let y = 0 ; y < y_max ; y++)
	{
		ctx.moveTo(middlex, middley - middley * y / y_max);

		ctx.fillStyle = "rgb(0, 0, " + 255 * y / y_max + ")";

		for (let x = 0 ; x < x_max ; x++)
		{
			const s = distortionXY(x, y);

			const distorted_x = middlex + s * x * 10;
			const distorted_y = middley - s * y * 10;

			ctx.fillRect(distorted_x - 1, distorted_y - 1, 2, 2);

			distorted_x_prev = distorted_x;
			distorted_y_prev = distorted_y;

			ctx.lineTo(distorted_x_prev, distorted_y_prev);
		}
	}
	ctx.stroke();

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

	ctx.strokeStyle = "#ffff00";
	ctx.beginPath();
	ctx.moveTo(middlex, 0);
	ctx.lineTo(middlex, canv.height);
	ctx.moveTo(0, middley);
	ctx.lineTo(canv.width, middley);
	ctx.stroke();

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
