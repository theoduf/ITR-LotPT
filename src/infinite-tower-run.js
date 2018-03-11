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

function sizeCanvases ()
{
	// Skybox covers 360 degrees, our view is showing 180 degrees.
	// Additionally, like with the sliding bricks we draw two copies next to each other so we can slide over.
	farbg.width = 4 * width;
	farbg.height = height;
}

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

function resetFPSCounter ()
{
	num_frames_rendered = 0;
	t_prev = null;
}

function initGlobalState ()
{
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
