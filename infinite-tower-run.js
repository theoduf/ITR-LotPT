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

function assert (cond)
{
	if (!cond)
	{
		throw "Assertion failed!";
	}
}

const t_start = Date.now();

const html = document.querySelector('html');

const canv = document.getElementById('game');
const ctx = canv.getContext('2d');

canv.width = window.innerWidth;
canv.height = window.innerHeight;

const tcanv = document.createElement('canvas');
const gl = tcanv.getContext('webgl');

tcanv.width = window.innerWidth;
tcanv.height = window.innerHeight;

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
}
sun.src = 'assets/thirdparty/images/sun.svg';

/*
 * Data for on-screen objects.
 */

// TOWER

const brickheight_pu = 1; // Brick height is the base unit.
const brickwidth_pu = 2;  // Brick width must be an integer multiple of brickheight.

const num_bricks_visible_quarter_ring = 16;
const num_bricks_visible_half_ring = 2 * num_bricks_visible_quarter_ring;
const num_bricks_tower_ring = 2 * num_bricks_visible_half_ring;

const tower_diameter_relative_to_screen_width = 0.5;

const flatland_extent_x_pu = Math.floor(
	num_bricks_visible_half_ring / (brickwidth_pu * tower_diameter_relative_to_screen_width));
let flatland_extent_y_pu; // Screen-ratio dependent.

let num_bricks_visible_tower_vertical;

const flatland_tower_positive_extent_x_pu = num_bricks_visible_half_ring + 2;
let flatland_tower_positive_extent_y_pu;

let towerverts_quads_flatland_pu_coords;

function recalculateWorldObjectData ()
{
	flatland_extent_y_pu = flatland_extent_x_pu * window.innerHeight / window.innerWidth;

	num_bricks_visible_tower_vertical = Math.ceil(flatland_extent_y_pu / brickheight_pu);

	// XXX: We put the same number of bricks above and below origin.
	flatland_tower_positive_extent_y_pu = Math.ceil(num_bricks_visible_tower_vertical / 2);

	towerverts_quads_flatland_pu_coords = new Float32Array(
		  4 // Four verts in a quad
		* 3 // Three coords in a vert
		* flatland_tower_positive_extent_x_pu // Extent of positive x-axis
		* 2 // Both positive and negative x-direction
		* flatland_tower_positive_extent_y_pu // Extent of positive y-axis
		* 2 /* Both positive and negative y-direction */
		/ (brickwidth_pu * brickheight_pu));

	function gen_verts_for_brick(idx_topleft, xleft, ytop, xsign, ysign)
	{
		// Top left corner
		towerverts_quads_flatland_pu_coords[idx_topleft + 0] = xleft;
		towerverts_quads_flatland_pu_coords[idx_topleft + 1] = ytop;
		//towerverts_quads_flatland_pu_coords[idx_topleft + 2] = 0;

		// Bottom left corner
		towerverts_quads_flatland_pu_coords[idx_topleft + 3] = xleft;
		towerverts_quads_flatland_pu_coords[idx_topleft + 4] = ytop - ysign * brickheight_pu;
		//towerverts_quads_flatland_pu_coords[idx_topleft + 5] = 0;

		// Bottom right corner
		towerverts_quads_flatland_pu_coords[idx_topleft + 6] = xleft - xsign * brickwidth_pu;
		towerverts_quads_flatland_pu_coords[idx_topleft + 7] = ytop - ysign * brickheight_pu;
		//towerverts_quads_flatland_pu_coords[idx_topleft + 8] = 0;

		// Top right corner
		towerverts_quads_flatland_pu_coords[idx_topleft + 9] = xleft - xsign * brickwidth_pu;
		towerverts_quads_flatland_pu_coords[idx_topleft + 10] = ytop;
		//towerverts_quads_flatland_pu_coords[idx_topleft + 11] = 0;
	}

	let odd = true;
	let k = 0;
	for (let bricknum_y = 0 ;
		bricknum_y < flatland_tower_positive_extent_y_pu / brickheight_pu ;
		bricknum_y++)
	{
		for (let bricknum_x = 0 ;
			bricknum_x < flatland_tower_positive_extent_x_pu / brickwidth_pu ;
			bricknum_x++)
		{
			/*
			 * Array holds coordinates of verts of quads row by row top to bottom.
			 */

			// 2nd quadrant (top left)
			i1 = // Index into the array for the current quadgon in 2nd quadrant
				  bricknum_y // Row number inside of 2nd quadrant
			        * flatland_tower_positive_extent_x_pu / brickwidth_pu // Each row inside of 2nd quadrant has this many quads
				* 2 // additionally we have the 1st quadrant.
				* 4 * 3 // Then we have the number of verts in a quad and number of coords in a vert.
				+ bricknum_x // Finally how far into the current row of the quadrant
				* 4 * 3; // taking into account the number of verts and coords in this row as well.

			const xleft1 = -(flatland_tower_positive_extent_x_pu - bricknum_x * brickwidth_pu);
			const ytop1 = flatland_tower_positive_extent_y_pu - bricknum_y * brickheight_pu;
			gen_verts_for_brick(i1, xleft1, ytop1, -1, 1);

			// 1st quadrant (top right)
			i0 = i1 + flatland_tower_positive_extent_x_pu / brickwidth_pu
				// It's the same index as i1 except one quadrant row further in
				* 4 * 3; // account for verts and coords for the quadrant row.

			const xleft0 = bricknum_x * brickwidth_pu;
			const ytop0 = flatland_tower_positive_extent_y_pu - bricknum_y * brickheight_pu;
			gen_verts_for_brick(i0, xleft0, ytop0, 1, 1);

			// 3rd quadrant (bottom left)
			i2 = i1 + towerverts_quads_flatland_pu_coords.length / 2;
				// Same offset as i1 except halfway throught the array further in.

			const xleft2 = -(flatland_tower_positive_extent_x_pu - bricknum_x * brickwidth_pu);
			const ytop2 = -(bricknum_y * brickheight_pu);
			gen_verts_for_brick(i2, xleft2, ytop2, -1, -1);

			// 3rd quadrant (bottom left)
			i3 = i0 + towerverts_quads_flatland_pu_coords.length / 2;
				// Likewise with 4th quadrant in relation to first quadrant.

			const xleft3 = bricknum_x * brickwidth_pu;
			const ytop3 = -(bricknum_y * brickheight_pu);
			gen_verts_for_brick(i3, xleft3, ytop3, 1, -1);
		}
	}
}

