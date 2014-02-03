((window, document, $) ->
  "use strict"

  defaults =
    # The transition speed if the user drags the panels
    draggingMS: 300

    # The transition speed if the user selects a pagination item
    controlsMS: 800

    # False if no autoplay, or a duration in milliseconds
    autoplayMS: 5000

    returnToStart: true
    returnToStartMS: 1000

    # Whether or not hovering will cause the autoplayMS to pause
    stopOnHover: true

    # Should we have previous and next buttons, and what should they say?
    navigation: ["&larr;", "&rarr;"]

    # Should we have pagination, and should it include numbers in the html?
    pagination: true
    paginationNumbers: false

    # The number of items to show within the revolver
    items: 5

    # An array of [pixel width, visible items] or false if
    # we shouldn't be responsive
    breakpoints: [
      [1199, 4]
      [ 979, 3]
      [ 768, 2]
      [ 479, 1]
    ]

  # True for all instances of the plugin
  isTouch = "ontouchstart" of window
  isZepto = $.zepto
  div = "<div/>"

  # Utility function for prefixing
  prefix = (style) ->
    emptyStyle = document.createElement("div").style

    # Woohoo, no vendor prefix
    return style if style of emptyStyle

    # Iterate through vendors to determine if there's a matching prefix
    for vendor in ["webkit", "Moz", "ms", "O"]
      prefixed = vendor + style.charAt(0).toUpperCase() + style.substr(1)
      return prefixed if prefixed of emptyStyle

    # This property is not supported at all
    return false

  # A simple init base function that calls init with the passed opts
  Revolver = (opts, el) ->
    @init(opts, el)
    return this

  # The prototype
  Revolver:: =
    init: (opts, el) ->
      # Extend any defaults with opts passed to the plugin
      @opts = $.extend({}, defaults, opts)

      # Store the element and hide it until we've finished setting up
      @$el = $(el).css(display: "block").addClass "revolver"

      # Determine whether CSS transforms are supported by the client
      @supportTransform = prefix("transform") isnt false

      # We'll start on the first slide, going rightwards
      @currentSlide = 0
      @playDirection = "next"

      # The total amount of items in the revolver
      @totalItems = @$el.children().size()

      # Wrap each item as a ".rv-item" and all items in a
      # ".rv-wrapper"
      @wrapItems()
      @items = @$el.find(".rv-item")
      @wrapper = @$el.find(".rv-wrapper")

      # We'll cache the style of the wrapper, as we do most manipulation
      # on this element. We can set its display now that we've wrapped
      # its contents.
      @style = @wrapper.get(0).style
      @style["display"] = "block"

      # Event binding
      @bindMoveEvents()
      @bindCustomEvents()
      @bindStopOnHover()
      @bindResize()

      @updateVars()

    reset: (opts) ->
      @opts = $.extend({}, defaults, opts)
      @updateVars()

    updateVars: ->
      @setupControls()
      @sizeForBreakpoints()
      @resetAll()
      @updateItems()
      @updatePosition()
      @updateNavigation()
      @refreshPagination()
      @updatePagination()

      @play() and @opts.autoplayMS > 0

    wrapItems: ->
      @$el
        .children()
        .wrapAll("<div class=\"rv-wrapper\">")
        .wrap("<div class=\"rv-item\"></div>")

    sizeForBreakpoints: ->
      return unless @opts.breakpoints
      width = $(window).width()

      for breakpoint in @opts.breakpoints
        if width <= breakpoint[0]
          @opts.items = breakpoint[1]

    bindResize: ->
      return unless @opts.breakpoints

      # Save the initial items into the breakpoints for simplicity sake
      @opts.breakpoints.unshift([Infinity, @opts.items])

      $(window).resize =>
        clearInterval @autoplay if @opts.autoplayMS > 0
        clearTimeout @resizeDelay
        @resizeDelay = setTimeout(=>
          @refreshPagination()
          @updateVars()
          delete @resizeDelay
        , 200)

    updatePosition: ->
      @transition 0
      @translate 0
      @currentSlide = 0

    resetAll: ->
      # Rest item width
      @itemWidth = Math.round(@$el.width() / @opts.items)

      # Rest wrapper css
      @style["width"] = "#{@items.size() * @itemWidth * 2}px"
      @style["left"] = 0

      # Reset item css
      @items.each (i, el) =>
        $(el)
          .css(width: @itemWidth)
          .data("rv-item", i)

      # Reset limits
      @lastSlide = @totalItems - @opts.items
      @maxPixels = -((@totalItems * @itemWidth) - @opts.items * @itemWidth)

      # Reset position array
      @positions = $.map [0...@totalItems], (el) => -@itemWidth * el

    setupControls: ->
      if @opts.navigation or @opts.pagination
        @rvControls.remove() if @rvControls

        @rvControls = $(div, {class: "rv-controls"})

        @setupPagination() if @opts.pagination
        @setupNavigation() if @opts.navigation

        @rvControls.addClass "clickable" unless isTouch
        @rvControls.appendTo(@$el)

    setupNavigation: ->
      @buttonPrev = $(div, {class: "rv-prev", html: @opts.navigation[0]})
      @buttonNext = $(div, {class: "rv-next", html: @opts.navigation[1]})

      buttonGroup = $(div, {class: "rv-buttons"})
      buttonGroup.append(@buttonPrev, @buttonNext)

      @updateNavigation()

      @rvControls
        .append(buttonGroup)
        .on(@getEvent(), ".rv-prev", (e) => @prev())
        .on(@getEvent(), ".rv-next", (e) => @next())

    getEvent: ->
      if isTouch then "touchstart.rvControls" else "click.rvControls"

    setupPagination: ->
      @paginationWrapper = $(div, {class: "rv-pagination"})

      @rvControls
        .append(@paginationWrapper)
        .on @getEvent(), ".rv-page", (e) =>
          e.preventDefault()

          # Get the index of the page, and if there's multiple
          # items, center by offseting from the current page
          index = +$(e.currentTarget).data("rv-page")
          index -= Math.floor(@opts.items / 2)

          @goTo index, if index isnt @currentSlide then @opts.controlsMS else 0

    refreshPagination: ->
      return unless @opts.pagination

      @paginationWrapper.html ""

      for i in [0...@totalItems]
        $(div, {class: "rv-page"})
          .data("rv-page", i)
          .html(if @opts.paginationNumbers then i + 1 else "")
          .appendTo(@paginationWrapper)

    updatePagination: ->
      @paginationWrapper
        .find(".rv-page")
        .removeClass("active")
        .slice(@currentSlide, @currentSlide + @opts.items)
        .addClass("active")

    updateItems: ->
      @items
        .removeClass("active")
        .slice(@currentSlide, @currentSlide + @opts.items)
        .addClass("active")

    updateNavigation: ->
      return unless @opts.navigation
      @buttonPrev.toggleClass "disabled", @currentSlide is 0
      @buttonNext.toggleClass "disabled", @currentSlide is @lastSlide

    destroyControls: ->
      @rvControls.off "rvControls"
      @rvControls.remove() if @rvControls

    next: (speed = @opts.controlsMS) ->
      @currentSlide += @opts.items
      @goTo @currentSlide, speed

    prev: (speed = @opts.controlsMS) ->
      @currentSlide -= @opts.items
      @goTo @currentSlide, speed

    goTo: (position, speed) ->
      # Limit position to min and max
      @currentSlide = Math.max(Math.min(position, @lastSlide), 0)

      if @supportTransform
        @isCss3Finish = false

        @transition(speed)
        setTimeout (=>
          @isCss3Finish = true
        ), speed

        @translate @positions[@currentSlide]

      else
        @css2slide @positions[@currentSlide], speed

      @updateItems()
      @updatePagination() if @opts.pagination
      @updateNavigation() if @opts.navigation
      @play() if @opts.autoplayMS > 0

    stop: ->
      clearInterval @autoplay

    play: ->
      clearInterval @autoplay
      @autoplay = setInterval(=>
        if @currentSlide < @lastSlide and @playDirection is "next"
          @next @opts.controlsMS
        else if @currentSlide is @lastSlide
          if @opts.returnToStart
            @goTo 0, @opts.returnToStartMS
          else
            @playDirection = "prev"
            @prev @opts.controlsMS
        else if @playDirection is "prev" and @currentSlide > 0
          @prev @opts.controlsMS
        else if @playDirection is "prev" and @currentSlide is 0
          @playDirection = "next"
          @next @opts.controlsMS
      , @opts.autoplayMS)

    transition: (speed) ->
      @style[prefix "transition"] = "all #{speed}ms ease"

    translate: (pixels) ->
      if @supportTransform
        @style[prefix "transform"] = "translate3d(#{pixels}px, 0px, 0px)"
      else
        @style["left"] = "#{pixels}px"

    css2slide: (pixels, speed) ->
      @isCssFinish = false
      @wrapper.stop(true, true).animate
        left: pixels
      , duration: speed or @opts.draggingMS
        complete: =>
          @isCssFinish = true

    bindMoveEvents: (check) ->
      offsetX = 0
      offsetY = 0
      @isCssFinish = true
      @isCss3Finish = true
      vertical = true
      horizontal = true
      wrapperPosition = {}

      start = (e) =>
        # Make sure we've finished any other transitions
        return unless @isCssFinish and @isCss3Finish

        # Stop autoplay timeout
        clearInterval @autoplay if @opts.autoplayMS > 0

        # Remove transition duration from wrapper
        @transition 0

        # Reset variables
        @newX = 0
        @newY = 0
        @newRelativeX = 0
        @newRelativeY = 0
        wrapperPosition = @wrapper.position()
        vertical = false
        horizontal = false

        if isTouch
          offsetX = e.originalEvent.touches[0].pageX - wrapperPosition.left
          offsetY = e.originalEvent.touches[0].pageY - wrapperPosition.top
        else
          @wrapper.addClass "grabbing"
          offsetX = e.pageX - wrapperPosition.left
          offsetY = e.pageY - wrapperPosition.top
          $(document).on "mousemove.revolver", move
          $(document).on "mouseup.revolver", end

      move = (e) =>
        return if vertical

        if isTouch
          @newX = e.originalEvent.touches[0].pageX - offsetX
          @newY = e.originalEvent.touches[0].pageY - offsetY
        else
          @newX = e.pageX - offsetX
          @newY = e.pageY - offsetY

        @newRelativeX = @newX - wrapperPosition.left
        @newRelativeY = @newY - wrapperPosition.top

        if (-8 > @newRelativeX or @newRelativeX > 8) and not horizontal
          horizontal = true
          e.preventDefault()

        else if (-10 > @newRelativeY or @newRelativeY > 10) and not horizontal
          vertical = true
          return

        #reset min and max, limit newX and translate the wrapper
        minSwipe = @newRelativeX / 5
        maxSwipe = @maxPixels + @newRelativeX / 5
        @newX = Math.max(Math.min(@newX, minSwipe), maxSwipe)
        @translate @newX

      end = (e) =>
        if not isTouch
          @wrapper.removeClass "grabbing"
          $(document).off "mousemove.revolver"
          $(document).off "mouseup.revolver"

        if @newX isnt 0 and horizontal
          @goTo @getNewPosition(), @opts.draggingMS

      if isTouch
        @$el
          .on("touchstart.revolver", ".rv-wrapper", start)
          .on("touchmove.revolver", ".rv-wrapper", move)
          .on("touchend.revolver", ".rv-wrapper", end)
      else
        @$el
          .on("mousedown.revolver", ".rv-wrapper", start)
          .on("dragstart.revolver", "img", (e) -> e.preventDefault())

    getNewPosition: ->
      @improveClosest()

      if @currentSlide > @lastSlide
        @currentSlide = @lastSlide
      else if @newX >= 0
        @currentSlide = 0

      @currentSlide

    improveClosest: ->
      for el, i in @positions
        if el > @newX + @itemWidth / 20 > @positions[i + 1]
          @currentSlide = if @moveDirection() is "next" then i else i + 1

    moveDirection: ->
      return @playDirection = if @newRelativeX > 0 then "next" else "prev"

    bindCustomEvents: ->
      @$el
        .on("next.revolver", => @next())
        .on("prev.revolver", => @prev())
        .on("play.revolver", => @play())
        .on("stop.revolver", => @stop())

    bindStopOnHover: ->
      if @opts.stopOnHover and @opts.autoplayMS > 0 and not isTouch
        @$el.on "mouseover.revolver", => @stop()
        @$el.on "mouseout.revolver", => @play()

    destroy: ->
      $(document).off ".revolver"
      @destroyControls()
      @$el
        .off(".revolver")
        .removeData("revolver")

  $.fn.revolver = (opts) ->
    @each ->
      unless $(this).data "revolver"
        $(this).data "revolver", new Revolver(opts, this)

  return

) window, document, window.jQuery or window.Zepto
