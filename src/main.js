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

statemachine.registerStateTransition('loading_resources', 'main_menu', 'resources_loaded');

const critical_error = new failure.CriticalError();
statemachine.registerState('critical_error', critical_error);

statemachine.registerStateTransition('loading_resources', 'critical_error', 'resource_failed_to_load');

statemachine.setInitialState('loading_resources');

{
	const canv = document.getElementById('game');
	const ctx = canv.getContext('2d');

	statemachine.run(canv, ctx);
}