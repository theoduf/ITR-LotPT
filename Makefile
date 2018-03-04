all: dist/assets/thirdparty/images/sun.svg dist/index.htm dist/style.min.css dist/infinite-tower-run.js dist/infinite-tower-run.min.js dist/infinite-tower-run.map

dist/index.htm: src/index.htm
	@mkdir -p dist/
	cp src/index.htm dist/

dist/infinite-tower-run.min.js dist/infinite-tower-run.map: src/infinite-tower-run.js
	cd src && npx google-closure-compiler --charset UTF-8 --compilation_level=ADVANCED_OPTIMIZATIONS --create_source_map ../dist/infinite-tower-run.map --output_wrapper "%output%//# sourceMappingURL=infinite-tower-run.map" --js=infinite-tower-run.js --js_output_file=../dist/infinite-tower-run.min.js

dist/infinite-tower-run.js: src/infinite-tower-run.js
	@mkdir -p dist/
	cp src/infinite-tower-run.js dist/

dist/style.min.css: src/style.css
	@mkdir -p dist/
	npx uglifycss src/style.css > dist/style.min.css

dist/assets/thirdparty/images/sun.svg: assets/thirdparty/images/sun.svg
	@mkdir -p dist/assets/thirdparty/images/
	cp assets/thirdparty/images/sun.svg dist/assets/thirdparty/images/sun.svg
