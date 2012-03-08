(function() {

  /*
  # Add a mapping for the Markdown parser to Pseudositer.  You must load
  # Showdown beforehand.  Load this after Pseudositer.
  #
  # <html>
  #   <head>
  
  #     <!-- jQuery -->
  #     <script type="text/javascript" src="lib/jquery/jquery-1.6.4.min.js"></script>
  
  #     <!-- Showdown -->
  #     <script type="text/javascript" src="lib/showdown/showdown.min.js"></script>
  
  #     <!-- pseudositer -->
  #     <script type="text/javascript" src="lib/pseudositer/pseudositer.js"></script>
  #     <script type="text/javascript" src="lib/pseudositer/pseudositer-extensions/pseudositer.showdown.js"></script>
  #     <script type="text/javascript">
  #       $(document).ready(function() {
  #           $('#pseudositer').pseudositer('path/to/content/index/');
  #       });
  #    </script>
  #   </head>
  #   <body>
  #     <div id="pseudositer" />
  #   </body>
  # </html>
  */

  (function($) {
    var converter, loadMarkdown;
    converter = new Showdown.converter();
    loadMarkdown = function(pathToMarkdown) {
      var dfd;
      dfd = new $.Deferred();
      $.get(pathToMarkdown).done(function(responseText) {
        return dfd.resolve($('<div />').html(converter.makeHtml(responseText)));
      }).fail(function(errObj) {
        return dfd.reject(errObj.statusText);
      });
      return dfd;
    };
    $.extend($.pseudositer.defaultMap, {
      md: loadMarkdown,
      markdown: loadMarkdown
    });
    return;
  })(jQuery);

}).call(this);
