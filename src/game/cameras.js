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
	constructor ()
	{
		this.canv = undefined;
		this.ctx = undefined;

		this.resources = undefined;

		this.num_frames_rendered = 0;

		this.angle_pu = 0;
		this.y_pu = 0;

		this.angular_velocity_pu = 0;
		this.vertical_velocity_pu = 0;

		this.angular_acceleration_pu = 0;
		this.vertical_acceleration_pu = 0;

		this.render_in_flight = false;
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
		this.render_in_flight = true;

		const canv = this.canv;
		const ctx = this.ctx;

		ctx.clearRect(0, 0, canv.width, canv.height);

		this.render_in_flight = false;
	}
}

export class ThirdPersonSideViewCamera extends Camera
{
	updatePosition (player)
	{
		// TODO
	}

	updateLookAt (player)
	{
		return; // Side-view camera is fixed in terms of look direction.
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
