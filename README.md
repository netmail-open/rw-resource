# rw-resource
A simple nodejs helper to protect access to a resource


## Description
'rw-resource' is a Node.js module that provides Promises that can be used to
protect access to a resource across multiple async operations.

A common use case may be an object that needs to stored to a permanent location
regularly but doing so requires multiple async operations, where any
modification to that object while the write operations are in progress would
prevent storing it successfully.


## Examples
```typescript
import RWRes from 'rw-resource';

/* Create a managed resource (with an initial value) */
let Data = new RWRes({ foo: 'bar' });

/* non-exclusive access */
Data.take()
.then((data) => {
	/* We now have non-exclusive access to the value */
	return delay(250, data)
})
.then((data) => {
	/*
		We are now in a different function, but still have access to the value
		and anyone waiting for exclusive access will not be given the value
		until we leave it.
	*/
	Data.leave();
});

/* Another non-exclusive access */
Data.take()
.then((data) => {
	/*
		We now have non-exclusive access to the value, even though another
		consumer also has non-exclusive access.
	*/
	Data.leave();
});


/* Exclusive access */
Data.take(true)
.then((data) => {
	/*
		We now have exclusive access to the value. The promise will not resolve
		until both of the earlier consumers are done with it.
	*/
	return delay(250, data)
})
.then((data) => {
	Data.leave();
});




/* Helper delay promise */
function delay(time: number, value: any): Promise<any>
{
	return new Promise((resolve, reject) => {
		setTimeout(function() {
			resolve(value);
		}, time);
	});
}


```
