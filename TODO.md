Interested in hacking on crashmapper and/or the nypd crash data bandaid?  These
are some outstanding tasks:

### Low-hanging fruit

* __(RESOLVED)__ `e766e46` *Mobile block, to advise people against trying to
  load the map on their cell phones.*
* A clearer disclaimer/link to licensing info.
* __(RESOLVED)__ `0507c49` *Determine end date from loaded data instead of
  hardcoding it.*
* Explanation in docs of how to read popup layout.
* Help in-popup to see what it means.
* Better icons for single intersections/incidents.

### Bug-fixes

* __(RESOLVED)__ `b6c787b` *Investigate GH issue #1, and see whether the Excel
  input script is sometimes dropping certain stats from intersections.*
* __(RESOLVED)__ `d771a9e` *Memory profile and fix leaks, particularly in FF.*
* __(RESOLVED)__ `d6cb4c7` *Fix bug that could cause empty popups to display.*
* Panning across the map after an overlay change doesn't always refresh data
  properly.

### Significant new features

* __(RESOLVED)__ `a5e4a19` *Allowing the selection of a date range, aggregating
  stats within.*
* __(RESOLVED)__ `398fd23` *Allow for a date range to be dragged in its
  entirety, rather than just one edge.*
* Providing an interface to view the vehicle type and contributing factor
  overlays.  The data's already loaded in.
* __(RESOLVED)__ `3a11c1e` *Display a color-coded legend.*
* Location box to quickly jump to a specific address.
* Allow custom aggregation based off of a drawn shape.
  - Provide some useful pre-made shapes (council districts, CDs, boroughs,
    etc.)
* Allow automatic zoom-to-area.
* __(RESOLVED)__ `4f40b81` *Provide interface to change "volume" of data.*
* Allow for quick back-and-forth switches between different views (for example,
  to compare two different time spans.)
* Use NYC Geocoder instead of Google
* Allow search for specific intersection based off characteristics (at least X
  collisions with injuries, etc.)

### Infrastructural changes

* Tests (!)
* __(RESOLVED)__ `35af1635` *Implement staging server and nonbreaking push of
  new features from it.*
* __(RESOLVED)__ `bc8dde4b` *Change crashmapper JS namespace from `Letsmap` to
  `Crashmapper`.*
* Possibly refactor crashmapper entirely out of the band-aid (dependencies are
  limited to the data transfer.)
* Investigate ways to break the data set into several requests while keeping it
  responsive.
  - Perhaps load the lon/lat data as an array alongside a simple array of the
    currently displayed overlay?  Two smaller requests instead of one, still
    provides immediate zoom/time scan response.  A third request could be
    point-in-time for all data dimensions, for providing readout on popup.

### Horizon

* Mobile support.
* Other cities.
* Complementary data sets (traffic counts, NYS collision data.)
