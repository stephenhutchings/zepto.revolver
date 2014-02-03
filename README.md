## zepto.revolver

See the [demo](http://stephenhutchings.github.io/zepto.revolver/demo/).

### How to use it

Download the source files from the `build` directory, or use [Bower](http://www.bower.io/).

```bash
$ bower install zepto.revolver
```

Then you're good to go. You can create a new Revolver carousel on any element. For example:

```js
$(".my-carousel").revolver(options);
```

### Tell me more

`zepto.revolver` is responsive and you can define custom breakpoints. It responds to touch and can be dragged this way and that. It's set up with sane defaults, but of course, these can be overriden. It fires events when things happen and exposes public methods to put you in control. It also uses hardware acceleration for transitions (if they're available), making it a great choice for mobile or devices with limited performance resources.

Revolver is compatible with jQuery and Zepto, but requires Zepto's data module for compatability.

### Available options

```js
var options = {
  // The transition speed if the user drags the panels
  draggingMS: 300,

  // The transition speed if the user selects a pagination item
  controlsMS: 800,

  // False if no autoplay, or a duration in milliseconds
  autoplayMS: 5000,

  returnToStart: true
  returnToStartMS: 1000,

  // Whether or not hovering will cause the autoplayMS to pause
  stopOnHover: true,

  // Should we have previous and next buttons, and what should they say?
  navigation: ["&larr;", "&rarr;"],

  // Should we have pagination, and should it include numbers in the html?
  pagination: true,
  paginationNumbers: false,

  // The number of items to show within the revolver
  items: 5,

  // An array of [pixel width, visible items] or false if
  // we shouldn't be responsive
  breakpoints: [
    [1199, 4],
    [ 979, 3],
    [ 768, 2],
    [ 479, 1]
  ]
}
```

### Developing and testing

There is a `Cakefile` for building, watching and linting. All these commands can be run with `cake`.

```bash
$ cake build    # Build the library
$ cake watch    # Watch for changes
$ cake lint     # Lint the compiled javascript.
```

Feel free to submit [issues](https://github.com/stephenhutchings/zepto.revolver/issues) or make [pull](https://github.com/stephenhutchings/zepto.revolver/pulls) requests.
