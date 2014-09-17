﻿/**
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

function PLEX() {
    this.PLEX_SESSION_ID = "plexSessionID";
    this.LG_PLEX_SERVER = "plexServerUrl";
    this.PLEX_OPTIONS_PREFIX = "plexOptions-";
    this.PLEX_WIDTH = "plexWidth";
    this.PLEX_HEIGHT = "plexHeight";
    this.PLEX_USE_MYPLEX = "plexUseMyPlex";
    this.PLEX_AUTHENTICATION_TOKEN = "plexAuthToken";
    this.PLEX_MYPLEX_USERNAME = "plexMyPlexUsername";
    this.PLEX_MYPLEX_PASSWORD = "plexMyPlexPass";;
    this.PLEX_LOCAL_PORT = "plexLocalPort";
    this.PLEX_PADDING_PREFIX="plexPadding_";

    this.X_Plex_Client_Identifier = localStorage.getItem(this.PLEX_SESSION_ID);
    this.X_Plex_Product = "Tivo";
    this.X_Plex_Device = "Tivo";
    this.X_Plex_Platform = "Tivo";
    this.X_Plex_Platform_Version = "7";
    this.X_Plex_Version = "1.2.12";
    this.X_Plex_Device_Name = "Tivo";

    var d = new Date();
    this.time = d.getTime();
};

// Configuration & Settings

PLEX.prototype.isMyPlexEnabled = function(){
    var isMyPlexEnabled = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_USE_MYPLEX);

    if(isMyPlexEnabled!=null && isMyPlexEnabled == "1"){
        return true;
    }
    return false;
};

PLEX.prototype.setMyPlexEnabled = function(enable){
    if(enable) {
        localStorage.setItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_USE_MYPLEX, "1");
    }else{
        localStorage.setItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_USE_MYPLEX, "0");

    }
 };

PLEX.prototype.getPadding =function(side){
    var padding = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_PADDING_PREFIX + side);
    if (padding == null || padding == "null") {
        padding = "0";
        this.setPadding(side, padding);
    }
    return padding;
};

PLEX.prototype.setPadding =function(side, padding){
    localStorage.setItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_PADDING_PREFIX + side ,padding);

};

PLEX.prototype.getPlexHeight = function () {
    var height = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_HEIGHT);
    if (height == null || height == "null") {
        height = window.innerHeight;
        console.log("No Height Set, Setting Height to default: " + height)

        this.setPlexHeight(height);
    }
    //console.log("Window Height is " + height);
    return height;
};

PLEX.prototype.getPlexWidth = function () {
    var width = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_WIDTH);
    if (width == null || width == "null") {
        width = window.innerWidth;
        console.log("No Width Set, Setting Width to default: " + width)
        this.setPlexWidth(width);
    }
   // console.log("Window Width is " + width);
    return width;
};

PLEX.prototype.setPlexHeight = function (height) {
    localStorage.setItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_HEIGHT, height);

};

PLEX.prototype.setPlexWidth = function (width) {
    localStorage.setItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_WIDTH, width);
};

PLEX.prototype.getAvailableBandwidths = function () {
    var bandwidthArray = [
        [0, '480p 2.0Mbps' , '720x480', '60', '2000'],
        [1, '720p 3.0Mbps' , '1280x720', '75', '3000'],
        [2, '720p 4.0Mbps' , '1280x720', '100', '4000']//,
        /* [3, '1080p 8.0Mbps' , '1920x1080', '60', '8000'],
         [4, '1080p 10.0Mbps' , '1920x1080', '75', '10000'],
         [5, '1080p 12.0Mbps' , '1920x1080', '90', '12000'],
         [6, '1080p 20.0Mbps' , '1920x1080', '100', '20000'],
         [7, '1080p 40.0Mbps' , '1920x1080', '100', '40000'];*/
    ];
    return bandwidthArray;
};

PLEX.prototype.setServerUrl = function (url) {
    localStorage.setItem(this.LG_PLEX_SERVER, url);
};

PLEX.prototype.getServerUrl = function () {
     return localStorage.getItem(this.LG_PLEX_SERVER);
};

PLEX.prototype.getServerPort = function () {
    return localStorage.getItem(this.LG_PLEX_SERVER).substr(localStorage.getItem(this.LG_PLEX_SERVER).lastIndexOf(":") + 1);
};

PLEX.prototype.getLocalServerPort = function (){
    if (this.isMyPlexEnabled()) {
        return "32400";
    } else {
        return localStorage.getItem(this.LG_PLEX_SERVER).substr(localStorage.getItem(this.LG_PLEX_SERVER).lastIndexOf(":") + 1);
    }
};

PLEX.prototype.removeServerUrl = function () {
    localStorage.removeItem(this.LG_PLEX_SERVER);
};

PLEX.prototype.getLibraryServer = function (callback) {
    $.get(this.getServerUrl(), callback);
};

PLEX.prototype.checkLibraryServerExists = function (callback, failCallback) {
    $.ajax({url: this.getServerUrl() + "?" +this.getAuthenticationToken(),
        success: callback,
        error: failCallback,
        timeout: 20000
    });
};

PLEX.prototype.scanNetwork = function (ip, callback, failCallback, completedCallback) {
    var url = "";

    for (i = 0; i <= 255; i++) {
        url = "http://" + ip.substr(0, ip.lastIndexOf(".") + 1) + i.toString() + ":32400";
        $.ajax({url: url,
            success: callback,
            error: failCallback,
            complete: completedCallback,
            timeout: 20000
        });
    }
};

PLEX.prototype.getMediaType = function (title, sectionType) {
    switch (sectionType) {
        case "movie":
            if (title.indexOf("Home") > -1) {
                return "home";
            }
            break;
    }

    return sectionType;
};

// Media library functions 
PLEX.prototype.getSections = function (callback) {
    $.get(this.getServerUrl() + "/library/sections?"+ this.getAuthenticationToken(), callback);
};

PLEX.prototype.getSectionDetails = function (key, callback) {
    $.get(this.getServerUrl() + "/library/sections/" + key+ "?" +this.getAuthenticationToken(), callback);
};

