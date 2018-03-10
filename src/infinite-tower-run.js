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

const title = document.title;

const t_start = Date.now();

const html = document.querySelector('html');

const canv = document.getElementById('game');
const ctx = canv.getContext('2d');

const tcanv = document.createElement('canvas');
const gl = tcanv.getContext('webgl');

/*
 * Distant background, equivalent of a skybox.
 */

let sunsvg;
const farbg = document.createElement('canvas');
const fctx = farbg.getContext('2d');

/*
 * Distortion
 */

const vertical_distortion = 0;
const horizontal_distortion = 1;

const angle_max_y_distortion = Math.acos(1 - vertical_distortion);
const angle_max_x_distortion = Math.acos(1 - horizontal_distortion);

let max_distortion_product;

function distortionXY (x, y)
{
	const distortion_x = Math.cos(angle_max_x_distortion * x / flatland_extent_x_pu);
	const distortion_y = Math.cos(angle_max_y_distortion * y / flatland_extent_y_pu);

	return (distortion_x * distortion_y) * max_distortion_product;
}

function distortMesh2D (vertex3d_points_xyz)
{
	const distorted_vertex3d_points_xyz = new Float32Array(vertex3d_points_xyz.length);

	for (let i = 0 ; i < vertex3d_points_xyz.length ; i += 3)
	{
		const x = vertex3d_points_xyz[i];
		const y = vertex3d_points_xyz[i + 1];

		const s = distortionXY(x, y);

		distorted_vertex3d_points_xyz[i] = s * x;
		distorted_vertex3d_points_xyz[i + 1] = s * y;
		//distorted_vertex3d_points_xyz[i + 2] = vertex3d_points_xyz[i + 2];
	}

	return distorted_vertex3d_points_xyz;
}

/*
 * Screen data.
 */

let unitpx;
let middlex;
let quarterx;
let middley;

function recalculateScreenData ()
{
	unitpx = tower_diameter_relative_to_screen_width * canv.width / num_bricks_visible_half_ring ;
	middlex = canv.width / 2;
	quarterx = canv.width / 4;
	middley = canv.height / 2;
}

/*
 * Data for on-screen objects.
 */

// TOWER

const brickheight_pu = 1; // Brick height is the base unit.
const brickwidth_pu = 2;  // Brick width must be an integer multiple of brick height.

const num_bricks_visible_quarter_ring = 8;
const num_bricks_visible_half_ring = 2 * num_bricks_visible_quarter_ring;

const tower_diameter_relative_to_screen_width = 0.5;

const flatland_extent_x_pu = Math.floor(
	num_bricks_visible_half_ring / (tower_diameter_relative_to_screen_width));
const flatland_extent_y_pu = flatland_extent_x_pu * 10 / 16;

let quadmesh_tower_flatland_pu;
let quadmesh_tower_distorted_pu;

