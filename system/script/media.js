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

function Media() {
    this.PLEX_OPTIONS_PREFIX = "plexOptions-";
    this.PLEX_CURRENT_PREFIX = "plexSelected-";
    this.PLEX_LAST_VIEW_PREFIX = "plexLastView-";

    this.PLEX_VIEW_MODE = "plexViewMode";
    this.menuBarWidth = "60px";
    this.menuFlag = false;
    this.titleScroll;

    this.viewStart = 0;
    this.viewTotal = 0;
    this.viewCount = 60;
    this.viewCurrent = 0;


};

Media.prototype.initialise = function () {
    var self = this;
    this.plex = new PLEX();
    this.cache = "";
    this.section = $.querystring().section;
    this.key = $.querystring().key;

    this.filter = localStorage.getItem(self.PLEX_LAST_VIEW_PREFIX + this.key) ? localStorage.getItem(self.PLEX_LAST_VIEW_PREFIX + this.key) : "all";
    this.filter = $.querystring().filter ? $.querystring().filter : this.filter;
    this.filterKey = $.querystring().filterkey;
    this.query = $.querystring().query;
    this.windowHeight = this.plex.getPlexHeight();
    this.windowWidth = this.plex.getPlexWidth();

    $("#menu a").tooltipster({position: "right"});
    $("#menuFilterView a").tooltipster();
    $("#menuBar").css("left",this.plex.getPadding("L") +"px");
    $("#mediaView").css("left", (61 + Number(this.plex.getPadding("L"))) + "px");


    if (localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "largeText") == "1") {
        $("body").addClass("xlarge");
    }

    this.debug = localStorage.getItem(this.PLEX_OPTIONS_PREFIX + "debug") == "1" ? true : false;


    $(document).keydown(function (event) {
        switch (event.which) {
            case 461:
            case 27:
                event.preventDefault();
                history.back(1);
                break;

            case 33: //Page Up
                break;

            case 34: //Page Down
                break;
        }
    });

    $("#menu a").hover(function () {
        $(this).focus();
    });

    $("#menu a").keydown(function (event) {

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
            if (self.menuFlag) {
                $("#menuFilterContent a:first").focus();
            }
            event.preventDefault();
        }

        // Right Arrow
        if (event.which == 39) {
            if ($(this).data("keyRight")) {
                $($(this).data("keyRight")).focus();
                if (self.menuFlag) {
                    self.hideMenu();
                }
                event.preventDefault();
            }
        }
    });

    switch ($.querystring().action) {
        case "view":
            if (this.section == "channels") {
                $("#filter").hide();
            } else {
                this.loadMenu(this.section, this.key);
            }
            this.view(this.section, this.key, this.filter, this.filterKey);
            break;

        case "search":
            $("#filter").hide();
            this.view(this.section, this.key, "search", this.query);
            break;
    }
};

Media.prototype.toggleMenu = function () {
    if (this.menuFlag) {
        this.hideMenu();
    } else {
        this.showMenu();
    }
};

Media.prototype.showMenu = function () {
    $("#menuBar").css("width", "270px");
    $("#menuFilter").fadeIn();
    this.menuFlag = true;
    $("#menuFilterContent a:first").focus();
};

Media.prototype.hideMenu = function () {
    $("#menuBar").css("width", this.menuBarWidth);
    $("#menuFilter").hide();
    this.menuFlag = false;
};

