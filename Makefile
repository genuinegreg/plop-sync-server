all: npm

npm: npmInstall npmUpdate

npmInstall:
	npm install

npmUpdate:
	npm update