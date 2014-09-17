/**
 PLEX for LG Media Center

 Copyright 2014 Simon J. Hogan (Sith'ari Consulting)

 Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 file except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software distributed under
 the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions
 and limitations under the License.
 **/

// hls & http protocols have currentTime offset for some reason, this is to workaround it
function currentTime() {
   var video = document.getElementById("v");
   var current = video.currentTime;
   var initial = 0;
   if (typeof video.viewOffset !== 'undefined')
      initial = video.viewOffset;
   if (video.timeOffset > initial)
      current -= (video.timeOffset-initial);
   if (current < initial)
      current = initial;
   return current;
}

function Player() {
    this.PLEX_OPTIONS_PREFIX = "plexOptions-";

    this.directPlay = (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "enableTranscoding") == "1") ? false : true;

    this.position = 0;
    this.speed = 1;
    this.controlTimer = null;
    this.scanStep = 300000;
    this.scanStepRation = 30;
    this.resume = false;

    this.debug = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "debug") == "1" ? true : false;
};

// These used for jump n minutes
Player.prototype.addKey = function (num) {
    var video = this.media;
    // 5 sec timeout for keypad entry
    video.timeout_keypad = new Date().getTime() + 5000;
    if (video.keypad.length >= 3)
        video.keypad = [];
    video.keypad.push(num);
    var message = "";
    for (i = 0; i < video.keypad.length; i++) {
        message += video.keypad[i];
    }
    $("#message").text(message);
    $("#message").show();
}
Player.prototype.getMinutes = function () {
    var video = this.media;
    var mins = 0;
    if (video.timeout_keypad != -1) {
        var multiplier = 1;
        for (i = video.keypad.length - 1; i >= 0; i--) {
            mins += video.keypad[i] * multiplier;
            multiplier *= 10;
        }
    }
    return mins;
}

Player.prototype.onPause = function () {
    var video = this;
    // Go to video info screen when playback has ended instead of just video freeze
    var tolerance = 10; // 10 sec from the end tolerance
    if (Math.abs(video.dur - currentTime()) < tolerance)
        history.back(1);
}

Player.prototype.timeUpdate = function () {
   // This is to workaround offset in currentTime using hls & http protocols
   var initial = 0;
   if (typeof this.viewOffset !== 'undefined')
      initial = this.viewOffset;
   if (this.timeOffset <= initial)
      this.timeOffset = this.currentTime;
}

Player.prototype.initialise = function () {
    var self = this;
    this.plex = new PLEX();
    this.key = $.querystring().key;
    this.media = document.getElementById("v");
    this.media.timeOffset = -1;
    this.subtitleId = $.querystring().subtitleId;
    this.audioId = $.querystring().audioId;
    this.media.timeout_keypad = -1;
    this.media.keypad = new Array();
    this.media.addEventListener("pause", this.onPause, false);
    this.media.addEventListener("timeupdate", this.timeUpdate, false);
    this.windowHeight = this.plex.getPlexHeight();
    this.windowWidth = this.plex.getPlexWidth();
    this.mediaKey = $.querystring().mediaKey;

    //Direct play via standalone player
    if (self.directPlay) {
        if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "standalonePlayer") == "1") {
            this.openMedia(this.key);
        }
    }


    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "largeText") == "1") {
        $("body").addClass("xlarge");
    }


    this.media.onError = function () {
        var error = document.getElementById("v").error;
        $("#message").text("Error: " + error);
        $("#message").show();
    };

    this.progessbar = $("#progressbar-container").progressbar({width: "600px", height: "8px"});

    $("#controls a, .options a").tooltipster();

    $(document).keydown(function (event) {
        if (event.which == 461 || event.which == 27) {
            event.preventDefault();
            history.back(1);
            return;
        }

        if (event.which == 38) { //Up
            self.showControls();
            return;
        }

        if (event.which == 40) { //Down
            self.hideControls();
            return;
        }

        self.showControls();
    });

    $("a").keydown(function () {
        var current = $(this).data("keyIndex");
        var right = Number(current) + 1;
        var left = Number(current) - 1;

        // Left Arrow
        if (event.which == 37) {
            event.preventDefault();
            if ($("a[data-key-index='" + left + "']").is(":visible")) {
                $("a[data-key-index='" + left + "']").focus();
            } else {
                $("a[data-key-index='" + (left - 1) + "']").focus();
            }
        }

        // Right Arrow
        if (event.which == 39) {
            event.preventDefault();
            if ($("a[data-key-index='" + right + "']").is(":visible")) {
                $("a[data-key-index='" + right + "']").focus();
            } else {
                $("a[data-key-index='" + (right + 1) + "']").focus();
            }
        }
    });

    $("#controls a, .options a").hover(function (event) {
        $(this).focus();
    });

    $("#controls a, .options a").focus(function (event) {
        $("#controls a, .options a").removeClass("selected");
        $(this).addClass("selected");
    });

    $(document).mousemove(function (event) {
        self.showControls();
    });

    $("#back").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        history.back(1);
    });

    this.initControls();
    this.showControls();
    this.openMedia(this.key);
};

