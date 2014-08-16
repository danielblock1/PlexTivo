(function() {

// Player (controller)
/*function init() {
  var fm = getFocusManager();
  var links = document.getElementsByTagName('A');
  for (var i = 0; i < links.length; ++i)
    fm.add(links[i]);

  syncQueryParameters(document.getElementById('player-conf'));

  var video = document.getElementById('v');
  window.v = video;

  if (!detectFeatures(video)) {
    log('Required features not detected, aborting.');
    return false;
  }
  document.getElementById('seekform').addEventListener('submit', onDocumentSeek);
  document.getElementById('seekbtn').addEventListener('click', onDocumentSeek);

  var box = document.getElementById('console');
  if (box) {
    box.value = '';
  }

  log('DASH MSE/EME demo version 0.2-207-g3fb234e');
  log('-------- Initializing --------');
  var url = document.getElementById('url').value;
   // document.getElementById('choose_example').className = '';
    retrieveDASHManifest("http://192.168.100.51:32400/video/:/transcode/universal/start.mpd?path=http%3A%2F%2F127.0.0.1%3A32400%2Flibrary%2Fmetadata%2F10623&mediaIndex=0&partIndex=0&protocol=dash&offset=0&fastSeek=1&directPlay=1&directStream=1&videoQuality=75&maxVideoBitrate=3000&subtitleSize=90&audioBoost=100&videoResolution=1280x720&videoQuality=75&session=898f368aee857f9&X-Plex-Client-Identifier=898f368aee857f9&X-Plex-Product=Web%20Client&X-Plex-Device=Mac&X-Plex-Platform=Chrome&X-Plex-Platform-Version=7&X-Plex-Version=1.2.12&X-Plex-Device-Name=Plex%2FWeb%20(Chrome)");
}*/
function log(output){
console.log(output);
}
function mediafyURL(url) {
  var start1 = 'http://yt-dash-mse-test.commondatastorage.googleapis.com/';
  var start2 = 'http://yt-dash-mse-test.commondatastorage.googleapis.com/media/';
  if (url.indexOf(start1) == 0 && url.indexOf(start2) != 0) {
    url = url.replace(start1, start2);
  }
  return url;
}

function absolutizeURL(base, target) {
  if (target.match(/^[a-z]*:\/\//)) return target;
  var rel_url;
  if (target[0] == '/') {
    rel_url = base.match(/^[a-z]*:\/\/[^\/]*/)[0];
  } else {
    rel_url = base.replace(/\/[^\/]*$/, '/');
  }
  return rel_url + target;
}

function getURLQueryParameter(name) {
  var re = new RegExp("[?&]" + name + "=([^&]*)");
  var result = re.exec(window.location.search);
  if (result != null) {
    result = result[1];
    if (/%/.exec(result)) result = decodeURIComponent(result);
    return result;
  }
  return null;
}

function syncQueryParameters(form) {
  var elements = form.elements;
  for (var i = 0; i < elements.length; i++) {
    var val = getURLQueryParameter(elements[i].name);
    if (elements[i].name == 'url') {
      val = mediafyURL(val);
    }
    if (elements[i].type == 'checkbox') {
      var dfault = elements[i].name == 'autoplay' ? true : false;
      elements[i].checked = (val == null ? dfault : val != 'off');
    } else if (val != null) {
      elements[i].value = val;
    }
  }
}

function retrieveDASHManifest(url) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', onManifestLoad.bind(null, url));
  xhr.addEventListener('error', onManifestError.bind(null, url));
  xhr.open("GET", url);
  xhr.send();
  //dlog(1, "XHR for manifest sent");
}

function onManifestLoad(url, evt) {
  //dlog(2, "Manifest received");
  if (!(evt.target.status >= 200 && evt.target.status < 299)) {
    log('HTTP error ' + evt.target.status +
        ' retrieving DASH manifest from ' + url);
    return;
  }
  var mpd = parseDASHManifest(evt.target.responseText, url);
  if (mpd == null) {
    log('Error parsing DASH manifest!');
    return;
  }
  var vid = document.getElementById('v');
  window.v = vid;  // For ease of debugging
  vid.volume = 1;  // To avoid blasting your ears when debugging

  var msrc = new MediaSource();
  msrc.mpd = mpd;
  msrc.eme = new EMEHandler(vid);
  msrc.addEventListener('sourceopen', onSourceOpen.bind(null, vid, msrc));
  msrc.addEventListener('webkitsourceopen', onSourceOpen.bind(null, vid, msrc));
  msrc.attachTo(vid);
  window.msrc = msrc;

  var bufbar = document.getElementById('bufbar');
  window.setInterval(updateBufferBar.bind(null, vid, msrc, bufbar), 1000);

  vid.addEventListener('seeking', onSeeking.bind(vid, msrc));
  vid.addEventListener('pause', onPause);
  vid.addEventListener('play', onPlay);
  vid.addEventListener('error', onError);

  // True if the next 'pause' event will be (or is expected to be) generated as
  // a result of automatic pausing, such as a buffer stall. Setting this masks
  // the next pause event from changing the user's paused state.
  // TODO(strobe): this is a hack in place until custom controls are in and we
  // can attach to the clicks and set the state directly.
  vid.autopause_pending = false;

  // True if the reason for the video being paused was not the result of user
  // action, and the video is currently paused.
  //vid.autopaused = document.getElementById('autoplay').checked;
}

function onManifestError(url, evt) {
  log('Error retrieving manifest from ' + url);
}

function getBaseURL(url){
  	var base = null;

            if (url.indexOf("/") !== -1)
            {
                if (url.indexOf("?") !== -1) {
                    url = url.substring(0, url.indexOf("?"));
                }
                base = url.substring(0, url.lastIndexOf("/") + 1);
            }

	return base;
}

function normalizeRepresentation(mpd, repSrc) {
  var rep = {
    'baseURL': getBaseURL(mpd.manifestURL),
    'bandwidth': repSrc.bandwidth,
    'duration': mpd.periods[0].duration || mpd.mediaPresentationDuration,
    'id': repSrc.id
  };
  var init = null;
  var index = null;
  if (repSrc.segmentBase != null) {
    var segSrc = repSrc.segmentBase;
    init = segSrc.initialization;
    if (segSrc.indexRange != null)
      index = segSrc.indexRange;
  }
  /*rep.indexRange = {
    'start': index.start,
    'end': index.end,
  };*/
  /*rep.init = {
    'start': init.start,
    'end': init.end,
    'value': null
  };*/
    log("duration:" + rep.duration); 
    return rep;
}

// Media Source =====================================================
function onSourceOpen(video, msrc, evt) {
  //dlog(3, "onSourceOpen()");
  var mpd = msrc.mpd;

  if (!msrc.progressTimer) {
    msrc.progressTimer =
      window.setInterval(onProgress.bind(video, msrc), 500);
  }

  if (msrc.sourceBuffers.length) {
    //dlog(4, "onSourceOpen(): Target already has buffers, bailing.");
    for (var i = 0; i < msrc.sourceBuffers.length; i++)
      msrc.sourceBuffers[i].active = true;
    return;
  }

  msrc.duration = mpd.periods[0].duration || mpd.mediaPresentationDuration;
  log("msrc.duration:" + msrc.duration);

  for (var i = 0; i < mpd.periods[0].adaptationSets.length; i++) {
    var aset = mpd.periods[0].adaptationSets[i];


    var reps = aset.representations.map(normalizeRepresentation.bind(null, mpd));
    for(var j=0;j<reps.length;j++){
	var rep = reps[j];
  	rep.initURL = (getBaseURL(mpd.manifestURL)+ aset.segmentTemplate.initialization).replace("$RepresentationID$", rep.id);
	rep.time =0;
	log("initURL:" + rep.initURL);
  	rep.count = aset.segmentTemplate.startNumber;
	log("count:" + rep.count);
  	rep.isInitAppended = false;
  	rep.segmentURLs = {}; 
    rep.segmentDuration = aset.segmentTemplate.duration/aset.segmentTemplate.timescale;
	 var numofSegs = Math.ceil(rep.duration/rep.segmentDuration);
	 rep.numOfSegs = numofSegs;
	 log("numOfSegs:" + numofSegs);
  	for (var k = rep.count; k < numofSegs; k++){
     		var path = aset.segmentTemplate.media.replace("$RepresentationID$",rep.id);
     		path = path.replace("$Number$", k);
    		rep.segmentURLs[k] = rep.baseURL + path;
     		//log("URL:" + rep.segmentURLs[k]);
  }

}

    var mime = aset.representations[0].mimeType || aset.mimeType;
    var codecs = aset.representations[0].codecs || aset.codecs;
    var buf = msrc.addSourceBuffer(mime + '; codecs="' + codecs + '"');

    buf.aset = aset;    // Full adaptation set, retained for reference
    buf.reps = reps;    // Individual normalized representations
    buf.currentRep = 0; // Index into reps[]
    buf.active = true;  // Whether this buffer has reached EOS yet
    buf.mime = mime;
    buf.queue = [];
    if (buf.appendBuffer) {
      buf.addEventListener('updateend', function(e) {
        if (buf.queue.length) {
          buf.appendBuffer(buf.queue.shift());
        }
      });
    }

    for (var j = 0; j < reps.length; j++) {
      if (mime.indexOf('audio') >= 0) {
        if (reps[j].bandwidth < 200000 && reps[j].bandwidth > 50000) {
          buf.currentRep = j;
          break;
        }
      }
      if (mime.indexOf('video') >= 0) {
        if (reps[j].bandwidth < 1000000 && reps[j].bandwidth > 700000) {
          buf.currentRep = j;
          break;
        }
      }
    }

    buf.segIdx = null;
    buf.last_init = null;  // Most-recently-appended initialization resource

    buf.resetReason = null; // Reason for performing last call to reset().
                            // Used for better QoE when refilling after reset().
  }
  updateRepresentationForm(msrc);
}

// Video Element =====================================
function onPause(evt) {
  log('Paused, auto=' + this.autopause_pending);
  this.autopaused = this.autopause_pending;
  this.autopause_pending = false;
}

function onPlay(msrc, evt) {
  log('Playing');
  this.autopause_pending = false;
  this.autopaused = false;
}

function onError(evt) {
  log('Error (' + v.error.code + ')');
}

function onSeeking(msrc, evt) {
  // TODO(strobe): Build quality index, other abstractions so that we know which
  // range is currently being appended explicitly and whether we should reset
  console.log("seeking");
  for (var i = 0; i < msrc.sourceBuffers.length; i++)
    resetSourceBuffer(msrc.sourceBuffers[i], 'seeking');
}

// Called in context of video element.
function onProgress(msrc) {
  if (msrc.readyState != 'open' && !!msrc.progressTimer) {
    //dlog(2, "Deregistering progress timer");
    window.clearInterval(msrc.progressTimer);
    msrc.progressTimer = null;
    return;
  }

  if (window.v.error) return;
  //log('Bandwidth: ' + globalSlowBandwidth + ', ' + globalFastBandwidth);
  var not_enough_buffered = false;
  var active = false;
  for (var i = 0; i < msrc.sourceBuffers.length; i++) {
    var buf = msrc.sourceBuffers[i];
    if (!buf.active) continue;
    active = true;
    fetchNextSegment(buf, this, msrc);

    // Find the end of the current buffered range, if any, and compare that
    // against the current time to determine if we're stalling
    var range = findRangeForPlaybackTime(buf, this.currentTime);
    if(range)
      //console.log("range:" + range +" start:"+ range.start + " end: " + range.end + ": currentTime" + this.currentTime);
    if (!range) {
      //console.log("no range");
        //this.play();
      not_enough_buffered = true;
    } else if (this.paused) {
      not_enough_buffered = (range.end < this.currentTime + MIN_RESUME_SECS);
    } else {
      not_enough_buffered |= (range.end < this.currentTime + MIN_BUFFERED_SECS);
    }
  }

  if (!active && msrc.readyState == 'open') {
    log('Ending stream');
    msrc.endOfStream();
    return;
  }

  if (this.paused) {
      //console.log("paused");
    if (this.autopaused) {
        //console.log("autopaused");
      // Last pause was an autopause, decide if we should resume
      if (!not_enough_buffered) {
        //dlog(4, 'Autoresuming');
          //console.log("autoresuming");
        this.play();
      }
    }
  } else {
    if (not_enough_buffered) {
      //dlog(4, 'Autopausing');
      //console.log("autopausing")
      this.autopause_pending = true;
      this.pause();
    }
  }
}

// Document ===========================================
function onDocumentSeek(evt) {
  evt.preventDefault();
  var vid = document.getElementById('v');
  var seek_form = document.getElementById('seekform');
  var time = parseFloat(seek_form.time.value);
  if (time == NaN) {
    log('Invalid or missing value for time in seek form');
    return;
  }

  //dlog(1, 'Seeking to time', time);
  vid.currentTime = time;
}

// TODO(strobe): screw it.

var kSlowEWMACoeff = 0.99;
var kFastEWMACoeff = 0.98;
var globalSlowBandwidth = 500000;
var globalFastBandwidth = 500000;
var videoRepSel = null;
var cooldown = 2;

function adapt() {
  /*var repsel = videoRepSel;
  var adapt = document.getElementById('adapt').value;
  if (adapt == "random") {
    if (Math.random() > 0.5) {
      repsel.selectedIndex = Math.floor(Math.random() * repsel.length);
      repsel.dispatchEvent(new Event('change', true, false));
      return true;
    }
  } else if (adapt == "auto") {
    if (cooldown) {
      cooldown--;
    } else {
      var bestBw = 0;
      var best = 0;
      var gbw = Math.min(globalSlowBandwidth, globalFastBandwidth);
      for (var i = 0; i < repsel.length; i++) {
        var bw = parseInt(repsel.options[i].innerText) * 1000;

        if (bw > bestBw && bw < (0.85 * gbw - 128000)) {
          bestBw = bw;
          best = i;
        }
      }
      if (best != repsel.selectedIndex) {
        log('Selected new rate ' + bestBw + ' for bandwidth ' + gbw +
            ' (from ' + globalSlowBandwidth + ', ' + globalFastBandwidth + ')');
        repsel.selectedIndex = best;
        repsel.dispatchEvent(new Event('change', true, false));
        cooldown = 8;
        return true;
      }
    }
  }
  return false;*/
}

function updateRepresentationForm(msrc) {
  //dlog(4, "updateRepresentationForm()", msrc);
 /* var repform = document.getElementById('repform');
  repform.innerHTML = 'Representations:';
  for (var buf_idx = 0; buf_idx < msrc.sourceBuffers.length; buf_idx++) {
    var buf = msrc.sourceBuffers[buf_idx];
    var sel = repform.appendChild(document.createElement('select'));
    for (var i = 0; i < buf.reps.length; i++) {
      var rep = buf.reps[i];
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = Math.round(rep.bandwidth / 1000) + 'k'; // plus codec?
      sel.add(opt);
    }
    sel.value = buf.currentRep;
    sel.addEventListener('change', onRepChange.bind(null, buf));
    if (buf.mime.indexOf('video') >= 0)
      videoRepSel = sel;
  }*/
}

function resetSourceBuffer(buf, reason) {
    console.log("ResetSourceBuffer");
  //dlog(1, 'resetSourceBuffer');
  if (buf.xhr != null) {

    buf.xhr.abort();
    buf.xhr = null;
  }
  buf.url = null;
  buf.segIdx = null;
  buf.last_init = null;
  buf.reset_reason = reason || null;
  // Shame on me for using window.
  if (window.msrc.readyState != 'open') return;

  buf.abort();
}

function onRepChange(buf, evt) {
  //dlog(3, "onRepChange");
  var reason;
  var oldBW = buf.aset.representations[buf.currentRep].bandwidth;
  var newBW = buf.aset.representations[evt.target.value].bandwidth;
  // TEMPORARY HACK: ignore change if rep is 32k (HE-AACv2).
  if (newBW < 48000) return;
  if (oldBW > newBW) {
    reason = 'rep_down';
  } else {
    reason = 'rep_up';
  }
  resetSourceBuffer(buf, reason);
  buf.currentRep = evt.target.value;
}

// Minimum amount of time required to continue playing. Falling below this
// threshold results in an autopause.
// TODO(strobe): this cuts off the last N seconds of video as well; we just
// need to add some more edge cases to deal with EOF.
var MIN_BUFFERED_SECS = 1;

// Minimum amount of time required to be buffered in order to resume playback
// from an autopause.
var MIN_RESUME_SECS = 5;

function queueAppend(buf, val) {
  if (buf.updating) {

    buf.queue.push(val);
  } else if (buf.appendBuffer) {

      buf.appendBuffer(val);
  } else {

    buf.append(new Uint8Array(val));
  }
}

function appendInit(buf, init) {
  //dlog(3, "Appending init");

  //buf.timestampOffset = -0;
  queueAppend(buf, init);
  buf.last_init = init;

}

function onXHRLoad(evt) {
  var xhr = evt.target;
  var buf = xhr.buf;
  buf.xhr = null;
  var vid = buf.video;

  if (xhr.readyState != xhr.DONE) return;
  if (xhr.status >= 300) {
    log('XHR failure, status=' + xhr.status);
    //if(retryCount < 3) {
        //console.log("buf:" + buf + "buf url:" + buf.url);
      setTimeout(function()
      { makeXHR(buf, buf.url, false);},100);
        return;
       // xhr.retryCount++;
    //}
    //throw 'TODO: retry XHRs on failure';
  }

    if(xhr.is_init){
        //xhr.init = xhr.response;
       buf.init = xhr.response;
        //buf.init = xhr.response;
        appendInit(buf,xhr.response);
        return;
    }

    if (buf.last_init == null) {
        appendInit(buf,buf.init);
    }

  queueAppend(buf, xhr.response);
  buf.segIdx++;



  if (xhr.expected_time != null && !buf.appendBuffer) {
    // The expected time is the start time of the first buffer in this sequence.
    // This check ensures that media data append time is (roughly) reflected in
    // the buffered range.
    range = findRangeForPlaybackTime(buf, xhr.expected_time);
    if (range == null ||
        !(range.start <= xhr.expected_time && range.end >= xhr.expected_time)) {
      log('Media data expected time not reflected in updated buffer range. ' +
          'MSE implementation bug?');
      if (range == null) {
        //dlog(2, 'Reason: range is null');
      } else {
        //dlog(2, 'Reason: expected time ' + xhr.expected_time + ' not in (' +
              //range.start + ', ' + range.end + ')');
      }
    }
  }

}

function onXHRProgress(evt) {
  //console.log("progress");
  var xhr = evt.target;
  if (xhr.lastTime != null && evt.timeStamp != xhr.lastTime) {

    var bw = 8000 * (evt.loaded - xhr.lastSize) / (evt.timeStamp - xhr.lastTime);
    globalSlowBandwidth = kSlowEWMACoeff * globalSlowBandwidth + (1 - kSlowEWMACoeff) * bw;
    globalFastBandwidth = kFastEWMACoeff * globalFastBandwidth + (1 - kFastEWMACoeff) * bw;
  }
  xhr.lastTime = evt.timeStamp;
  xhr.lastSize = evt.loaded;
}

function mkrange(start, end) {
        if (start != null && end != null) return 'bytes=' + start + '-' + end;
        return null;
}


function findForTime(rep, append_time) {
    if (append_time < rep.duration) {
        rep.time = append_time;
        var segId = Math.floor(append_time / rep.segmentDuration);
        return segId;

    }else{
         return rep.duration;
    }

}

function fetchNextSegment(buf, video, msrc) {
  if (buf.xhr) return;
  var time = video.currentTime;
  var rep = buf.reps[buf.currentRep];

  if (!rep.isInitAppended) {
     //console.log("append init");
    //var xhr = makeXHR(buf, rep.url, rep.init.start, rep.init.end, rep.init, true, false);
    rep.url = rep.initURL;
    var xhr = makeXHR(buf, rep.url, true);
    buf.inituri = rep.initURL;
    rep.isInitAppended = true;
    return;
  }

 // if (adapt()) return;

  var range = findRangeForPlaybackTime(buf, time);
  //console.log("range:" + range);
  var append_time = (range && range.end) || time;
  //console.log("append:" + append_time);
  if (append_time > time + 15) return;

  if (buf.segIdx == null) {
    buf.segIdx = Math.max(0, findForTime(rep,append_time));
    rep.count = buf.segIdx;
  } else {
    if (range == null) {
      // If buf.segIdx is set, we're continuing to append data consecutively
      // from some previous point, as opposed to choosing a new location to
      // start appending from. The only reason a the playback head *should* be
      // outside of a buffered region is that we've seeked, which should have
      // triggered an append location change if the current head fell outside
      // of a buffered region (or in the future, if the current buffered region
      // has content from a different quality level - but we don't track that
      // yet or flush the buffer on quality change). It's normal to see this
      // message once or maybe even twice after a seek, since seeking near the
      // end of a high-bitrate segment may mean the first append didn't cover
      // the full time between segment start and current time, but seeing this
      // any more than that is a pretty big error.
      // Seeing this outside of a seek means something's lying, or we
      // underflowed and playback didn't stall.
      log("Current playback head outside of buffer in append-continue state.");
    }
  }


  //var offset = rep.index.getOffset(buf.segIdx);
  ///var size = rep.index.getByteLength(buf.segIdx);
  
  //var xhr = makeXHR(buf, rep.url, offset, offset + size - 1,
    //                rep.init, false, false);


  /*if(rep.count < rep.numOfSegs){
  var xhr = makeXHR(buf,rep.segmentURLs[rep.count],false);
  rep.count+=1;
  xhr.expected_time = append_time;
}*/
    if(buf.segIdx < rep.numOfSegs){
        var xhr = makeXHR(buf,rep.segmentURLs[buf.segIdx],false);
        //rep.count+=1;
        xhr.expected_time = append_time;
    }
}

function makeXHR(buf, url, is_init) {

  var xhr = new XMLHttpRequest();
   xhr.open("GET", url);
  xhr.responseType = 'arraybuffer';
  xhr.addEventListener('load', onXHRLoad);
  if (url == null) throw "Null URL";
  buf.url = url;
  //xhr.init =0;
  xhr.buf = buf;
  xhr.is_init = is_init;
  buf.xhr = xhr;
  xhr.lastTime = null;
  xhr.lastSize = null;
  xhr.retryCount = 0;
  xhr.addEventListener('progress', onXHRProgress);
  xhr.send();

  //log('Sent XHR: url=' + url);
  return xhr;
}


/*function makeXHR(buf, url, start, end, init_ref, is_init, is_index) {
  console.log("makeXHR2");
  var xhr = new XMLHttpRequest();
  var range = mkrange(start, end);

  xhr.open("GET", url);
  xhr.responseType = 'arraybuffer';
  xhr.startByte = start;
  if (range != null && !useArg) xhr.setRequestHeader('Range', range);
  xhr.addEventListener('load', onXHRLoad);
  if (url == null) throw "Null URL";
  buf.url = url;
  xhr.buf = buf;
  xhr.init = init_ref;
  xhr.is_init = is_init;
  xhr.is_index = is_index;
  buf.xhr = xhr;
  xhr.lastTime = null;
  xhr.lastSize = null;
  xhr.addEventListener('progress', onXHRProgress);
  xhr.send();
  //dlog(2, 'Sent XHR: url=' + url + ', range=' + range);
  return xhr;
}*/

function findRangeForPlaybackTime(buf, time) {
  var ranges = buf.buffered;
  for (var i = 0; i < ranges.length; i++) {
    if (ranges.start(i) <= time && ranges.end(i) >= time) {
      return {'start': ranges.start(i), 'end': ranges.end(i)};
    }
  }
}

// Buffer bar ========================================
function updateBufferBar(vid, msrc, bufbar) {
 /* if (vid.error) return;
  var duration = vid.duration;
  log("buf duration:" + duration);
  if (!(duration < 1.0e9)) {
    if (msrc.duration != 0) {
      //dlog(3, 'Implausible duration from video element: ' + duration);
      duration = msrc.duration;
    } else {
      return;
    }
  }

  var box = bufbar.firstElementChild;
  // The first box is the format label
  box.innerText = '' + vid.videoWidth + 'x' + vid.videoHeight;
  box = box.nextElementSibling;
  // The second box is the playback position
  box.style.left = (100 * vid.currentTime / duration) + '%';
  box = box.nextElementSibling;

  var buffers = [vid.buffered];
  for (var i = 0; i < msrc.sourceBuffers.length; i++) {
    buffers.push(msrc.sourceBuffers[i].buffered);
  }

  for (var buf_idx = 0; buf_idx < buffers.length; buf_idx++) {
    var ranges = buffers[buf_idx];
    for (var i = 0; i < ranges.length; i++) {
      if (box == null)
        box = bufbar.appendChild(document.createElement('div'));
      box.className = 'bufblock' + (buf_idx == 0 ? ' vidbuf' : '');
      box.style.left = (100 * ranges.start(i) / duration) + '%';
      box.style.width = (100 * (ranges.end(i) - ranges.start(i)) / duration) + '%';
      box.style.top = (100 * buf_idx / buffers.length) + '%';
      box.style.height = (100 / buffers.length) + '%';
      box = box.nextElementSibling;
    }
  }

  while (box != null) {
    var next = box.nextElementSibling;
    bufbar.removeChild(box);
    box = next;
  }*/
}

// Utils ================================================
function detectFeatures(video) {
  var ok = true;
  if (!video.webkitGenerateKeyRequest && !video.generateKeyRequest) {
    log('EME not detected.');
    //ok = false;
  }
  if (!hasMediaSource()) {
    log('MSE not detected.');
    ok = false;
  }
  return ok;
}

var counter = 0;

if (document.location.href.indexOf('seeky=1') >= 0) {
  window.setInterval(function() {
    if (counter > 20) {
      counter = 0;
    } else if (counter > 10) {
      var v = document.getElementById('v');
      if (v.duration > 0) {
          v.currentTime = v.duration * 0.8 * Math.random();
      }
    }
    counter++;
  }, 400);
}
window.retrieveDASHManifest = retrieveDASHManifest;
//window.addEventListener('load', init);

})();
