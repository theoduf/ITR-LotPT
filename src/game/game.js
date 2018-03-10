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

import * as state from '../state.js';
import * as cameras from './cameras.js';
import * as environment from './environment.js';
import * as characters from './characters.js';

export class Game extends state.CanvasHoldingState
{
	constructor ()
	{
		super();

		this.available_cameras =
		{
			'third_person_side_view_camera': new cameras.ThirdPersonSideViewCamera(this),
			'third_person_behind_character_camera': new cameras.ThirdPersonBehindCharacterCamera(this),
			'third_person_behind_character_cardboard_camera': new cameras.ThirdPersonBehindCharacterCardboardCamera(this),
			'first_person_camera': new cameras.FirstPersonCamera(this),
			'first_person_cardboard_camera': new cameras.FirstPersonCardboardCamera(this)
		};

		this.tower = new environment.Tower();

		this.player = new characters.Player();

		this.world_objects = [this.player];

		this.active_camera = this.available_cameras['third_person_side_view_camera'];

		this.t_prev = undefined;
		this.dt_recent = new Array(240);
	}

	registerResources (resources)
	{
		for (let camera_name of Object.keys(this.available_cameras))
		{
			this.available_cameras[camera_name].registerResources(resources);
		}
	}

	setCanv (canv, ctx)
	{
		for (let camera_name of Object.keys(this.available_cameras))
		{
			this.available_cameras[camera_name].setCanv(canv, ctx);
		}
	}

	getWorldObjects ()
	{
		return this.world_objects;
	}

	_update ()
	{
		const t_now = Date.now();

		if (!this.running)
		{
			return;
		}

		let t_prev = this.t_prev;
		let dt_recent = this.dt_recent;

		let dt = 0;
		if (t_prev !== undefined)
		{
			dt = t_now - t_prev;

			dt_recent.shift();
			dt_recent.push(dt);
		}

		this.player.angle_pu = (this.player.angle_pu + this.player.angular_velocity_pu * dt / 1000) % (2 * Math.PI);
		this.player.y_pu += this.player.vertical_velocity_pu * dt / 1000;

		// TODO: Update game object positions.

		// TODO: Check collisions.

		this.active_camera.updatePosition(this.player);
		this.active_camera.render();

		this.t_prev = t_now;

		window.requestAnimationFrame(this._update.bind(this));
	}

	pause ()
	{
		this.running = false;
		// TODO: ...
	}

	resume ()
	{
		this.running = true;
		this._update();
	}

	run ()
	{
		this.running = true;
		this._update();
	}

	stop ()
	{
		this.running = false;
	}
}
