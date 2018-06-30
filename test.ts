import 'mocha';
import RWRes from './index';
const chai		= require('chai');
const expect	= chai.expect;
const debug		= require('debug')('rw-resource');

function delay(time: number, value: any): Promise<any>
{
	return new Promise((resolve, reject) => {
		setTimeout(function() {
			resolve(value);
		}, time);
	});
}

describe('RW Resources', () => {
	before(function() {
		this.timeout(0);
	});

	it('should allow a single writer', () => {
		let Data	= new RWRes({ val: 3 });

		return Data.take(true)
		.then((data) => {
			expect(data.val).to.equal(3);

			return delay(250, data);
		})
		.then((data) => {
			Data.leave();
		})
		.then(() => {
			expect(Data.check()).to.equal(0);
		});
	});

	it('should allow a single reader', () => {
		let Data	= new RWRes({ val: 3 });

		return Data.take(false)
		.then((data) => {
			expect(data.val).to.equal(3);

			return delay(250, data);
		})
		.then((data) => {
			Data.leave();
		})
		.then(() => {
			expect(Data.check()).to.equal(0);
		});
	});

	it('should allow multiple concurrent readers', () => {
		let Data	= new RWRes({ val: 3 });

		return Promise.all([
			Data.take(false),
			Data.take(false),
			Data.take(false)
		])

		.then((datas) => {
			for (let data of datas) {
				expect(data.val).to.equal(3);

				Data.leave();
			}
		})
		.then(() => {
			expect(Data.check()).to.equal(0);
		});
	});

	it('should prevent writers while readers are active', () => {
		let Data	= new RWRes({ val: 3 });

		return Promise.all([
			Data.take(false)
			.then((data) => { return delay(250, data); })
			.then((data) => {
				expect(data.val).to.equal(3);
				Data.leave();
			}),

			Data.take(false)
			.then((data) => { return delay(500, data); })
			.then((data) => {
				expect(data.val).to.equal(3);
				Data.leave();
			}),

			Data.take(true)
			.then((data) => {
				data.val = 7;

				expect(data.val).to.equal(7);
				Data.leave();
			})
		])
		.then(() => {
			expect(Data.check()).to.equal(0);
		});
	});

	it('should prevent readers while a writer is active', () => {
		let Data	= new RWRes({ val: 3 });

		return Promise.all([
			Data.take(false)
			.then((data) => { return delay(250, data); })
			.then((data) => {
				expect(data.val).to.equal(3);
				Data.leave();
			}),

			Data.take(true)
			.then((data) => { return delay(50, data); })
			.then((data) => {
				expect(data.val).to.equal(3);
				data.val = 7;
				expect(data.val).to.equal(7);
				Data.leave();
			}),

			Data.take(false)
			.then((data) => {
				expect(data.val).to.equal(7);
				Data.leave();
			})
		])
		.then(() => {
			expect(Data.check()).to.equal(0);
		});
	});

	it('should enforce writer order', () => {
		let Data	= new RWRes({ val: 1 });

		return Promise.all([
			Data.take(true)
			.then((data) => { return delay(250, data); })
			.then((data) => {
				/*
					All 4 promises should have attempted access by this point
					because of the delay.
				*/
				expect(Data.check()).to.equal(4);

				expect(data.val).to.equal(1);
				data.val++;
				Data.leave();
			}),

			Data.take(true)
			.then((data) => { return delay(50, data); })
			.then((data) => {
				expect(data.val).to.equal(2);
				data.val++;
				Data.leave();
			}),

			Data.take(true)
			.then((data) => { return delay(5, data); })
			.then((data) => {
				expect(data.val).to.equal(3);
				data.val++;
				Data.leave();
			}),

			Data.take(false)
			.then((data) => {
				expect(data.val).to.equal(4);
				Data.leave();
			})
		])
		.then(() => {
			expect(Data.check()).to.equal(0);
		});
	});

	it('should throw on extra calls to leave', () => {
		let Data	= new RWRes({ val: 3 });

		return Promise.all([
			Data.take(false),
			Data.take(false),
			Data.take(false)
		])

		.then((datas) => {
			for (let data of datas) {
				Data.leave();
			}

			/* One extra call to .leave */
			Data.leave();
		})
		.then(() => {
			throw new Error('We should not get here');
		})
		.catch((err) => {
			expect(err.name).to.equal('NotLockedError');
		})
		.then(() => {
			expect(Data.check()).to.equal(0);
		});
	});






});
