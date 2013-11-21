all: npm

npm: npmInstall npmUpdate

npmInstall:
	npm install

npmUpdate:
	npm update

clean:
	rm -R bin