PLEX.prototype.getSectionMedia = function (key, filter, filterKey, callback) {
    var jsonCallback = 'callback' + new Date().getTime();
    var self = this;

    if (filterKey) {
        switch (filter) {
            case "folder":
            case "all":
                filter = decodeURIComponent(filterKey);
                if (filter.indexOf("?") > -1) {
                    $.get(this.getServerUrl() + filter + "&X-Plex-Access-Time=" + this.time+ "&" +this.getAuthenticationToken(), callback);
                } else {
                    $.get(this.getServerUrl() + filter + "?X-Plex-Access-Time=" + this.time+ "&" + this.getAuthenticationToken(), callback);
                }
                break;

            case "search":
                $.get(this.getServerUrl() + "/search?query=" + filterKey+ "&" +this.getAuthenticationToken(), callback);
                break;

            default:
                $.get(this.getServerUrl() + "/library/sections/" + key + "/" + filter + "/" + filterKey + "?X-Plex-Access-Time=" + this.time+ "&" +this.getAuthenticationToken(), callback);
                break;
        }
    } else {
        if (key == "channels") {
            self.getChannels(key, callback);
        } else {
            $.get(this.getServerUrl() + "/library/sections/" + key + "/" + filter + "?X-Plex-Access-Time=" + this.time+ "&" + this.getAuthenticationToken(), callback);
        }
    }
};

PLEX.prototype.getRecentlyAdded = function (key, callback) {
    $.get(this.getServerUrl() + "/library/sections/" + key + "/recentlyAdded?X-Plex-Container-Start=0&X-Plex-Container-Size=25&X-Plex-Access-Time=" + this.time+ "&" + this.getAuthenticationToken(), callback);
};

PLEX.prototype.getOnDeck = function (key, callback) {
    $.get(this.getServerUrl() + "/library/onDeck?X-Plex-Container-Start=0&X-Plex-Container-Size=25&X-Plex-Access-Time=" + this.time+"&" + this.getAuthenticationToken(), callback);
};

PLEX.prototype.getChannels = function (key, callback) {
    $.get(this.getServerUrl() + "/channels/all?"+ this.getAuthenticationToken(), callback);
};

//Helper function for main menu
PLEX.prototype.getMediaItems = function (section, key, callback) {
    switch (section) {
        case "ondeck":
            this.getOnDeck(key, callback);
            break;

        case "channels":
            this.getChannels(key, callback);
            break;

        default:
            this.getRecentlyAdded(key, callback);
            break;
    }
};

PLEX.prototype.getMediaMetadata = function (key, callback) {
    if (key.indexOf("?") > -1) {
        $.get(this.getServerUrl() + key + "&X-Plex-Access-Time=" + this.time+ "&" +this.getAuthenticationToken(), callback);
    } else {
        $.get(this.getServerUrl() + key + "?X-Plex-Access-Time=" + this.time+ "&" +this.getAuthenticationToken(), callback);
    }
};

PLEX.prototype.reportProgress = function (key, state, time) {
    console.log("ReportProgress:" + state + " at time:" + time);
    $.get(this.getServerUrl() + "/:/progress?key=" + key + "&identifier=com.plexapp.plugins.library&time=" + Math.round(time * 1000) + "&state=" + state+ "&" +this.getAuthenticationToken(), null);
};

PLEX.prototype.setWatched = function (key, callback) {
    $.get(this.getServerUrl() + "/:/scrobble?key=" + key + "&identifier=com.plexapp.plugins.library"+ "&" +this.getAuthenticationToken(), callback);
};

PLEX.prototype.setUnwatched = function (key, callback) {
    $.get(this.getServerUrl() + "/:/unscrobble?key=" + key + "&identifier=com.plexapp.plugins.library"+ "&" +this.getAuthenticationToken(), callback);
};

PLEX.prototype.setAudioStream = function (partKey, streamKey) {

    $.ajax({
        type: "PUT",
        url: this.getServerUrl() + "/library/parts/" + partKey + "?audioStreamID=" + streamKey+ "&" +this.getAuthenticationToken()
    });
};

PLEX.prototype.setSubtitleStream = function (partKey, streamKey) {
    //console.log(this.getServerUrl() + "/library/parts/" + partKey + "?subtitleStreamID=" + streamKey+ "&" + this.getAuthenticationToken());
    $.ajax({
        type: "PUT",
        url: this.getServerUrl() + "/library/parts/" + partKey + "?subtitleStreamID=" + streamKey + "&" +this.getAuthenticationToken()
    });
};

PLEX.prototype.getTranscodedPath = function (path, width, height, remote) {
    if (remote) {
        return this.getServerUrl() + "/photo/:/transcode?url=" + encodeURIComponent(path) + "&width=" + width + "&height=" + height +"&" + this.getAuthenticationToken();
    } else {
        return this.getServerUrl() + "/photo/:/transcode?url=" + encodeURIComponent("http://localhost:" + this.getLocalServerPort() + path) + "&width=" + width + "&height=" + height + "&" +this.getAuthenticationToken();
    }
};

PLEX.prototype.getTranscodedMediaFlagPath = function (flag, value, width, height) {
    //console.log("thumb url:" + this.getServerUrl() +"/photo/:/transcode?url=" + encodeURIComponent("http://localhost:" + this.getLocalServerPort() + "/system/bundle/media/flags/" + flag + "/" + value + "?t=" + new Date().getTime()) + "&width=" + width + "&height=" + height + "&" +this.getAuthenticationToken());
    return this.getServerUrl() + "/photo/:/transcode?url=" + encodeURIComponent("http://localhost:" + this.getLocalServerPort() + "/system/bundle/media/flags/" + flag + "/" + value + "?t=" + new Date().getTime()) + "&width=" + width + "&height=" + height + "&" +this.getAuthenticationToken();
};


