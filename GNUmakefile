JSSRC:= src/license.js src/main.js src/failure.js src/menus.js src/resourceloader.js src/statechart.js
JSOUT:= $(subst src/,dist/,${JSSRC})
CLSRCARG:= $(subst src/,,${JSSRC})

all: dist/assets/thirdparty/images/sun.svg dist/index.htm dist/style.min.css dist/main.min.js dist/main.map ${JSOUT}

dist/index.htm: src/index.htm
	@mkdir -p dist/
	cp src/index.htm dist/

dist/main.min.js dist/main.map: ${JSSRC}
	cd src && npx google-closure-compiler --charset UTF-8 --compilation_level ADVANCED_OPTIMIZATIONS --create_source_map ../dist/main.map --output_wrapper "%output%//# sourceMappingURL=main.map" --js ${CLSRCARG} --js_output_file ../dist/main.min.js

dist/%.js: src/%.js
	@mkdir -p dist/
	cp $< dist/

dist/style.min.css: src/style.css
	@mkdir -p dist/
	npx uglifycss src/style.css > dist/style.min.css

dist/assets/thirdparty/images/sun.svg: assets/thirdparty/images/sun.svg
	@mkdir -p dist/assets/thirdparty/images/
	cp assets/thirdparty/images/sun.svg dist/assets/thirdparty/images/sun.svg
