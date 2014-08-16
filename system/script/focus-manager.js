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

var INFINITY = 100000;
var FUDGE = INFINITY;
var DIRECTION_WEIGHT = 2;

function Dir(x, y) {
  this.x = x;
  this.y = y;
};

var LEFT = new Dir(-1, 0);
var UP = new Dir(0, -1);
var RIGHT = new Dir(1, 0);
var DOWN = new Dir(0, 1);

function Rect(left, top, width, height) {
  this.left = left;
  this.top = top;
  this.width = width;
  this.height = height;
  this.right = this.left + this.width - 1;
  this.bottom = this.top + this.height - 1;

  this.valid = function() {
    return this.width != 0  && this.height != 0;
  };

  this.inside = function(x, y) {
    return x >= this.left && x < this.left + this.width &&
        y >= this.top && y < this.top + this.height;
  };

  this.intersect = function(that) {
    return this.inside(that.left, that.top) ||
        this.inside(that.right, that.top) ||
        this.inside(that.left, that.bottom) ||
        this.inside(that.right, that.bottom) ||
        that.inside(this.left, this.top) ||
        that.inside(this.right, this.top) ||
        that.inside(this.left, this.bottom) ||
        that.inside(this.right, this.bottom);
  };

  this.distanceSquared = function(that, dir) {
    var x, y;
    if (dir.x == -1) {
      x = (that.left - this.right) * DIRECTION_WEIGHT;
      y = ((this.top + this.bottom) - (that.top + that.bottom)) / 2;
    } else if (dir.x == 1) {
      x = (this.left - that.right) * DIRECTION_WEIGHT;
      y = ((this.top + this.bottom) - (that.top + that.bottom)) / 2;
    } else if (dir.y == -1) {
      x = ((this.left + this.right) - (that.left + that.right)) / 2;
      y = (that.top - this.bottom) * DIRECTION_WEIGHT;
    } else {
      x = ((this.left + this.right) - (that.left + that.right)) / 2;
      y = (this.top - that.bottom) * DIRECTION_WEIGHT;
    }

    return x * x + y * y;
  };

  // Check if this is strictly at the side (defined by dir) of that, there
  // cannot be any overlap.
  this.atside = function(that, dir) {
    var left, right, top, bottom;
    
    if (dir == LEFT) {
      left = -INFINITY;
      right = that.left - 1;
      top = that.top - FUDGE;
      bottom = that.bottom + FUDGE;
    } else if (dir == RIGHT) {
      left = that.right + 1;
      right = INFINITY;
      top = that.top - FUDGE;
      bottom = that.bottom + FUDGE;
    } else if (dir == UP) {
      left = that.left - FUDGE;
      right = that.right + FUDGE;
      top = -INFINITY;
      bottom = that.top - 1;
    } else {
      left = that.left - FUDGE;
      right = that.right + FUDGE;
      top = that.bottom + 1;
      bottom = INFINITY;
    }

    var rect = new Rect(left, top, right - left, bottom - top);
    var centerX = (this.left + this.right) / 2;
    var centerY = (this.top + this.bottom) / 2;
    return rect.inside(centerX, centerY) && this.intersect(rect);
  };
};

function createRect(element) {
  var offsetLeft = element.offsetLeft;
  var offsetTop = element.offsetTop;
  var e = element.offsetParent;
  while (e && e != document.body) {
    offsetLeft += e.offsetLeft;
    offsetTop += e.offsetTop;
    e = e.offsetParent;
  }
  return new Rect(offsetLeft, offsetTop,
                  element.offsetWidth, element.offsetHeight);
};

function FocusManager() {
  var elements = [];
  var handlers = [];

  var pickElement = function(e, dir) {
    var rect = createRect(e);
    var bestDistanceSquared = INFINITY * INFINITY;
    var bestElement = null;

    for (var i = 0; i < elements.length; ++i) {
      if (elements[i] != e) {
        var r = createRect(elements[i]);
        if (r.valid() && r.atside(rect, dir)) {
          var distanceSquared = r.distanceSquared(rect, dir);
          if (bestElement == null || distanceSquared < bestDistanceSquared) {
            bestElement = elements[i];
            bestDistanceSquared = distanceSquared;
          }
        }
      }
    }

    return bestElement;
  };

  var onkeydown = function(e) {
    if (elements.indexOf(e.target) != -1) {
      var dir;
      if (e.keyCode == 37) {  // left
        dir = LEFT;
      } else if (e.keyCode == 38) {  // up
        dir = UP;
      } else if (e.keyCode == 39) {  // right
        dir = RIGHT;
      } else if (e.keyCode == 40) {  // down
        dir = DOWN;
      } else {
        return true;
      }
      var element = pickElement(e.target, dir);
      if (element) {
        element.focus();
        e.stopPropagation();
        e.preventDefault();
      }
    }

    return true;
  };

  this.add = function(element) {
    if (elements.indexOf(element) == -1) {
      elements.push(element);
      handlers.push(element.addEventListener('keydown', onkeydown));

      if (elements.length == 1)
        element.focus();
    }
  };
};

var focusManager = new FocusManager;

window.getFocusManager = function() {
  return focusManager;
};

window.addEventListener('load', function() {
  var elements = document.getElementsByClassName('focusable');
  for (var i = 0; i < elements.length; ++i)
    focusManager.add(elements[i]);
});

})();