Player.prototype.getTranscodingOptions = function () {
    var bandwidthArray = this.plex.getAvailableBandwidths();

    var options = {};
    var bandwidth = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "bandwidthSelection");
    if (bandwidth !=null && bandwidth != "null") {
        var bwidthvars = bandwidthArray[Number(bandwidth)];
        options.videoResolution = bwidthvars[2];
        options.videoQuality = bwidthvars[3];
        options.maxVideoBitrate = bwidthvars[4];
    }
    var httpEnabled = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "enableHttpTranscoding");
    console.log("Enable HTTP:" + httpEnabled);
    if (httpEnabled == "1") {
        options.protocol = "http";
    }
    options.frameRate = this.frameRate;
    return options;
};

Player.prototype.openMedia = function (key) {
    var self = this;
    this.key = key;
    this.showLoader("Loading");

    this.plex.getMediaMetadata(this.key, function (xml) {
        self.cache = xml;
        var media = $(xml).find("Media");
        if(media.length > 1){
            if (self.mediaKey !=null && self.mediaKey !="null" && self.mediaKey !=""){
                media = media.eq(Number(self.mediaKey));
            }else{
                media = media.eq(0);
            }
        }

        var container = media.attr("container");
        var vcodec = media.attr("videoCodec");
        var acodec = media.attr("audioCodec");
        // TiVo compatible video gets non-transcoding url
        if ((container == "mp4" || container == "mpegts") && vcodec == "h264" && (acodec == "aac" || acodec == "mp3"))
            self.directUrl = self.plex.getServerUrl() + media.find("Part:first").attr("key");
        else
            self.directUrl = null;
        self.mediaKey = $(xml).find("Video:first").attr("ratingKey");
        self.mediaUrl = media.find("Part:first").attr("key");
        self.viewOffset = $(xml).find("Video:first").attr("viewOffset");
        self.duration = $(xml).find("Video:first").attr("duration");
        self.duration = Number(self.duration) / 1000;
        self.media.dur = self.duration;
        self.aspectRatio = media.attr("aspectRatio");
        self.frameRate = media.attr("videoFrameRate");
        self.setVideoSize(self.media, self.aspectRatio, self.windowHeight, self.windowWidth);

        if (self.directUrl == null) {
            var options = self.getTranscodingOptions();

            self.url = self.plex.getHlsTranscodeUrl(self.key, options);
        } else
            self.url = self.directUrl;
        self.media.setAttribute('src', self.url);
        self.media.load();

        console.log(self.url);
        self.hideLoader();

        if ($.querystring().autoplay == "true") {
            if (self.viewOffset) {
                self.resumeDialog(Number(self.viewOffset));
            } else {
                $("#play").focus();
                self.speed = 1;
                self.play(self.speed);

                if (self.subtitleId != null && self.subtitleId.toString() != "Disabled") {
                    self.enableSubtitles((self.subtitleId));
                } else {
                    self.disableSubtitles();
                }
                //self.setDefaultStreams();
            }
        } else {
            $("#play").focus();
        }
    });
};
Player.prototype.setVideoSize = function (videoElem, aspectRatio, windowHeight, windowWidth) {
    var vidHeight = Math.round(windowWidth / aspectRatio);
    var vidWidth = Math.round(windowHeight * aspectRatio);
    if (vidHeight > windowHeight) {
        videoElem.width = vidWidth;
        videoElem.height = windowHeight;

        //pad the video to center it
        var padding = (windowHeight - vidHeight) / 2;
        if (padding >= 1) { //a bit of a hack so that if the video is close to 720p don't pad
            videoElem.style.paddingTop = padding + "px";
        }

        //pad the video to center it
        padding = (windowWidth - vidWidth) / 2;
        if (padding >= 1) { //a bit of a hack so that if the video is close to 720p don't pad
            videoElem.style.paddingLeft = padding + "px";
        }


    } else if (vidHeight < windowHeight) {
        videoElem.width = windowWidth;
        videoElem.height = vidHeight;

        //pad the video to center it
        var padding = (windowHeight - vidHeight) / 2;
        if (padding >= 1) { //a bit of a hack so that if the video is close to 720p don't pad
            videoElem.style.paddingTop = padding + "px";
        }

        //pad the video to center it
        padding = (windowWidth - vidWidth) / 2;
        if (padding >= 1) { //a bit of a hack so that if the video is close to 720p don't pad
            videoElem.style.paddingLeft = padding + "px";
        }
    }


};

