all: build
test:
	@./node_modules/.bin/babel-node ./node_modules/.bin/babel-istanbul cover ./node_modules/mocha/bin/_mocha -- --compilers js:babel-core/register --reporter dot test
.PHONY: test build
