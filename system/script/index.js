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

function Menu() {
    this.PLEX_SESSION_ID = "plexSessionID";
    this.PLEX_CURRENT_SECTION = "plexCurrentSection";
    this.PLEX_SERVER_LIST = "plexServerList";
    this.PLEX_CURRENT_PREFIX = "plexHomeSelected-";
    this.PLEX_OPTIONS_PREFIX = "plexOptions-";
    this.PLEX_USE_MYPLEX = "plexUseMyPlex";
    this.PLEX_MYPLEX_USERNAME = "plexMyPlexUsername";
    this.PLEX_MYPLEX_PASSWORD = "plexMyPlexPass";

    this.plex = new PLEX();
    this.cache = "";
    this.toggleActive = false;
    this.titleScroll;
    this.scanErrorCount = 0;
    this.windowHeight = this.plex.getPlexWidth();
    this.windowWidth = this.plex.getPlexHeight();
    this.bandwidthCount = 0;
    var self = this;

    this.bandwidthArray = this.plex.getAvailableBandwidths();

//Set session ID if blank
    if (!localStorage.getItem(this.PLEX_SESSION_ID) || localStorage.getItem(this.PLEX_SESSION_ID) == "") {
        localStorage.setItem(this.PLEX_SESSION_ID, this.plex.getSessionID());
    }


    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "largeText") == "1") {
        $("body").addClass("xlarge");
    }


    //Initialise Mousewheel scrolling
    $("#navigator #sections").mousewheel(function (event) {
        $(this).scrollTop($(this).scrollTop() - (event.deltaY * event.deltaFactor));
        event.preventDefault();
    });

    $("#recentlyAdded .content").mousewheel(function (event) {
        $(this).scrollLeft($(this).scrollLeft() - (event.deltaY * event.deltaFactor));
        event.preventDefault();
    });

    $("#query").focus(function (event) {

    });

    $("#query").blur(function (event) {

    });

    $("#searchForm").submit(function () {

    });

    $("#server").click(function () {
        self.serverSelection();
    });

    $(document).keydown(function (event) {
        // Reset settings - RED button or ( key
        if (event.which == 403 || event.which == 122) {
            if (confirm("Press OK to RESET settings ...")) {
                self.plex.removeServerUrl();
                location.reload();
            }
        }

        if (event.which == 404 || event.which == 123) {
            self.serverSelection();
        }

        if (event.which == 461 || event.which == 27) {
            self.close();
        }
    });

    $("#settings").hide();

    $("#navigatorSwitch").click(function () {
        self.toggleMenu();
    });

    $("#previewClose").click(function () {
        $("#recentlyAdded .content").scrollLeft(0);
        $("#preview").fadeOut();
        $("#navigator #sections a.selected").focus();
    });

};

Menu.prototype.serverSelection = function () {
    var self = this;

    if (localStorage.getItem(this.PLEX_SERVER_LIST) && localStorage.getItem(this.PLEX_SERVER_LIST).length > 0) {
        var servers = localStorage.getItem(this.PLEX_SERVER_LIST).split(",");
        $("#serverSelect").empty();
        $.each(servers, function (index, value) {
            var server = value.split("|");
            $("#serverSelect").append("<a data-key-index=\"" + index + "\"href=\"#\" data-address=\"" + server[1] + "\">" + server[0] + " (" + server[1] + ")</a>");
        });

        $("#serverSelect a").hover(function () {
            $(this).focus();
        });

        $("#serverSelect a").click(function () {
            self.plex.setServerUrl($(this).data("address"));
            location.reload();
        });

        $("#serverSelect a").keydown(function (event) {
            var index = $(this).data("key-index");
            var previous = $(this).parents("#sections, #settings").find("li a[data-key-index='" + (Number(index) - 1) + "']");
            var next = $(this).parents("#sections, #settings").find("li a[data-key-index='" + (Number(index) + 1) + "']");

            // Up Arrow
            if (event.which == 38) {
                event.preventDefault();
                $(this).prev().focus();
            }

            // Down Arrow
            if (event.which == 40) {
                event.preventDefault();
                $(this).next().focus();
            }

            // Back
            if (event.which == 461 || event.which == 27) {
                event.preventDefault();
                $("#serverSelect").hide();
                $("#navigator a.selected").focus();
            }
        });

        $("#serverSelect").show();
        $("#serverSelect a:first").focus();
    }
};

