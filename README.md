# NYPD Crash Data Bandaid

NYPD traffic crash [data][] has a booboo. This eases the pain.

  [data]: http://www.nyc.gov/html/nypd/html/traffic_reports/motor_vehicle_accident_data.shtml

> Council Member Jessica Lappin got into an animated discussion with
> Petito over traffic crash data. When Lappin asked why NYPD is
> releasing data in PDF form — and only after the council adopted
> legislation forcing the department to do so — Petito replied that the
> department is "concerned with the integrity of the data itself."
> Petito said NYPD believes data released on a spreadsheet could be
> manipulated by people who want "to make a point of some sort." An
> incredulous Lappin assured Petito that the public only wants to
> analyze the data to improve safety, not use it for "evil."

(from [Streetsblog][])

  [Streetsblog]: http://www.streetsblog.org/2012/02/15/nypds-lax-crash-investigations-may-violate-state-law

Want to automatically download the latest NYPD traffic crash data as a
CSV instead of PDF?  Done!

## Installation

First, make sure you have the handy pdftotext utility, part of [xpdf][].

  [xpdf]: http://www.foolabs.com/xpdf/

You will need Python (I've only tested with 2.7) and wget.

On Mac:

    brew install xpdf
    brew install wget

Debian:

    sudo aptitude install xpdf-utils

Then, clone the repo:

    git clone https://github.com/talos/nypd-crash-data-bandaid.git

And run the shell script:

    cd nypd-crash-data-bandaid/
    ./download.sh

You will now be graced with a folder inside `public/data/`, named in the
format `YYYYMM`, with borough-by-borough crash data as a CSV.

If you have already downloaded the data currently on the site, the
script will bow out gracefully and tell you there is no new data.  The
NYPD doesn't keep historical files, but the script's placement of the
CSV makes it easy for you to.

You can even adapt the sample cronjob to run the script daily.

## Credit

Thanks to David Turner for writing the original scrapeintersections.py
script.  It is accessible [here](http://novalis.org/programs/scrapeintersections.txt).

Thanks to Matthew Kime for suggesting the name.

Thanks to [Streetsblog](http://www.streetsblog.org/) for being awesome.

## Just give me the data already!

OK, OK.  Go to:

[http://nypd.openscrape.com/](http://nypd.openscrape.com/)

Historical data will be kept there, too.  Watch the [RSS feed][]!

  [RSS feed]: http://nypd.openscrape.com/data/feed.xml

## I wanna API! I wanna make mashups!

Data's there.  I'm not stopping you. ;)

## License

GPLv3, just as it should be.
