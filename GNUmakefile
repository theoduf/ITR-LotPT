JSSRC:= src/license.js src/main.js src/state.js src/game/characters.js src/game/environment.js src/game/cameras.js src/game/game.js src/viewablefailures.js src/viewablemenus.js src/viewableresourceloader.js src/statechart.js
JSSRCDIST:= $(subst src/,dist/,${JSSRC})
CLSRCARG:= $(subst src/,,${JSSRC})

IMAGES:= dist/assets/thirdparty/images/sun.svg

all: ${IMAGES} dist/index.htm dist/style.min.css dist/main.min.js dist/main.map ${JSSRCDIST}

dist/index.htm: src/index.htm
	@mkdir -p dist/
	cp src/index.htm dist/

dist/main.min.js dist/main.map: ${JSSRC}
	cd src && npx google-closure-compiler --charset UTF-8 \
	  --compilation_level ADVANCED_OPTIMIZATIONS \
	  --create_source_map ../dist/main.map \
	  --output_wrapper "%output%//# sourceMappingURL=main.map" \
	  --js ${CLSRCARG} --js_output_file ../dist/main.min.js

dist/game/%.js: src/game/%.js
	@mkdir -p dist/game/
	cp $< dist/game/

dist/%.js: src/%.js
	@mkdir -p dist/
	cp $< dist/

dist/style.min.css: src/style.css
	@mkdir -p dist/
	npx uglifycss src/style.css > dist/style.min.css

dist/assets/thirdparty/images/%: assets/thirdparty/images/%
	@mkdir -p dist/assets/thirdparty/images/
	cp $< $@