Menu.prototype.initialise = function (focus) {

    var self = this;


    if (this.plex.isMyPlexEnabled()) {

        this.plex.resetAuthenticationToken();

        try {
            this.plex.login(this.plex.getUsername(), this.plex.getPassword());
        } catch (err) {
            console.log("error:" + err);
            localStorage.removeItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_MYPLEX_USERNAME);
            localStorage.removeItem(this.PLEX_OPTIONS_PREFIX + this.PLEX_MYPLEX_PASSWORD);
            //localStorage.removeItem(this.PL)
            location.reload();
        }
        var server = this.plex.getMyPlexServers();

        if (server != null) {
            this.plex.setServerUrl("http://" + server.url + ":" + server.port);

        }
    }


    var pms = this.plex.getServerUrl();


    self.showLoader("Searching");

    //Check PMS Server Set
    if (!pms || !this.isValidUrl(self.plex.getServerUrl())) {

        self.hideLoader();
        this.settingsDialog(true);
        $("#settingsMessage").show();
        $("#settingsMessage").html(settings.language.dialogSettingsValidMessage);
        $("#settingsMessage").fadeOut(5000);
    } else {

        self.plex.checkLibraryServerExists(function (xml) {
            self.showLoader("Loading");
            $("#serverName").text($(xml).find("MediaContainer:first").attr("friendlyName"));

            //Get Sections and Insert into Menu
            self.plex.getSections(function (xml) {
                var i = 0;
                $("#sections ul").empty();

                $(xml).find("Directory").each(function (index, item) {
                    html = "<li><a data-key-index=\"" + index + "\" data-title=\"" + $(this).attr("title") + "\" data-key=\"" + $(this).attr("key") + "\" data-section-type=\"" +
                        $(this).attr("type") + "\" data-art=\"" + self.plex.getTranscodedPath($(this).attr("art"), self.windowWidth, self.windowHeight) + "\" href>" + $(this).attr("title") + "</a></li>";
                    i = index;
                    $("#sections ul").append(html);
                });

                $("#sections ul").append("<li><a data-key-index=\"" + (i + 1) + "\" data-title=\"ondeck\" data-key=\"ondeck\" data-section-type=\"ondeck\" data-art=\"" + self.plex.getTranscodedPath("/:/resources/movie-fanart.jpg", self.windowWidth, self.windowHeight) + "\" href>" + settings.language.sectionOnDeck + "</a></li>");
                //$("#sections ul").append("<li><a data-key-index=\"" + (i+2) + "\" data-title=\"channels\" data-key=\"channels\" data-section-type=\"channels\" data-art=\"" + self.plex.getTranscodedPath("/:/resources/movie-fanart.jpg", self.windowWidth, self.windowHeight) + "\" href>" + settings.language.sectionChannels + "</a></li>");
                $("#sections ul").append("<li><a data-key-index=\"" + (i + 2) + "\" data-title=\"search\" data-key=\"search\" data-section-type=\"search\" data-art=\"" + self.plex.getTranscodedPath("/:/resources/movie-fanart.jpg", self.windowWidth, self.windowHeight) + "\" href>" + settings.language.sectionSearch + "</a></li>");


                // Add Event Handlers
                $("#navigator #sections li a, #settings li a").off();

                $("#navigator #sections li a, #settings li a").focus(function (event) {
                    var link = this;

                    if (!$(this).hasClass("selected")) {
                        $(this).parents("#sections, #settings").find("li a").removeClass("selected");

                        $(".dialog").hide();
                        $("#recentlyAdded").removeClass("show-quick-menu");
                        $("#recentlyAdded").hide();

                        $(this).addClass("selected");

                        var t = setTimeout(function () {
                            if ($(link).hasClass("selected")) {
                                $.event.trigger({
                                    type: "navigationFocus",
                                    title: $(link).data("title"),
                                    key: $(link).data("key"),
                                    sectionType: self.plex.getMediaType($(link).data("title"), $(link).data("sectionType")),
                                    art: $(link).data("art")
                                });
                            }
                        }, 500);
                    }
                });

                $("#navigator #sections li a, #settings li a").hover(function (event) {
                    $(this).focus();
                });

                //Navigation click event handler
                $("#navigator #sections li a, #navigator #settings li a").click(function (event) {
                    $.event.trigger({
                        type: "navigationClick",
                        title: $(this).data("title"),
                        key: $(this).data("key"),
                        sectionType: self.plex.getMediaType($(this).data("title"), $(this).data("sectionType")),
                        art: $(this).data("art")
                    });
                    event.preventDefault();
                });

                // Handle Arrow Key Navigation
                $("#sections a, #settings a").keydown(function (event) {
                    var index = $(this).data("key-index");
                    var previous = $(this).parents("#sections, #settings").find("li a[data-key-index='" + (Number(index) - 1) + "']");
                    var next = $(this).parents("#sections, #settings").find("li a[data-key-index='" + (Number(index) + 1) + "']");

                    // Up Arrow
                    if (event.which == 38) {
                        event.preventDefault();
                        if (Number(index) == 0) {
                            self.serverSelection();
                        }
                        previous.focus();
                    }

                    // Down Arrow
                    if (event.which == 40) {
                        event.preventDefault();
                        next.focus();
                    }

                    // Left Arrow
                    if (event.which == 37) {
                        event.preventDefault();
                        self.toggleMenu();
                    }

                    // Right Arrow - Quick Select
                    if (event.which == 39) {

                        event.preventDefault();
                        $.event.trigger({
                            type: "navigationQuickSelect",
                            title: $(this).data("title"),
                            key: $(this).data("key"),
                            sectionType: self.plex.getMediaType($(this).data("title"), $(this).data("sectionType")),
                            art: $(this).data("art")
                        });
                    }
                });

                self.setClock();
                self.hideLoader();

                if (focus) {
                    $(focus).focus();
                } else {
                    if (localStorage.getItem(self.PLEX_CURRENT_SECTION) && $("#sections li a[data-key='" + localStorage.getItem(self.PLEX_CURRENT_SECTION) + "']:first").length > 0) {
                        $("#sections li a[data-key='" + localStorage.getItem(self.PLEX_CURRENT_SECTION) + "']:first").focus();
                    } else {
                        $("#sections li a:first").focus();
                    }
                }
            });

            $(document).on("navigationQuickSelect", function (event) {
                switch (event.sectionType) {
                    case "settings":
                        $("#scan").focus();
                        break;

                    case "search":
                        $("#query").focus();
                        break;

                    case "options":
                        $("#optionTimeDisplay").focus();
                        break;

                    default:
                        localStorage.setItem(self.PLEX_CURRENT_SECTION, event.key);
                        if ($("#recentlyAdded").hasClass("show-quick-menu")) {
                            $("#recentlyAdded a:first").focus();
                        }
                        break;
                }
            });

            $(document).on("navigationClick", function (event) {
                switch (event.sectionType) {
                    case "quit":
                        self.close();
                        break;

                    case "home":
                    case "movie":
                    case "photo":
                    case "show":
                    case "artist":
                    case "channels":
                        self.showLoader("Loading");
                        location.href = "media.html?action=view&section=" + event.sectionType + "&key=" + event.key;
                        break;

                }
            });

            $(document).on("navigationFocus", function (event) {
                if (event.art) {
                    $("#applicationWallpaper").css("background-image", "url(" + event.art + ")");
                }

                switch (event.sectionType) {
                    case "search":
                        self.quickSearchMenu(event);
                        break;

                    case "settings":
                        self.settingsDialog();
                        break;

                    case "options":
                        self.optionsDialog();
                        break;

                    case "about":
                        $("#about").show();
                        break;

                    case "help":
                        $("#help").show();
                        break;


                    case "home":
                    case "movie":
                    case "photo":
                    case "show":
                    case "artist":
                    case "ondeck":
                    case "channels":
                        localStorage.setItem(self.PLEX_CURRENT_SECTION, event.key);
                        self.quickSelectionMenu(event);
                        break;
                }
            });
        }, function () {
            //Server not found
            self.hideLoader();
            self.settingsDialog(true);
            $("#settingsMessage").show();
            $("#settingsMessage").html(settings.language.dialogSettingsAddressNotFoundMessage);
            $("#settingsMessage").fadeOut(5000);
        });
    }

};