Media.prototype.loadMenu = function (section, key) {
    var i = 0;
    var self = this;
    this.showLoader("Loading");

    $("#menuFilterContent ul").empty();

    this.plex.getSectionDetails(key, function (xml) {
        //Set title
        $("#applicationWallpaper").css("background-image", "url(" + self.plex.getTranscodedPath($(xml).find("MediaContainer:first").attr("art"), self.windowWidth, self.windowHeight) + ")");

        // Populate section filters
        $("#menuFilterContent ul").empty();
        $("#menuFilterContent ul").append("<li class=\"heading\">Views</li>");
        $(xml).find("Directory[search!='1'][secondary!='1']").each(function (index, item) {
            html = "<li><a href data-key-index=\"" + i++ + "\" data-action=\"view\" data-section=\"" + self.section + "\" data-key=\"" + self.key + "\" data-filter=\"" + $(this).attr("key") + "\">" + $(this).attr("title").replace("By ", "") + "</a></li>";
            $("#menuFilterContent ul").append(html);
        });

        $("#menuFilterContent ul").append("<li class=\"heading\">Filters</li>");
        $(xml).find("Directory[secondary='1']").each(function (index, item) {
            html = "<li><a href data-key-index=\"" + i++ + "\" data-action=\"view\" data-section=\"" + self.section + "\" data-key=\"" + self.key + "\" data-filter=\"" + $(this).attr("key") + "\">" + $(this).attr("title").replace("By ", "") + "</a></li>";
            $("#menuFilterContent ul").append(html);
        });

        //$("#menuFilterContent a, #menuFilterView a").off();

        $("#menuFilterContent a, #menuFilterView a").hover(function () {
            $(this).focus();
        });

        $("#menuFilterView a").keydown(function (event) {

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
        });

        $("#thumbsView").click(function () {
            localStorage.setItem(self.PLEX_VIEW_MODE, "thumbs");
            self.view(self.section, self.key, self.filter, self.filterKey);
            self.hideMenu();
            event.preventDefault();
        });

        $("#listView").click(function () {
            localStorage.setItem(self.PLEX_VIEW_MODE, "list");
            self.view(self.section, self.key, self.filter, self.filterKey);
            self.hideMenu();
            event.preventDefault();
        });

        $("#menuFilterContent a").click(function (event) {
            self.filter = $(this).data("filter");
            localStorage.setItem(self.PLEX_LAST_VIEW_PREFIX + $(this).data("key"), $(this).data("filter"));
            self.view($(this).data("section"), $(this).data("key"), $(this).data("filter"), self.filterKey);
            self.hideMenu();
            event.preventDefault();
        });

        $("#menuFilterContent a").keydown(function (event) {
            var index = $(this).data("keyIndex");
            var up = $(this).parents("#menuFilterContent").find("li a[data-key-index='" + (Number(index) - 1) + "']");
            if ((Number(index) - 1) < 0) {
                up = $("#menuFilterView a:first");
            }
            var down = $(this).parents("#menuFilterContent").find("li a[data-key-index='" + (Number(index) + 1) + "']");

            // Up Arrow
            if (event.which == 38) {
                event.preventDefault();
                up.focus();
            }

            // Down Arrow
            if (event.which == 40) {
                event.preventDefault();
                down.focus();
            }

            // Left Arrow
            if (event.which == 37) {
                event.preventDefault();
                if (self.menuFlag) {
                    self.hideMenu();
                    $("#mediaView a:first").focus();
                }
            }

            // Right Arrow
            if (event.which == 39) {
                event.preventDefault();
                $("#filter").focus();
            }
        });

    });
};