Player.prototype.resumeDialog = function (ms) {
    var self = this;
    self.stopTranscoding();
    var time = this.plex.getTimeFromMS(ms);
    var html = "<a data-key-index=\"100\" id=\"resume\" href=\"\"><span class=\"option\">Resume from " + time + "</span></a>";
    html += "<a data-key-index=\"101\" id=\"start\" href=\"\"><span class=\"option\">Start from beginning</span></a>";
    $("#dialog .content").html(html);

    $("#dialog a").off();

    $("#dialog a").hover(function () {
        $(this).focus();
    });

    $("#resume").click(function () {
        event.preventDefault();
        self.showLoader("Seeking");
        self.media.viewOffset = ms/1000;
        self.seek(ms);
        self.resume = true;
        self.speed = 1;
        self.play(self.speed);
        $("#dialog").hide();
        $("#play").focus();
    });

    $("#start").click(function () {
        event.preventDefault();
        self.media.setAttribute('src', self.url);
        self.media.load();
        self.speed = 1;
        self.play(self.speed);
        self.setDefaultStreams();
        $("#dialog").hide();
        $("#play").focus();
    });

    $("#dialog a").keydown(function () {
        var current = $(this).data("keyIndex");
        var down = Number(current) + 1;
        var up = Number(current) - 1;

        // Up Arrow
        if (event.which == 38) {
            event.stopPropagation();
            event.preventDefault();
            $("a[data-key-index='" + up + "']").focus();
        }

        // Down Arrow
        if (event.which == 40) {
            event.stopPropagation();
            event.preventDefault();
            $("a[data-key-index='" + down + "']").focus();
        }
    });

    $("#dialog").show();
    $("#dialog a:first").focus();
};

Player.prototype.setDefaultStreams = function () {
    /* var defaultSubtitles = $(this.cache).find("Media:first Part:first Stream[streamType='3'][selected='1']");
     if (defaultSubtitles.length > 0) {
     this.enableSubtitles($(defaultSubtitles).attr("key"));


     var defaultLanguage = $(this.cache).find("Media:first Part:first Stream[streamType='2'][selected='1']");
     if (defaultLanguage.length > 0) {
     if ($(defaultLanguage).attr("languageCode")) {
     this.setAudoLanguage($(defaultLanguage).attr("languageCode"), $(defaultLanguage).attr("language"));
     }
     }*/
};

Player.prototype.subtitleDialog = function () {
    var self = this;
    var html = "";
    var i = 0;
    var partKey = $(this.cache).find("Media:first Part:first").attr("id");

    $(this.cache).find("Media:first Stream[streamType='3']").each(function (index, value) {
        i = index;
        html += "<a data-key-index=\"" + (200 + index) + "\" href=\"\" data-part-key=\"" + partKey + "\" data-stream-key=\"" + $(this).attr("id") + "\" data-key=\"" + $(this).attr("key") + "\"><span class=\"option\">" + $(this).attr("language") + " (" + $(this).attr("format") + ") Subtitles</span></a>";
    });
    html += "<a data-key-index=\"" + (200 + i + 1) + "\" href=\"\" data-part-key=\"" + partKey + "\" data-stream-key=\"" + $(this).attr("id") + "\" data-key=\"disabled\"><span class=\"option\">Disable Subtitles</span></a>";
    html += "<a data-key-index=\"" + (200 + i + 2) + "\" href=\"\" data-key=\"close\"><span class=\"option\">Close</span></a>";

    $("#dialog .content").html(html);

    //$("#dialog a").off();

    $("#dialog a").hover(function () {
        $(this).focus();
    });

    $("#dialog a").click(function (event) {
        event.preventDefault();
        switch ($(this).data("key")) {
            case "disabled":
                self.plex.setSubtitleStream($(this).data("partKey"));
                self.disableSubtitles();
                break;

            case "close":
                // Do nothing
                break;

            default:
                self.plex.setSubtitleStream($(this).data("partKey"), $(this).data("streamKey"));
                self.enableSubtitles($(this).data("key"));
                break;
        }

        $("#dialog").hide();
        $("#subtitles").focus();
    });


    $("#dialog a").keydown(function (event) {
        var current = $(this).data("keyIndex");
        var down = Number(current) + 1;
        var up = Number(current) - 1;

        // Up Arrow
        if (event.which == 38) {
            event.stopPropagation();
            event.preventDefault();
            $("a[data-key-index='" + up + "']").focus();
        }

        // Down Arrow
        if (event.which == 40) {
            event.stopPropagation();
            event.preventDefault();
            $("a[data-key-index='" + down + "']").focus();
        }

        if (event.which == 461) {
            event.stopPropagation();
            $("#dialog").hide();
            $("#subtitles").focus();
        }
    });

    $("#dialog").show();
    $("#dialog a:first").focus();
};