recalculateWorldObjectData();

// TODO: Recalculate on resize after timeout.

/*
 * Screen data.
 */

let unitpx;
let middlex;
let middley;

function recalculateScreenData ()
{
	unitpx = tower_diameter_relative_to_screen_width * window.innerWidth / num_bricks_visible_half_ring ;
	middlex = canv.width / 2;
	middley = canv.height / 2;
}

recalculateScreenData();

// TODO: Recalculate on resize after timeout.

/*
 * Render tower.
 */

let y = 0; // Unit: Pixels
let angle = 0; // Unit: radians

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

function renderMesh (verts)
{
	ctx.strokeStyle = "#00ffff";
	ctx.beginPath();
	for (let i = 0 ; i < verts.length ; i += 12)
	{
		const p0 = { 'x': middlex + unitpx * verts[i], 'y': middley + unitpx * verts[i +  1] };
		ctx.moveTo(p0.x, p0.y);

		const p1 = { 'x': middlex + unitpx * verts[i + 3], 'y': middley + unitpx * verts[i +  4] };
		ctx.lineTo(p1.x, p1.y);

		const p2 = { 'x': middlex + unitpx * verts[i + 6], 'y': middley + unitpx * verts[i +  7] };
		ctx.lineTo(p2.x, p2.y);

		const p3 = { 'x': middlex + unitpx * verts[i + 9], 'y': middley + unitpx * verts[i + 10] };
		ctx.lineTo(p3.x, p3.y);

		ctx.lineTo(p0.x, p0.y);
	}
	ctx.stroke();

	/*(
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
	*/
}

function renderTower ()
{
	const t_render_tower_begin = Date.now();

	let distorted_x_prev = 0, distorted_y_prev = 0;

	renderMesh(towerverts_quads_flatland_pu_coords);

	const t_render_tower_end = Date.now();

	ctx.fillStyle = '#449';
	ctx.fillText('Tower rendered in ' + (t_render_tower_end - t_render_tower_begin) + ' ms', 16, 24);
}

let angular_velocity_pu = 3; // Unit: pu / second
let angular_acceleration_pu = 0; // Unit: pu / s^2

let vertical_velocity_pu = 3; // Unit: pu / second
let vertical_acceleration_pu = 0; // Unit: pu / s^2

let num_frames_rendered = 0;
let t_prev = null;
let dt = 0;
const dt_recent = new Array(240);

function render ()
{
	ctx.clearRect(0, 0, canv.width, canv.height);

	const offs_x_farbg_srcpx = (angle / (4 * Math.PI)) * farbg.width;

	ctx.drawImage(farbg, farbg.width - canv.width - offs_x_farbg_srcpx, 0, canv.width, canv.height,
		0, 0, canv.width, canv.height);

	renderTower();

	ctx.strokeStyle = "#ffff00";
	ctx.beginPath();
	ctx.moveTo(middlex, 0);
	ctx.lineTo(middlex, canv.height);
	ctx.moveTo(0, middley);
	ctx.lineTo(canv.width, middley);
	ctx.stroke();

	ctx.fillStyle = '#449';
	ctx.fillText('Current frame ' + dt + ' ms', 16, 36);
	if (t_prev !== null)
	{
		if (num_frames_rendered > dt_recent.length)
		{
			ctx.fillText('Last ' + dt_recent.length + ' frames ' + Math.round(100 * 1000 / (dt_recent.reduce((acc, v) => acc + v) / dt_recent.length)) / 100 + ' FPS', 16, 48);
		}
		else
		{
			ctx.fillText('Last ' + num_frames_rendered + ' frames ' + Math.round(100 * 1000 / (dt_recent.slice(dt_recent.length - num_frames_rendered).reduce((acc, v) => acc + v) / num_frames_rendered)) / 100 + ' FPS', 16, 48);
		}
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

	angle = (angle + (angular_velocity_pu / unitpx) * dt / 1000) % (2 * Math.PI);
	y += (vertical_velocity_pu / unitpx) * dt / 1000;

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
	num_frames_rendered = 0;
	stopped = false;
	run();
}

start();

window.onfocus = start;
window.onblur = stop;
