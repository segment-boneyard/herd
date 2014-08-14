TESTS= $(shell ls ./test)

test: ${TESTS}

${TESTS}:
	@node ./test/$@

.PHONY: test