Player.prototype.languageDialog = function () {
    var self = this;
    var html = "";
    var i = 0;
    var partKey = $(this.cache).find("Media:first Part:first").attr("id");

    $(this.cache).find("Media:first Stream[streamType='2']").each(function (index, value) {
        i = index;
        html += "<a data-key-index=\"" + (200 + index) + "\" href=\"\" data-part-key=\"" + partKey + "\" data-stream-key=\"" + $(this).attr("id") + "\" data-language-code=\"" + $(this).attr("languageCode") + "\" data-label=\"" + $(this).attr("language") + "\"><span class=\"option\">" + $(this).attr("language") + " (" + $(this).attr("codec") + ") Audio</span></a>";
    });
    html += "<a data-key-index=\"" + (200 + i + 1) + "\" href=\"\" data-part-key=\"" + partKey + "\" data-stream-key=\"" + $(this).attr("id") + "\" data-language-code=\"close\"><span class=\"option\">Close</span></a>";
    $("#dialog .content").html(html);
    $("#dialog a").off();

    $("#dialog a").hover(function () {
        $(this).focus();
    });

    $("#dialog a").click(function (event) {
        event.preventDefault();

        if ($(this).data("languageCode") != "close") {
            self.plex.setAudioStream($(this).data("partKey"), $(this).data("streamKey"));
            self.setAudioLanguage($(this).data("languageCode"), $(this).data("label"));
        }
        $("#dialog").hide();
        $("#language").focus();
    });


    $("#dialog a").keydown(function (event) {
        var current = $(this).data("keyIndex");
        var down = Number(current) + 1;
        var up = Number(current) - 1;

        // Up Arrow
        if (event.which == 38) {
            event.stopPropagation();
            event.preventDefault();
            $("a[data-key-index='" + up + "']").focus();
        }

        // Down Arrow
        if (event.which == 40) {
            event.stopPropagation();
            event.preventDefault();
            $("a[data-key-index='" + down + "']").focus();
        }

        if (event.which == 461) {
            event.stopPropagation();
            $("#dialog").hide();
            $("#language").focus();
        }
    });

    $("#dialog").show();
    $("#dialog a:first").focus();
};

Player.prototype.initControls = function () {
    var self = this;

    $(document).keydown(function (event) {
        if (event.which == 461) { //Back
            event.preventDefault();
            history.back(1);
            return;
        }

        if (event.which >= 48 && event.which <= 57) { // 0-9
            self.addKey(event.which - 48);
            return;
        }

        if (event.which == 19) { //Pause
            if (self.speed == 0) {
                self.speed = 1;
                self.play();
            }
            else {
                self.speed = 0;
                self.pause();
            }
            return;
        }

        if (event.which == 413 || event.which == 405) { //Stop or A
            self.stop();
            return;
        }

        if (event.which == 412) { //Rewind
            self.rewind();
            return;
        }

        if (event.which == 415) { //Play
            self.speed = 1;
            self.play(self.speed);
            return;
        }

        if (event.which == 417) { //Forward
            self.forward();
            return;
        }

        if (event.which == 0 || event.which == 457) { //Info
            self.infoBox();
            return;
        }



        self.showControls();
    });

    $("#play").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.speed = 1;
        self.play(self.speed);
        self.timerControls();
    });

    $("#pause").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        if (self.speed == 0) {
            self.speed = 1;
            self.play();
        }
        else {
            self.speed = 0;
            self.pause();
        }
        self.timerControls();
    });

    $("#stop").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.stop();
        self.timerControls();
    });

    $("#skipBackward").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.rewind();
        self.timerControls();
    });

    $("#skipForward").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.forward();
        self.timerControls();
    });


    $("#subtitles").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.subtitleDialog();
        self.timerControls();
    });

    $("#language").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.languageDialog();
        self.timerControls();
    });

    /*$("#transcode").click(function(event) {
     event.stopPropagation();
     event.preventDefault();
     self.media.data = self.plex.getHlsTranscodeUrl(self.key);
     self.play(1);
     self.timerControls();
     });*/

    $("#info").off("click");
    $("#info").click(function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.infoBox();
        self.timerControls();
    });

    $(document).on("progressClick", function (event) {
        var ms = Math.round(event.percent / 100 * self.media.playTime);
        self.seek(ms);
        $("a.selected").focus();
        self.timerControls();
    });
};