Menu.prototype.quickSearchMenu = function (event) {
    $("#search").fadeIn();

    $("#search input, #search button").keydown(function (event) {

        // Up Arrow
        if (event.which == 38) {
            if ($(this).data("keyUp")) {
                $($(this).data("keyUp")).focus();
                event.preventDefault();
            }
        }

        // Down Arrow
        if (event.which == 40) {
            if ($(this).data("keyDown")) {
                $($(this).data("keyDown")).focus();
                event.preventDefault();
            }
        }

        // Left Arrow
        if (event.which == 37) {
            if ($(this).data("keyLeft")) {
                $($(this).data("keyLeft")).focus();
                event.preventDefault();
            }
        }

        // Right Arrow
        if (event.which == 39) {
            if ($(this).data("keyRight")) {
                $($(this).data("keyRight")).focus();
                event.preventDefault();
            }
        }

        // Back
        if (event.which == 461 || event.which == 27) {
            $("#navigator a.selected").focus();

            event.preventDefault();
            event.stopPropagation();
        }
    });
};

Menu.prototype.quickSelectionMenu = function (event) {
    var self = this;
    var maxItems = 30;

    self.showLoader("Loading");
    //console.log(">>" + event.sectionType);

    self.plex.getMediaItems(event.sectionType, event.key, function (xml) {
        var sectionType = event.sectionType;
        var sectionKey = event.key;
        this.cache = xml;
        var current = this;

        $("#recentlyAdded .content ul").empty();
        var html = "";
        $(xml).find("Directory,Video,Photo").each(function (index, item) {
            if (index < maxItems) {
                html += self.plex.getThumbHtml(index, $(this).attr("title"), sectionType + " recent", $(this).attr("type"), $(this).attr("key"),
                    {"thumb": $(this).attr("thumb"),
                        "parentThumb": $(this).attr("parentThumb"),
                        "grandparentThumb": $(this).attr("grandparentThumb"),
                        "art": $(this).attr("art"),
                        "artist": $(this).attr("parentTitle"),
                        "series": $(this).attr("grandparentTitle"),
                        "season": $(this).attr("parentIndex"),
                        "episode": $(this).attr("index"),
                        "parentKey": $(this).attr("parentKey"),
                        "lastViewedAt": $(this).attr("lastViewedAt"),
                        "viewOffset": $(this).attr("viewOffset"),
                        "duration": $(this).attr("duration"),
                        "viewCount": $(this).attr("viewCount"),
                        "media": $(this).find("Media Part:first").attr("key"),
                        "sectionKey": $(this).attr("librarySectionID") ? $(this).attr("librarySectionID") : sectionKey
                    });

            }
        });
        $("#recentlyAdded .content ul").append(html);
        $("#recentlyAdded").attr("data-current-key", event.key);
        $("#recentlyAdded").show();
        $("#recentlyAdded").addClass("show-quick-menu");

        if (sectionType == "channels") {
            $("#recentlyAdded .name").html(settings.language.sectionChannels);
        } else {
            $("#recentlyAdded .name").html(settings.language.menuRecentlyAdded);
        }

        $("#recentlyAdded a").hover(function () {
            $(this).focus();
        });

        $("#recentlyAdded a").click(function (event) {
            event.preventDefault();
            self.showLoader("Loading");
            url = "./item.html?action=preview&section=" + sectionType + "&sectionKey=" + sectionKey + "&key=" + encodeURIComponent($(this).data("key"));
            $(this).attr("href", url);
            location.href = url;
        });

        $("#recentlyAdded a").focus(function (event) {
            var current = this;
            var item = $(this);
            var left = 0;

            localStorage.setItem(self.PLEX_CURRENT_PREFIX + $(this).data("sectionType"), $(this).data("key"));

            switch ($(this).data("mediaType")) {
                case "album":
                    self.plex.getMediaMetadata($(this).data("key"), function (xml) {
                        var metadata = $(xml).find("MediaContainer:first");

                        var tracks = [];
                        $(metadata).find("Track").each(function () {
                            tracks.push($(this).attr("index") + ". " + $(this).attr("title"))
                        });

                        if ($("#recentlyAdded a:focus").data("key") == $(current).data("key")) {
                            $("#previewContent").html(self.plex.getMediaHtml(metadata.attr("title2"), "album",
                                {"art": metadata.attr("art"),
                                    "thumb": metadata.attr("thumb"),
                                    "artist": metadata.attr("title1"),
                                    "year": metadata.attr("parentYear"),
                                    "tracks": tracks
                                }));
                            //$("#preview").fadeIn();
                        }
                    });
                    break;

                case "episode":
                    self.plex.getMediaMetadata($(this).data("key"), function (xml) {
                        var metadata = $(xml).find("Video:first");

                        if ($("#recentlyAdded a:focus").data("key") == $(current).data("key")) {
                            $("#previewContent").html(self.plex.getMediaHtml(metadata.attr("title"), metadata.attr("type"),
                                {"art": metadata.attr("art"),
                                    "thumb": metadata.attr("thumb"),
                                    "lastViewedAt": metadata.attr("lastViewedAt"),
                                    "viewOffset": metadata.attr("viewOffset"),
                                    "viewCount": metadata.attr("viewCount"),
                                    "duration": metadata.attr("duration"),
                                    "parentThumb": metadata.attr("parentThumb"),
                                    "summary": metadata.attr("summary"),
                                    "grandparentTitle": metadata.attr("grandparentTitle"),
                                    "index": metadata.attr("index"),
                                    "parentIndex": metadata.attr("parentIndex"),
                                    "contentRating": metadata.attr("contentRating"),
                                    "rating": metadata.attr("rating"),
                                    "year": metadata.attr("year")
                                }));
                            //$("#preview").fadeIn();
                        }
                    });
                    break;

                case "movie":
                    self.plex.getMediaMetadata($(this).data("key"), function (xml) {
                        var metadata = $(xml).find("Video:first");

                        var roles = [];
                        $(metadata).find("Role").each(function () {
                            roles.push($(this).attr("tag"))
                        });

                        var genre = [];
                        $(metadata).find("Genre").each(function () {
                            genre.push($(this).attr("tag"))
                        });


                        if ($("#recentlyAdded a:focus").data("key") == $(current).data("key")) {
                            $("#previewContent").html(self.plex.getMediaHtml(metadata.attr("title"), metadata.attr("type"),
                                {"art": metadata.attr("art"),
                                    "thumb": metadata.attr("thumb"),
                                    "lastViewedAt": metadata.attr("lastViewedAt"),
                                    "viewOffset": metadata.attr("viewOffset"),
                                    "viewCount": metadata.attr("viewCount"),
                                    "tagline": metadata.attr("tagline"),
                                    "summary": metadata.attr("summary"),
                                    "studio": metadata.attr("studio"),
                                    "year": metadata.attr("year"),
                                    "rating": metadata.attr("rating"),
                                    "contentRating": metadata.attr("contentRating"),
                                    "director": $(metadata).find("Director:first").attr("tag"),
                                    "roles": roles,
                                    "genre": genre,
                                    "duration": metadata.attr("duration")
                                }));
                            //$("#preview").fadeIn();
                        }
                    });
                    break;

                case "photo":
                    self.plex.getMediaMetadata($(this).data("key"), function (xml) {
                        var metadata = $(xml).find("Photo:first");

                        if ($("#recentlyAdded a:focus").data("key") == $(current).data("key")) {
                            $("#previewContent").html(self.plex.getMediaHtml(metadata.attr("title"), metadata.attr("type"),
                                {"art": metadata.attr("art"),
                                    "thumb": metadata.attr("thumb"),
                                    "summary": metadata.attr("summary"),
                                    "year": metadata.attr("year"),
                                    "width": metadata.find("Media:first").attr("width"),
                                    "height": metadata.find("Media:first").attr("height"),
                                    "container": metadata.find("Media:first").attr("container")
                                }));
                            //$("#preview").fadeIn();
                        }
                    });
                    break

                case "channel":
                    //Do nothing
                    break;

                default:
                    self.plex.getMediaMetadata($(this).data("key"), function (xml) {
                        var metadata = $(xml).find("Directory:first,Video:first,Photo:first,Track:first");

                        if ($("#recentlyAdded a:focus").data("key") == $(current).data("key")) {
                            $("#previewContent").html(self.plex.getMediaHtml(metadata.attr("title"), metadata.attr("type"),
                                {"art": metadata.attr("art"),
                                    "thumb": metadata.attr("thumb"),
                                    "summary": metadata.attr("summary"),
                                    "year": metadata.attr("year")
                                }));
                            //$("#preview").fadeIn();
                        }
                    });
                    break
            }
        });

        //Handle Quick Select Menu Keys
        $("#recentlyAdded a").keydown(function (event) {
            var index = $(this).data("key-index");
            var previous = $(this).parents(".content").find("ul li a[data-key-index='" + (Number(index) - 1) + "']");
            var next = $(this).parents(".content").find("ul li a[data-key-index='" + (Number(index) + 1) + "']");
            var length = $(this).parents(".content").find("ul li").length;
            //console.log(index + " ... " + length + " : " + (index*142-142));
            //console.log($("#recentlyAdded .content").scrollLeft());

            // Left Arrow
            if (event.which == 37) {
                event.preventDefault();
                if (index == 0) {
                    $("#recentlyAdded .content").scrollLeft(0);
                    $("#preview").fadeOut();
                    $("#navigator #sections a.selected").focus();
                }

                if (index < length - 3) {
                    $("#recentlyAdded .content").scrollLeft((index - 2) * 142 - 142);
                }
                previous.focus();
            }

            // Right Arrow - Quick Select
            if (event.which == 39) {
                event.preventDefault();
                if (index >= 2) {
                    $("#recentlyAdded .content").scrollLeft(index * 142 - 142);
                }

                next.focus();
            }

            // Play Button
            if (event.which == 415 || event.which == 80) {
                event.preventDefault();
                if ($(this).data("media") && $(this).data("media") != "undefined") {
                    self.showLoader("Loading");
                    location.href = "player.html?key=" + $(this).data("key") + "&autoplay=true";
                }
            }

            if (event.which == 461 || event.which == 27) {
                event.preventDefault();
                $("#recentlyAdded .content").scrollLeft(0);
                $("#preview").fadeOut();
                $("#navigator #sections a.selected").focus();
            }
        });

        $(".thumb").lazyload({
            threshold: 400,
            placeholder: 'system/images/poster.png',
            container: $("#recentlyAdded .content")
        });

        self.hideLoader();
    });
};

