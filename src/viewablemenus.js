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

import * as state from './state.js';

export class MainMenu extends state.CanvasViewableState
{
	constructor ()
	{
		super();

		this.resources = undefined;

		this.window_listeners =
		{
			'touchend': () =>
			{
				this.stop();
				this.statemachine.inform('start_game', this.resources);
			},
			'mouseup': (evt) =>
			{
				if (evt.which === 1) // LMB
				{
					this.stop();
					this.statemachine.inform('start_game', this.resources);
				}
			},
			'keyup': (evt) =>
			{
				if (evt.key === ' ')
				{
					this.stop();
					this.statemachine.inform('start_game', this.resources);
				}
			}
		};
	}

	registerResources (resources)
	{
		this.resources = resources;
	}

	_render ()
	{
		const canv = this.canv;
		const ctx = this.ctx;

		// TODO: Proper menu

		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, canv.width, canv.height);

		const default_font = ctx.font;
		ctx.font = '12pt sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#fff';
		ctx.fillText('Touch screen, click primary mouse button or press spacebar to start game.',
			canv.width / 2, canv.height / 2);
		ctx.font = default_font;

		if (this.running)
		{
			window.requestAnimationFrame(this._render.bind(this));
		}
	}

	run ()
	{
		for (let event_name of Object.keys(this.window_listeners))
		{
			window.addEventListener(event_name, this.window_listeners[event_name]);
		}

		this.running = true;
		window.requestAnimationFrame(this._render.bind(this));
	}

	stop ()
	{
		for (let event_name of Object.keys(this.window_listeners))
		{
			window.removeEventListener(event_name, this.window_listeners[event_name]);
		}

		this.running = false;
	}
}
