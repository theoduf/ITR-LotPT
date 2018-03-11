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

		ctx.font = '12pt sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#fff';
		ctx.fillText('Touch screen, click primary mouse button or press spacebar to start game.',
			canv.width / 2, canv.height / 2);

		if (this.running)
		{
			window.requestAnimationFrame(this._render.bind(this));
		}
	}
}

export class PauseMenu extends state.CanvasViewableState
{
	constructor ()
	{
		super();

		this.gamesession = undefined;

		this.basetitle = undefined;

		this.resume_on_focus = undefined;

		this.window_listeners =
		{
			'focus': () =>
			{
				if (this.resume_on_focus)
				{
					this.stop();
					this.statemachine.inform('resume_game');
				}
			},
			'touchend': () =>
			{
				this.stop();
				this.statemachine.inform('resume_game');
			},
			'mouseup': (evt) =>
			{
				if (evt.which === 1) // LMB
				{
					this.stop();
					this.statemachine.inform('resume_game');
				}
			},
			'keyup': (evt) =>
			{
				if (evt.key === 'Escape')
				{
					this.stop();
					this.statemachine.inform('resume_game');
				}
			}
		};
	}

	_render ()
	{
		if (this.gamesession.active_camera.render_in_flight)
		{
			window.requestAnimationFrame(this._render.bind(this));
			return;
		}

		this.gamesession.active_camera.render();

		const canv = this.canv;
		const ctx = this.ctx;

		ctx.fillStyle = 'rgba(64, 64, 128, 0.45)';
		ctx.fillRect(0, 0, canv.width, canv.height);

		ctx.fillStyle = '#ffffff';
		const s = 0.05 * canv.height;
		ctx.fillRect(s, s, s, 2.5 * s);
		ctx.fillRect(2.5 * s, s, s, 2.5 * s);

		ctx.font = '12pt sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#fff';
		if (this.resume_on_focus)
		{
			ctx.fillText('Bring game window back in focus to resume game.',
				canv.width / 2, canv.height / 2);
		}
		else
		{
			ctx.fillText('Touch screen, click primary mouse button or press escape to resume game.',
				canv.width / 2, canv.height / 2);
		}
	}

	canvResized ()
	{
		console.log('Yohoo');
		this._render();
	}

	receiveGameSession (gs)
	{
		this.gamesession = gs;
	}

	setResumeOnFocus (truthness)
	{
		this.resume_on_focus = truthness;
	}

	run ()
	{
		this.basetitle = document.title;

		document.title = 'Paused - ' + this.basetitle;

		super.run();
	}

	stop ()
	{
		document.title = this.basetitle;

		super.stop();
	}
}
