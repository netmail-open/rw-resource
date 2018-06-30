TSC_FLAGS		= --sourceMap -t ES6 --noEmitOnError --module commonjs

all: index.js test.js

node_modules:
	npm install

%.js: %.ts node_modules
	tsc ${TSC_FLAGS} $<

clean:
	@rm *.js *.js.map || true

test:
	npm test

install:
	@true


.PHONY: clean test install

