# Require
fs = require "fs"
flour = require "flour"
rmdir = require "rimraf"
jade = require "jade"
{exec} = require "child_process"

# Name and version taken from package
config = require('./package.json')
bower = require('./bower.json')

# Prepend files with info comments
prepend = """/* #{config.name} - v#{config.version} - #{config.license} */
             /* #{config.description} */
             /* #{config.repository.url} */\n"""

# Bare coffeescript
flour.compilers.coffee.bare = true

# Build the demo html
task "build:demo", ->
  fs.writeFile "demo/index.html",
    jade.renderFile("demo/index.jade", {config})

# Update bower.json, to match package.json
# Using npm version will therefore update bower
task "build:bower", ->
  bower.version = config.version
  fs.writeFile "bower.json", JSON.stringify(bower, null, 2)

# Compile and uglify js and sass
task "build:src", ->
  compile "src/#{config.name}.coffee", (res) ->
    fs.writeFile "build/#{config.name}.js", prepend + res, ->
      minify "build/#{config.name}.js", (res) ->
        fs.writeFile "build/#{config.name}.min.js", prepend + res

  exec "sass -t expanded --compass src/#{config.name}.sass", (err, res) ->
    fs.writeFile "build/#{config.name}.css", prepend + res

  exec "sass -t compressed --compass src/#{config.name}.sass", (err, res) ->
    fs.writeFile "build/#{config.name}.min.css", prepend + res



task "build", ->
  invoke "build:src"
  invoke "build:demo"
  invoke "build:bower"

# Watch for changes
task "watch", ->
  invoke "build"
  watch "src/*.coffee", -> invoke "build:src"
  watch "src/*.sass", -> invoke "build:src"
  watch "demo/index.jade", -> invoke "build:demo"

# Lint js
task "lint", "Check javascript syntax", ->
  lint "build/#{config.name}.js"
