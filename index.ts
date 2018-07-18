// let debug		= require('debug')('rw-resource');

export class NotLockedError extends Error
{
	name:		string;

	constructor(msg: string)
	{
		super(msg);
		this.name = 'NotLockedError';
	}
}

export default class RWRes
{
	value:				any;

	readers:			number;
	writers:			number;

	waiters:			any[];
	exclusiveWaiters:	any[];

	constructor(initialValue?: any)
	{
		/* The actual value */
		this.value				= initialValue;

		/* Current counts */
		this.readers			= 0;
		this.writers			= 0;

		/*
			Queues of promises resolve callbacks to be resolved when the
			resource becomes available.
		*/
		this.exclusiveWaiters	= [];
		this.waiters			= [];
	}

	public take(exclusive: boolean): Promise<any>
	{
		return new Promise((resolve, reject) => {
			if (exclusive) {
				if (this.readers === 0 && this.writers === 0) {
					/*
						Nothing else is accessing the resource now, so exclusive
						access is available.
					*/
					this.writers++;
					resolve(this.value);
				} else {
					/* This can't be resolved yet */
					this.exclusiveWaiters.push(resolve);
				}
			} else {
				if (this.writers === 0 && this.exclusiveWaiters.length === 0) {
					/*
						Nothing has exclusive access now, and nothing is waiting
						for exclusive access so read access can be given.
					*/
					this.readers++;
					resolve(this.value);
				} else {
					/* This can't be resolved yet */
					this.waiters.push(resolve);
				}
			}
		});
	}

	public leave(): void
	{
		if (this.writers) {
			this.writers--;
		} else if (this.readers) {
			this.readers--;
		} else {
			throw new NotLockedError("Resource released that was not in use");
		}

		/*
			If something is waiting for exclusive access then that should be
			granted first.
		*/
		if (this.writers === 0 && this.readers === 0 &&
			this.exclusiveWaiters.length > 0
		) {
			this.giveExclusive();
			return;
		}

		/*
			If nothing has exclusive access, and nothing is waiting for it then
			we can give out read access to anything that is waiting.
		*/
		if (this.writers === 0 && this.exclusiveWaiters.length === 0) {
			this.giveReaders();
			return;
		}
	}

	giveExclusive(): void
	{
		let		w;

		if ((w = this.exclusiveWaiters.shift())) {
			this.writers++;
			w(this.value);
		}
	}

	giveReaders(): void
	{
		let		w;

		while ((w = this.waiters.shift())) {
			this.readers++;
			w(this.value);
		}
	}

	public check(): number
	{
		return	this.readers		+
				this.writers		+
				this.waiters.length	+
				this.exclusiveWaiters.length;
	}
}