Menu.prototype.resetOptions = function () {
    self = this;

    localStorage.setItem(this.PLEX_OPTIONS_PREFIX + "bandwidthSelection", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "plexWidth", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "plexHeight", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "enableHttpTranscoding", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "time24", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "titleOverlay", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "themeMusic", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "nextEpisode", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "hoverBackdrop", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "watchedIcons", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "largeText", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "debug", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "plexPadding_L", null);
    localStorage.setItem(self.PLEX_OPTIONS_PREFIX + "plexPadding_R", null);

};

Menu.prototype.setCheckOption = function (item, optionName) {
    var icon = $(item).find("i");
    if (icon.hasClass("unchecked")) {
        icon.removeClass("unchecked");
        icon.addClass("check");
        localStorage.setItem(optionName, "1");
    } else {
        icon.removeClass("check");
        icon.addClass("unchecked");
        localStorage.setItem(optionName, "0");
    }
};

Menu.prototype.nextBandwidthOption = function () {
    this.bandwidthCount++;

    var self = this;
    if (this.bandwidthCount >= this.bandwidthArray.length) {
        this.bandwidthCount = 0;
    }
    var bandwidth = this.bandwidthArray[this.bandwidthCount];
    $("#options span#bandwidth").text(bandwidth[1]);
    localStorage.setItem(this.PLEX_OPTIONS_PREFIX + "bandwidthSelection", bandwidth[0]);

};

