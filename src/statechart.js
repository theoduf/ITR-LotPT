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

		this.current_statename = undefined;
	}

	registerState (statename, obj)
	{
		if (!this.states.hasOwnProperty(statename))
		{
			this.states[statename] = obj;
			this.state_transitions[statename] = {};
		}
		else
		{
			throw `State ${statename} has already been registered!`;
		}
	}

	registerStateTransition (current_statename, next_statename, evt)
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
			this.state_transitions[current_statename][evt] = next_statename;
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

	run (canv, ctx)
	{
		if (!this.running)
		{
			this.canv = canv;
			this.ctx = ctx;
			this.running = true;

			this.states[this.current_statename].run(this, canv, ctx);
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
			// TODO
		}
		else
		{
			console.log('State machine does not know where to send this event '
				+ `given its current state ${this.current_statename}.`);
		}
	}
}
