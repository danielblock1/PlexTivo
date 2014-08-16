'use strict';
/* Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * 0.2-207-g3fb234e
 */

(function() {

window.hasMediaSource = function() {
  if (window.MediaSource != null || window.webkitMediaSource != null)
    return true;
  var v = document.createElement('video');
  if (v.webkitSourceAddId == null && v.sourceAddId == null) {
    log('Media Source not found!');
    return false;
  }
  return true;
}

// Converted to property of Media Source prototype.
window.attachMediaSource = function(video, msrc) {
  msrc.attachTo(video);
}

var dlog = window.dlog || console.log.bind(console);

var attachNative = function(video) {
  var URL = window.URL;
  video.src = URL.createObjectURL(this);
}

// Don't even bother executing the rest if the browser already has what we need.
if (window.MediaSource != null || window.WebKitMediaSource != null) {
  if (window.WebKitMediaSource != null) {
    window.MediaSource = window.WebKitMediaSource;
    window.MediaSource.prototype.version = 'MSE-live-webkit';
  } else {
    window.MediaSource.prototype.version = 'MSE-live';
  }
  window.MediaSource.prototype.attachTo = attachNative;
  return;
}

// Don't create the wrapper if we don't have MSE
if (!hasMediaSource()) return;

function MediaSource() {
  this.sourceBuffers = [];
  this.activeSourceBuffers = this.sourceBuffers;
  this.readyState = "closed";

  this.msWrapperVideo = null;
  this.msWrapperDuration = NaN;
  this.msWrapperSourceIdCount = 1;
  this.msWrapperHandlers = {};
  this.msWrapperAppended = false;
}

MediaSource.prototype.version = 'MSE-v0.5-wrapped';

MediaSource.prototype.msWrapperHandler = function(name, evt) {
  var handlers = this.msWrapperHandlers[name] || [];
  dlog(4, "In msWrapperHandler");
  if (name == 'close') {
    this.readyState = 'closed';
    this.msWrapperDuration = NaN;
  } else {
    this.readyState = name;
  }
  for (var i = 0; i < handlers.length; i++) {
    handlers[i].call(evt, evt);
  }
}

MediaSource.prototype.attachTo = function(video) {
  dlog(4, "In msWrapperAttach");
  var names = ['open', 'close', 'ended'];
  for (var i = 0; i < names.length; i++) {
    var h = this.msWrapperHandler.bind(this, names[i]);
    v.addEventListener('webkitsource' + names[i], h);
  }
  var self = this;
  video.addEventListener('durationchange', function() {
    self.msWrapperDuration = video.duration;
  });
  if (video.webkitMediaSourceURL != null) {
    video.src = video.webkitMediaSourceURL;
  } else {
    throw "Could not find mediaSourceURL";
  }
  this.msWrapperVideo = video;
}

MediaSource.prototype.addSourceBuffer = function(type) {
  if (this.msWrapperVideo == null) throw "Unattached";
  var id = '' + this.msWrapperSourceIdCount;
  this.msWrapperSourceIdCount += 1;

  if (this.msWrapperVideo.webkitSourceAddId != null) {
    this.msWrapperVideo.webkitSourceAddId(id, type);
  } else {
    throw "No sourceAddId";
  }
  var buf = new SourceBuffer(this.msWrapperVideo, id);
  this.sourceBuffers.push(buf);
  return buf;
}

MediaSource.prototype.removeSourceBuffer = function(buf) {
  var v = this.msWrapperVideo;
  var id = buf.msWrapperSourceId;
  if (v.sourceRemoveId != null) {
    v.sourceRemoveId(id);
  } else if (this.webkitSourceRemoveId != null) {
    v.webkitSourceRemoveId(id);
  } else {
    throw "No sourceRemoveId";
  }
}

MediaSource.prototype.endOfStream = function(opt_error) {
  var v = this.msWrapperVideo;

  // TODO: are these prefixed in M21?
  var err;
  if (opt_error == "network") {
    err = v.EOS_NETWORK_ERR;
  } else if (opt_error == "decode") {
    err = v.EOS_DECODE_ERR;
  } else if (opt_error == null) {
    err = v.EOS_NO_ERROR;
  } else {
    throw 'Unrecognized endOfStream error type: ' + opt_error;
  }

  if (v.webkitSourceEndOfStream != null) {
    v.webkitSourceEndOfStream(err);
  } else {
    throw "No sourceEndOfStream";
  }
}

// The 'setDuration' method of the media element is an extension to the
// MSE-v0.5 spec, which will be implemented on some devices.
// Calling this method is defined to have the same semantics as setting
// the duration property of the Media Source object in the current spec.
// Getting it is undefined, although clearly here we just return the last
// value that we set.
Object.defineProperty(MediaSource.prototype, "duration",
    { get: function() { return this.msWrapperDuration; }
    , set: function(duration) {
        this.msWrapperDuration = duration;
        if (this.msWrapperVideo.webkitSourceSetDuration != null) {
          this.msWrapperVideo.webkitSourceSetDuration(duration);
        } else {
          dlog(1, 'webkitSourceSetDuration() missing (ignored)');
        }
      }
    });

MediaSource.prototype.addEventListener = function(name, handler) {
  var re = /^(webkit)?source(open|close|ended)/;
  var match = re.exec(name);
  if (match && match[2]) {
    if (match[1]) {
      dlog(1, 'Ignoring webkit-prefixed event listens in wrapper');
      return;
    }
    name = match[2];
    var l = this.msWrapperHandlers[name] || [];
    l.push(handler);
    this.msWrapperHandlers[name] = l;
  } else {
    throw "Unrecognized event name: " + name;
  }
}


function SourceBuffer(video, id) {
  this.msWrapperVideo = video;
  this.msWrapperSourceId = id;
  this.msWrapperTimestampOffset = 0;
}

function FakeSourceBufferedRanges() {
  this.length = 0;
}

SourceBuffer.prototype.msWrapperGetBuffered = function() {
  dlog(5, "In msWrapperGetBuffered");

  // Chrome 22 doesn't like calling sourceBuffered() before initialization
  // segment gets appended.
  if (!this.msWrapperAppended) return new FakeSourceBufferedRanges();

  var v = this.msWrapperVideo;
  var id = this.msWrapperSourceId;
  if (v.webkitSourceBuffered != null) {
    return v.webkitSourceBuffered(id);
  } else {
    throw "No sourceBuffered";
  }
}

SourceBuffer.prototype.append = function(bytes) {
  dlog(4, "In append");
  var v = this.msWrapperVideo;
  var id = this.msWrapperSourceId;
  if (v.webkitSourceAppend != null) {
    v.webkitSourceAppend(id, bytes);
  } else {
    throw "No sourceAppend";
  }
  this.msWrapperAppended = true;
}

SourceBuffer.prototype.abort = function() {
  dlog(4, "In abort");
  var v = this.msWrapperVideo;
  var id = this.msWrapperSourceId;
  if (v.webkitSourceAbort != null) {
    v.webkitSourceAbort(id);
  } else {
    throw "No sourceAbort";
  }
}

// The 'setTimestampOffset' method of the media element is an extension to the
// MSE-v0.5 spec, which will be implemented on some devices.
// Calling this method is defined to have the same semantics as setting
// the timestampOffset property of the Media Source object in the current spec.
Object.defineProperty(SourceBuffer.prototype, "timestampOffset",
    { get: function() { return this.msWrapperTimestampOffset; }
    , set: function(o) {
        this.msWrapperTimestampOffset = o;
        this.msWrapperVideo.webkitSourceTimestampOffset(this.msWrapperSourceId, o);
      }
    });

Object.defineProperty(SourceBuffer.prototype, "buffered",
    { get: SourceBuffer.prototype.msWrapperGetBuffered
    });

window.MediaSource = MediaSource;
})();