function calculateWorldObjectData ()
{
	recalculateScreenData();

	const flatland_tower_positive_extent_x_pu = num_bricks_visible_half_ring;

	let flatland_tower_positive_extent_y_pu = 1;

	do
	{
		max_distortion_product =
			Math.cos(angle_max_x_distortion * flatland_tower_positive_extent_x_pu / flatland_extent_x_pu)
			* Math.cos(angle_max_y_distortion * flatland_tower_positive_extent_y_pu / flatland_extent_y_pu);

		flatland_tower_positive_extent_y_pu++;
	}
	while (0 < middlex -
			distortMesh2D([flatland_tower_positive_extent_x_pu, flatland_tower_positive_extent_y_pu, 0])[1] * unitpx)

	quadmesh_tower_flatland_pu = new Float32Array(
		  4 // Four verts in a quad
		* 3 // Three coords in a vert
		* flatland_tower_positive_extent_x_pu // Extent of positive x-axis
		* 2 // Both positive and negative x-direction
		* flatland_tower_positive_extent_y_pu // Extent of positive y-axis
		* 2 /* Both positive and negative y-direction */
		/ brickwidth_pu);

	function array_store_points_of_brick_verts (col, offs_x0, row, offs_y0, xsign, ysign)
	{
		const idx = (((flatland_tower_positive_extent_y_pu - row) * (2 * flatland_tower_positive_extent_x_pu)
			+ (flatland_tower_positive_extent_x_pu + col)) * 4 * 3) / brickwidth_pu;

		const x0 = col + offs_x0;
		const y0 = row + offs_y0;

		quadmesh_tower_flatland_pu[idx] = x0;
		quadmesh_tower_flatland_pu[idx +  1] = y0;
		//quadmesh_tower_flatland_pu[idx +  2] = 0;

		quadmesh_tower_flatland_pu[idx +  3] = x0;
		quadmesh_tower_flatland_pu[idx +  4] = y0 + ysign * brickheight_pu;
		//quadmesh_tower_flatland_pu[idx +  5] = 0;

		quadmesh_tower_flatland_pu[idx +  6] = x0 + xsign * brickwidth_pu;
		quadmesh_tower_flatland_pu[idx +  7] = y0 + ysign * brickheight_pu;
		//quadmesh_tower_flatland_pu[idx +  8] = 0;

		quadmesh_tower_flatland_pu[idx +  9] = x0 + xsign * brickwidth_pu;
		quadmesh_tower_flatland_pu[idx + 10] = y0;
		//quadmesh_tower_flatland_pu[idx + 11] = 0;
	}

	let odd = true;
	let k = 0;
	for (let bricknum_y = 0 ;
		bricknum_y < flatland_tower_positive_extent_y_pu ;
		bricknum_y++)
	{
		for (let bricknum_x = 0 ;
			bricknum_x < flatland_tower_positive_extent_x_pu / brickwidth_pu ;
			bricknum_x++)
		{
			const row_top_half = flatland_tower_positive_extent_y_pu - bricknum_y;
			const row_btm_half = -bricknum_y;

			const col_left_half = -(flatland_tower_positive_extent_x_pu - bricknum_x * brickwidth_pu);
			const col_right_half = bricknum_x * brickwidth_pu;

			array_store_points_of_brick_verts(col_left_half,
				(bricknum_y % 2) ? brickwidth_pu : 0.5 * brickwidth_pu,
				row_top_half, -brickheight_pu, -1, 1);

			array_store_points_of_brick_verts(col_right_half,
				(bricknum_y % 2) ? 0 : -0.5 * brickwidth_pu,
				row_top_half, -brickheight_pu, 1, 1);

			array_store_points_of_brick_verts(col_left_half,
				(bricknum_y % 2) ? brickwidth_pu : 0.5 * brickwidth_pu,
				row_btm_half, 0, -1, -1);

			array_store_points_of_brick_verts(col_right_half,
				(bricknum_y % 2) ? 0 : -0.5 * brickwidth_pu,
				row_btm_half, 0, 1, -1);
		}
	}

	quadmesh_tower_distorted_pu = distortMesh2D(quadmesh_tower_flatland_pu);
}

/*
 * Render tower.
 */

let y; // Unit: Pixels
let angle; // Unit: radians

function renderMeshEdges2D (vertex3d_points_xyz)
{
	//let k = 0;

	ctx.fillStyle = '#449';
	ctx.strokeStyle = '#00ffff';
	for (let i = 0 ; i < vertex3d_points_xyz.length ; i += 12)
	{
		ctx.beginPath();

		const p0 = { 'x': Math.floor(middlex + unitpx * vertex3d_points_xyz[i]),
			'y': Math.floor(middley - unitpx * vertex3d_points_xyz[i + 1]) };
		ctx.moveTo(p0.x, p0.y);

		const p1 = { 'x': Math.floor(middlex + unitpx * vertex3d_points_xyz[i + 3]),
			'y': Math.floor(middley - unitpx * vertex3d_points_xyz[i + 4]) };
		ctx.lineTo(p1.x, p1.y);

		const p2 = { 'x': Math.floor(middlex + unitpx * vertex3d_points_xyz[i + 6]),
			'y': Math.floor(middley - unitpx * vertex3d_points_xyz[i + 7]) };
		ctx.lineTo(p2.x, p2.y);

		const p3 = { 'x': Math.floor(middlex + unitpx * vertex3d_points_xyz[i + 9]),
			'y': Math.floor(middley - unitpx * vertex3d_points_xyz[i + 10]) };
		ctx.lineTo(p3.x, p3.y);

		ctx.lineTo(p0.x, p0.y);

		ctx.stroke();
		ctx.fill();

		//ctx.fillText(k, p0.x + (p2.x - p0.x) / 2, p0.y + (p2.y - p0.y) / 2);
		//k++;
	}
}

function renderMeshVerts2D (vertex3d_points_xyz)
{
	ctx.fillStyle = '#ff0000';
	for (let i = 0 ; i < vertex3d_points_xyz.length ; i += 12)
	{
		const p0 = { 'x': Math.floor(middlex + unitpx * vertex3d_points_xyz[i]),
			'y': Math.floor(middley - unitpx * vertex3d_points_xyz[i + 1]) };

		ctx.fillRect(p0.x - 1, p0.y - 1, 2, 2);
	}
}