Player.prototype.infoBox = function () {
    var self = this;
    var metadata = $(this.cache).find("Video:first");

    if ($("#infoBox").is(":visible")) {
        $("#infoBox").hide();
    } else {
        var roles = [];
        $(metadata).find("Role").each(function () {
            roles.push($(this).attr("tag"));
        });

        var genre = [];
        $(metadata).find("Genre").each(function () {
            genre.push($(this).attr("tag"));
        });

        $("#infoBox .content").html(self.plex.getMediaHtml(metadata.attr("title"), metadata.attr("type"),
            {"art": metadata.attr("art"),
                "grandparentTitle": metadata.attr("grandparentTitle"),
                "tagline": metadata.attr("tagline"),
                "summary": metadata.attr("summary"),
                "year": metadata.attr("year"),
                "rating": metadata.attr("rating"),
                "director": $(metadata).find("Director:first").attr("tag"),
                "width": $(metadata).find("Media:first").attr("width"),
                "height": $(metadata).find("Media:first").attr("height"),
                "roles": roles,
                "genre": genre,
                "index": metadata.attr("index"),
                "parentIndex": metadata.attr("parentIndex"),
                "duration": metadata.attr("duration")
            }));
        $("#infoBox").show().delay(5000).fadeOut(3000);
    }
};

Player.prototype.play = function (speed) {

    var self = this;
    this.progressCount = 30;
    this.media.play(speed);
    this.timerControls();

    clearInterval(this.timer);
    this.timer = setInterval(function () {
        var pos = (currentTime() / self.duration) * 100;
        self.progessbar.progress(pos);
        if (currentTime()) {
            var c = self.plex.getTimeFromSec(currentTime()).replace(/^00:/, "");
            var d = self.plex.getTimeFromSec(self.duration).replace(/^00:/, "");
            $("#progressTime").text(c + "/" + d);
        }

        self.progressCount++;

        if (self.progressCount >= 30) {
            self.setWatchedStatus(self.mediaKey, self.duration, currentTime());
            self.plex.reportProgress(self.mediaKey, "playing", currentTime());
            self.progressCount = 0;
        }

        var video = self.media;
        // Auto hide numeric skip text
        var date = new Date().getTime();
        if (video.timeout_keypad > 0 && date >= video.timeout_keypad) {
            $("#message").hide();
            video.timeout_keypad = -1;
            video.keypad = [];
        }

        // Hide Seeking message if visible and video is in play state
        if (video.readyState == 4 && $("#loader").is(':visible'))
            self.hideLoader();
    }, 1000);
};

Player.prototype.rewind = function () {
    var pos = Number(currentTime());
    var total = Number(this.duration);
    this.scanStep = Math.round(total / this.scanStepRation);

    // Jump n minutes processing
    var mins = this.getMinutes();
    if (mins > 0) {
        this.scanStep = 60 * mins;
    }

    pos = (pos - this.scanStep) > 0 ? pos - this.scanStep : 0;

    this.showLoader("Seeking");
    this.seek(pos * 1000);

    $("#message").html("<i class=\"glyphicon xlarge rewind\"></i>");
    $("#message").show();
    $("#message").fadeOut(3000);
};

Player.prototype.forward = function () {
    var pos = Number(currentTime());
    var total = Number(this.duration);
    this.scanStep = Math.round(total / this.scanStepRation);

    // Jump n minutes processing
    var mins = this.getMinutes();
    if (mins > 0) {
        this.scanStep = 60 * mins;
    }

    pos = (pos + this.scanStep) < total ? pos + this.scanStep : total - 1;

    this.showLoader("Seeking");
    //this.media.currentTime=pos;
    this.seek(pos * 1000);
    $("#message").html("<i class=\"glyphicon xlarge forward\"></i>");
    $("#message").show();
    $("#message").fadeOut(3000);
};

Player.prototype.pause = function () {
    this.media.pause();
    //$("#play").focus();
    clearInterval(this.timer);
    //onPause();
    this.plex.reportProgress(this.mediaKey, "paused", currentTime());

};

Player.prototype.stopTranscoding = function () {

    var url = this.plex.getServerUrl() + '/video/:/transcode/universal/stop?session=' + this.plex.X_Plex_Client_Identifier;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();
};

Player.prototype.stop = function () {
    //$("#play").focus();
    clearInterval(this.timer);
    this.media.pause();

    this.plex.reportProgress(this.mediaKey, "stopped", currentTime());
    this.plex.getTimeline(this.mediaKey, "stopped", 0, 0);
    if ((this.duration / currentTime()) >= 0.9) {
        this.setWatchedStatus(this.mediaKey, this.duration, currentTime());
        this.plex.reportProgress(this.mediaKey, "stopped", 0);
        this.plex.getTimeline(this.mediaKey, "stopped", 0, 0);
    }

    this.stopTranscoding();
    // Without this timeout the transcoder stop doesn't always work
    setTimeout(function () {
        history.back(1);
    }, 2000);
};