Menu.prototype.prevBandwidthOption = function () {
    var self = this;
    this.bandwidthCount--;

    if (this.bandwidthCount < 0) {
        this.bandwidthCount = this.bandwidthArray.length - 1;
    }
    var bandwidth = this.bandwidthArray[this.bandwidthCount];
    $("#options span#bandwidth").text(bandwidth[1]);
    localStorage.setItem(this.PLEX_OPTIONS_PREFIX + "bandwidthSelection", bandwidth[0]);

};

Menu.prototype.optionsDialog = function (event) {
    var self = this;

    var leftPad = self.plex.getPadding("L");
    var rightPad = self.plex.getPadding("R");

    $("#options input#lpadEntry").val(leftPad);
    $("#options input#rpadEntry").val(rightPad);

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "bandwidthSelection") != null) {
        var index = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "bandwidthSelection");

        if (index == "null") {
            index = self.bandwidthArray.length - 1;
            localStorage.setItem(this.PLEX_OPTIONS_PREFIX + "bandwidthSelection", this.bandwidthArray[index][0]);
        }
        var bandwidth = this.bandwidthArray[Number(index)];
        $("#options span#bandwidth").text(bandwidth[1]);
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "enableHttpTranscoding") == "1") {
        $("#options a#optionTranscoding i").removeClass("unchecked");
        $("#options a#optionTranscoding i").addClass("check");
    }


    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "time24") == "1") {
        $("#options a#optionTimeDisplay i").removeClass("unchecked");
        $("#options a#optionTimeDisplay i").addClass("check");
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "titleOverlay") == "1") {
        $("#options a#optionTitleOverlays i").removeClass("unchecked");
        $("#options a#optionTitleOverlays i").addClass("check");
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "themeMusic") == "1") {
        $("#options a#optionNoThemeMusic i").removeClass("unchecked");
        $("#options a#optionNoThemeMusic i").addClass("check");
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "nextEpisode") == "1") {
        $("#options a#optionDisableNextEpisodePlay i").removeClass("unchecked");
        $("#options a#optionDisableNextEpisodePlay i").addClass("check");
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "hoverBackdrop") == "1") {
        $("#options a#optionBackdropHover i").removeClass("unchecked");
        $("#options a#optionBackdropHover i").addClass("check");
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "watchedIcons") == "1") {
        $("#options a#optionDisableWatchedIcons i").removeClass("unchecked");
        $("#options a#optionDisableWatchedIcons i").addClass("check");
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "largeText") == "1") {
        $("#options a#optionLargeText i").removeClass("unchecked");
        $("#options a#optionLargeText i").addClass("check");
    }

    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "debug") == "1") {
        $("#options a#optionDebugDetails i").removeClass("unchecked");
        $("#options a#optionDebugDetails i").addClass("check");
    }

    $("#options").show();
    $("#options a").off();
    $("#options a").hover(function () {
        $(this).focus();
    });

    $("#options input#lpadEntry").on("input", function (event) {
        var padding = $("#options input#lpadEntry").val();
        var padNum = Number(padding);
        if (padNum != null && padNum != "NaN" && padNum > 0) {
            $("#options input#lpadEntry").val(padNum);
            self.plex.setPadding("L", padNum);
        } else {
            $("#options input#lpadEntry").val(0);
        }
    });

    $("#options input#rpadEntry").on("input", function (event) {
        var padding = $("#options input#rpadEntry").val();
        var padNum = Number(padding);
        if (padNum != null && padNum != "NaN" && padNum > 0) {
            $("#options input#rpadEntry").val(padNum);
            self.plex.setPadding("R", padNum);
        } else {
            $("#options input#rpadEntry").val(0);
        }
    });

    $("#options a#lpadUp").click(function (event) {
        event.preventDefault();
        value = Number($("#options input#lpadEntry").val());
        value++;
        self.plex.setPadding("L", value);
        $("#options input#lpadEntry").val(self.plex.getPadding("L"));

    });

    $("#options a#resetOptions").click(function (event) {
        //event.preventDefault();
        self.resetOptions();

    });

    $("#options a#lpadDown").click(function (event) {
        event.preventDefault();
        value = Number($("#options input#lpadEntry").val());
        if (value > 0) {
            value--;
        }
        self.plex.setPadding("L", value);
        $("#options input#lpadEntry").val(self.plex.getPadding("L"));
    });

    $("#options a#rpadUp").click(function (event) {
        event.preventDefault();
        value = Number($("#options input#rpadEntry").val());
        value++;
        self.plex.setPadding("R", value);
        $("#options input#rpadEntry").val(self.plex.getPadding("R"));
    });

    $("#options a#rpadDown").click(function (event) {
        event.preventDefault();
        value = Number($("#options input#rpadEntry").val());
        if (value > 0) {
            value--;
        }
        self.plex.setPadding("R", value);
        $("#options input#rpadEntry").val(self.plex.getPadding("R"));
    });

    $("#options a#bandwidthUp").click(function (event) {
        event.preventDefault();
        self.nextBandwidthOption();
    });

    $("#options a#bandwidthDown").click(function (event) {
        event.preventDefault();
        self.prevBandwidthOption();
    });

    $("#options a#optionTranscoding").click(function (event) {
        event.preventDefault();
        console.log("enabling http transcoding");
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "enableHttpTranscoding");
    });


    $("#options a#optionTimeDisplay").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "time24");
    });

    $("#options a#optionTitleOverlays").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "titleOverlay");
    });

    $("#options a#optionNoThemeMusic").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "themeMusic");
    });

    $("#options a#optionDisableNextEpisodePlay").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "nextEpisode");
    });

    $("#options a#optionBackdropHover").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "hoverBackdrop");
    });

    $("#options a#optionDisableWatchedIcons").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "watchedIcons");
    });

    $("#options a#optionLargeText").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "largeText");
        if (localStorage.getItem(self.PLEX_OPTIONS_PREFIX + "largeText") == "1") {
            $("body").addClass("xlarge");
        } else {
            $("body").removeClass("xlarge");
        }
    });

    $("#options a#optionDebugDetails").click(function (event) {
        event.preventDefault();
        self.setCheckOption(this, self.PLEX_OPTIONS_PREFIX + "debug");
    });

    $("#options a").keydown(function (event) {

        // Up Arrow
        if (event.which == 38) {
            if ($(this).data("keyUp")) {
                $($(this).data("keyUp")).focus();
                event.preventDefault();
            }
        }

        // Down Arrow
        if (event.which == 40) {
            if ($(this).data("keyDown")) {
                $($(this).data("keyDown")).focus();
                event.preventDefault();
            }
        }

        // Left Arrow
        if (event.which == 37) {
            if ($(this).data("keyLeft")) {
                $($(this).data("keyLeft")).focus();
                event.preventDefault();
            }
        }

        // Right Arrow
        if (event.which == 39) {
            if ($(this).data("keyRight")) {
                $($(this).data("keyRight")).focus();
                event.preventDefault();
            }
        }

        //Back
        if (event.which == 461 || event.which == 27) {
            $("#navigator a.selected").focus();
            event.preventDefault();
            event.stopPropagation();
        }
    });

};

