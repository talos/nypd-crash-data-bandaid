VERSION=v1

compile:
	mkdir -p public/js/lib
	cp -r lib public/js/lib
	cat src/letsmap.js \
	    src/routers/* \
	    src/views/* \
	    > public/js/letsmap.js
	#uglifyjs -c -b -o public/js/letsmap.min.js public/js/letsmap.js
	cp -R lib public/js/

clean:
	rm -r public/js/*
	rm -r public/research/*
