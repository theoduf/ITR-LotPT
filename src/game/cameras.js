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

export class Camera
{
	constructor (gamesession)
	{
		this.gamesession = gamesession;

		this.canv = undefined;
		this.ctx = undefined;

		this.resources = undefined;

		this.num_frames_rendered = 0;

		this.prev_angle_rad = undefined;
		this.prev_y_pu = undefined;

		this.angle_rad = 0;
		this.y_pu = 0;

		this.angular_velocity_pu = 0;
		this.vertical_velocity_pu = 0;

		this.angular_acceleration_pu = 0;
		this.vertical_acceleration_pu = 0;

		this.render_in_flight = false;

		//this.distorted_tower_mesh_screen = null;

		this.dirty = undefined;
	}

	registerResources (resources)
	{
		this.resources = resources;
	}

	setCanv (canv, ctx)
	{
		this.canv = canv;
		this.ctx = ctx;
	}

	calculateDimensions ()
	{
		this.dirty = true;
	}

	updatePosition (player)
	{
		// Subclasses implement this.
	}

	updateLookAt (player)
	{
		// Subclasses implement this.
	}

	render ()
	{
		// TODO: Render scene with WebGL
	}
}

export class ThirdPersonSideViewCamera extends Camera
{
	constructor (gamesession)
	{
		super(gamesession);

		this.angle_max_x_distortion = Math.acos(0);

		const flatland_tower_positive_extent_x_pu = 14;

		this.flatland_extent_x_pu = 2 * flatland_tower_positive_extent_x_pu;
		this.flatland_extent_y_pu = this.flatland_extent_x_pu * 10 / 16;

		this.unitpx = undefined;
		this.middlex = undefined;
		this.middley = undefined;

		this.tile_linewidth = undefined;
	}

	calculateDimensions ()
	{
		super.calculateDimensions();

		this.unitpx = this.canv.height / this.flatland_extent_y_pu;

		this.middlex = this.canv.width / 2;
		this.middley = this.canv.height / 2;

		this.tile_linewidth = Math.min(Math.max(this.canv.height / 200, 1.25), 1.75);
	}

	updatePosition (player)
	{
		this.prev_y_pu = this.y_pu;
		this.prev_angle_rad = this.angle_rad;

		// TODO
		this.y_pu = player.y_pu;
		this.angle_rad = player.angle_rad;
	}

	updateLookAt (player)
	{
		return; // Side-view camera is fixed in terms of look direction.
	}

	distortionXY (x)
	{
		return Math.cos(this.angle_max_x_distortion * x / this.flatland_extent_x_pu) / 1.25;
	}

