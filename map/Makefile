VERSION=v1

clean:
	rm -rf build/*

compile: clean
	mkdir -p build/js
	cp -R public/css public/images public/index.html public/favicon.ico public/data build/
	cp -R lib build/js/
	cat src/letsmap.js \
	    src/routers/* \
	    src/views/* \
	    > build/js/letsmap.js
	#uglifyjs -c -b -o public/js/letsmap.min.js public/js/letsmap.js

host: compile
	cd build && python -m SimpleHTTPServer 8000

gzip:
	find build/js -type f -exec gzip {} \; -exec mv {}.gz {} \;
	find build/css -type f -exec gzip {} \; -exec mv {}.gz {} \;
	gzip build/index.html && mv build/index.html.gz build/index.html

# Deploy to S3
deploy: compile gzip
	s3cmd --config=.s3cfg --acl-public --delete-removed --exclude=.DS_Store \
		--add-header "Content-Encoding:gzip" \
		sync build/js/ s3://nyc.crashmapper.com/js/
	s3cmd --config=.s3cfg --acl-public --delete-removed --exclude=.DS_Store \
		--add-header "Content-Encoding:gzip" \
		sync build/css/ s3://nyc.crashmapper.com/css/
	s3cmd --config=.s3cfg --acl-public --delete-removed --exclude=.DS_Store \
		sync build/images/ s3://nyc.crashmapper.com/images/
	s3cmd --config=.s3cfg --acl-public \
		put build/favicon.ico s3://nyc.crashmapper.com/favicon.ico
	s3cmd --config=.s3cfg --acl-public \
		--add-header "Content-Encoding:gzip" \
		put build/index.html s3://nyc.crashmapper.com/index.html
	s3cmd --config=.s3cfg --acl-public\
		--add-header "Content-Encoding:gzip" \
		--add-header "Content-Type:application/json" \
		put build/data/collisions.json.gz s3://nyc.crashmapper.com/data/collisions.json.gz
