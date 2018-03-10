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

export class ResourceLoader extends state.CanvasViewableState
{
	constructor (resources_pending)
	{
		super();

		this.resources_pending = resources_pending;

		this.num_resources_to_load = undefined;
		this.num_resources_loaded = 0;
		this.num_resources_failed_to_load = 0;
	}

	_loadResources ()
	{
		this.num_resources_to_load = 0;
		let resources_loading = {};
		let resources_loaded = {};

		for (let resource_type of Object.keys(this.resources_pending))
		{
			resources_loading[resource_type] = {};
			resources_loaded[resource_type] = {};

			for (let resource_key of Object.keys(this.resources_pending[resource_type]))
			{
				this.num_resources_to_load++;
			}
		}

		for (let image_key of Object.keys(this.resources_pending['image']))
		{
			const img = new Image();

			resources_loading['image'][image_key] = img;

			img.onload = () =>
			{
				(resourceLoaded.bind(this))('image', image_key);
			};

			img.onerror = () =>
			{
				(resourceFailedToLoad.bind(this))('image', image_key);
			};

			img.src = this.resources_pending['image'][image_key];
		}

		function resourceLoaded (resource_type, resource_key)
		{
			resources_loaded[resource_type][resource_key] =
				resources_loading[resource_type][resource_key];

			this.num_resources_loaded++;

			delete resources_loading[resource_type][resource_key];

			if (Object.keys(resources_loading[resource_type]).length === 0)
			{
				delete resources_loading[resource_type];
			}

			delete this.resources_pending[resource_type][resource_key];

			if (Object.keys(this.resources_pending[resource_type]).length === 0)
			{
				delete this.resources_pending[resource_type];
			}

			if (Object.keys(this.resources_pending).length === 0)
			{
				this.stop();

				this.statemachine.inform('resources_loaded', resources_loaded);
			}
		}

		function resourceFailedToLoad (resource_type, resource_key)
		{
			this.num_resources_failed_to_load++;

			this.stop();

			this.statemachine.inform('resource_failed_to_load',
				{'resource_type': resource_type, 'resource_key': resource_key});
		}
	}

	_render ()
	{
		// TODO

		if (this.running)
		{
			window.requestAnimationFrame(this._render.bind(this));
		}
	}

	run ()
	{
		this.running = true;

		this._loadResources();

		window.requestAnimationFrame(this._render.bind(this));
	}
}