Media.prototype.view = function (section, key, filter, filterKey) {
    this.rowCount = 0;

    var self = this;
    this.showLoader("Loading");
    $("#mediaViewContent ul").empty();

    // Load section content
    self.plex.getSectionMedia(key, filter, filterKey, function (xml) {
        var $container = $(xml).find("MediaContainer:first");
        $("#title").show();
        console.log(filter);
        switch (filter) {
            case "all":
                if (key == "channels") {
                    $("#title").text("Channels");
                } else {
                    $("#title").text($container.attr("title2"));
                }
                break;

            case "search":
                if (filterKey.indexOf("%") > -1) {
                    $("#title").text("Search Results");
                } else {
                    $("#title").text("Results for \"" + filterKey + "\"");
                }
                break;

            default:
                $("#title").text($container.attr("title1") + " - " + $container.attr("title2"));
                break;
        }
        var html = [];
        var i=0;
        $(xml).find("Directory,Video,Photo,Artist,Track").each(function (index, item) {
            if (localStorage.getItem(self.PLEX_VIEW_MODE) == "list") {
                html[i++]= self.plex.getListHtml(index, $(this).attr("title"), self.section, $(this).attr("type"), $(this).attr("key"),
                    {"artist": $(this).attr("parentTitle"),
                        "art": $(this).attr("art"),
                        "series": $(this).attr("grandparentTitle"),
                        "season": $(this).attr("parentIndex"),
                        "episode": $(this).attr("index"),
                        "index": $(this).attr("index"),
                        "year": $(this).attr("year"),
                        "parentKey": $(this).attr("parentKey"),
                        "media": $(this).find("Media Part:first").attr("key"),
                        "lastViewedAt": $(this).attr("lastViewedAt"),
                        "viewOffset": $(this).attr("viewOffset"),
                        "viewCount": $(this).attr("viewCount"),
                        "leafCount": $(this).attr("leafCount"),
                        "viewedLeafCount": $(this).attr("viewedLeafCount"),
                        "filter": self.filter,
                        "sectionKey": key
                    });
            } else {
                html[i++]= self.plex.getThumbHtml(index, $(this).attr("title"), self.section, $(this).attr("type"), $(this).attr("key"),
                    {"thumb": $(this).attr("thumb"),
                        "parentThumb": $(this).attr("parentThumb"),
                        "grandparentThumb": $(this).attr("grandparentThumb"),
                        "art": $(this).attr("art"),
                        "artist": $(this).attr("parentTitle"),
                        "series": $(this).attr("grandparentTitle"),
                        "season": $(this).attr("parentIndex"),
                        "episode": $(this).attr("index"),
                        "index": $(this).attr("index"),
                        "parentKey": $(this).attr("parentKey"),
                        "media": $(this).find("Media Part:first").attr("key"),
                        "lastViewedAt": $(this).attr("lastViewedAt"),
                        "viewOffset": $(this).attr("viewOffset"),
                        "viewCount": $(this).attr("viewCount"),
                        "leafCount": $(this).attr("leafCount"),
                        "viewedLeafCount": $(this).attr("viewedLeafCount"),
                        "filter": self.filter,
                        "sectionKey": key,
                        "containerArt": $(xml).find("MediaContainer:first").attr("art"),
                        "containerThumb": $(xml).find("MediaContainer:first").attr("thumb")
                    });
            }

        });
        $("#mediaViewContent ul").append(html.join(''));

        $(".thumb").lazyload({
            placeholder: 'system/images/poster.png',
            container: $("#mediaViewContent")
        });

        $("#title").fadeOut(8000);
        self.rowCount = self.getRowCount("#mediaViewContent ul li");

        $("#mediaViewContent a").focus(function (event) {
            var item = $(this);
            var left = 0;
            localStorage.setItem(self.PLEX_CURRENT_PREFIX + self.key, $(this).data("key"));

            if (localStorage.getItem(self.PLEX_OPTIONS_PREFIX + "hoverBackdrop") == "1") {
                $("#applicationWallpaper").css("background-image", "url(" + self.plex.getTranscodedPath($(this).data("art"), self.windowWidth, self.windowHeight) + ")");
            }

            if (item.find(".subtitle").length > 0) {
                clearInterval(self.titleScroll);
                self.titleScroll = setInterval(function () {
                    item.find(".subtitle").css("textOverflow", "clip");
                    clearInterval(self.titleScroll);
                    self.titleScroll = setInterval(function () {
                        if (left <= item.find(".subtitle")[0].scrollWidth) {
                            item.find(".subtitle").scrollLeft(left += 2);
                        } else {
                            clearInterval(self.titleScroll);
                        }
                    }, 100);
                }, 1000);
            }
        });

        $("#mediaViewContent a").blur(function (event) {
            clearInterval(self.titleScroll);
            $(this).find(".subtitle").scrollLeft(0);
            $(this).find(".subtitle").css("textOverflow", "ellipsis");
        });

        $("#mediaViewContent a").mouseenter(function (event) {
            $(this).focus();
        });

        $("#mediaViewContent a").click(function (event) {
            event.preventDefault();
            self.showLoader("Loading");
            if ($(this).is("[data-filter]")) {
                url = "./media.html?action=view&section=" + self.section + "&key=" + $(this).data("sectionKey") + "&filter=" + self.filter + "&filterkey=" + encodeURIComponent($(this).data("key"));
            } else {
                url = "./item.html?action=preview&section=" + self.section + "&sectionKey=" + $(this).data("sectionKey") + "&key=" + encodeURIComponent($(this).data("key"));
            }
            $(this).attr("href", url);
            location.href = url;
        });

        // Handle Arrow Key Navigation
        $("#mediaViewContent a").keydown(function (event) {
            var index = $(this).data("key-index");

            var left = (Number(index) % self.rowCount == 0) ? $("#back") : $(this).parents("#mediaView").find("li a[data-key-index='" + (Number(index) - 1) + "']");
            var right = $(this).parents("#mediaView").find("li a[data-key-index='" + (Number(index) + 1) + "']");
            var up = $(this).parents("#mediaView").find("li a[data-key-index='" + (Number(index) - self.rowCount) + "']");
            var down = $(this).parents("#mediaView").find("li a[data-key-index='" + (Number(index) + self.rowCount) + "']");

            // Up Arrow
            if (event.which == 38) {
                event.preventDefault();
                up.focus();
            }

            // Down Arrow
            if (event.which == 40) {
                event.preventDefault();
                down.focus();
            }

            // Left Arrow
            if (event.which == 37) {
                event.preventDefault();
                left.focus();
            }

            // Right Arrow
            if (event.which == 39) {
                event.preventDefault();
                right.focus();
            }

            // Play Button
            if (event.which == 415 || event.which == 80) {
                event.preventDefault();
                if ($(this).data("media") && $(this).data("media") != "undefined") {
                    self.showLoader("Loading");
                    location.href = "player.html?key=" + $(this).data("key") + "&autoplay=true";
                }
            }

        });


        if (localStorage.getItem(self.PLEX_CURRENT_PREFIX + self.key) && $("#mediaView li a[data-key='" + localStorage.getItem(self.PLEX_CURRENT_PREFIX + self.key) + "']:first").length > 0) {
            $("#mediaView li a[data-key='" + localStorage.getItem(self.PLEX_CURRENT_PREFIX + self.key) + "']:first").focus();
        } else {
            if ($("#mediaView li a").length > 0) {
                $("#mediaView li a:first").focus();
            } else {
                $("#mediaViewContent ul").html("<p class=\"centered\">Empty view</p");
                $("#back").focus();
            }
        }
        self.hideLoader();
    });
};

Media.prototype.showLoader = function (message) {
    $("#message").text(message);
    $("#loader").show();
};

Media.prototype.hideLoader = function () {
    $("#loader").hide();
};

Media.prototype.getRowCount = function (query) {
    var row = 0;
    $(query).each(function () {
        if ($(this).prev().length > 0) {
            if ($(this).position().top != $(this).prev().position().top) return false;
            row++;
        } else {
            row++;
        }
    });
    return row;
};

Media.prototype.setDebug = function () {
    var self = this;
    var device = document.getElementById("device");


    timer = setTimeout(function () {
        self.setDebug();
    }, 500);
};