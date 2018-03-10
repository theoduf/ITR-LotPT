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

export class StateMachine
{
	constructor ()
	{
		this.canv = undefined;
		this.ctx = undefined;

		this.running = false;

		this.states = {};
		this.state_transitions = {};
		this.handlers_external_events = {};

		this.current_statename = undefined;
	}

	registerState (statename, obj)
	{
		if (!this.states.hasOwnProperty(statename))
		{
			obj.associateStatemachine(this);

			this.states[statename] = obj;
			this.state_transitions[statename] = {};
		}
		else
		{
			throw `State ${statename} has already been registered!`;
		}
	}

	registerStateTransition (current_statename, next_statename, call_f, evt)
	{
		if (!this.states.hasOwnProperty(current_statename))
		{
			throw `State ${current_statename} has not been registered!`;
		}
		else if (!this.states.hasOwnProperty(next_statename))
		{
			throw `State ${next_statename} has not been registered!`;
		}
		else if (this.state_transitions.hasOwnProperty(evt))
		{
			throw `State transition ${evt} has already been registered!`;
		}
		else
		{
			this.state_transitions[current_statename][evt] =
				{ 'next_statename': next_statename, 'call_f': call_f};
		}
	}

	registerHandlerForExternalEvent (current_statename, handler_f, evt)
	{
		if (!(this.handlers_external_events.hasOwnProperty(current_statename)))
		{
			this.handlers_external_events[current_statename] = {};
		}

		if (this.handlers_external_events[current_statename].hasOwnProperty(evt))
		{
			throw `Handler for external event ${evt} has already been `
				+ `registered for state ${current_statename}!`;
		}
		else
		{
			this.handlers_external_events[current_statename][evt] = handler_f;
		}
	}

	setInitialState (statename)
	{
		if (!this.states.hasOwnProperty(statename))
		{
			throw `State ${statename} has not been registered!`;
		}
		else
		{
			this.current_statename = statename;
		}
	}

	setCanv (canv, ctx)
	{
		this.canv = canv;
		this.ctx = ctx;

		for (let state of Object.keys(this.states))
		{
			this.states[state].setCanv(canv, ctx);
		}
	}

	run ()
	{
		if (!this.running)
		{
			this.running = true;

			this.states[this.current_statename].run();
		}
		else
		{
			throw "State machine is already running!";
		}
	}

	inform (evt, msg)
	{
		console.log('State machine was informed of an event:', evt, msg);

		if (this.state_transitions[this.current_statename].hasOwnProperty(evt))
		{
			const sn = this.state_transitions[this.current_statename][evt]['next_statename'];
			const cf = this.state_transitions[this.current_statename][evt]['call_f'];

			this.current_statename = sn;

			cf(msg);
		}
		else
		{
			console.log('State machine does not know where to send this event '
				+ `given its current state ${this.current_statename}.`);
		}
	}

	externalInform (evt)
	{
		console.log('State machine was informed of an external event:', evt);

		if (this.handlers_external_events.hasOwnProperty(this.current_statename)
			&& this.handlers_external_events[this.current_statename].hasOwnProperty(evt))
		{
			const handler_f = this.handlers_external_events[this.current_statename][evt];

			handler_f();
		}
		else
		{
			console.log(`Current state ${this.current_statename} does not `
				+ 'have the handler required for this event.');
		}
	}
}
