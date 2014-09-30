/* zepto.revolver - v0.0.3 - MIT */
/* A do-it-all carousel that's simple, flexible and lightweight */
/* https://github.com/stephenhutchings/zepto.revolver.git */
(function(window, document, $) {
  "use strict";
  var Revolver, defaults, div, isTouch, isZepto, prefix;
  defaults = {
    draggingMS: 300,
    controlsMS: 800,
    autoplayMS: 5000,
    returnToStart: true,
    returnToStartMS: 1000,
    stopOnHover: true,
    navigation: ["&larr;", "&rarr;"],
    pagination: true,
    paginationNumbers: false,
    items: 5,
    breakpoints: [[1199, 4], [979, 3], [768, 2], [479, 1]]
  };
  isTouch = "ontouchstart" in window;
  isZepto = $.zepto;
  div = "<div/>";
  prefix = function(style) {
    var emptyStyle, prefixed, vendor, _i, _len, _ref;
    emptyStyle = document.createElement("div").style;
    if (style in emptyStyle) {
      return style;
    }
    _ref = ["webkit", "Moz", "ms", "O"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      vendor = _ref[_i];
      prefixed = vendor + style.charAt(0).toUpperCase() + style.substr(1);
      if (prefixed in emptyStyle) {
        return prefixed;
      }
    }
    return false;
  };
  Revolver = function(opts, el) {
    this.init(opts, el);
    return this;
  };
  Revolver.prototype = {
    init: function(opts, el) {
      this.opts = $.extend({}, defaults, opts);
      this.$el = $(el).css({
        display: "block"
      }).addClass("revolver");
      this.supportTransform = prefix("transform") !== false;
      this.currentSlide = 0;
      this.playDirection = "next";
      this.totalItems = this.$el.children().size();
      this.wrapItems();
      this.items = this.$el.find(".rv-item");
      this.wrapper = this.$el.find(".rv-wrapper");
      this.style = this.wrapper.get(0).style;
      this.style.display = "block";
      this.bindMoveEvents();
      this.bindCustomEvents();
      this.bindStopOnHover();
      this.bindResize();
      return this.updateVars();
    },
    reset: function(opts) {
      this.opts = $.extend({}, defaults, opts);
      return this.updateVars();
    },
    updateVars: function() {
      this.setupControls();
      this.sizeForBreakpoints();
      this.resetAll();
      this.updateItems();
      this.updatePosition();
      this.updateNavigation();
      this.refreshPagination();
      this.updatePagination();
      return this.play() && this.opts.autoplayMS > 0;
    },
    wrapItems: function() {
      return this.$el.children().wrapAll("<div class=\"rv-wrapper\">").wrap("<div class=\"rv-item\"></div>");
    },
    sizeForBreakpoints: function() {
      var breakpoint, width, _i, _len, _ref, _results;
      if (!this.opts.breakpoints) {
        return;
      }
      width = $(window).width();
      _ref = this.opts.breakpoints;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        breakpoint = _ref[_i];
        if (width <= breakpoint[0]) {
          _results.push(this.opts.items = breakpoint[1]);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    bindResize: function() {
      if (!this.opts.breakpoints) {
        return;
      }
      this.opts.breakpoints.unshift([Infinity, this.opts.items]);
      return $(window).resize((function(_this) {
        return function() {
          if (_this.opts.autoplayMS > 0) {
            clearInterval(_this.autoplay);
          }
          clearTimeout(_this.resizeDelay);
          _this.resizeDelay = setTimeout(function() {
            _this.refreshPagination();
            _this.updateVars();
            return delete _this.resizeDelay;
          }, 200);
        };
      })(this));
    },
    updatePosition: function() {
      this.transition(0);
      this.translate(0);
      this.currentSlide = 0;
    },
    resetAll: function() {
      var _i, _ref, _results;
      this.itemWidth = Math.round(this.$el.width() / this.opts.items);
      this.style.width = "" + (this.items.size() * this.itemWidth * 2) + "px";
      this.style.left = 0;
      this.items.each((function(_this) {
        return function(i, el) {
          return $(el).css({
            width: _this.itemWidth
          }).data("rv-item", i);
        };
      })(this));
      this.lastSlide = this.totalItems - this.opts.items;
      this.maxPixels = -((this.totalItems * this.itemWidth) - this.opts.items * this.itemWidth);
      this.positions = $.map((function() {
        _results = [];
        for (var _i = 0, _ref = this.totalItems; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this), (function(_this) {
        return function(el) {
          return -_this.itemWidth * el;
        };
      })(this));
    },
    setupControls: function() {
      if (this.opts.navigation || this.opts.pagination) {
        if (this.rvControls) {
          this.rvControls.remove();
        }
        this.rvControls = $(div, {
          "class": "rv-controls"
        });
        if (this.opts.pagination) {
          this.setupPagination();
        }
        if (this.opts.navigation) {
          this.setupNavigation();
        }
        if (!isTouch) {
          this.rvControls.addClass("clickable");
        }
        return this.rvControls.appendTo(this.$el);
      }
    },
    setupNavigation: function() {
      var buttonGroup;
      this.buttonPrev = $(div, {
        "class": "rv-prev",
        html: this.opts.navigation[0]
      });
      this.buttonNext = $(div, {
        "class": "rv-next",
        html: this.opts.navigation[1]
      });
      buttonGroup = $(div, {
        "class": "rv-buttons"
      });
      buttonGroup.append(this.buttonPrev, this.buttonNext);
      this.updateNavigation();
      return this.rvControls.append(buttonGroup).on(this.getEvent(), ".rv-prev", (function(_this) {
        return function(e) {
          return _this.prev();
        };
      })(this)).on(this.getEvent(), ".rv-next", (function(_this) {
        return function(e) {
          return _this.next();
        };
      })(this));
    },
    getEvent: function() {
      if (isTouch) {
        return "touchstart.rvControls";
      } else {
        return "click.rvControls";
      }
    },
    setupPagination: function() {
      this.paginationWrapper = $(div, {
        "class": "rv-pagination"
      });
      return this.rvControls.append(this.paginationWrapper).on(this.getEvent(), ".rv-page", (function(_this) {
        return function(e) {
          var index;
          e.preventDefault();
          index = +$(e.currentTarget).data("rv-page");
          index -= Math.floor(_this.opts.items / 2);
          return _this.goTo(index, index !== _this.currentSlide ? _this.opts.controlsMS : 0);
        };
      })(this));
    },
    refreshPagination: function() {
      var i, _i, _ref, _results;
      if (!this.opts.pagination) {
        return;
      }
      this.paginationWrapper.html("");
      _results = [];
      for (i = _i = 0, _ref = this.totalItems; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push($(div, {
          "class": "rv-page"
        }).data("rv-page", i).html(this.opts.paginationNumbers ? i + 1 : "").appendTo(this.paginationWrapper));
      }
      return _results;
    },
    updatePagination: function() {
      return this.paginationWrapper.find(".rv-page").removeClass("active").slice(this.currentSlide, this.currentSlide + this.opts.items).addClass("active");
    },
    updateItems: function() {
      return this.items.removeClass("active").slice(this.currentSlide, this.currentSlide + this.opts.items).addClass("active");
    },
    updateNavigation: function() {
      if (!this.opts.navigation) {
        return;
      }
      this.buttonPrev.toggleClass("disabled", this.currentSlide === 0);
      return this.buttonNext.toggleClass("disabled", this.currentSlide === this.lastSlide);
    },
    destroyControls: function() {
      this.rvControls.off("rvControls");
      if (this.rvControls) {
        return this.rvControls.remove();
      }
    },
    next: function(speed) {
      this.currentSlide += this.opts.items;
      return this.goTo(this.currentSlide, speed || this.opts.controlsMS);
    },
    prev: function(speed) {
      this.currentSlide -= this.opts.items;
      return this.goTo(this.currentSlide, speed || this.opts.controlsMS);
    },
    goTo: function(position, speed) {
      this.currentSlide = Math.max(Math.min(position, this.lastSlide), 0);
      if (this.supportTransform) {
        this.isCss3Finish = false;
        this.transition(speed);
        setTimeout(((function(_this) {
          return function() {
            _this.isCss3Finish = true;
          };
        })(this)), speed);
        this.translate(this.positions[this.currentSlide]);
      } else {
        this.css2slide(this.positions[this.currentSlide], speed);
      }
      this.updateItems();
      if (this.opts.pagination) {
        this.updatePagination();
      }
      if (this.opts.navigation) {
        this.updateNavigation();
      }
      if (this.opts.autoplayMS > 0) {
        return this.play();
      }
    },
    stop: function() {
      return clearInterval(this.autoplay);
    },
    play: function() {
      clearInterval(this.autoplay);
      if (this.opts.autoplayMS > 0) {
        this.autoplay = setInterval((function(_this) {
          return function() {
            if (_this.currentSlide < _this.lastSlide && _this.playDirection === "next") {
              return _this.next(_this.opts.controlsMS);
            } else if (_this.currentSlide === _this.lastSlide) {
              if (_this.opts.returnToStart) {
                return _this.goTo(0, _this.opts.returnToStartMS);
              } else {
                _this.playDirection = "prev";
                return _this.prev(_this.opts.controlsMS);
              }
            } else if (_this.playDirection === "prev" && _this.currentSlide > 0) {
              return _this.prev(_this.opts.controlsMS);
            } else if (_this.playDirection === "prev" && _this.currentSlide === 0) {
              _this.playDirection = "next";
              return _this.next(_this.opts.controlsMS);
            }
          };
        })(this), this.opts.autoplayMS);
      }
    },
    transition: function(speed) {
      this.style[prefix("transition")] = "all " + speed + "ms ease";
    },
    translate: function(pixels) {
      if (this.supportTransform) {
        this.style[prefix("transform")] = "translate3d(" + pixels + "px, 0px, 0px)";
      } else {
        this.style.left = "" + pixels + "px";
      }
    },
    css2slide: function(pixels, speed) {
      this.isCssFinish = false;
      return this.wrapper.stop(true, true).animate({
        left: pixels
      }, {
        duration: speed || this.opts.draggingMS({
          complete: (function(_this) {
            return function() {
              _this.isCssFinish = true;
            };
          })(this)
        })
      });
    },
    bindMoveEvents: function(check) {
      var end, horizontal, move, offsetX, offsetY, start, vertical, wrapperPosition;
      offsetX = 0;
      offsetY = 0;
      this.isCssFinish = true;
      this.isCss3Finish = true;
      vertical = true;
      horizontal = true;
      wrapperPosition = {};
      start = (function(_this) {
        return function(e) {
          if (!(_this.isCssFinish && _this.isCss3Finish)) {
            return;
          }
          if (_this.opts.autoplayMS > 0) {
            clearInterval(_this.autoplay);
          }
          _this.transition(0);
          _this.newX = 0;
          _this.newY = 0;
          _this.newRelativeX = 0;
          _this.newRelativeY = 0;
          wrapperPosition = _this.wrapper.position();
          vertical = false;
          horizontal = false;
          if (isTouch) {
            offsetX = e.originalEvent.touches[0].pageX - wrapperPosition.left;
            offsetY = e.originalEvent.touches[0].pageY - wrapperPosition.top;
          } else {
            _this.wrapper.addClass("grabbing");
            offsetX = e.pageX - wrapperPosition.left;
            offsetY = e.pageY - wrapperPosition.top;
            $(document).on("mousemove.revolver", move);
            $(document).on("mouseup.revolver", end);
          }
        };
      })(this);
      move = (function(_this) {
        return function(e) {
          var maxSwipe, minSwipe;
          if (vertical) {
            return;
          }
          if (isTouch) {
            _this.newX = e.originalEvent.touches[0].pageX - offsetX;
            _this.newY = e.originalEvent.touches[0].pageY - offsetY;
          } else {
            _this.newX = e.pageX - offsetX;
            _this.newY = e.pageY - offsetY;
          }
          _this.newRelativeX = _this.newX - wrapperPosition.left;
          _this.newRelativeY = _this.newY - wrapperPosition.top;
          if ((-8 > _this.newRelativeX || _this.newRelativeX > 8) && !horizontal) {
            horizontal = true;
            e.preventDefault();
          } else if ((-10 > _this.newRelativeY || _this.newRelativeY > 10) && !horizontal) {
            vertical = true;
            return;
          }
          minSwipe = _this.newRelativeX / 5;
          maxSwipe = _this.maxPixels + _this.newRelativeX / 5;
          _this.newX = Math.max(Math.min(_this.newX, minSwipe), maxSwipe);
          return _this.translate(_this.newX);
        };
      })(this);
      end = (function(_this) {
        return function(e) {
          if (!isTouch) {
            _this.wrapper.removeClass("grabbing");
            $(document).off("mousemove.revolver");
            $(document).off("mouseup.revolver");
          }
          if (_this.newX !== 0 && horizontal) {
            return _this.goTo(_this.getNewPosition(), _this.opts.draggingMS);
          }
        };
      })(this);
      if (isTouch) {
        return this.$el.on("touchstart.revolver", ".rv-wrapper", start).on("touchmove.revolver", ".rv-wrapper", move).on("touchend.revolver", ".rv-wrapper", end);
      } else {
        return this.$el.on("mousedown.revolver", ".rv-wrapper", start).on("dragstart.revolver", "img", function(e) {
          return e.preventDefault();
        });
      }
    },
    getNewPosition: function() {
      this.improveClosest();
      if (this.currentSlide > this.lastSlide) {
        this.currentSlide = this.lastSlide;
      } else if (this.newX >= 0) {
        this.currentSlide = 0;
      }
      return this.currentSlide;
    },
    improveClosest: function() {
      var el, i, _i, _len, _ref, _ref1, _results;
      _ref = this.positions;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        el = _ref[i];
        if ((el > (_ref1 = this.newX + this.itemWidth / 20) && _ref1 > this.positions[i + 1])) {
          _results.push(this.currentSlide = this.moveDirection() === "next" ? i : i + 1);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    moveDirection: function() {
      this.playDirection = this.newRelativeX > 0 ? "next" : "prev";
      return this.playDirection;
    },
    bindCustomEvents: function() {
      return this.$el.on("next.revolver", (function(_this) {
        return function() {
          return _this.next();
        };
      })(this)).on("prev.revolver", (function(_this) {
        return function() {
          return _this.prev();
        };
      })(this)).on("play.revolver", (function(_this) {
        return function() {
          return _this.play();
        };
      })(this)).on("stop.revolver", (function(_this) {
        return function() {
          return _this.stop();
        };
      })(this));
    },
    bindStopOnHover: function() {
      if (this.opts.stopOnHover && this.opts.autoplayMS > 0 && !isTouch) {
        this.$el.on("mouseover.revolver", (function(_this) {
          return function() {
            return _this.stop();
          };
        })(this));
        return this.$el.on("mouseout.revolver", (function(_this) {
          return function() {
            return _this.play();
          };
        })(this));
      }
    },
    destroy: function() {
      $(document).off(".revolver");
      this.destroyControls();
      return this.$el.off(".revolver").removeData("revolver");
    }
  };
  $.fn.revolver = function(opts) {
    return this.each(function() {
      if (!$(this).data("revolver")) {
        return $(this).data("revolver", new Revolver(opts, this));
      }
    });
  };
})(window, document, window.jQuery || window.Zepto);
