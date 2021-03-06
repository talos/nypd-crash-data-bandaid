SHA1=$(shell git rev-parse HEAD)

test:
	echo $(SHA1)

clean:
	rm -rf build/*

compile: clean
	mkdir -p build/js
	cp -R public/css public/images public/index.html public/favicon.ico public/data build/
	cp -R lib build/js/
	echo 'var _CRASHMAPPER_HASH = "$(SHA1)";' > build/js/crashmapper.js
	cat src/header.js \
	    src/crashmapper.js \
	    src/routers/* \
	    src/views/* \
	    src/footer.js \
	    >> build/js/crashmapper.js

host: compile
	cd build && python -m SimpleHTTPServer 8000

gzip:
	find build/js -type f -exec gzip {} \; -exec mv {}.gz {} \;
	find build/css -type f -exec gzip {} \; -exec mv {}.gz {} \;
	gzip build/index.html && mv build/index.html.gz build/index.html

prod-bucket:
	$(eval BUCKET = s3://nyc.crashmapper.com)

staging-bucket:
	$(eval BUCKET = s3://staging.nyc.crashmapper.com)

s3: compile gzip
	s3cmd --config=.s3cfg --acl-public --delete-removed --exclude=.DS_Store \
		--add-header "Content-Encoding:gzip" \
		sync build/js/ ${BUCKET}/js/
	s3cmd --config=.s3cfg --acl-public --delete-removed --exclude=.DS_Store \
		--add-header "Content-Encoding:gzip" \
		sync build/css/ ${BUCKET}/css/
	s3cmd --config=.s3cfg --acl-public --delete-removed --exclude=.DS_Store \
		sync build/images/ ${BUCKET}/images/
	s3cmd --config=.s3cfg --acl-public \
		put build/favicon.ico ${BUCKET}/favicon.ico
	s3cmd --config=.s3cfg --acl-public \
		--add-header "Content-Encoding:gzip" \
		put build/index.html ${BUCKET}/index.html
	s3cmd --config=.s3cfg --acl-public\
		--add-header "Content-Encoding:gzip" \
		--add-header "Content-Type:application/json" \
		put build/data/collisions.json.gz ${BUCKET}/data/collisions.json.gz

stage: staging-bucket s3

deploy: prod-bucket s3
