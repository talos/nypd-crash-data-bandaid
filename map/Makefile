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
	s3cmd --config=.s3cfg --acl-public --delete-removed \
		sync public/js/ s3://nyc.crashmapper.com/js/
	s3cmd --config=.s3cfg --acl-public --delete-removed \
		sync public/css/ s3://nyc.crashmapper.com/css/
	s3cmd --config=.s3cfg --acl-public --delete-removed \
		sync public/images/ s3://nyc.crashmapper.com/images/
	s3cmd --config=.s3cfg --acl-public\
		--add-header "Content-Encoding:gzip" \
		--add-header "Content-Type:application/json" \
		put public/data/collisions.json.gz s3://nyc.crashmapper.com/data/collisions.json.gz
	s3cmd --config=.s3cfg --acl-public \
		put public/index.html s3://nyc.crashmapper.com/index.html
