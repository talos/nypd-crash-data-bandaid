# Good news!

The NYPD is now uploading collision data to the NYC Open Data portal.  You can
[find it here][].

  [find it here]: https://data.cityofnewyork.us/NYC-BigApps/NYPD-Motor-Vehicle-Collisions/h9gi-nx95

This data is of vastly superior quality to the old release, correcting most of
the major deficiencies of the old data.  It is:

  * Machine readable in multiple open formats, instead of an Excel file
  * Published as a feed, rather than a monthly document drop
  * Granular to the individual incident, not aggregated by intersection and
    month
  * Geocoded with lon/lat, although still only to the nearest intersection

Since the data now published is not aggregated, there is new information
available:

  * Time of day of the incident
  * Incidents that occurred off an intersection, for example in a parking lot
    (although these are not geocoded at all.)

Unfortunately, certain pieces of data are missing from the release, as compared
to the old format:

  * Types of vehicles involved (bus, semi, sanitation vehicle, etc.)
  * Passengers in cars injured/killed (the new release only counds
    "Pedestrians", "Cyclists", and "Drivers", while the old release also
    tabulated "Passengers"
  * Reporting precinct
  * Data going back to August 2011 (the current release picks up in July 2012).

The new releases also do not include moving violations data.

I'll leave the Bandaid online as a historical record, containing older data,
but the collisions will likely no longer be updated.  Moving violations will
continue to update as long as the NYPD releases them.

You can read a statement from [BetaNYC][] [here][].

  [BetaNYC]: http://betanyc.us/
  [here]: https://docs.google.com/document/d/1Z7cMUCtEjXoTr1Oys7Y14ERxBVfQ9X_Xl7aARAqenPw/edit

# NYPD Crash Data Bandaid

NYPD traffic collision [data][] has a booboo. This eases the pain.

  [data]: http://www.nyc.gov/html/nypd/html/traffic_reports/motor_vehicle_collision_data.shtml

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

Want to visualize collision data and break it down intersection by
intersection?  [Done](http://nyc.crashmapper.com)!

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

## Hacking

There's lots'o'work to be done!  Check out the [TODO][].

  [TODO]: https://github.com/talos/nypd-crash-data-bandaid/blob/master/TODO.md

## Credit

Thanks to David Turner for writing the original scrapeintersections.py
script.  It is accessible [here](http://novalis.org/programs/scrapeintersections.txt).

Thanks to Matthew Kime for suggesting the name.

Thanks to [Streetsblog](http://www.streetsblog.org/) for being awesome.

Thanks to [Transportation Alternatives](http://www.transalt.org/) for supplying
missing older data, the raw violations files, and the full list of violations
URLs.

Thanks to Tom Swanson for his invaluable help in geocoding the vast majority of
intersections. Check out his [maps](http://bit.ly/11ecHc5)!

## Just give me the data already!

OK, OK.  Go to:

[http://nypd.openscrape.com/](http://nypd.openscrape.com/)

Historical data will be kept there, too.  Watch the [RSS feed][]!

  [RSS feed]: http://nypd.openscrape.com/data/feed.xml

## I wanna API! I wanna make mashups!

Check out [Crashmapper](http://nyc.crashmapper.com).

Data's there.  I'm not stopping you. ;)

## License

GPLv3, just as it should be.
