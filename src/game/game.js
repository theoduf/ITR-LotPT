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

		this.window_listeners =
		{
			'blur': () =>
			{
				this.stop();
				this.statemachine.inform('blur_paused_game', this);
			},
			'keyup': (evt) =>
			{
				if (evt.key === 'Escape')
				{
					this.stop();
					this.statemachine.inform('user_paused_game', this);
				}
			}
		};

		this.available_cameras =
		{
			'third_person_side_view_camera': new cameras.ThirdPersonSideViewCamera(this),
			//'third_person_behind_character_camera': new cameras.ThirdPersonBehindCharacterCamera(this),
			//'third_person_behind_character_cardboard_camera': new cameras.ThirdPersonBehindCharacterCardboardCamera(this),
			//'first_person_camera': new cameras.FirstPersonCamera(this),
			//'first_person_cardboard_camera': new cameras.FirstPersonCardboardCamera(this)
		};

		this.tower = new environment.Tower();

		this.player = new characters.Player();

		this.world_objects =
		{
			'tower': this.tower,
			'player': this.player
		};

		this.movable_world_objects = [this.player];

		this.active_camera = this.available_cameras['third_person_side_view_camera'];

		this.t_prev = undefined;
		this.dt_recent = new Array(240);

		this.anim_req = undefined;
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

	calculateDimensions ()
	{
		this.active_camera.calculateDimensions();
	}

	canvResized ()
	{
		this.calculateDimensions();
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

		for (let movable of this.movable_world_objects)
		{
			movable.angular_velocity_rad_s += movable.angular_acceleration_rad_s2 * dt / 1000;

			if (movable.angular_velocity_rad_s > movable.angular_velocity_rad_s_clamp_abs_max)
			{
				movable.angular_velocity_rad_s = movable.angular_velocity_rad_s_clamp_abs_max;
			}
			else if (movable.angular_velocity_rad_s < -movable.angular_velocity_rad_s_clamp_abs_max)
			{
				movable.angular_velocity_rad_s = -movable.angular_velocity_rad_s_clamp_abs_max;
			}

			movable.angle_rad += movable.angular_velocity_rad_s;

			movable.vertical_velocity_pu_s += movable.vertical_acceleration_pu_s2 * dt / 1000;

			if (movable.vertical_velocity_pu_s > movable.vertical_velocity_pu_s_clamp_abs_max)
			{
				movable.vertical_velocity_pu_s = movable.vertical_velocity_pu_s_clamp_abs_max;
			}
			else if (movable.vertical_velocity_pu_s < -movable.vertical_velocity_pu_s_clamp_abs_max)
			{
				movable.vertical_velocity_pu_s = -movable.vertical_velocity_pu_s_clamp_abs_max;
			}

			movable.y_pu += movable.vertical_velocity_pu_s;
		}

		//console.log(this.player.angle_rad, this.player.y_pu);

		// TODO: Update game object positions.

		// TODO: Check collisions.

		this.active_camera.updatePosition(this.player);
		this.active_camera.updateLookAt(this.player);
		this.active_camera.render();

		this.t_prev = t_now;

		this.anim_req = window.requestAnimationFrame(this._update.bind(this));
	}

	stop ()
	{
		window.cancelAnimationFrame(this.anim_req);

		super.stop();
	}
}