Player.prototype.seek = function (timeMS) {
    console.log("seeking to:" + timeMS);
    if (this.directUrl == null) {
        // Transcoding url
        this.media.pause();
        this.stopTranscoding();

       // Without this timeout the transcoder stop doesn't always work
        setTimeout(function (player) {
           var options = player.getTranscodingOptions();
           options.offset = Math.round(timeMS / 1000);
           var url = player.plex.getHlsTranscodeUrl(player.key, options);
           player.media.setAttribute('src', url);

           player.media.load();
           player.media.play();
           console.log("Seek URL:" + url);
        }, 1000, this);
    } else {
        // Direct play url
        this.media.currentTime = Math.round(timeMS/1000);
    }
};

Player.prototype.enableSubtitles = function (subtitleId) {

    $("#message").html(decodeURI(subtitleId) + " Subtitles On");
    $("#message").show();
    $("#message").fadeOut(3000);

};

Player.prototype.disableSubtitles = function () {
    this.media.subtitleOn = false;
    this.media.subtitle = "";
    $("#message").html("Subtitles Off");
    $("#message").show();
    $("#message").fadeOut(3000);
};

Player.prototype.setAudioLanguage = function (key, label) {
    var code = this.getLanguageCode(key);

    if (code.length > 0) {
        this.media.audioLanguage = code;
        $("#message").html("Audio: " + label + " (" + code + ")");
        $("#message").show();
        $("#message").fadeOut(3000);
    }
};

Player.prototype.toggleControls = function () {
    if ($("#controls").is(':visible')) {
        this.hideControls();
    } else {
        this.showControls();
    }
};

Player.prototype.showControls = function () {
    $("#controls").show();
    $(".options").show();
    this.timerControls();
};

Player.prototype.hideControls = function () {
    $("#controls").fadeOut();
    $(".options").fadeOut();
};

Player.prototype.timerControls = function () {
    var self = this;

    clearInterval(this.controlTimer);
    this.controlTimer = setInterval(function () {
        self.hideControls();
        clearInterval(self.controlTimer);
    }, 8000);
};

