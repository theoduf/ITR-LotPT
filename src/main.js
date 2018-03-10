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

import * as statechart from './statechart.js';
import * as resourceloader from './resourceloader.js';
import * as menus from './menus.js';
import * as failure from './failure.js';

const statemachine = new statechart.StateMachine();

const resources_pending =
{
	'image':
	{
		'sun.svg': 'assets/thirdparty/images/sun.svg',
	},
};

const resource_loader = new resourceloader.ResourceLoader(resources_pending);

statemachine.registerState('loading_resources', resource_loader);

const main_menu = new menus.MainMenu();
statemachine.registerState('main_menu', main_menu);

statemachine.registerStateTransition('loading_resources', 'main_menu', (rsc) =>
{
	main_menu.registerResources(rsc);
	main_menu.run();
},
	'resources_loaded');

const critical_error = new failure.CriticalErrorInformer();
statemachine.registerState('critical_error', critical_error);

statemachine.registerStateTransition('loading_resources', 'critical_error', () =>
{
	critical_error.setErrorMessageText('A critical error occurred while loading resources :(');
	critical_error.run();
},
	'resource_failed_to_load');
statemachine.registerStateTransition('critical_error', 'loading_resources', resourceloader.run, 'restart');

statemachine.setInitialState('loading_resources');

function sizeCanvas (canv, ctx)
{
	const scale = window.devicePixelRatio;
	let width, height;

	if (window.innerWidth > 16 * window.innerHeight / 10)
	{
		height = window.innerHeight;
		width = height * 16 / 10;
	}
	else
	{
		width = window.innerWidth;
		height = width * 10 / 16;
	}

	canv.style.width = Math.floor(width) + 'px';
	canv.style.height = Math.floor(height) + 'px';

	width *= scale;
	height *= scale;

	canv.width = width;
	canv.height = height;
}

for (let state_name of Object.keys(statemachine.states))
{
	const state = statemachine.states[state_name];

	const handlers = state.getHandlersForExternalEvents();

	for (let ext_evt_name of Object.keys(handlers))
	{
		statemachine.registerHandlerForExternalEvent(state_name, handlers[ext_evt_name], ext_evt_name);
	}
}

window.addEventListener('load', () =>
{
	const canv = document.getElementById('game');
	const ctx = canv.getContext('2d');

	sizeCanvas(canv, ctx);
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, canv.width, canv.height);
	canv.hidden = false;

	statemachine.setCanv(canv, ctx);

	function sizeMainCanvas ()
	{
		sizeCanvas(canv, ctx);
		statemachine.externalInform('did_resize');
	}

	let resizetimer;

	window.addEventListener('resize', () =>
	{
		clearTimeout(resizetimer);

		resizetimer = setTimeout(sizeMainCanvas, 30);
	});

	let orientationtimer;

	window.addEventListener('orientationchange', () =>
	{
		clearTimeout(orientationtimer);

		orientationtimer = setTimeout(sizeMainCanvas, 250);
	});

	statemachine.run();
});