Menu.prototype.toggleMenu = function () {
    var self = this;

    if (!this.toggleActive) {
        this.toggleActive = true;

        $("#navigator a.selected").addClass("return");
        $("#navigator a.selected").removeClass("selected");

        if ($("#navigator").hasClass("flip")) {
            $("#sections").show();
            $("#navigator").removeClass("flip");
            $("#settings").fadeOut(600, function () {
                if ($("#sections a").hasClass("return")) {
                    $("#sections a.return").focus();
                    $("#sections a.return").removeClass("return");
                } else {
                    $("#sections a:first").focus();
                }
                self.toggleActive = false;
            });
        } else {
            $("#settings").show();
            $("#navigator").addClass("flip");
            $("#sections").fadeOut(600, function () {
                $("#settings a.return").focus();
                $("#settings a.return").removeClass("return");
                self.toggleActive = false;
            });
        }
    }
};

Menu.prototype.myPlexDialog = function (init) {
    var self = this;

    $("#config").fadeOut(1000);
    //$("#myplexdialog").fadeIn(1000);

    $("#myplexdialog").fadeIn(400, function () {
        if (init) {
            $("#signin").focus();
        }
    });
    $("#myplexdialog a#myPlexEnabled").click(function (event) {
        event.preventDefault();


        //remove my plex URL
        self.plex.removeServerUrl();

        //turn off my plex and log out
        self.plex.setMyPlexEnabled(false);
        self.plex.resetAuthenticationToken();
        //remote myplex dialog
        $("#myplexdialog").fadeOut(1000);

        //reset the attributes back since we've logged out of myplex
        $("#signin").text("Sign In");
        $("#username").removeAttr("readonly");
        $("#pass").removeAttr("readonly");
        $("#clear").removeAttr("disabled");
        $("#clear").attr("style", "color: white;");

        //switch to local
        self.settingsDialog(true);


    });
    var username = self.plex.getUsername(); //get username from storage
    var password = self.plex.getPassword(); //get pass from storage

    //as long as username and password retrieved for storage are good, set the text boxes
    if (username != null && password != null) {
        $("#username").val(username);
        $("#pass").val(password);
    }

    //if we are already logged in, set the gui field correctly
    if (self.plex.isLoggedIn()) {

        $("#username").attr("readonly", "readonly");
        $("#pass").attr("readonly", "readonly");
        $("#clear").attr("disabled", "disabled");
        $("#clear").attr("style", "color: grey;");
        $("#signin").text("Sign Out");
    }

    $("#clear").unbind("click").click(function (event) { //we unbind before bind, because of the switching back and forth
        $("#username").val("");                        //between my plex and the local server selection screen
        $("#pass").val("");
        localStorage.removeItem(self.PLEX_OPTIONS_PREFIX + self.PLEX_MYPLEX_USERNAME);
        localStorage.removeItem(self.PLEX_OPTIONS_PREFIX + self.PLEX_MYPLEX_PASSWORD);
    });

    $("#signin").unbind("click").click(function (event) {

        event.stopPropagation();
        event.preventDefault();

        //if we are logged in, "sign out"
        if (self.plex.isLoggedIn()) {
            self.plex.resetAuthenticationToken(); //clear out auth token
            $("#signin").text("Sign In");
            $("#username").removeAttr("readonly");
            $("#pass").removeAttr("readonly");
            $("#clear").removeAttr("disabled");
            $("#clear").attr("style", "color: white;"); //enable clear button

        } else { //we are logged out, so sign in
            var uname = $("#username").val(); //get username from txt box
            var pass = $("#pass").val(); //get pass from txt box

            if (uname != null && uname != "" && pass != null && pass != "") { //only login if the username and password at least seem correct
                $("#pass").attr("readonly", "readonly");
                console.log("Logging in:" + uname);
                try {
                    var authToken = self.plex.login(uname, pass); //login
                } catch (err) {
                    console.log(err);
                    $("#myplexMessage").show();
                    $("#myplexMessage").html(err);
                    $("#myplexMessage").fadeOut(5000);
                    return;
                }
                self.plex.setUsername(uname); //set the username in storage
                self.plex.setPassword(pass); //set the password in storage

                if (authToken != null) { //if we have an auth token, login was successful
                    $("#username").attr("readonly", "readonly");
                    $("#pass").attr("readonly", "readonly");
                    $("#clear").attr("disabled", "disabled");
                    $("#clear").attr("style", "color: grey;");
                    $("#signin").text("Sign Out");

                    location.reload();
                }

            } else {
                $("#myplexMessage").show();
                $("#myplexMessage").html("Please Enter a Username and Password");
                $("#myplexMessage").fadeOut(5000);
            }
        }
    });
    $("#myplexdialog input, #myplexdialog button, #myplexdialog a").unbind("keydown").keydown(function (event) {

        // Up Arrow
        if (event.which == 38) {
            if ($(this).data("keyUp")) {
                if ($($(this).data("keyUp")).attr("readonly") != null) {
                    $("#myPlexEnabled").focus();
                } else {
                    $($(this).data("keyUp")).focus();
                }

                event.preventDefault();
            }
        }

        // Down Arrow
        if (event.which == 40) {

            if ($(this).data("keyDown")) {
                if ($($(this).data("keyDown")).attr("readonly") != null) {
                    $("#signin").focus();
                } else {
                    $($(this).data("keyDown")).focus();
                }
                event.preventDefault();
            }
        }

        // Left Arrow
        if (event.which == 37) {
            if ($(this).data("keyLeft")) {
                $($(this).data("keyLeft")).focus();
                event.preventDefault();
            }
        }

        // Right Arrow
        if (event.which == 39) {
            if ($(this).data("keyRight")) {
                if ($($(this).data("keyRight")).attr("disabled") == null) {
                    $($(this).data("keyRight")).focus();
                }
                event.preventDefault();
            }
        }

        //Back
        if (event.which == 461 || event.which == 27) {
            $("#navigator a.selected").focus();
            event.preventDefault();
            event.stopPropagation();
        }


    });
    if (init) {
        //this.toggleMenu();
        //$("#navigator #settings li a[data-title='Settings'").addClass("selected");
        $("#signin").focus();
    }
};

