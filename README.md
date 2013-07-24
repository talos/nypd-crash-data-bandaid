# NYPD Crash Data Bandaid

NYPD traffic collision [data][] has a booboo. This eases the pain.

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
CSV instead of hard-to-interpret Excel file?  Done!

## Installation

First, clone the repo:

    git clone https://github.com/talos/nypd-crash-data-bandaid.git
    cd nypd-crash-data-bandaid/

You'll need Python 2.7, and preferably virtualenv/virtualenvwrapper.  Install
the requirements in your virtualenv:

    pip install -r requirements.txt

And run the shell script:

    ./bandaid.sh

You can even adapt the sample cronjob to run the script daily.

## Credit

Thanks to David Turner for writing the original scrapeintersections.py
script.  It is accessible [here](http://novalis.org/programs/scrapeintersections.txt).

Thanks to Matthew Kime for suggesting the name.

Thanks to [Streetsblog](http://www.streetsblog.org/) for being awesome.

Thanks to [Transportation Alternatives](http://www.transalt.org/) for supplying
missing older data, the raw violations files, and the full list of violations
URLs.

Thanks to Tom Swanson for his invaluable help in geocoding the vast majority of
intersections.

## Just give me the data already!

OK, OK.  Go to:

[http://nypd.openscrape.com/](http://nypd.openscrape.com/)

Historical data will be kept there, too.  Watch the [RSS feed][]!

  [RSS feed]: http://nypd.openscrape.com/data/feed.xml

## I wanna API! I wanna make mashups!

Data's there.  I'm not stopping you. ;)

## License

GPLv3, just as it should be.
