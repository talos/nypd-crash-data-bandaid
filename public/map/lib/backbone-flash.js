/*globals define*/

define([
    'require',
    'libs/backbone',
    'libs/jquery'
], function (require, backbone) {
    "use strict";

    var $ = require('jquery'),
        FLASH_TIMEOUT = 4000;

    backbone.FlashView = backbone.View.extend({

        /**
         * Flash a message to the user.  Add optional CSS class.
         */
        flash: function (msg, klass) {
            var $flash = this.$el.find('.flash'),
                synthetic = false;
            if ($flash.length === 0) {
                $flash = this.$el.append($('<div />'));
            }
            $flash.text(msg).show();
            if (klass) {
                $flash.addClass(klass);
            }
            setTimeout(function () {
                $flash.fadeOut().removeClass(klass);
                if (synthetic === true) {
                    $flash.remove();
                }
            }, FLASH_TIMEOUT);
        },
    });
});
