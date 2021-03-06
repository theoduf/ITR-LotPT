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

export class CanvasHoldingState
{
	constructor ()
	{
		this.statemachine = undefined;

		this.canv = undefined;
		this.ctx = undefined;

		this.running = false;

		this.window_listeners = {};
	}

	associateStatemachine (statemachine)
	{
		this.statemachine = statemachine;
	}

	setCanv (canv, ctx)
	{
		this.canv = canv;
		this.ctx = ctx;
	}

	canvResized ()
	{
		// TODO
	}

	getHandlersForExternalEvents ()
	{
		return { 'did_resize': this.canvResized.bind(this) };
	}

	_update ()
	{
		// Subclasses must implement this method themselves if it's going to be used.
	}

	run ()
	{
		for (let event_name of Object.keys(this.window_listeners))
		{
			window.addEventListener(event_name, this.window_listeners[event_name]);
		}

		this.running = true;

		this._update();
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

export class CanvasViewableState extends CanvasHoldingState
{
	constructor ()
	{
		super();

		this.anim_req = undefined;
	}

	_render ()
	{
		// Subclasses must implement this method themselves.
	}

	run ()
	{
		for (let event_name of Object.keys(this.window_listeners))
		{
			window.addEventListener(event_name, this.window_listeners[event_name]);
		}

		this.running = true;

		this._render();
	}

	stop ()
	{
		window.cancelAnimationFrame(this.anim_req);

		this.anim_req = null;

		super.stop();
	}
}
