# Build

build:
	rm    -rf ./out/
	mkdir -p  ./out/
	make assets
	make scripts-debug
	make templates
	make stylesheets


build-release:
	rm    -rf ./out/
	mkdir -p  ./out/
	make assets
	make scripts
	make templates
	make stylesheets


docs:
	make build-release
	mv ./out ./docs


# Stylesheets

STYLESHEETS_VENDOR += ./node_modules/reset-css/reset.css
STYLESHEETS        += ./src/alice.styl
STYLESHEETS_OUTPUT  = ./out/bundle.css

STYLUS         = ./node_modules/stylus/bin/stylus
STYLUS_PARAMS += --compress
STYLUS_PARAMS += --print >> $(STYLESHEETS_OUTPUT)

stylesheets:
	cat $(STYLESHEETS_VENDOR) > $(STYLESHEETS_OUTPUT)
	$(STYLUS) $(STYLESHEETS) $(STYLUS_PARAMS)


TEMPLATES        += ./src/index.pug
TEMPLATES_OUTPUT  = ./out

PUG_CLI         = ./node_modules/pug-cli/index.js
PUG_CLI_PARAMS += --obj ./package.json
PUG_CLI_PARAMS += --out ./out

templates:
	$(PUG_CLI) $(TEMPLATES) $(PUG_CLI_PARAMS)


# Javascript

SCRIPTS        += ./src/alice.js
SCRIPTS        += $(shell find ./src/lib      -iname "*.js" -not -iname "*.test.js")
SCRIPTS        += $(shell find ./src/features -iname "*.js" -not -iname "*.test.js")
SCRIPTS_OUTPUT  = ./out/bundle.js

TERSER         = ./node_modules/terser/bin/terser
TERSER_PARAMS += --compress
TERSER_PARAMS += --mangle
TERSER_PARAMS += --

scripts:
	$(TERSER) $(TERSER_PARAMS) $(SCRIPTS) > $(SCRIPTS_OUTPUT)

scripts-debug:
	cat $(SCRIPTS) > $(SCRIPTS_OUTPUT)


# Assets

ASSETS += ./src/assets

assets: $(ASSETS)
	cp -R $(ASSETS) ./out/assets


# Utilities

serve:
	node ./index.js


setup:
	make clean
	npm  install


clean:
	rm -rf ./out/
	rm -rf ./node_modules/