	render ()
	{
		// TODO: Replace with common-to-all WebGL renderer above.

		this.render_in_flight = true;

		const canv = this.canv;
		const ctx = this.ctx;

		ctx.clearRect(0, 0, canv.width, canv.height);

		const num_points_per_half_y_axis = 21;
		const num_points_per_column = 2 * num_points_per_half_y_axis + 1;

		const num_points_per_half_x_axis = 14;
		const num_points_per_row = 2 * num_points_per_half_x_axis + 1;

		const brickratio = 2;
		const angleratio = 2 * num_points_per_half_x_axis / Math.PI;

		if ((this.y_pu % 1) !== (this.prev_y_pu % 1) ||
			(this.angle_rad % angleratio) != (this.prev_angle_rad % angleratio))
		{
			this.dirty = true;

			ctx.fillStyle = '#449'; // '#f00'; // It actually almost looks better in red... :/
			ctx.strokeStyle = '#0ff';
			ctx.lineWidth = this.tile_linewidth;

			const left_x = -num_points_per_half_x_axis;
			const s_utmost = this.distortionXY(left_x);
			const left_x_d = left_x * s_utmost;
			const left_x_d_screen = this.middlex + left_x_d * this.unitpx;
			const right_x_d_screen = this.middlex - left_x_d * this.unitpx;

			const top_y_d_screen = 0;
			const bottom_y_d_screen = this.canv.height;

			ctx.fillRect(left_x_d_screen, top_y_d_screen, right_x_d_screen - left_x_d_screen, bottom_y_d_screen);

			ctx.beginPath();
			ctx.moveTo(left_x_d_screen, top_y_d_screen);
			ctx.lineTo(left_x_d_screen, bottom_y_d_screen);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(right_x_d_screen, top_y_d_screen);
			ctx.lineTo(right_x_d_screen, bottom_y_d_screen);
			ctx.stroke();

			for (let i = 0 ; i < num_points_per_column ; i++)
			{
				const y = num_points_per_half_y_axis - i - (this.y_pu % 2);

				const first_in_row_x = -num_points_per_half_x_axis;

				const s0 = this.distortionXY(first_in_row_x);

				const first_in_row_x_d = first_in_row_x * s0;
				const first_in_row_y_d = y * s0;

				const first_in_row_x_d_screen = this.middlex + first_in_row_x_d * this.unitpx;
				const first_in_row_y_d_screen = this.middley - first_in_row_y_d * this.unitpx;

				// Horizontal lines

				ctx.beginPath();
				ctx.moveTo(first_in_row_x_d_screen, first_in_row_y_d_screen);

				for (let j = 0 ; j < num_points_per_row ; j++)
				{
					const x = first_in_row_x + j;

					const s = this.distortionXY(x);

					const x_d = s * x;
					const y_d = s * y;

					const x_d_screen = this.middlex + x_d * this.unitpx;
					const y_d_screen = this.middley - y_d * this.unitpx;

					ctx.lineTo(x_d_screen, y_d_screen);
				}

				ctx.stroke();

				// Vertical lines

				ctx.beginPath();

				const first_x_vertical = first_in_row_x + 1 + (i % 2 ? 0 : 1) - (this.angle_rad / angleratio) % 2;
				const first_s_vertical = this.distortionXY(first_x_vertical);
				const first_x_d_screen = this.middlex + first_s_vertical * first_x_vertical * this.unitpx;

				if (first_x_d_screen > first_in_row_x_d_screen)
				{

					const first_y_d1_screen = this.middley - first_s_vertical * y * this.unitpx;
					const first_y_d2_screen = this.middley - first_s_vertical * (y - 1) * this.unitpx;

					ctx.moveTo(first_x_d_screen, first_y_d1_screen);
					ctx.lineTo(first_x_d_screen, first_y_d2_screen);
				}

				for (let j = 2 ; j < num_points_per_row - 1 ; j += 2)
				{
					const x = first_in_row_x + j + (i % 2 ? 1 : 0) - (this.angle_rad / angleratio) % 2;

					const s = this.distortionXY(x);

					const x_d_screen = this.middlex + s * x * this.unitpx;
					const y_d1_screen = this.middley - s * y * this.unitpx;
					const y_d2_screen = this.middley - s * (y - 1) * this.unitpx;

					ctx.moveTo(x_d_screen, y_d1_screen);
					ctx.lineTo(x_d_screen, y_d2_screen);
				}

				const last_x_vertical = num_points_per_half_x_axis + 1 - (i % 2 ? 1 : 0) - (this.angle_rad / angleratio) % 2;
				const last_s_vertical = this.distortionXY(last_x_vertical);
				const last_x_d_screen = this.middlex + last_s_vertical * last_x_vertical * this.unitpx;

				const last_in_row_x_d_screen = this.middlex + num_points_per_half_x_axis * last_s_vertical * this.unitpx;

				if (last_x_d_screen < last_in_row_x_d_screen)
				{

					const last_y_d1_screen = this.middley - last_s_vertical * (y + 1) * this.unitpx;
					const last_y_d2_screen = this.middley - last_s_vertical * y * this.unitpx;

					ctx.moveTo(last_x_d_screen, last_y_d1_screen);
					ctx.lineTo(last_x_d_screen, last_y_d2_screen);
				}

				ctx.stroke();
			}
		}

		this.render_in_flight = false;
	}
}

export class BehindCharacterCamera extends Camera
{
	updatePosition (player)
	{
		// TODO
	}
}

export class ThirdPersonBehindCharacterCamera extends BehindCharacterCamera
{
	updateLookAt (player)
	{
		// TODO
	}
}

export class ThirdPersonBehindCharacterCardboardCamera extends BehindCharacterCamera
{
	updateLookAt (player)
	{
		// TODO
	}
}

export class FirstPersonCamera extends BehindCharacterCamera
{
	updateLookAt (player)
	{
		// TODO
	}
}

export class FirstPersonCardboardCamera extends BehindCharacterCamera
{
	updateLookAt (player)
	{
		// TODO
	}
}
