/* This plugin allows you to dynamically change styles on the page. */
/*

Call the plugin on a form:

$( "form#styleswitcher" ).styleswitcher();

*/



(function($) {

	/* Find available stylesheets on the page */
	var findLinks = function() {
		return $('link[@rel*="style"][title]');
	};

	/* Pull style name from address. */
	var currentStyle = decodeURI( window.location.search.substr(1) );

	/* Static initialization code on the entire page, once it's loaded. 
	 *
	 * This will enable the correct style sheet depending upon the URL.
	 */
	$( window ).load( function() { // document.ready doesn't work.
		
		var $links = findLinks();

		/* Add options to switcher */
		$links.each( function( idx, elem ) {
			/* Use title as name of option. */
			var title = this.getAttribute('title'),
			$link = $( elem );
			
			$link.prop( 'disabled', true ); // this -has- to be called before!
			if ( title === currentStyle ) {
				$link.prop( 'disabled', false );
			} else if ( currentStyle === '' && this.getAttribute('rel') === 'stylesheet' ) {
				$link.prop( 'disabled', false ); // for null title, non-alternate is enabled
			}
		});
	});

	/* Plugin object */
	$.styleswitcher = function( el, options ) {
		this.init = function() {
			var $el = $( el ),
			
			/* Create switcher form */
			$switcher = $( '<select />' ).appendTo( $el )
				.before( $( '<label /> ' ).text( 'Style:' ) );
			
			/* Add options to switcher */
			findLinks().each( function( idx ) {
				
				/* Use title as name of option. */
				var title = this.getAttribute('title'),
				$option = $( '<option />' ).text( title ).attr( 'value', title );
				
				if ( title === currentStyle ) {
					$option.attr( 'selected', true );
				} else if ( currentStyle === '' && this.getAttribute('rel') === 'stylesheet' ) {
					$option.attr( 'selected', true );
				}

				$option.appendTo( $switcher );
			});

			/* Listen to $switcher */
			$switcher.change( function( evt ) {
				selectedStyle = $switcher.val();
				
				/* Refresh page */
				window.location.search = selectedStyle;
			});
		};

		return this.init();
	};
	
	/* jQuery boilerplate */
	$.fn.styleswitcher = function( options ) {
		return $.each(this, function(i, el) {
			var $el = $(el);
			// Plugin must be called on a form.
			if ( !$el.is('form') ) {
				$.error( "Styleswitcher must be called on a form element." );
			} else if (!$el.data('styleswitcher')) {
				return $el.data('styleswitcher', new $.styleswitcher(el, options));
			}
		});
	};
})(jQuery);