// HTML output functions
PLEX.prototype.getThumbHtml = function (index, title, sectionType, mediaType, key, metadata) {
    var html = "";
    if (sectionType && sectionType.indexOf("home") > -1) {
        mediaType = "home";
    }

    switch (mediaType) {
        case "movie":
            html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" data-media=\"" + metadata.media + "\" href>";
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 128, 190) + "\"></div>";
            if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "titleOverlay") != "1") {
                html += "<div class=\"subtitle alt\">" + title + "</div>";
            }
            ;
            if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "watchedIcons") != "1") {
                html += "<div class=\"watchedStatus\">" + this.getWatchedIconHtml(metadata.lastViewedAt, metadata.viewOffset, metadata.viewCount, metadata.duration) + "</div>";
            }
            html += "</a></li>";
            break;

        case "photo":
            if (metadata.media) {
                html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" data-media=\"" + metadata.media + "\" href>";
            } else {
                html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"folder\" data-art=\"" + metadata.art + "\" data-media=\"" + metadata.media + "\" data-filter=\"" + metadata.filter + "\" href>";
            }
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 300, 190) + "\"></div>";
            html += "<div class=\"subtitle alt\">" + title + "</div>";
            html += "</a></li>";
            break;

        case "home":
            html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" data-media=\"" + metadata.media + "\" href>";
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 190, 190) + "\"></div>";
            html += "<div class=\"subtitle alt\">" + title + "</div>";
            html += "</a></li>";
            break;

        case "episode":
            html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" data-media=\"" + metadata.media + "\" href>";
            if (sectionType && sectionType.indexOf("recent") > -1) {
                html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.grandparentThumb, 300, 190) + "\"></div>";
            } else {
                html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 300, 190) + "\"></div>";
            }
            if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "titleOverlay") != "1") {
                if (metadata.series) {
                    html += "<div class=\"title\">" + metadata.series + "</div>";
                }
                ;
            }
            ;
            html += "<div class=\"subtitle alt\">" + (metadata.season ? metadata.season + "." : "") + metadata.episode + " " + title + "</div>";
            if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "watchedIcons") != "1") {
                html += "<div class=\"watchedStatus\">" + this.getWatchedIconHtml(metadata.lastViewedAt, metadata.viewOffset, metadata.viewCount, metadata.duration) + "</div>";
            }
            html += "</a></li>";
            break;

        case "show":
            html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" href>";
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 128, 190) + "\"></div>";
            if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "titleOverlay") == "0") {
                html += "<div class=\"subtitle alt\">" + title + "</div>";
            }
            ;
            if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "watchedIcons") != "1") {
                html += "<div class=\"watchedStatus watchedCount\">" + (Number(metadata.leafCount) - Number(metadata.viewedLeafCount)) + "</div>";
            }
            html += "</a></li>";
            break;

        case "artist":
            html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" href>";
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 190, 190) + "\"></div>";
            html += "<div class=\"subtitle alt\">" + title + "</div>";
            html += "</a></li>";
            break;

        case "channel":
            html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" href>";
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 128, 190, true) + "\"></div>";
            html += "<div class=\"subtitle alt\">" + title + "</div>";
            html += "</a></li>";
            break;

        case "album":
            html = "<li class=\"media " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-parent-key=\"" + metadata.parentKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" href>";
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath(metadata.thumb, 190, 190) + "\"></div>";
            if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "titleOverlay") != "1") {
                if (metadata.artist) {
                    html += "<div class=\"title\">" + metadata.artist + "</div>";
                }
                ;
            }
            ;
            html += "<div class=\"subtitle alt\">" + title + "</div>";
            html += "</a></li>";
            break;

        case "track":
            html = "<li class=\"" + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-media=\"" + metadata.media + "\" data-duration=\"" + metadata.duration + "\" href>";
            html += "<div class=\"track-title\"><i class=\"glyphicon\"></i>" + metadata.index + ". " + title + "</div>";
            html += "</a></li>";
            break;


        default:
            html = "<li class=\"media " + metadata.filter + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\"";
            html += " data-key=\"" + key + "\" data-section-type=\"" + sectionType + "\" data-section-key=\"" + metadata.sectionKey + "\" data-media-type=\"folder\" data-filter=\"" + metadata.filter + "\" href>";
            html += "<div class=\"thumb\" data-original=\"" + this.getTranscodedPath("/web/img/posters/folder.png", 128, 190) + "\"></div>";
            html += "<div class=\"subtitle\">" + title + "</div>";
            html += "</a></li>";
            break;

    }
    return html;
};

PLEX.prototype.getListHtml = function (index, title, sectionType, mediaType, key, metadata) {
    var html = "";
    if (sectionType && sectionType.indexOf("home") > -1) {
        mediaType = "home";
    }

    switch (mediaType) {
        case "movie":
        case "photo":
        case "home":
        case "episode":
        case "show":
        case "artist":
        case "album":
            html = "<li class=\"list " + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-parent-key=\"" + metadata.parentKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-art=\"" + metadata.art + "\" href>";
            html += "<span class=\"listTitle\">" + title + "</div>";
            if (metadata.year) {
                html += "<span class=\"listYear\">" + metadata.year + this.getWatchedIconHtml(metadata.lastViewedAt, metadata.viewOffset, metadata.viewCount, metadata.duration) + "</div>";
            }
            html += "</a></li>";
            break;

        case "track":
            html = "<li class=\"" + mediaType + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\" data-key=\"" + key + "\" data-section-key=\"" + metadata.sectionKey + "\" data-section-type=\"" + sectionType + "\" data-media-type=\"" + mediaType + "\" data-media=\"" + metadata.media + "\" href>";
            html += "<div class=\"track-title\"><i class=\"glyphicon\"></i>" + metadata.index + ". " + title + "</div>";
            html += "</a></li>";
            break;

        default:
            html = "<li class=\"list " + metadata.filter + "\"><a data-key-index=\"" + index + "\" data-title=\"" + title + "\"";
            html += " data-key=\"" + key + "\" data-section-type=\"" + sectionType + "\" data-section-key=\"" + metadata.sectionKey + "\" data-media-type=\"folder\" data-filter=\"" + metadata.filter + "\" href>";
            html += "<span class=\"title\">" + title + "</div>";
            html += "</a></li>";
            break;

    }
    return html;
};

