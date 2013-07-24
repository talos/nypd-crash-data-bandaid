VERSION=v1

clean:
	rm -rf public/js/*

compile: clean
	cp -r lib public/js/
	cat src/letsmap.js \
	    src/routers/* \
	    src/views/* \
	    > public/js/letsmap.js
	#uglifyjs -c -b -o public/js/letsmap.min.js public/js/letsmap.js
	cp -R lib public/js/

# Deploy to S3
deploy: compile
	s3cmd --config=.s3cfg --acl-public sync public/ s3://nyc.crashmapper.com
