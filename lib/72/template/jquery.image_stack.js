/*
 * Copyright 2012, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function($) {
  /**
   * Given the following markup pattern:
   *
   * <div class="image-stack">
   *   <a href="#foo" class="img-stack-item"><img src="image-01.jpg" /></a>
   *   <a href="#foo" class="img-stack-item"><img src="image-02.jpg" /></a>
   *   <a href="#foo" class="img-stack-item"><img src="image-03.jpg" /></a>
   *   etc…
   * </div>
   *
   * $(".image_stack").image_stack();
   *
   * Will do the following:
   *
   * 1. Find all images inside the selector
   * 2. Determine a count of said images
   * 3. Apply appropriate z-index value for each image
   * 4. Apply random css3 rotation value
   */

  $.fn.image_stack = function(options) {

    options = $.extend({
      min: 0,
      max: 10
    }, options);

    return this.each(function(){

      // Get the images and total count
      var images = $(this).children(".img-stack-item");
      var image_count = images.length;

      images.each(function(index){
        var $img = $(this);

        // z-index to be applied to image
        var z_index = image_count - index;

        // rotation value to be applied to image
        var rotate_amount = random_value(options.min, options.max);

        // Set base rotation amount
        var rotation = rotate_amount + 'deg';

        // If we're on the first (top) image, set rotation to 0
        if ((index) === 0 ) {
          rotation = '0deg';
        }
        // If index value is odd, make rotation value negative
        else if(!is_even(index)) {
          rotation = "-" + rotation;
        }

        $img.css({
          "z-index": z_index,
          "-webkit-transform": "rotate(" + rotation + ")",
          "-moz-transform": "rotate(" + rotation + ")",
          "transform": "rotate(" + rotation + ")"
        });


      });

      var offset = 0;
      $(this).hover(

        // Animate images out when user hovers
        function() {
          var $images = $(this).children(".img-stack-item");
          var margin = 10;

          $images.each(function(index){
            var $container = $(this);
            var $img = $container.children("img:first");

            $container.css("left", offset);
            offset = offset + $img.width() + margin;

            if (index === 1) {
              var rotation = "-10deg";
              $container.css("left", "-30px");
              $container.css({
                "-webkit-transform": "rotate(" + rotation + ")",
                "-moz-transform": "rotate(" + rotation + ")",
                "transform": "rotate(" + rotation + ")"
              })
            }
            else if (index === 2) {
              var rotation = "10deg";
              $container.css("left", "30px");
              $container.css({
                "-webkit-transform": "rotate(" + rotation + ")",
                "-moz-transform": "rotate(" + rotation + ")",
                "transform": "rotate(" + rotation + ")"
              })
            }
          });
          return false;
        },

        // Reset image position on mouseout
        function() {
          var $images = $(this).children(".img-stack-item");
          $images.css('left', '0');
          offset = 0;
        }
      );


    });

    function is_even(value) {
      return (value%2 === 0) ? true : false;
    }

    function random_value(minVal,maxVal) {
      var randVal = minVal+(Math.random()*(maxVal-minVal));
      return typeof floatVal== 0 ? Math.round():randVal.toFixed();
    }

  };

}) (jQuery);