PLEX.prototype.getMediaHtml = function (title, mediaType, metadata) {
    var html = "<div class=\"" + mediaType + "\">";

    switch (mediaType) {
        case "movie":
            html += "<div class=\"thumb\" style=\"background-image: url('" + this.getTranscodedPath(metadata.art, 350, 350) + "')\"></div>";
            html += "<div class=\"title\">" + title + "</div>";
            if (metadata.year) {
                html += "<div class=\"time\"><span class=\"duration\">" + this.getTimeFromMS(metadata.duration);
                html += this.getWatchedIconHtml(metadata.lastViewedAt, metadata.viewOffset, metadata.viewCount, metadata.duration);
                html += "</span><span class=\"year\">" + metadata.year + "</span></div>";
            }
            if (metadata.tagline) {
                html += "<div class=\"tagline\">" + metadata.tagline + "</div>";
            }
            if (metadata.summary) {
                html += "<div class=\"summary\">" + metadata.summary + "</div>";
            }
            if (metadata.roles && metadata.roles.length > 0) {
                html += "<div class=\"roles\">" + metadata.roles.join(", ") + "</div>";
            }
            if (metadata.genre && metadata.genre.length > 0) {
                html += "<div class=\"genre\">" + metadata.genre.join(", ") + "</div>";
            }
            if (metadata.director) {
                html += "<div class=\"director\">" + metadata.director + "</div>";
            }
            if (metadata.width) {
                html += "<div class=\"resolution\">" + metadata.width + "x" + metadata.height + "</div>";
            }

            if (metadata.studio) {
                html += "<div class=\"studio\"><img src=\"" + this.getTranscodedMediaFlagPath("studio", metadata.studio, 150, 40) + "\"/></div>";
            }
            if (metadata.contentRating) {
                html += "<div class=\"contentRating\"><img src=\"" + this.getTranscodedMediaFlagPath("contentRating", metadata.contentRating, 80, 40) + "\"/></div>";
            }
            break;

        case "photo":
            html = "<div class=\"thumb\" style=\"background-image: url('" + this.getTranscodedPath(metadata.thumb, 350, 350) + "')\"></div>";
            html += "<div class=\"title\">" + title + "</div>";
            if (metadata.year) {
                html += "<div class=\"time\">" + metadata.year + "</div>";
            }
            if (metadata.summary) {
                html += "<div class=\"summary\">" + metadata.summary + "</div>";
            }
            html += "<div class=\"dimensions\">";
            if (metadata.width) {
                html += "<span class=\"width\">" + metadata.width + "</span>";
            }
            if (metadata.height) {
                html += "<span class=\"height\">" + metadata.height + "</span>";
            }
            html += "</div>";
            if (metadata.container) {
                html += "<div class=\"container\">" + metadata.container + "</div>";
            }
            break;

        case "home":
            html = "<div class=\"thumb\" style=\"background-image: url('" + this.getTranscodedPath(metadata.art, 350, 350) + "')\"></div>";
            html += "<div class=\"title\">" + title + "</div>";
            break;

        case "episode":
        case "show":
            html = "<div class=\"thumb\" style=\"background-image: url('" + this.getTranscodedPath(metadata.thumb, 350, 350) + "')\"></div>";
            html += "<div class=\"title\">" + title + "</div>";
            html += "<div class=\"subtitle\">";
            if (metadata.parentIndex) {
                html += "<span class=\"season-n\">" + metadata.parentIndex + "</span>";
            }
            if (metadata.index) {
                html += "<span class=\"episode-n\">" + metadata.index + "</span>";
            }
            html += "</div>";
            if (metadata.grandparentTitle) {
                html += "<div class=\"tagline\">" + metadata.grandparentTitle + "</div>";
            }
            if (metadata.year) {
                html += "<div class=\"time\">" + metadata.year + this.getWatchedIconHtml(metadata.lastViewedAt, metadata.viewOffset, metadata.viewCount, metadata.duration) + "</div>";
            }
            if (metadata.summary) {
                html += "<div class=\"summary\">" + metadata.summary + "</div>";
            }
            if (metadata.contentRating) {
                html += "<div class=\"contentRating\"><img src=\"" + this.getTranscodedMediaFlagPath("contentRating", metadata.contentRating, 80, 40) + "\"/></div>";
            }
            if (metadata.width) {
                html += "<div class=\"resolution\">" + metadata.width + "x" + metadata.height + "</div>";
            }
            //if (metadata.parentThumb) { html += "<div class=\"cover\"><img src=\"" + this.getTranscodedPath(metadata.parentThumb, 150, 150) + "\"/></div>"; }
            break;

        case "artist":
        case "album":
            html = "<div class=\"thumb\" style=\"background-image: url('" + this.getTranscodedPath(metadata.art, 350, 350) + "')\"></div>";
            html += "<div class=\"title\">" + title + "</div>";
            if (metadata.year) {
                html += "<div class=\"time\">" + metadata.year + "</div>";
            }
            if (metadata.artist) {
                html += "<div class=\"artist\">" + metadata.artist + "</div>";
            }
            if (metadata.tracks.length > 0) {
                html += "<div class=\"summary\">" + metadata.tracks.join("<br/>") + "</div>";
            }
            if (metadata.thumb) {
                html += "<div class=\"cover\"><img src=\"" + this.getTranscodedPath(metadata.thumb, 128, 128) + "\"/></div>";
            }
            break;
    }

    html += "</div>";

    return html;
};

