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

export class Character
{
	constructor ()
	{
		this.health = 100;

		this.angle_rad = 0;
		this.y_pu = 0;

		this.angular_velocity_rad_s = 0;
		this.vertical_velocity_pu_s = 0;

		this.angular_acceleration_rad_s2 = 1;
		this.vertical_acceleration_pu_s2 = 1;

		this.angular_velocity_rad_s_clamp_abs_max = Math.PI / 4;
		this.vertical_velocity_pu_s_clamp_abs_max = 0.1337;
	}
}

export class Player extends Character
{
	constructor ()
	{
		super();
	}
}