Player.prototype.getLanguageCode = function (code) {
    if (code == 'abk') {
        return 'ab';
    }
    ;
    if (code == 'aar') {
        return 'aa';
    }
    ;
    if (code == 'afr') {
        return 'af';
    }
    ;
    if (code == 'alb' || code == 'sqi') {
        return 'sq';
    }
    ;
    if (code == 'amh') {
        return 'am';
    }
    ;
    if (code == 'ara') {
        return 'ar';
    }
    ;
    if (code == 'arg') {
        return 'an';
    }
    ;
    if (code == 'arm' || code == 'hye') {
        return 'hy';
    }
    ;
    if (code == 'asm') {
        return 'as';
    }
    ;
    if (code == 'ave') {
        return 'ae';
    }
    ;
    if (code == 'aym') {
        return 'ay';
    }
    ;
    if (code == 'aze') {
        return 'az';
    }
    ;
    if (code == 'bak') {
        return 'ba';
    }
    ;
    if (code == 'baq' || code == 'eus') {
        return 'eu';
    }
    ;
    if (code == 'bel') {
        return 'be';
    }
    ;
    if (code == 'ben') {
        return 'bn';
    }
    ;
    if (code == 'bih') {
        return 'bh';
    }
    ;
    if (code == 'bis') {
        return 'bi';
    }
    ;
    if (code == 'bos') {
        return 'bs';
    }
    ;
    if (code == 'bre') {
        return 'br';
    }
    ;
    if (code == 'bul') {
        return 'bg';
    }
    ;
    if (code == 'bur' || code == 'mya') {
        return 'my';
    }
    ;
    if (code == 'cat') {
        return 'ca';
    }
    ;
    if (code == 'cha') {
        return 'ch';
    }
    ;
    if (code == 'che') {
        return 'ce';
    }
    ;
    if (code == 'chi' || code == 'zho') {
        return 'zh';
    }
    ;
    if (code == 'chu') {
        return 'cu';
    }
    ;
    if (code == 'chv') {
        return 'cv';
    }
    ;
    if (code == 'cor') {
        return 'kw';
    }
    ;
    if (code == 'cos') {
        return 'co';
    }
    ;
    if (code == 'scr' || code == 'hrv') {
        return 'hr';
    }
    ;
    if (code == 'cze' || code == 'ces') {
        return 'cs';
    }
    ;
    if (code == 'dan') {
        return 'da';
    }
    ;
    if (code == 'div') {
        return 'dv';
    }
    ;
    if (code == 'dut' || code == 'nld') {
        return 'nl';
    }
    ;
    if (code == 'dzo') {
        return 'dz';
    }
    ;
    if (code == 'eng') {
        return 'en';
    }
    ;
    if (code == 'epo') {
        return 'eo';
    }
    ;
    if (code == 'est') {
        return 'et';
    }
    ;
    if (code == 'fao') {
        return 'fo';
    }
    ;
    if (code == 'fij') {
        return 'fj';
    }
    ;
    if (code == 'fin') {
        return 'fi';
    }
    ;
    if (code == 'fre' || code == 'fra') {
        return 'fr';
    }
    ;
    if (code == 'gla') {
        return 'gd';
    }
    ;
    if (code == 'glg') {
        return 'gl';
    }
    ;
    if (code == 'geo' || code == 'kat') {
        return 'ka';
    }
    ;
    if (code == 'ger' || code == 'deu') {
        return 'de';
    }
    ;
    if (code == 'gre' || code == 'ell') {
        return 'el';
    }
    ;
    if (code == 'grn') {
        return 'gn';
    }
    ;
    if (code == 'guj') {
        return 'gu';
    }
    ;
    if (code == 'hat') {
        return 'ht';
    }
    ;
    if (code == 'hau') {
        return 'ha';
    }
    ;
    if (code == 'heb') {
        return 'he';
    }
    ;
    if (code == 'her') {
        return 'hz';
    }
    ;
    if (code == 'hin') {
        return 'hi';
    }
    ;
    if (code == 'hmo') {
        return 'ho';
    }
    ;
    if (code == 'hun') {
        return 'hu';
    }
    ;
    if (code == 'ice' || code == 'isl') {
        return 'is';
    }
    ;
    if (code == 'ido') {
        return 'io';
    }
    ;
    if (code == 'ind') {
        return 'id';
    }
    ;
    if (code == 'ina') {
        return 'ia';
    }
    ;
    if (code == 'ile') {
        return 'ie';
    }
    ;
    if (code == 'iku') {
        return 'iu';
    }
    ;
    if (code == 'ipk') {
        return 'ik';
    }
    ;
    if (code == 'gle') {
        return 'ga';
    }
    ;
    if (code == 'ita') {
        return 'it';
    }
    ;
    if (code == 'jpn') {
        return 'ja';
    }
    ;
    if (code == 'jav') {
        return 'jv';
    }
    ;
    if (code == 'kal') {
        return 'kl';
    }
    ;
    if (code == 'kan') {
        return 'kn';
    }
    ;
    if (code == 'kas') {
        return 'ks';
    }
    ;
    if (code == 'kaz') {
        return 'kk';
    }
    ;
    if (code == 'khm') {
        return 'km';
    }
    ;
    if (code == 'kik') {
        return 'ki';
    }
    ;
    if (code == 'kin') {
        return 'rw';
    }
    ;
    if (code == 'kir') {
        return 'ky';
    }
    ;
    if (code == 'kom') {
        return 'kv';
    }
    ;
    if (code == 'kor') {
        return 'ko';
    }
    ;
    if (code == 'kua') {
        return 'kj';
    }
    ;
    if (code == 'kur') {
        return 'ku';
    }
    ;
    if (code == 'lao') {
        return 'lo';
    }
    ;
    if (code == 'lat') {
        return 'la';
    }
    ;
    if (code == 'lav') {
        return 'lv';
    }
    ;
    if (code == 'lim') {
        return 'li';
    }
    ;
    if (code == 'lin') {
        return 'ln';
    }
    ;
    if (code == 'lit') {
        return 'lt';
    }
    ;
    if (code == 'ltz') {
        return 'lb';
    }
    ;
    if (code == 'mac' || code == 'mkd') {
        return 'mk';
    }
    ;
    if (code == 'mlg') {
        return 'mg';
    }
    ;
    if (code == 'may' || code == 'msa') {
        return 'ms';
    }
    ;
    if (code == 'mal') {
        return 'ml';
    }
    ;
    if (code == 'mlt') {
        return 'mt';
    }
    ;
    if (code == 'glv') {
        return 'gv';
    }
    ;
    if (code == 'mao' || code == 'mri') {
        return 'mi';
    }
    ;
    if (code == 'mar') {
        return 'mr';
    }
    ;
    if (code == 'mah') {
        return 'mh';
    }
    ;
    if (code == 'mol') {
        return 'mo';
    }
    ;
    if (code == 'mon') {
        return 'mn';
    }
    ;
    if (code == 'nau') {
        return 'na';
    }
    ;
    if (code == 'nav') {
        return 'nv';
    }
    ;
    if (code == 'nde') {
        return 'nd';
    }
    ;
    if (code == 'nbl') {
        return 'nr';
    }
    ;
    if (code == 'ndo') {
        return 'ng';
    }
    ;
    if (code == 'nep') {
        return 'ne';
    }
    ;
    if (code == 'sme') {
        return 'se';
    }
    ;
    if (code == 'nor') {
        return 'no';
    }
    ;
    if (code == 'nob') {
        return 'nb';
    }
    ;
    if (code == 'nno') {
        return 'nn';
    }
    ;
    if (code == 'nya') {
        return 'ny';
    }
    ;
    if (code == 'oci') {
        return 'oc';
    }
    ;
    if (code == 'ori') {
        return 'or';
    }
    ;
    if (code == 'orm') {
        return 'om';
    }
    ;
    if (code == 'oss') {
        return 'os';
    }
    ;
    if (code == 'pli') {
        return 'pi';
    }
    ;
    if (code == 'pan') {
        return 'pa';
    }
    ;
    if (code == 'per' || code == 'fas') {
        return 'fa';
    }
    ;
    if (code == 'pol') {
        return 'pl';
    }
    ;
    if (code == 'por') {
        return 'pt';
    }
    ;
    if (code == 'pus') {
        return 'ps';
    }
    ;
    if (code == 'que') {
        return 'qu';
    }
    ;
    if (code == 'roh') {
        return 'rm';
    }
    ;
    if (code == 'rum' || code == 'ron') {
        return 'ro';
    }
    ;
    if (code == 'run') {
        return 'rn';
    }
    ;
    if (code == 'rus') {
        return 'ru';
    }
    ;
    if (code == 'smo') {
        return 'sm';
    }
    ;
    if (code == 'sag') {
        return 'sg';
    }
    ;
    if (code == 'san') {
        return 'sa';
    }
    ;
    if (code == 'srd') {
        return 'sc';
    }
    ;
    if (code == 'scc' || code == 'srp') {
        return 'sr';
    }
    ;
    if (code == 'sna') {
        return 'sn';
    }
    ;
    if (code == 'iii') {
        return 'ii';
    }
    ;
    if (code == 'snd') {
        return 'sd';
    }
    ;
    if (code == 'sin') {
        return 'si';
    }
    ;
    if (code == 'slo' || code == 'slk') {
        return 'sk';
    }
    ;
    if (code == 'slv') {
        return 'sl';
    }
    ;
    if (code == 'som') {
        return 'so';
    }
    ;
    if (code == 'sot') {
        return 'st';
    }
    ;
    if (code == 'spa') {
        return 'es';
    }
    ;
    if (code == 'sun') {
        return 'su';
    }
    ;
    if (code == 'swa') {
        return 'sw';
    }
    ;
    if (code == 'ssw') {
        return 'ss';
    }
    ;
    if (code == 'swe') {
        return 'sv';
    }
    ;
    if (code == 'tgl') {
        return 'tl';
    }
    ;
    if (code == 'tah') {
        return 'ty';
    }
    ;
    if (code == 'tgk') {
        return 'tg';
    }
    ;
    if (code == 'tam') {
        return 'ta';
    }
    ;
    if (code == 'tat') {
        return 'tt';
    }
    ;
    if (code == 'tel') {
        return 'te';
    }
    ;
    if (code == 'tha') {
        return 'th';
    }
    ;
    if (code == 'tib' || code == 'bod') {
        return 'bo';
    }
    ;
    if (code == 'tir') {
        return 'ti';
    }
    ;
    if (code == 'ton') {
        return 'to';
    }
    ;
    if (code == 'tso') {
        return 'ts';
    }
    ;
    if (code == 'tsn') {
        return 'tn';
    }
    ;
    if (code == 'tur') {
        return 'tr';
    }
    ;
    if (code == 'tuk') {
        return 'tk';
    }
    ;
    if (code == 'twi') {
        return 'tw';
    }
    ;
    if (code == 'uig') {
        return 'ug';
    }
    ;
    if (code == 'ukr') {
        return 'uk';
    }
    ;
    if (code == 'urd') {
        return 'ur';
    }
    ;
    if (code == 'uzb') {
        return 'uz';
    }
    ;
    if (code == 'vie') {
        return 'vi';
    }
    ;
    if (code == 'vol') {
        return 'vo';
    }
    ;
    if (code == 'wln') {
        return 'wa';
    }
    ;
    if (code == 'wel' || code == 'cym') {
        return 'cy';
    }
    ;
    if (code == 'fry') {
        return 'fy';
    }
    ;
    if (code == 'wol') {
        return 'wo';
    }
    ;
    if (code == 'xho') {
        return 'xh';
    }
    ;
    if (code == 'yid') {
        return 'yi';
    }
    ;
    if (code == 'yor') {
        return 'yo';
    }
    ;
    if (code == 'zha') {
        return 'za';
    }
    ;
    if (code == 'zul') {
        return 'zu';
    }
    ;

    return code;
}

Player.prototype.setWatchedStatus = function (key, duration, current) {
    if (current / duration > 0.9) {
        this.plex.setWatched(key, null);
    }
};

Player.prototype.showLoader = function (message) {
    $("#loadMessage").text(message);
    $("#loader").show();
};

Player.prototype.hideLoader = function () {
    $("#loader").hide();
};