PLEX.prototype.getMediaPreviewHtml = function (xml) {
    var mediaItem = $(xml).find("MediaContainer:first").children().first();
    var mediaItemFile = mediaItem.find("Media:first");
    var mediaType = mediaItem.attr("type");
    var audioStream = $(xml).find("Media:first Stream[streamType='2'][selected='1']").length > 0 ? $(xml).find("Media:first Stream[streamType='2'][selected='1']") : $(xml).find("Media:first Stream[streamType='2']:first");
    var subtitleStream = $(xml).find("Media:first Stream[streamType='3'][selected='1']").length > 0 ? $(xml).find("Media:first Stream[streamType='3'][selected='1']") : $(xml).find("Media:first Stream[streamType='3']");

    var html = "<div class=\"" + mediaType + "\">";

    switch (mediaType) {
        case "movie":
            html += "<div class=\"leftColumn\">";
            html += "<div class=\"cover\" style=\"background-image: url('" + this.getTranscodedPath(mediaItem.attr("thumb"), 300, 440) + "')\"></div>";

            html += "<div class=\"media\">";
            if (mediaItemFile.attr("videoResolution")) {
                html += "<img src=\"" + this.getTranscodedMediaFlagPath("videoResolution", mediaItemFile.attr("videoResolution"), 100, 20) + "\"/>";
            }
            if (mediaItemFile.attr("audioCodec")) {
                html += "<img src=\"" + this.getTranscodedMediaFlagPath("audioCodec", mediaItemFile.attr("audioCodec"), 100, 20) + "\"/>";
            }
            if (mediaItemFile.attr("audioChannels")) {
                html += "<img src=\"" + this.getTranscodedMediaFlagPath("audioChannels", mediaItemFile.attr("audioChannels"), 100, 20) + "\"/>";
            }
            html += "</div>";

            html += "</div>";

            html += "<div class=\"rightColumn\">";

            html += "<div class=\"title\">" + mediaItem.attr("title") + "</div>";

            html += "<div class=\"time\">";
            if (mediaItem.attr("duration")) {
                html += "<span class=\"duration\">" + this.getTimeFromMS(mediaItem.attr("duration"));
                html += this.getWatchedIconHtml(mediaItem.attr("lastViewedAt"), mediaItem.attr("viewOffset"), mediaItem.attr("viewCount"), mediaItem.attr("duration"));
                html += "</span>";
            }
            if (mediaItem.attr("year")) {
                html += "<span class=\"year\">" + mediaItem.attr("year") + "</span>";
            }
            html += "</div>";

            if (mediaItem.attr("tagline")) {
                html += "<div class=\"tagline\">" + mediaItem.attr("tagline") + "</div>";
            }
            if (mediaItem.attr("summary")) {
                html += "<div class=\"summary\">" + mediaItem.attr("summary") + "</div>";
            }

            if (mediaItem.find("Genre").length > 0) {
                html += "<div class=\"genre\">" + this.getAttributeList(mediaItem.find("Genre"), "tag", ", ") + "</div>";
            }
            if (mediaItem.find("Director").length > 0) {
                html += "<div class=\"director\">" + mediaItem.find("Director").attr("tag") + "</div>";
            }
            if (mediaItem.find("Role").length > 0) {
                html += "<div class=\"roles\">" + this.getAttributeList(mediaItem.find("Role"), "tag", ", ") + "</div>";
            }

            if (audioStream.length > 0) {
                html += "<div class=\"audio\">" + (audioStream.attr("language") || "Unknown") + " (" + audioStream.attr("codec") + ")</div>";
            }
            if (subtitleStream.length > 0) {
                if (subtitleStream.length == 1 && subtitleStream.attr("selected") != null) {
                    html += "<div class=\"subtitles\">" + subtitleStream.attr("language") + " (" + subtitleStream.attr("format") + ")</div>";
                } else {
                    html += "<div class=\"subtitles\">Disabled</div>";
                }
            }
            if (mediaItemFile.attr("width")) {
                html += "<div class=\"resolution\">" + mediaItemFile.attr("width") + "x" + mediaItemFile.attr("height") + "</div>";
            }

            if (mediaItem.attr("studio")) {
                html += "<div class=\"studio\"><img src=\"" + this.getTranscodedMediaFlagPath("studio", mediaItem.attr("studio"), 300, 40) + "\"/></div>";
            }
            if (mediaItem.attr("contentRating")) {
                html += "<div class=\"contentRating\"><img src=\"" + this.getTranscodedMediaFlagPath("contentRating", mediaItem.attr("contentRating"), 70, 25) + "\"/></div>";
            }

            html += "</div>";
            break;

        case "photo":
            html += "<div class=\"leftColumn\">";
            html += "<div class=\"title\">" + (mediaItem.attr("parentTitle") ? mediaItem.attr("parentTitle") + "/" : "") + mediaItem.attr("title") + "</div>";
            if (mediaItem.attr("year")) {
                html += "<div class=\"time\"><div class=\"year\">" + mediaItem.attr("year") + "</div></div>";
            }
            if (mediaItem.attr("summary")) {
                html += "<div class=\"summary\">" + mediaItem.attr("summary") + "</div>";
            }
            if (mediaItemFile.attr("width")) {
                html += "<div class=\"dimensions\"><span class=\"width\">" + mediaItemFile.attr("width") + "</span></div>";
            }
            if (mediaItemFile.attr("height")) {
                html += "<div class=\"dimensions\"><span class=\"height\">" + mediaItemFile.attr("height") + "</span></div>";
            }
            if (mediaItemFile.attr("container")) {
                html += "<div class=\"container\">" + mediaItemFile.attr("container") + "</div>";
            }
            html += "</div>";

            html += "<div class=\"rightColumn\">";
            html += "<div class=\"cover\">";
            html += "<img class=\"photo\" src=\"" + this.getTranscodedPath(mediaItem.find("Part").attr("key"), 800, 600) + "\"/>";
            html += "</div>";
            html += "</div>";
            break;

        case "album":
            html += "<div class=\"leftColumn\">";
            html += "<div class=\"cover\" style=\"background-image: url('" + this.getTranscodedPath(mediaItem.attr("thumb"), 320, 320) + "')\"></div>";
            html += "<div class=\"title\">" + mediaItem.attr("title") + "</div>";
            html += "<div class=\"time\">";
            if (mediaItem.attr("year")) {
                html += "<span class=\"year\">" + mediaItem.attr("year") + "</span>";
            }
            html += "</div>";

            if (mediaItem.attr("summary")) {
                html += "<div class=\"summary\">" + mediaItem.attr("summary") + "</div>";
            }
            if (mediaItem.find("Genre").length > 0) {
                html += "<div class=\"genre\">" + this.getAttributeList(mediaItem.find("Genre"), "tag", ", ") + "</div>";
            }
            html += "</div>";

            html += "<div class=\"rightColumn\">";
            html += "<div id=\"children\"><ul></ul></div>";
            html += "</div>";
            break;

        case "artist":
            html += "<div class=\"leftColumn\">";
            html += "<div class=\"cover\" style=\"background-image: url('" + this.getTranscodedPath(mediaItem.attr("thumb"), 380, 380) + "')\"></div>";
            html += "<div class=\"title\">" + mediaItem.attr("title") + "</div>";
            if (mediaItem.find("Genre").length > 0) {
                html += "<div class=\"genre\">" + this.getAttributeList(mediaItem.find("Genre"), "tag", ", ") + "</div>";
            }
            if (mediaItem.attr("summary")) {
                html += "<div class=\"summary\">" + mediaItem.attr("summary") + "</div>";
            }
            html += "</div>";

            html += "<div class=\"rightColumn\">";
            html += "<div id=\"children\"><ul></ul></div>";
            html += "</div>";
            break;

        case "show":
        case "season":
            html += "<div class=\"leftColumn\">";
            html += "<div class=\"cover\" style=\"background-image: url('" + this.getTranscodedPath(mediaItem.attr("thumb"), 300, 440) + "')\"></div>";
            if (mediaItem.attr("parentTitle")) {
                html += "<div class=\"title\">" + mediaItem.attr("parentTitle") + "</div>";
            }
            html += "<div class=\"title\">" + mediaItem.attr("title") + "</div>";
            html += "<div class=\"time\">";
            if (mediaItem.attr("duration")) {
                html += "<span class=\"duration\">" + this.getTimeFromMS(mediaItem.attr("duration")) + "</span>";
            }
            if (mediaItem.attr("year")) {
                html += "<span class=\"year\">" + mediaItem.attr("year") + "</span>";
            }
            html += "</div>";
            if (mediaItem.find("Genre").length > 0) {
                html += "<div class=\"genre\">" + this.getAttributeList(mediaItem.find("Genre"), "tag", ", ") + "</div>";
            }
            if (mediaItem.attr("summary")) {
                html += "<div class=\"summary\">" + mediaItem.attr("summary") + "</div>";
            }
            html += "</div>";

            html += "<div class=\"rightColumn\">";
            html += "<div id=\"children\"><ul></ul></div>";
            if (mediaItem.attr("theme")) {
                html += "<div id=\"theme\" data-src=\"" + this.getServerUrl() + mediaItem.attr("theme") + "\"></div>"
            }
            ;
            html += "</div>";
            break;

        case "episode":
            html += "<div class=\"leftColumn\">";
            html += "<div class=\"cover\" style=\"background-image: url('" + this.getTranscodedPath(mediaItem.attr("thumb"), 380, 256) + "')\"></div>";
            html += "<div class=\"media\">";
            if (mediaItemFile.attr("videoResolution")) {
                html += "<img src=\"" + this.getTranscodedMediaFlagPath("videoResolution", mediaItemFile.attr("videoResolution"), 100, 20) + "\"/>";
            }
            if (mediaItemFile.attr("audioCodec")) {
                html += "<img src=\"" + this.getTranscodedMediaFlagPath("audioCodec", mediaItemFile.attr("audioCodec"), 100, 20) + "\"/>";
            }
            if (mediaItemFile.attr("audioChannels")) {
                html += "<img src=\"" + this.getTranscodedMediaFlagPath("audioChannels", mediaItemFile.attr("audioChannels"), 100, 20) + "\"/>";
            }
            html += "</div>";
            html += "</div>";

            html += "<div class=\"rightColumn\">";
            html += "<div class=\"title\">" + mediaItem.attr("title") + "</div>";
            html += "<div class=\"time\">";
            if (mediaItem.attr("duration")) {
                html += "<span class=\"duration\">" + this.getTimeFromMS(mediaItem.attr("duration"));
                html += this.getWatchedIconHtml(mediaItem.attr("lastViewedAt"), mediaItem.attr("viewOffset"), mediaItem.attr("viewCount"), mediaItem.attr("duration"));
                html += "</span>";
            }
            if (mediaItem.attr("year")) {
                html += "<span class=\"year\">" + mediaItem.attr("year") + "</span>";
            }
            html += "</div>";

            if (mediaItem.attr("summary")) {
                html += "<div class=\"summary\">" + mediaItem.attr("summary") + "</div>";
            }

            if (mediaItem.find("Genre").length > 0) {
                html += "<div class=\"genre\">" + this.getAttributeList(mediaItem.find("Genre"), "tag", ", ") + "</div>";
            }
            if (mediaItem.find("Role").length > 0) {
                html += "<div class=\"roles\">" + this.getAttributeList(mediaItem.find("Role"), "tag", ", ") + "</div>";
            }
            if (mediaItem.find("Writer").length > 0) {
                html += "<div class=\"writer\">" + this.getAttributeList(mediaItem.find("Writer"), "tag", ", ") + "</div>";
            }
            if (mediaItem.find("Director").length > 0) {
                html += "<div class=\"director\">" + this.getAttributeList(mediaItem.find("Director"), "tag", ", ") + "</div>";
            }

            if (audioStream.length > 0) {
                html += "<div class=\"audio\">" + (audioStream.attr("language") || "Unknown") + " (" + audioStream.attr("codec") + ")</div>";
            }
            if (subtitleStream.length > 0) {
                if (subtitleStream.length == 1 && subtitleStream.attr("selected") != null) {
                    html += "<div class=\"subtitles\">" + subtitleStream.attr("language") + " (" + subtitleStream.attr("format") + ")</div>";
                } else {
                    html += "<div class=\"subtitles\">Disabled</div>";
                }
            }
            if (mediaItemFile.attr("width")) {
                html += "<div class=\"resolution\">" + mediaItemFile.attr("width") + "x" + mediaItemFile.attr("height") + "</div>";
            }
            html += "</div>";
            break;

        default:

            break;
    }

    html += "</div>";

    return html;
};