Menu.prototype.settingsDialog = function (init) {
    var self = this;
    //var device = document.getElementById("device");
    //var ip = device.net_ipAddress;

    if (self.plex.isMyPlexEnabled()) {
        self.myPlexDialog(true);
        return;
    }

    var servers = new Array();

    $("#config").fadeIn(400, function () {
        //if (init) {
        $("#MyPlex").focus();
        //}
    });

    $("#settingsMessage").html("");
    var pms = this.plex.getServerUrl();

    if (pms) {
        $("#pms").val(pms.substr(pms.indexOf("://") + 3));
    }

    $("#save").off();
    //$("#scan").off();

    $("#save").unbind("click").click(function (event) {
        event.preventDefault();
        var pms = $("#pms").val();

        if (pms.indexOf("http") > -1) {
            $("#settingsMessage").show();
            $("#settingsMessage").html(settings.language.dialogSettingsRemoveMessage);
            $("#settingsMessage").fadeOut(5000);
            return false;
        }

        if (pms.indexOf(":") == -1) {
            pms = pms + ":32400";
        }

        self.plex.setServerUrl("http://" + pms);
        location.reload();
    });

    $("#MyPlex").unbind("click").click(function (event) {
        event.preventDefault();
        self.plex.setMyPlexEnabled(true);
        self.myPlexDialog(true);
    });

    /*$("#scan").click(function () {
     event.preventDefault();
     self.scanErrorCount = 0;
     self.scanFoundCount = 0;
     if (!ip) {
     ip = "192.168.0.3";
     }

     self.showLoader("Scanning");
     $("#settingsMessage").html("");
     $("#settingsMessage").show();
     self.plex.scanNetwork(ip, function (xml) {
     self.scanFoundCount++;
     $("#pms").val(this.url.substr(this.url.indexOf("://") + 3));
     servers.push($(xml).find("MediaContainer:first").attr("friendlyName") + "|" + this.url);
     $("#settingsMessage").html(settings.language.dialogSettingsFoundMessage + this.url + " " + $(xml).find("MediaContainer:first").attr("friendlyName"));
     $("#settingsMessage").fadeOut(3000);
     self.showLoader("PMS found");
     }, function () {
     self.scanErrorCount++;
     if (self.scanErrorCount >= 255) {
     $("#settingsMessage").html(settings.language.dialogSettingsNotFoundMessage);
     $("#settingsMessage").fadeOut(3000);
     self.showLoader("Error");
     }
     }, function (xml) {
     localStorage.setItem(self.PLEX_SERVER_LIST, servers.unique().join(","));

     if (servers.unique().length > 1) {
     $("#settingsMessage").html(settings.language.dialogSettingsMultipleMessage);
     $("#settingsMessage").fadeOut(3000);
     }
     self.hideLoader();
     });
     });*/

    $("#config .keypad").unbind("click").click(function (event) {
        var key = $(this).text();
        var pms = $("#pms").val();
        var caret = $("#pms").caret();

        switch ($(this).attr("id")) {
            case "kcl":
                $("#pms").val("");
                break;

            case "kb":
                if (caret > 0) {
                    var chars = $("#pms").val().split("");
                    chars.splice(caret - 1, 1);
                    $("#pms").val(chars.join("").trim());
                    $("#pms").caret(caret - 1);
                    $("#kb").focus();
                }
                break;

            default:
                var chars = $("#pms").val().split("");
                chars.splice(caret, 0, key);
                $("#pms").val(chars.join("").trim());
                $("#pms").caret(caret + 1);
                $(this).focus();
                //$("#pms").val(pms + key);
                break;
        }
        event.preventDefault();
    });

    $("#config input, #config button").unbind("keydown").keydown(function (event) {

        // Up Arrow
        if (event.which == 38) {
            if ($(this).data("keyUp")) {
                $($(this).data("keyUp")).focus();
                event.preventDefault();
            }
        }

        // Down Arrow
        if (event.which == 40) {
            if ($(this).data("keyDown")) {
                $($(this).data("keyDown")).focus();
                event.preventDefault();
            }
        }

        // Left Arrow
        if (event.which == 37) {
            if ($(this).data("keyLeft")) {
                $($(this).data("keyLeft")).focus();
                event.preventDefault();
            }
        }

        // Right Arrow
        if (event.which == 39) {
            if ($(this).data("keyRight")) {
                $($(this).data("keyRight")).focus();
                event.preventDefault();
            }
        }

        //Back
        if (event.which == 461 || event.which == 27) {
            $("#navigator a.selected").focus();
            event.preventDefault();
            event.stopPropagation();
        }
    });

    if (init) {
        //this.toggleMenu();
        //$("#navigator #settings li a[data-title='Settings'").addClass("selected");
        $("#MyPlex").focus();
    }
};