function drawGuidelines ()
{
	ctx.strokeStyle = '#ffff00';
	ctx.beginPath();

	// Middle vertical line
	ctx.moveTo(middlex, 0);
	ctx.lineTo(middlex, canv.height);

	// Middle horizontal line
	ctx.moveTo(0, middley);
	ctx.lineTo(canv.width, middley);

	// Left-most vertical line
	ctx.moveTo(quarterx, 0);
	ctx.lineTo(quarterx, canv.height);

	// Right-most vertical line
	ctx.moveTo(middlex + quarterx, 0);
	ctx.lineTo(middlex + quarterx, canv.height);

	ctx.stroke();

	/*
	 * Camera/character lock bounds box.
	 */
	const fomb = // "freedom of movement bounds"
	[
		-8,  0, // p1
		-8, -9, // p2
		-7, -9, // .
		-6, -9, // .
		-5, -9, // .
		-4, -9, // Intermediate points.
		-3, -9, // .
		-2, -9, // .
		-1, -9, // .
		 0, -9, // p3
		 0,  0  // p0
	];

	ctx.strokeStyle = '#ff00ff';
	ctx.beginPath();

	ctx.moveTo(middlex, middley); // p0; (0, 0)
	for (let i = 0 ; i < fomb.length ; i += 2)
	{
		const s = distortionXY(fomb[i], fomb[i + 1]);
		ctx.lineTo(middlex + fomb[i] * s * unitpx,
			middley - fomb[i + 1] * s * unitpx);
	}

	ctx.stroke();
	ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
	ctx.fill();

	/*
	 * Natural position of character nose tip.
	 */
	ctx.strokeStyle = '#ff0000';
	ctx.beginPath();

	const sn = distortionXY(-2, -5);

	// Vertical line
	ctx.moveTo(middlex + (-2) * sn * unitpx, 0);
	ctx.lineTo(middlex + (-2) * sn * unitpx, canv.height);

	// Horizontal line
	ctx.moveTo(0, middley + 5 * sn * unitpx);
	ctx.lineTo(canv.width, middley + 5 * sn * unitpx);

	ctx.stroke();
}

function renderTower ()
{
	const t_render_tower_begin = Date.now();

	renderMeshEdges2D(quadmesh_tower_distorted_pu);

	drawGuidelines();

	renderMeshVerts2D(quadmesh_tower_distorted_pu);

	const t_render_tower_end = Date.now();

	ctx.fillStyle = '#449';
	ctx.fillText('Tower rendered in ' + (t_render_tower_end - t_render_tower_begin) + ' ms', 16, 24);
}

let angular_velocity_pu; // Unit: pu / second
let angular_acceleration_pu; // Unit: pu / s^2

let vertical_velocity_pu; // Unit: pu / second
let vertical_acceleration_pu; // Unit: pu / s^2

let renderInFlight;
function render ()
{
	renderInFlight = true;

	ctx.clearRect(0, 0, canv.width, canv.height);

	const offs_x_farbg_srcpx = (angle / (4 * Math.PI)) * farbg.width;

	ctx.drawImage(farbg, farbg.width - canv.width - offs_x_farbg_srcpx, 0, canv.width, canv.height,
		0, 0, canv.width, canv.height);

	renderTower();

	ctx.fillStyle = '#449';
	ctx.fillText('Current frame ' + dt + ' ms', 16, 36);
	if (t_prev !== null)
	{
		if (num_frames_rendered > dt_recent.length)
		{
			ctx.fillText('Last ' + dt_recent.length + ' frames ' + Math.round(100 * 1000 / (dt_recent.reduce((acc, v) => acc + v) / dt_recent.length)) / 100 + ' FPS', 16, 48);
		}
		else if (num_frames_rendered >= 30)
		{
			ctx.fillText('Last ' + num_frames_rendered + ' frames ' + Math.round(100 * 1000 / (dt_recent.slice(dt_recent.length - num_frames_rendered).reduce((acc, v) => acc + v) / num_frames_rendered)) / 100 + ' FPS', 16, 48);
		}
	}

	num_frames_rendered++;

	renderInFlight = false;
}

let stopped;
let paused;
let manually_paused;

/*
 * Options. TODO: Configure from user interface. Save values in localStorage.
 */

let option_disable_autopause = false;
let option_enable_autoresume_always = false; // If true then resume on focus even when manually paused.

/*
 * Starting, pausing and stopping game.
 */

let start;
let pause;
let quitToMainMenu;