PLEX.prototype.getWatchedIconHtml = function (lastViewedAt, viewOffset, viewCount, duration) {
    if (viewCount) {
        return "<span id=\"watchStatus\" class=\"\"></span>";
    }

    if (viewOffset) {
        if (viewOffset / duration > 0.9) {
            return "<span id=\"watchStatus\" class=\"\"></span>";
        } else {
            return "<span id=\"watchStatus\" class=\"unwatched-icon unwatched-partial-icon\"></span>";
        }
    }

    return "<span id=\"watchStatus\" class=\"unwatched-icon unwatched-full-icon\"></span>";
};

PLEX.prototype.getAttributeList = function (nodeList, attribute, join) {
    var list = [];
    nodeList.each(function () {
        list.push($(this).attr(attribute))
    });
    return list.join(join);
};

PLEX.prototype.getTimeFromMS = function (duration) {
    if (!duration) {
        return "";
    }

    var milliseconds = parseInt((duration % 1000) / 100)
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
};

PLEX.prototype.getTimeFromSec = function (duration) {
    if (!duration) {
        return "";
    }

    var milliseconds = parseInt(0)
        , seconds = parseInt((duration) % 60)
        , minutes = parseInt((duration / 60) % 60)
        , hours = parseInt((duration / (60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
};


// Transcoding

PLEX.prototype.getGenericTranscodeUrl = function (key, partKey, options) {
    options = options || {};

    var offset = options.offset || 0;
    var quality = options.quality || 7;
    var format = options.format || 'mpegts';
    var audioCodec = options.audioCodec || 'libfaac'; // AAC: libfaac, MP3: libmp3lame
    var audioBitrate = options.audioBitrate || 128;
    var videoCodec = options.videoCodec || 'libx264'; // H.264: libx264
    var videoBitrate = options.videoBitrate || 3000;

    var url = '/video/:/transcode/generic.' + format + '?';
    url += 'identifier=' + encodeURIComponent('com.plexapp.plugins.library');
    url += '&format=' + format;
    url += '&videoCodec=' + videoCodec + '&videoBitrate=' + videoBitrate;
    url += '&audioCodec=' + audioCodec + '&audioBitrate=' + audioBitrate;
    url += '&size=1280x720';
    url += '&width=1280&height=720';
    url += '&quality=' + quality;
    url += '&fakeContentLength=2000000000';
    url += '&offset=' + offset;
    url += '&key=' + encodeURIComponent('http://127.0.0.1:' + this.getServerPort() + key);
    url += '&url=' + encodeURIComponent('http://127.0.0.1:' + this.getServerPort() + partKey);

    return this.getServerUrl() + url;
};

PLEX.prototype.getHlsTranscodeUrl = function (key, options) {
    options = options || {};

    var path = "http://127.0.0.1:32400" + key;
    var session = localStorage.getItem(this.PLEX_SESSION_ID);
    var mediaIndex = options.mediaIndex || "0";
    var partIndex = options.partIndex || "0";
    var protocol = options.protocol || "hls";
    var offset = options.offset || "0";
    var fastSeek = options.fastSeek || "1";
    var directPlay = options.directPlay || "0";
    var directStream = options.directStream || "1";
    var videoQuality = options.videoQuality || "75";
    var maxVideoBitrate = options.maxVideoBitrate || "3000";
    var subtitleSize = options.subtitleSize || "90";
    var audioBoost = options.audioBoost || "100";
    var videoResolution = options.videoResolution || "1280x720";
    var xmlId = this.X_Plex_Device_Name;
    if (options.frameRate.match(/^24/) || options.frameRate == "NTSC")
        xmlId = xmlId + "_24fps";

    //var url = "/video/:/transcode/universal/start.mpd?";
    var url = "/video/:/transcode/universal/start.m3u8?";
    if (protocol == "http")
        url = "/video/:/transcode/universal/start.ts?";
    url += "path=" + encodeURIComponent(path);
    url += "&mediaIndex=" + mediaIndex;
    url += "&partIndex=" + partIndex;
    url += "&protocol=" + protocol;
    url += "&offset=" + offset;
    url += "&fastSeek=" + fastSeek;
    url += "&directPlay=" + directPlay;
    url += "&directStream=" + directStream;
    url += "&videoQuality=" + videoQuality;
    url += "&maxVideoBitrate=" + maxVideoBitrate;
    url += "&subtitleSize=" + subtitleSize;
    url += "&audioBoost=" + audioBoost;
    url += "&videoResolution=" + videoResolution;
    url += "&videoQuality=" + videoQuality;
    url += "&session=" + session;

    url += "&X-Plex-Client-Identifier=" + this.X_Plex_Client_Identifier;
    url += "&X-Plex-Product=" + xmlId;
    url += "&X-Plex-Device=" + xmlId;
    url += "&X-Plex-Platform=" + xmlId;
    url += "&X-Plex-Platform-Version=" + this.X_Plex_Platform_Version;
    url += "&X-Plex-Version=" + this.X_Plex_Version;
    url += "&X-Plex-Device-Name=" + xmlId;

    console.log("Path" + path +
        "\nSessionID:" + session +
        "\nMediaIndex:" + mediaIndex +
        "\nPartIndex:" + partIndex +
        "\nProtocol:" + protocol +
        "\nOffset:" + offset +
        "\nFastSeek:" + fastSeek +
        "\nDirectPlay:" + directPlay +
        "\nVideoQuality:" + videoQuality +
        "\nMaxVideoBitrate:" + maxVideoBitrate +
        "\nSubtitleSize:" + subtitleSize +
        "\nAudioBoost:" + audioBoost +
        "\nVideoResolution:" + videoResolution);

    return this.getServerUrl() + url + "&" +this.getAuthenticationToken();
};

PLEX.prototype.getTimeline = function (key, state, time, duration) {
    $.ajax({
        type: "GET",
        url: this.getServerUrl() + "/:/timeline?time=" + time + "&duration=" + duration + "&state=" + state + "&key=%2Flibrary%2Fmetadata%2F" + key + "&ratingKey=" + key + "&" +this.getAuthenticationToken(),
        headers: {"X-Plex-Client-Identifier": this.X_Plex_Client_Identifier,
            "X-Plex-Product": this.X_Plex_Product,
            "X-Plex-Device": this.X_Plex_Device,
            "X-Plex-Platform": this.X_Plex_Platform,
            "X-Plex-Platform-Version": this.X_Plex_Platform_Version,
            "X-Plex-Version": this.X_Plex_Version,
            "X-Plex-Device-Name": this.X_Plex_Device_Name
        }
    });
};

PLEX.prototype.ping = function () {
    $.ajax({
        type: "GET",
        url: this.getServerUrl() + "/video/:/transcode/universal/ping?session=" + this.X_Plex_Client_Identifier + "&" +this.getAuthenticationToken(),
        headers: {"X-Plex-Client-Identifier": this.X_Plex_Client_Identifier,
            "X-Plex-Product": this.X_Plex_Product,
            "X-Plex-Device": this.X_Plex_Device,
            "X-Plex-Platform": this.X_Plex_Platform,
            "X-Plex-Platform-Version": this.X_Plex_Platform_Version,
            "X-Plex-Version": this.X_Plex_Version,
            "X-Plex-Device-Name": this.X_Plex_Device_Name
        }
    });
};

PLEX.prototype.resetAuthenticationToken = function(){
    localStorage.removeItem(this.PLEX_AUTHENTICATION_TOKEN);
};

PLEX.prototype.getAuthenticationToken = function(){

    //check whether myplex is enabled
    if(!this.isMyPlexEnabled()){
        return "";
    }

    //check whether we already got the authtoken and return it if we did
    var authToken = localStorage.getItem(this.PLEX_AUTHENTICATION_TOKEN);
    if(authToken !=null && authToken !="null"){
        return "X-Plex-Token=" +authToken;
    }

    var username = this.getUsername();
    var password = this.getPassword();

    //username and password aren't stored properly don't use auth token
    if(username == null || password == null){
        console.log ("not getting auth token");
        return "";
    }

    var token = this.login(username, password);
    if(token == null || token =="" || token =="null"){
        return "";
    }
    localStorage.setItem(this.PLEX_AUTHENTICATION_TOKEN, token);
    return "&X-Plex-Token="  + token;
};

PLEX.prototype.isLoggedIn = function(){
    var authToken = localStorage.getItem(this.PLEX_AUTHENTICATION_TOKEN);
    if(authToken !=null && authToken !="null"){
        return true;
    }
    return false;
};

PLEX.prototype.getUsername=function(){
    var username = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_MYPLEX_USERNAME);
    if(username != null && username !="null" && username !="" ){
        return username;
    }else{
        return null;
    }
};


PLEX.prototype.getPassword=function(){
    var password = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_MYPLEX_PASSWORD);
    if(password != null && password !="null" && password !="" ){
        return password;
    }else{
        return null;
    }
};

PLEX.prototype.setUsername = function(username){
    if(username !=null && username !="null" && username !=""){
        localStorage.setItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_MYPLEX_USERNAME, username);

    }
}