Menu.prototype.setClock = function () {
    var self = this;

    try {
        var device = document.getElementById("device");

        /*if (device.getLocalTime) {
         var now = device.getLocalTime();
         var hours = now.hour;
         var minutes = now.minute;
         var seconds = now.second;
         var ampm = hours >= 12 ? 'PM' : 'AM';
         minutes = minutes < 10 ? '0'+minutes : minutes;
         seconds = seconds < 10 ? '0'+seconds : seconds;

         if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "time24") == "1") {
         $("#clock").text(hours + ':' + minutes + ":" + seconds);
         } else {
         hours = hours % 12;
         hours = hours ? hours : 12; // hour '0' should be '12'
         $("#clock").text(hours + ':' + minutes + ":" + seconds + ' ' + ampm);
         }
         } else {*/
        var now = new Date();
        $("#clock").text(now.toLocaleTimeString());
        //}


    } catch (err) {
        var now = new Date();
        $("#clock").text(now.toLocaleTimeString());
    }
    clock = setTimeout(function () {
        self.setClock();
    }, 500);
};

Menu.prototype.showLoader = function (message) {
    $("#message").text(message);
    $("#loader").show();
};

Menu.prototype.hideLoader = function () {
    $("#loader").hide();
};

Menu.prototype.close = function () {

    window.close();

};

Menu.prototype.isValidUrl = function (s) {
    if (s.length < 14) {
        return false;
    }
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
};

Array.prototype.unique = function () {
    var o = {}, i, l = this.length, r = [];
    for (i = 0; i < l; i += 1) o[this[i]] = this[i];
    for (i in o) r.push(o[i]);
    return r;
};