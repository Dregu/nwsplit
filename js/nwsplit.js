if(typeof process !== 'undefined') {
  var gui = require('nw.gui')
  var win = gui.Window.get()
  var fs = require('fs')
  //win.showDevTools()
}
var defaults = {
  ontop: true,
  precision: 1,
  trim: true,
  offset: 0,
  interval: 100,
  drawinterval: 100,
  autoadd: false,
  autosave: true,
  title: 'Game title',
  attempts: 0,
  splits: 0,
  graph: true,
  toolbar: true,
  global_split: 'Ctrl+F12',
  global_stop: 'Ctrl+F11',
  global_pause: 'Ctrl+F10',
  global_reset: 'Ctrl+F9',
  global_undo: 'Ctrl+F8',
  local_split: 'F12',
  local_stop: 'F11',
  local_pause: 'F10',
  local_reset: 'F9',
  local_undo: 'F8',
  width: 300,
  height: 500,
  x: 300,
  y: 300,
  zoom: 1,
  css: ''
}
var RESET = 0, RUNNING = 1, PAUSED = 2, STOPPED = 3;
var v = {
  inter: 0,
  drawinter: 0,
  n: 0,
  time: 0,
  state: RESET,
  pausestart: 0,
  start: 0,
  stop: 0,
  resets: 0,
  stops: 0,
  plot: false
}
var custom = null
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
}
var options = clone(defaults)
var optionHandler = {
  ontop: function(o){if(typeof win !== 'undefined'){win.setAlwaysOnTop(o)}},
  precision: function(o){
    for(var i in splits) {
      $('.split[data-id='+i+'] .seg').html(ttime(splits[i].bestseg))
      $('.split[data-id='+i+'] .time').html(ttime(splits[i].best))
    }
    v.timer.html(ttime(v.time))
  },
  format: function(o){if(!v.inter){reset()}},
  offset: function(o){if(!v.inter){reset()}},
  interval: function(o){},
  autoadd: function(o){},
  autosave: function(o){},
  trim: function(o){if(!v.inter){reset()}},
  title: function(o){if(v.title) v.title.html(o)},
  attempts: function(o){if(v.attempts) v.attempts.html(o)},
  graph: function(o){if(o){$('#graph').slideDown(function(){if(v.plot){v.plot.resize()};v.drawinter = setInterval(draw,options.drawinterval)})} else {clearInterval(v.drawinter);v.drawinter = 0;$('#graph').slideUp()}},
  toolbar: function(o){if(typeof win === 'undefined') return;if(o){$('#bar').slideDown()} else {$('#bar').slideUp()}},
  global_split: function(o){if(typeof gui !== 'undefined'){gui.App.unregisterGlobalHotKey(v.shortcut_split);v.shortcut_split = new gui.Shortcut({key: o,active: function(){split()},failed: function(msg){console.log(msg)}});gui.App.registerGlobalHotKey(v.shortcut_split)}},
  global_stop: function(o){if(typeof gui !== 'undefined'){gui.App.unregisterGlobalHotKey(v.shortcut_stop);v.shortcut_stop = new gui.Shortcut({key: o,active: function(){stop()},failed: function(msg){console.log(msg)}});gui.App.registerGlobalHotKey(v.shortcut_stop)}},
  global_pause: function(o){if(typeof gui !== 'undefined'){gui.App.unregisterGlobalHotKey(v.shortcut_pause);v.shortcut_pause = new gui.Shortcut({key: o,active: function(){pause()},failed: function(msg){console.log(msg)}});gui.App.registerGlobalHotKey(v.shortcut_pause)}},
  global_reset: function(o){if(typeof gui !== 'undefined'){gui.App.unregisterGlobalHotKey(v.shortcut_reset);v.shortcut_reset = new gui.Shortcut({key: o,active: function(){reset()},failed: function(msg){console.log(msg)}});gui.App.registerGlobalHotKey(v.shortcut_reset)}},
  global_undo: function(o){if(typeof gui !== 'undefined'){gui.App.unregisterGlobalHotKey(v.shortcut_undo);v.shortcut_undo = new gui.Shortcut({key: o,active: function(){undo()},failed: function(msg){console.log(msg)}});gui.App.registerGlobalHotKey(v.shortcut_undo)}},
  local_split: function(o){},
  local_stop: function(o){},
  local_pause: function(o){},
  local_reset: function(o){},
  local_undo: function(i){},
  width: function(o){if(typeof win !== 'undefined'){win.width = o}},
  height: function(o){if(typeof win !== 'undefined'){win.height = o}},
  x: function(o){if(typeof win !== 'undefined'){win.x = o}},
  y: function(o){if(typeof win !== 'undefined'){win.y = o}},
  zoom: function(o){if(typeof win !== 'undefined'){if(!isNaN(Math.log(options.zoom)/Math.log(1.2))){win.zoomLevel = Math.log(options.zoom)/Math.log(1.2)}}},
  css: function(o){$('style').html(o)}
}
var keymap = {backspace:8,command:91,tab:9,clear:12,enter:13,shift:16,ctrl:17,alt:18,capslock:20,escape:27,esc:27,space:32,pageup:33,pgup:33,pagedown:34,pgdn:34,end:35,home:36,left:37,up:38,right:39,down:40,del:46,comma:188,f1:112,f2:113,f3:114,f4:115,f5:116,f6:117,f7:118,f8:119,f9:120,f10:121,f11:122,f12:123,',':188,'.':190,'/':191,'`':192,'-':189,'=':187,';':186,'[':219,'\\':220,']':221,'\'':222}
var key = function(name){return keymap[String(name).toLowerCase()]||String(name).toUpperCase().charCodeAt(0)}
var getCss = function() {
  var file = document.createElement('input')
  file.setAttribute('type', 'file')
  file.setAttribute('accept', '.css')
  file.onchange = function() {
    var reader = new FileReader()
    reader.onloadend = function() {
      data = reader.result
      options.css = data
    }
    reader.readAsText(this.files[0])
  }
  file.click()
}
var plotopt = {
  colors: ['#eee'],
  series: {
    lines: { show: true, lineWidth: 1 },
    points: { show: true, fill: false, radius: 3 },
    shadowSize: 0
  },
  legend: { show: false },
  xaxis: { show: true, tickColor: '#222', color: '#333', tickFormatter: function(t){return ttime(t)} },
  yaxis: { show: true, ticks: [0], tickColor: '#222', color: 'rgba(0,0,0,0)' },
  grid: {
    show: true,
    borderWidth: 0,
    borderColor: '#333',
    margin: 5,
  },
  interaction: {
    redrawOverlayInterval: 10000000
  }
}
var updateStaticSegments = function() {
  v.data = []
  v.ticks = [0]
  if(splits.length > 1) {
    v.max = splits[splits.length-1].best/60
  } else {
    v.max = 5000
  }
  v.segcolors = ['rgba(255,165,0,','rgba(50,205,50,','rgba(178,34,34,']
  v.startfincolors = ['rgba(50,205,50,0.7)']
  v.startfin = [[[0,-10000000],[0,10000000]]]
  if(splits.length > 0 && splits[splits.length-1].best > 0) {
    v.startfincolors.push('rgba(178,34,34,0.7)')
    v.startfin.push([[splits[splits.length-1].best,-10000000],[splits[splits.length-1].best,10000000]])
  }
  v.colors = []
  v.segments = []
  v.lastpoint = [0,0]
  if(splits.length==0) {
    return
  }
  for(var i in splits) {
    v.ticks.push(splits[i].best)
    if(i<v.n) {
      var y = splits[i].current-splits[i].best
      var x = splits[i].current
      v.data.push([x, y])
    }
  }
  if(!v.plot) {
    v.plot = $.plot('#graph', [[0,0]], plotopt)
  }
  var opac = 1
  for(var i in v.data) {
    if(i<v.n) {
      v.opac = 1
      if(splits[i].seg < splits[i].bestseg) {
        v.colors.push(v.segcolors[0]+opac+')')
      } else if(rnd(v.data[i][1]) > 0) {
        v.colors.push(v.segcolors[2]+opac+')')
      } else {
        v.colors.push(v.segcolors[1]+opac+')')
      }
    }
    if(Math.abs(v.data[i][1]) > v.max && ((i<v.n) || (i==v.n && v.data[i][1] > 0))) {
      v.max = Math.abs(v.data[i][1])
    }
    v.segments.push([v.lastpoint,v.data[i]])
    v.lastpoint = v.data[i]
  }
}
var draw = function() {
  if(!options.graph) {
    clearInterval(v.drawinter)
    v.drawinter = 0
    return
  }
  if(!options.graph || $('#graph').is(':hidden')) {
    options.graph = false
  }
  if(v.state == PAUSED || splits.length == 0 || !options.graph) {
    return
  }
  if(!v.data || v.n>v.data.length) {
    updateStaticSegments()
  }
  var i = v.n
  if(!splits[i]) {
    return
  }
  if(!v.plot) {
    v.plot = $.plot('#graph', [[0,0]], plotopt)
  }
  var y = v.time-splits[i].best
  var x = v.time
  v.data[i] = [x, y]
  var opac = 1
  var color = 'rgba(0,0,0,0)'
  if(v.n==0) {
    opac = v.time/splits[v.n].bestseg
    if(!v.inter) {
      opac = 1
    }
    if(v.time < splits[0].bestseg) {
      color = v.segcolors[0]+opac+')'
    } else if(rnd(v.data[v.n][1]) > 0) {
      color = v.segcolors[2]+opac+')'
    } else {
      color = v.segcolors[1]+opac+')'
    }
  } else {
    opac = (v.time-splits[i-1].current)/splits[i].bestseg
    if(!v.inter) {
      opac = 1
    }
    if(v.time-splits[i-1].current < splits[i].bestseg) {
      color = v.segcolors[0]+opac+')'
    } else if(rnd(v.data[v.n][1]) > 0) {
      color = v.segcolors[2]+opac+')'
    } else {
      color = v.segcolors[1]+opac+')'
    }
  }
  if(Math.abs(v.data[i][1]) > v.max && v.data[i][1] > 0) {
    v.max = Math.abs(v.data[i][1])
  }
  if(v.time > 0) {
    v.colors[i] = color
    v.segments[i] = [v.lastpoint,v.data[i]]
  }
  v.plot.getOptions().colors = v.startfincolors.concat(v.colors).reverse()
  v.plot.setData(v.startfin.concat(v.segments).reverse())
  v.plot.getOptions().xaxes[0].ticks = v.ticks
  v.plot.getOptions().yaxes[0].max = v.max
  v.plot.getOptions().yaxes[0].min = -v.max
  if(v.time > splits[splits.length-1].best) {
    v.plot.getOptions().xaxes[0].max = v.time
  } else {
    v.plot.getOptions().xaxes[0].max = splits[splits.length-1].best
  }
  v.plot.getOptions().xaxes[0].min = 0
  v.plot.setupGrid()
  v.plot.draw()
}
var editOptions = function() {
  if($('#options').is(':visible')) {
    $('#options').hide()
    $('#splits').show()
    $('#titlerow').show()
    if(options.graph) $('#graph').show()
    if(options.toolbar) $('#bar').show()
    return
  }
  var help = {
    ontop: 'Always on top, boolean',
    zoom: 'Zoom level, 0.1 .. 5',
    precision: 'Number of decimals, 0 .. 3',
    trim: 'Trim leading zeroes, boolean',
    interval: 'Timer update interval, ms',
    drawinterval: 'Graph update interval, ms',
    autoadd: 'Automatically add new splits or stop on last split, boolean',
    autosave: 'Automatically save personal bests as splits',
    offset: 'Timer start offset, ms. Can be negative.',
    splits: 'Number of splits to create on clear',
    graph: 'Show the split graph, boolean',
    toolbar: 'Show the toolbar, boolean',
    global_split: 'Global hotkey: Start / Split',
    global_stop: 'Global hotkey: Stop / Save times',
    global_pause: 'Global hotkey: Pause / Unpause',
    global_reset: 'Global hotkey: Reset / Clear',
    global_undo: 'Global hotkey: Undo split',
    local_split: 'Local hotkey: Start / Split',
    local_stop: 'Local hotkey: Stop / Save times',
    local_pause: 'Local hotkey: Pause / Unpause',
    local_reset: 'Local hotkey: Reset / Clear',
    local_undo: 'Local hotkey: Undo split'
  }
  $('#options').html('')
  $('#options').append('<div class="help">Hover over a setting for help.</div><button class="saveoptions">Save settings</button>')
  for(var i in help) {
    $('#options').append('<div class="option"><span class="variable" title="'+help[i]+' (default: '+defaults[i]+')">'+i+':</span><span class="value" contenteditable="true" title="'+help[i]+' (default: '+defaults[i]+')" data-key="'+i+'">'+options[i]+'</span></div>')
  }
  $('#options').append('<button class="saveoptions">Save settings</button>')
  $('#graph').hide()
  $('#titlerow').hide()
  $('#splits').hide()
  $('#options').show()
  if(typeof win !== 'undefined') {
    win.height = parseInt(($('#timer').height()+$('#bar').height()+$('#options')[0].scrollHeight)*Math.pow(1.2, win.zoomLevel))
    if(win.width < 300) {
      win.width = 300
    }
  }
  $('.saveoptions').click(function() {
    $('#options .value').each(function() {
      var key = $(this).data('key')
      var val = $(this).html()
      if(val == null) {
        return
      }
      if(!isNaN(parseFloat(val))) {
        val = parseFloat(val)
      }
      if(val === 'true') {
        val = true
      }
      if(val === 'false') {
        val = false
      }
      if(val !== options[i]) {
        options[key] = val
      }
    })
    $('#options').hide()
    $('#splits').show()
    $('#titlerow').show()
    if(options.graph) $('#graph').show()
    if(options.toolbar) $('#bar').show()
  })
}
var save = function() {
  localStorage.splits = JSON.stringify(splits)
  options.css = $('style').html()
  if(typeof win !== 'undefined') {
    options.width = win.width
    options.height = win.height
    options.x = win.x
    options.y = win.y
  }
  localStorage.options = JSON.stringify(options)
  var savev = {}
  var savedvars = ['n','time','state','pausestart','start','stop']
  for(var i in savedvars) {
    savev[savedvars[i]] = v[savedvars[i]]
  }
  localStorage.v = JSON.stringify(savev)
}
var undo = function() {
  if(!v.inter && v.time) {
    split()
  } else if(v.n>0) {
    $('.split:nth('+v.n+') .diff').html('').removeClass('better worse')
    v.n--
  }
}
var split = function() {
  if(v.state == PAUSED) {
    pause()
    return
  }
  if(!v.inter) {
    if(!v.time) {
      v.start = new Date().getTime()-options.offset
      v.n=0
      options.attempts++
      $('#attempts').html(options.attempts)
    }
    v.inter = setInterval(updateTime, options.interval)
    v.drawinter = setInterval(draw,options.drawinterval)
    v.state = RUNNING
  } else {
    if(!options.autoadd && v.n >= splits.length-1) {
      addSplit()
      stop()
      return
    } else {
      addSplit()
    }
  }
  updateStaticSegments()
  centerSplit()
  save()
}
var addSplit = function(add) {
  if(add) {
    var name = 'Split '+(splits.length+1)
    splits[splits.length] = { name: name, current: 0, best: 0, seg: 0, bestseg: 0 }
    appendSplit(name, 0, 0)
    return    
  }
  var split = (v.state == STOPPED ? v.stop-v.start : new Date().getTime()-v.start);
  if(v.start == 0) {
    split = 0
  }
  var seg = split
  if(splits[v.n-1]) {
    seg = split - splits[v.n-1].current
  }
  var name = 'Split '+(1+v.n)
  if(splits.length == 0 || (splits.length <= v.n && options.autoadd && v.inter)) {
    splits[v.n] = { name: name, current: split, best: 0, seg: seg, bestseg: 0 }
    appendSplit(name, split, seg)
  } else if(splits[v.n]) {
    splits[v.n].current = split
    splits[v.n].seg = seg
  }
  if((options.autoadd || v.n < splits.length-1) && v.state == RUNNING) {
    v.n++
  }
  if(v.inter) {
    draw()
  }
  updateStaticSegments()
}
var saveSplits = function(all) {
  for(var i in splits) {
    if(((i<v.n || v.n == splits.length-1) && splits[i].current > 0 && splits[i].current < splits[i].best && v.time <= splits[splits.length].best) || splits[i].best == 0 || all) {
      splits[i].best = splits[i].current
      $('.time:nth('+i+')').html(ttime(splits[i].best))
    }
    if(((i<v.n || v.n == splits.length-1) && splits[i].seg > 0 && splits[i].seg < splits[i].bestseg) || splits[i].bestseg == 0 || all) {
      splits[i].bestseg = splits[i].seg
      $('.seg:nth('+i+')').html(ttime(splits[i].bestseg))
    }
  }
  updateStaticSegments()
}
var stop = function() {
  if(v.state == RESET) {
    addSplit(splits.length)
  } else if(v.state == RUNNING) {
    v.state = STOPPED
    v.stop = new Date().getTime()
    updateTime()
    clearInterval(v.inter)
    clearInterval(v.drawinter)
    v.inter = 0
    addSplit()
  } else if(v.state == PAUSED) {
    v.state = STOPPED
    v.stop = v.pausestart
    updateTime()
    clearInterval(v.inter)
    clearInterval(v.drawinter)
    v.inter = 0
    addSplit()
  }
  if((v.inter == 0 || options.autosave) && (v.n >= splits.length-1) || (v.stops > 5)) {
    saveSplits(v.stops > 5 && v.n >= splits.length-1)
  }
  if(v.stops == 0) {
    setTimeout(function(){v.stops = 0},700)
  }
  v.stops++
  if(v.state != RESET) {
    v.state = STOPPED
  }
  save()
  centerSplit()
}
var trash = function() {
  reset()
  v.resets = 10
  reset()
  updateStaticSegments()
}
var reset = function() {
  if(v.time==0 && v.state == RESET && v.resets > 5) {
    splits = []
    $('#splits').html('')
    for(var i = 0; i < options.splits; i++) {
      addSplit(true)
    }
    $('#title').html(options.title)
    $('#attempts').html(options.attempts)
    save()
  }
  if(splits.length == 0) {
    $('#buttonsave').hide()
    $('#buttonload').show()
  } else {
    $('#buttonload').hide()
    $('#buttonsave').show()
  }
  if(v.resets == 0) {
    setTimeout(function(){v.resets = 0},700)
  }
  v.resets++
  clearInterval(v.inter)
  clearInterval(v.drawinter)
  v.start = 0
  v.inter = 0
  v.n = 0
  v.time = 0
  v.state = RESET
  centerSplit()
  updateStaticSegments()
  draw()
  save()
}
var pause = function() {
  if(v.state == PAUSED) {
    var pausetime = new Date().getTime()-v.pausestart
    v.start += pausetime
    v.state = RUNNING
    v.inter = setInterval(updateTime,options.interval)
    v.drawinter = setInterval(draw,options.drawinterval)
  } else if(v.state == RUNNING) {
    v.pausestart = new Date().getTime()
    v.state = PAUSED
    clearInterval(v.inter)
    clearInterval(v.drawinter)
    v.inter = 0
    v.drawinter = 0
  } else {
    editOptions()
  }
  updateTime()
  save()
}
var pad = function(num, size) {
  var s = "0000" + num;
  return s.substr(s.length - size);
}
var ttime = function(time) {
  time = Math.abs(time)
  var s = (time / 1000) % 60
  var m = Math.floor((time / (1000 * 60)) % 60)
  var h = Math.floor((time / (1000 * 60 * 60)) % 24)
  var newTime = h+':'+m+':'+(s.toFixed(options.precision))
  if(options.trim) {
    newTime = newTime.replace(/^([0:]*(?!\.))/,'')
  }
  newTime = newTime.replace(/(:(?=\d(?!\d)))/g,':0')
  newTime = newTime.replace('.','<span>.')+'</span>'
  return newTime
}
var centerSplit = function() {
  resizeSplits()
  var el = $('.split[data-id='+v.n+']')
  if(el.length == 0) {
    el = $('.split[data-id='+(v.n-1)+']')
    if(el.length == 0) {
      return
    }
  }
  var from = { top: $('#splits').scrollTop(), left: $('#splits').scrollLeft() }
  $('#splits').scrollTop(0)
  $('#splits').scrollLeft(0)
  var to = { top: el.position().top-$('#splits').position().top-$('#splits').height()/2+el.height()/2, left: el.position().left-$('#splits').position().left-$('#splits').width()/2+el.width()/2 }
  $('#splits').scrollTop(from.top)
  $('#splits').scrollLeft(from.left)
  $('#splits').stop(true,true).animate({scrollTop: to.top, scrollLeft: to.left}, {duration: 200, queue: false})
}
var resizeSplits = function() {
  $('#container').height($(window).height())
  $('#container').width($(window).width())
  if(v.plot) {
    v.plot.resize()
    draw()
  }
}
var updateTime = function() {
  if(v.state == RUNNING) {
    v.time = new Date().getTime()-v.start
  } else if(v.state == STOPPED) {
    v.time = v.stop-v.start
  } else if(v.state == RESET) {
    v.time = options.offset
  } else if(v.state == PAUSED) {
    v.time = v.pausestart-v.start
  }
}
var drawTime = function() {
  v.timer.html((v.time<0?'-':'')+ttime(v.time))
  if(v.time > 0 && splits[v.n]){
    v.diff.html(ttime(v.time-splits[v.n].best))
    if(rnd(v.time) > rnd(splits[v.n].best)) {
      v.diff.removeClass('better').addClass('worse')
    } else {
      v.diff.removeClass('worse').addClass('better')
    }
    var seg = v.time
    if(v.n > 0) {
      seg = v.time - splits[v.n-1].current
    }
    if(rnd(seg) < rnd(splits[v.n].bestseg)) {
      v.diff.addClass('gold')
    } else {
      v.diff.removeClass('gold')
    }
  }
}
var appendSplit = function(myname, mytime, myseg) {
  var id = $('.split').length
  $('#splits').append('<div class="split" data-id="'+id+'"><span class="name" contenteditable="true">'+myname+'</span><span class="diff"></span><span class="seg" contenteditable="true">'+ttime(myseg)+'</span><span class="time" contenteditable="true">'+ttime(mytime)+'</span></div>')
  $('#buttonload').hide()
  $('#buttonsave').show()
  v.diff = $('.diff:nth('+v.n+')')
}
var die = function() {
  localStorage.clear()
  gui.App.quit()
}
var rnd = function(num) {
  return parseFloat(num.toFixed(3))
}
var importExport = function() {
  if(splits.length > 0) {
    exportWsplit()
  } else {
    importWsplit()
  }
}
var exportWsplit = function() {
  var data = 'Title='+options.title+'\nAttempts='+options.attempts+'\nOffset=0\nSize=200,25\n'
  for(var i in splits) {
    data += splits[i].name+',0,'+rnd(splits[i].best/1000)+','+rnd(splits[i].bestseg/1000)+'\n'
  }
  data += 'Icons='+Array(splits.length).join('"",')+'""'
  if(typeof fs !== 'undefined') {
    var file = $('<input type="file" accept=".wsplit" nwsaveas="'+options.title+'">')
    file.change(function() {
      var path = this.files[0].path
      fs.writeFile(path, data)
    })
    file.click()
  } else {
    var ex = document.createElement('a')
    ex.setAttribute('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(data))
    ex.setAttribute('download', options.title+'.wsplit')
    ex.click()
  }
}
var importWsplit = function() {
  var file = $('<input type="file" accept=".wsplit">')
  file.change(function() {
    var reader = new FileReader()
    reader.onloadend = function() {
      var metareg = false
      var reg = false
      if(file[0].files[0].name.match(/\.wsplit$/)) {
        metareg = /Title=(.*)$[^]*?(Attempts=(.*?)$)/gm
        reg = /^(.*),[\d\.]*,([\d\.]*),([\d\.]*)$/gm
      } else {
        return
      }
      var meta = metareg.exec(reader.result)
      options.title = meta[1]
      $('#title').html(options.title)
      options.attempts = parseInt(meta[3]) || 0
      $('#attempts').html(options.attempts)
      splits = []
      $('#splits').html('')
      while(found = reg.exec(reader.result)) {
        var newtime = 1000*found[2]
        var newseg = 1000*found[3]
        var newname = String(found[1])
        splits.push({name: newname, current: 1*newtime, best: 1*newtime, seg: 1*newseg, bestseg: 1*newseg})
        appendSplit(newname, newtime, newseg)
      }
      save()
    }
    reader.readAsText(this.files[0])
  })
  file.click()
}
var stored = JSON.parse(localStorage.options || '[]')
for(var i in stored) {
  options[i] = clone(stored[i])
}
var storedv = JSON.parse(localStorage.v || '[]')
for(var i in storedv) {
  v[i] = clone(storedv[i])
}
var variableHandler = {
  state: function() {
    if(v.state == PAUSED) {
      $('.split:nth('+v.n+')').addClass('current')
      v.timer.removeClass().addClass('paused')
    } else if(v.state == RUNNING) {
      if(!v.inter) {
        v.inter = setInterval(updateTime,options.interval)
      }
      if(!v.drawinter && options.graph) {
        v.drawinter = setInterval(draw,options.drawinterval)
      }
      $('.split:nth('+v.n+')').addClass('current')
      v.timer.removeClass().addClass('running')
      $('#buttonreset').show()
      $('#buttonclear').hide()
      $('#buttonadd').hide()
      $('#buttonstop').show()
      $('#buttonoptions').hide()
      $('#buttonpause').show()
      $('#buttontimes').hide()
    } else if(v.state == STOPPED) {
      $('.split:nth('+v.n+')').addClass('current')
      v.timer.removeClass().addClass('stopped')
      $('#buttonadd').hide()
      $('#buttonstop').hide()
      $('#buttontimes').show()
      $('#buttonoptions').show()
      $('#buttonpause').hide()
    } else if(v.state == RESET) {
      v.timer.removeClass()
      $('#buttonreset').hide()
      $('#buttonclear').show()
      $('#timer').html((options.offset<0?'-':'')+ttime(options.offset))
      $('#timer').removeClass()
      $('.diff').removeClass('better worse gold')
      $('.diff').html('')
      $('.split').removeClass('current')
      $('#buttonstop').hide()
      $('#buttontimes').hide()
      $('#buttonadd').show()
      $('#buttonoptions').show()
      $('#buttonpause').hide()
    }
  },
  n: function() {
    $('.split').removeClass('current')
    $('.split:nth('+v.n+')').addClass('current')
    v.diff = $('.diff:nth('+v.n+')')
    updateStaticSegments()
  },
  time: function() {
    if(v.time > 0 && splits[v.n]) {
      if(v.time < splits[v.n].best) {
        v.timer.removeClass('worse').addClass('better')
      } else if(v.time > splits[v.n].best) {
        v.timer.removeClass('better').addClass('worse')
      } else {
        v.timer.removeClass('better worse')
      }
    }
    drawTime()
  }
}
var splits = (localStorage.splits?JSON.parse(localStorage.splits):[])
if(splits.length == 0 && options.splits > 0) {
  for(var i = 0; i < options.splits; i++) {
    addSplit(true)
  }
}
if(typeof process !== 'undefined') {
  win.setAlwaysOnTop(options.ontop)
  if(!isNaN(Math.log(options.zoom)/Math.log(1.2))) {
    win.zoomLevel = Math.log(options.zoom)/Math.log(1.2)
  }
  if(options.x) {
    win.x = options.x
  }
  if(options.y) {
    win.y = options.y
  }
  if(options.width) {
    win.width = options.width
  }
  if(options.height) {
    win.height = options.height
  }
  v.shortcut_split = new gui.Shortcut({key: options.global_split,active: function(){split()},failed: function(msg){console.log(msg)}})
  gui.App.registerGlobalHotKey(v.shortcut_split)
  v.shortcut_stop = new gui.Shortcut({key: options.global_stop,active: function(){stop()},failed: function(msg){console.log(msg)}})
  gui.App.registerGlobalHotKey(v.shortcut_stop)
  v.shortcut_pause = new gui.Shortcut({key: options.global_pause,active: function(){pause()},failed: function(msg){console.log(msg)}})
  gui.App.registerGlobalHotKey(v.shortcut_pause)
  v.shortcut_reset = new gui.Shortcut({key: options.global_reset,active: function(){reset()},failed: function(msg){console.log(msg)}})
  gui.App.registerGlobalHotKey(v.shortcut_reset)
  v.shortcut_undo = new gui.Shortcut({key: options.global_undo,active: function(){undo()},failed: function(msg){console.log(msg)}})
  gui.App.registerGlobalHotKey(v.shortcut_undo)
  var menu = new gui.Menu()
  menu.append(new gui.MenuItem({ label: 'Import splits' }))
  menu.append(new gui.MenuItem({ label: 'Export splits' }))
  menu.append(new gui.MenuItem({ type: 'separator' }))
  menu.append(new gui.MenuItem({ label: 'Start / Split' }))
  menu.append(new gui.MenuItem({ label: 'Stop / Save times' }))
  menu.append(new gui.MenuItem({ label: 'Pause / Unpause' }))
  menu.append(new gui.MenuItem({ label: 'Reset' }))
  menu.append(new gui.MenuItem({ label: 'Clear all' }))
  menu.append(new gui.MenuItem({ label: 'Undo split' }))
  menu.append(new gui.MenuItem({ label: 'Add split' }))
  menu.append(new gui.MenuItem({ type: 'separator' }))
  menu.append(new gui.MenuItem({ label: 'Settings' }))
  menu.append(new gui.MenuItem({ label: 'Add custom theme' }))
  menu.append(new gui.MenuItem({ label: 'Clear custom theme' }))
  menu.append(new gui.MenuItem({ label: 'Load defaults' }))
  menu.append(new gui.MenuItem({ label: 'Show graph' }))
  menu.append(new gui.MenuItem({ label: 'Show toolbar' }))
  menu.append(new gui.MenuItem({ label: 'Open devtools' }))
  menu.append(new gui.MenuItem({ type: 'separator' }))
  menu.append(new gui.MenuItem({ label: 'Exit' }))
  menu.items[0].click = function() { importWsplit() }
  menu.items[1].click = function() { exportWsplit() }
  menu.items[3].click = function() { split() }
  menu.items[4].click = function() { stop() }
  menu.items[5].click = function() { pause() }
  menu.items[6].click = function() { reset() }
  menu.items[7].click = function() { trash() }
  menu.items[8].click = function() { undo() }
  menu.items[9].click = function() { addSplit(true) }
  menu.items[11].click = function() { editOptions() }
  menu.items[12].click = function() { getCss() }
  menu.items[13].click = function() { $('style').html(''); save() }
  menu.items[14].click = function() { localStorage.clear; for(var i in defaults) {options[i] = clone(defaults[i])} }
  menu.items[15].click = function() { options.graph = !options.graph }
  menu.items[16].click = function() { options.toolbar = !options.toolbar }
  menu.items[17].click = function() { win.showDevTools() }
  menu.items[19].click = function() { win.close() }
  window.oncontextmenu = function(e) {
    if(e.button == 2) {
      menu.popup(e.clientX, e.clientY)
    }
  }
  var sock = false
  if(process.platform.match(/linux|darwin/ig)) {
    var os = require('os')
    sock = os.tmpDir()+'/nwsplit.sock'
    if(fs.existsSync(sock)) {
      fs.unlinkSync(sock)
    }
  } else if(process.platform.match(/win32/ig)) {
    sock = '\\\\.\\pipe\\nwsplit'
  }
  if(sock) {
    var net = require('net')
    var server = net.createServer(function(stream) {
      stream.on('data', function(c) {
        console.log('Socket says '+c.toString())
        eval(c.toString())
      })
    })
    server.listen(sock)
  }
  win.on('close', function() {
    this.hide()
    if(server) {
      server.close()
    }
    save()
    this.close(true)
  })
}
var buttonHandler = {
  buttonsave: function(){ exportWsplit() },
  buttonload: function(){ importWsplit() },
  buttonreset: function(){ reset() },
  buttonclear: function(){ trash() },
  buttonpause: function(){ pause() },
  buttonoptions: function(){ editOptions() },
  buttonadd: function(){ stop() },
  buttonstop: function(){ stop() },
  buttontimes: function(){ stop() },
  buttonsplit: function(){ split() }
}
$(function() {
  v.timer = $('#timer')
  v.title = $('#title')
  v.attempts = $('#attempts')
  if(!options.graph) {
    $('#graph').hide()
  }
  if(!options.toolbar && typeof win !== 'undefined') {
    $('#bar').hide()
  }
  v.title.html(options.title)
  v.attempts.html(options.attempts)
  $('style').html(options.css)
  resizeSplits()
  $(window).resize(function(e) {
    centerSplit()
  })
  $(window).keydown(function(e) {
    if($(e.target).attr('contenteditable') == 'true') {
      return
    }
    if(e.which == key(options.local_split)) {
      e.preventDefault()
      split()
    } else if(e.which == key(options.local_stop)) {
      e.preventDefault()
      stop()
    } else if(e.which == key(options.local_reset)) {
      e.preventDefault()
      reset()
    } else if(e.which == key(options.local_pause)) {
      e.preventDefault()
      pause()
    }
  })
  $('#timer').html((options.offset<0?'-':'')+ttime(options.offset))
  for(var i in splits) {
    appendSplit(splits[i].name, splits[i].best, splits[i].bestseg)
  }
  $('#container').on('click', '[contenteditable="true"]', function(e){
    e.preventDefault()
    e.stopPropagation()
    document.execCommand('selectAll', false, null)
  })
  $('#splits').on('click', function(e){
    if($(e.target).is('.split, #splits')) {
      $('[contenteditable="true"]').blur()
    }
  })
  $('#container').on('focus', '.time', function(e) {
    var id = $(this).parents('.split').attr('data-id')
    var val = rnd(splits[id].best/1000)
    $(this).html(val)
  })
  $('#container').on('blur', '.time', function(e) {
    if(!e.isSimulated) {
      return false
    }
    var id = $(this).parents('.split').attr('data-id')
    if(!splits[id]) {
      return
    }
    var val = 1000*$(this).html()
    splits[id].best = val
    $(this).html(ttime(val))
    save()
  })
  $('#container').on('focus', '.seg', function(e) {
    var id = $(this).parents('.split').attr('data-id')
    var val = rnd(splits[id].bestseg/1000)
    $(this).html(val)
  })
  $('#container').on('blur', '.seg', function(e) {
    if(!e.isSimulated) {
      return false
    }
    var id = $(this).parents('.split').attr('data-id')
    if(!splits[id]) {
      return
    }
    var val = 1000*$(this).html()
    splits[id].bestseg = val
    $(this).html(ttime(val))
    save()
  })
  $('#container').on('blur', '.name', function(e) {
    var id = $(this).parents('.split').attr('data-id')
    if(!splits[id]) {
      return
    }
    var val = $(this).html()
    if(val == '') {
      splits.splice(id, 1)
      $(this).parents('.split').remove()
      var m = 0
      $('.split').each(function() {
        $(this).attr('data-id', m)
        m++
      })
      if(v.n>id) {
        v.n--
      }
    } else {
      splits[id].name = val
    }
    save()
  })
  if(typeof win !== 'undefined') {
    $(window).bind('mousewheel', function(e){
      if(!e.ctrlKey) {
        return
      }
      if(e.originalEvent.wheelDelta /120 > 0) {
        e.preventDefault()
        options.zoom += 0.1
      } else {
        e.preventDefault()
        options.zoom -= 0.1
      }
    });
  }
  $(window).scroll(function() {
    $(window).scrollTop(0)
    $(window).scrollLeft(0)
  })
  $('#title').blur(function() {
    options.title = $('#title').html()
    save()
  })
  $('#attempts').blur(function() {
    options.attempts = parseInt($('#attempts').html()) || 0
    save()
  })
  $('#splits').dblclick(function(e) {
    e.preventDefault()
    if(splits.length == 0) {
      importWsplit()
    } else {
      exportWsplit()
    }
  })
  $('#bar').on('click', '.button', function(e){
    if(buttonHandler[this.id]) {
      buttonHandler[this.id]()
    }
  })
  window.ondragover = function(e) { e.preventDefault(); return false }
  window.ondrop = function(e){ if(e.target.id != 'file') { e.preventDefault(); return false }}
  variableHandler['state']()
  Object.observe(v, function(c) {
    for(var i in c) {
      if(variableHandler[c[i].name]) {
        variableHandler[c[i].name]()
      }
    }
  })
  Object.observe(options, function(c) {
    for(var i in c) {
      if(optionHandler[c[i].name]) {
        optionHandler[c[i].name](options[c[i].name])
      }
    }
    save()
  })
  if(typeof win !== 'undefined') {
    win.width++
    win.width--
  }
  custom = $('#custom')
})