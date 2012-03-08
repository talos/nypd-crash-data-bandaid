// Fires when the DOM is loaded, but before images.
$(document).ready(function() {

    // Dynamic link
    var pseudoPath = $( '#pseudositer a' ).first().attr( 'href' );
    
    // Initialize pseudositer
    $('#pseudositer').pseudositer( pseudoPath, {
        recursion: false,
        decodeUri: true,
        stripSlashes: true,
        showExtension: true
    });
});