PLEX.prototype.setPassword=function(password){

    if(password != null && password !="null" && password !="" ){

        localStorage.setItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_MYPLEX_PASSWORD, password);
    }
};

PLEX.prototype.getMyPlexServers = function(){
    var authToken = localStorage.getItem(this.PLEX_AUTHENTICATION_TOKEN);
    var url = 'https://my.plexapp.com/pms/servers.xml?auth_token=' + authToken;


    var xhr = new XMLHttpRequest();
    var tokenNode = null;

    xhr.open('GET', url, false);

    xhr.send(null);

    if (xhr.readyState === 4) {

        if (xhr.status >= 200 && xhr.status < 300) {
              //console.log(xhr.responseText);
              var server = $(xhr.responseText).find("Server:first");
              //console.log("url:" + server.attr("address") + " port:" + server.attr("port"));
              return retVal ={
                url: server.attr("address"),
                port: server.attr("port"),
                name: server.attr("name")
              };



        }
    }
    return null;
};


PLEX.prototype.login = function (username, pass) {
    //console.log(username +":" + pass);
    if(username == null || pass ==null){
        console.log("not logging in");
        return null;
    }
    //console.log("User:" + username +" Pass:" + pass);
    var token = username + ':' + pass;
    var encoded = btoa(token);
    var auth = 'Basic ' + encoded;
    var url = 'https://my.plexapp.com/users/sign_in.xml';

    var xhr = new XMLHttpRequest();
    var tokenNode = null;

    xhr.open('POST', url, false);
    xhr.setRequestHeader('Authorization', auth);
    xhr.setRequestHeader('X-Plex-Client-Identifier', this.X_Plex_Client_Identifier);
    xhr.setRequestHeader('X-Plex-Platform', this.X_Plex_Platform);
    //xhr.setRequestHeader('X-Plex-Platform-Version', '');
    xhr.setRequestHeader('X-Plex-Provides', 'player');
    xhr.setRequestHeader('X-Plex-Product', this.X_Plex_Product);
    //xhr.setRequestHeader('X-Plex-Version', '');
    //xhr.setRequestHeader('X-Plex-Device', ''); // TODO: example Beoplay V1
    xhr.send(null);

    if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
            tokenNode = xhr.responseXML.getElementsByTagName('authentication-token')[0];
            //console.log("Token:" + tokenNode.childNodes[0].nodeValue);
        }else{
            if(xhr.status == 401){
                throw "Invalid Username or Password";
            }else{
                throw "Error: HTTP status code: " +xhr.status;
            }

        };
    }
    if(tokenNode == null){
        return null;
    }
    if(tokenNode.childNodes[0].nodeValue !=null) {
        localStorage.setItem(this.PLEX_AUTHENTICATION_TOKEN, tokenNode.childNodes[0].nodeValue);
    }
    return tokenNode.childNodes[0].nodeValue;
};

PLEX.prototype.getSessionID = function () {
    return (Math.random().toString(16)).substr(2) + (Math.random().toString(16)).substr(2);
};