function sizeCanvases ()
{
	tcanv.width = width;
	tcanv.height = height;

	// Skybox covers 360 degrees, our view is showing 180 degrees.
	// Additionally, like with the sliding bricks we draw two copies next to each other so we can slide over.
	farbg.width = 4 * width;
	farbg.height = height;
}

let resizetimer;
let orientationtimer;
function adaptToDims ()
{
	sizeCanvases();

	const sun_diam_srcpx = sunsvg.width;
	const sun_radius_srcpx = Math.ceil(0.5 * sun_diam_srcpx);
	const sun_offs_y_srcpx = Math.ceil(0.42 * sun_diam_srcpx);

	const sun_diam_dstpx = Math.floor(0.35 * canv.width);
	const sun_radius_dstpx = Math.ceil(0.5 * sun_diam_dstpx);
	const sun_offs_y_dstpx = Math.ceil(0.42 * sun_diam_dstpx);

	// XXX: Sun goes in opposite direction so we place it 75% away from the *right* edge of each "skybox copy".

	fctx.drawImage(sunsvg,
		0, sun_offs_y_srcpx,
		sun_diam_srcpx, sun_diam_srcpx - sun_offs_y_srcpx,
		Math.floor(0.25 * 2 * canv.width) - sun_radius_dstpx, 0,
		sun_diam_dstpx, sun_diam_dstpx - sun_offs_y_dstpx);

	fctx.drawImage(sunsvg,
		0, sun_offs_y_srcpx,
		sun_diam_srcpx, sun_diam_srcpx - sun_offs_y_srcpx,
		Math.floor(1.25 * 2 * canv.width) - sun_radius_dstpx, 0,
		sun_diam_dstpx, sun_diam_dstpx - sun_offs_y_dstpx);

	recalculateScreenData();
	resetFPSCounter();
}

function handleBlur ()
{
	if (!manually_paused && !option_disable_autopause)
	{
		pause();
	}
}

function handleFocus ()
{
	if (!manually_paused || option_enable_autoresume_always)
	{
		start();
	}
}

function resetFPSCounter ()
{
	num_frames_rendered = 0;
	t_prev = null;
}

function initGlobalState ()
{
	window.removeEventListener('blur', handleBlur);
	window.removeEventListener('focus', handleFocus);

	stopped = true;
	paused = false;
	manually_paused = false;

	quitToMainMenu = null;
	start = null;
	pause = null;

	dt = 0;
	resetFPSCounter();

	vertical_velocity_pu = 3;
	vertical_acceleration_pu = 0;

	angular_velocity_pu = 3;
	angular_acceleration_pu = 0;

	y = 0;
	angle = Math.PI / 2;
}

function startNewGame ()
{
	initGlobalState();

	pause = () =>
	{
		paused = true;
		document.title = 'Paused - ' + title;

		if (renderInFlight)
		{
			requestAnimationFrame(pause);
			return;
		}

		ctx.fillStyle = 'rgba(64, 64, 128, 0.45)';
		ctx.fillRect(0, 0, canv.width, canv.height);

		ctx.fillStyle = '#ffffff';
		const s = 0.05 * canv.height;
		ctx.fillRect(s, s, s, 2.5 * s);
		ctx.fillRect(2.5 * s, s, s, 2.5 * s);
	}

	start = () =>
	{
		if (paused)
		{
			resetFPSCounter();
			paused = false;
			stopped = false;
			document.title = title;
			run();
		}
	}

	quitToMainMenu = () =>
	{
		stopped = true;

		if (renderInFlight)
		{
			requestAnimationFrame(quitToMainMenu);
			return;
		}

		// TODO: Save so game can be resumed if user quit accidentaly.

		mainMenu();
	}

	window.addEventListener('blur', handleBlur);
	window.addEventListener('focus', handleFocus);

	stopped = false;
	run();
}

function mainMenu ()
{
	initGlobalState();

	// TODO: ...

	startNewGame();
}

window.addEventListener('load', () =>
{
	let num_resources_to_load = 1;
	let num_resources_loaded = 0;

	sizeCanvases();

	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canv.width, canv.height);

	canv.hidden = false;

	function update_resource_loading_progress_bar_until_ready ()
	{
		if (++num_resources_loaded === num_resources_to_load)
		{
			calculateWorldObjectData();

			adaptToDims();
			mainMenu();
		}
		else
		{
			// TODO: Draw infinite progress bar.
		}
	}

	sunsvg = new Image();
	sunsvg.onload = update_resource_loading_progress_bar_until_ready;
	sunsvg.src = 'assets/thirdparty/images/sun.svg';
});
