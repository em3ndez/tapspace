Taaspace.SpaceElement = (function () {
  //
  // Abstract prototype for all objects floating in the space.
  // 
  // Usage
  //   MyElemType.prototype = Taaspace.SpaceElement.create()
  //
  // Animation options
  //   ease (optional, default none)
  //     "in", "out", "in-out", "snap", "none"
  //   duration (optional)
  //       Requires ease to be set.
  //       e.g. "2s"
  //   delay (optional)
  //       Requires ease to be set.
  //       e.g. "2s"
  //   end (optional)
  //       Requires ease to be set.
  //       Function fires when the animation ends.
  //
  var exports = {};
  /////////////////
  
  
  
  // Constructor
  
  var Elem = function () {
    this._space = null;
    
    // HTMLElement wrappend in jQuery object.
    // Represents the SpaceElement.
    this._htmlElement = null;
    
    // For mouse and touch gestures
    this._hammertime = null;
    
    // Location of left top corner in space
    this._x = 0;
    this._y = 0;
    
    // Width in space
    this._w = 0;
    this._h = 0;
    
    // Pivot point
    this._px = 0;
    this._py = 0;
    
    // Events FIXME use minibus
    this._onScaled = [];
    //this._onMoved = [];
    //this._onRotated = [];
    
    // Is animation currently playing.
    // Makes possible to cancel animations.
    this._animation = null;
    
    // Model for movability. Defined in movable().
    this._movable = {};
    
    // Model for scalability. Defined in scalable().
    this._scalable = {};
  };
  
  exports.create = function () {
    return new Elem();
  };
  
  
  
  // Accessors
  
  Elem.prototype.width = function () {
    // Width of the element in space
    // 
    return this._w;
  };
  
  Elem.prototype.height = function () {
    // Height of the element in space
    // 
    return this._h;
  };
  
  Elem.prototype.center = function () {
    // Center point of the element in space
    // 
    return {
      x: this._x + this._w / 2,
      y: this._y + this._h / 2
    };
  };
  
  Elem.prototype.northwest = function () {
    // Top-left point of the element in space
    // 
    return {
      x: this._x,
      y: this._y
    };
  };
  
  Elem.prototype.northeast = function () {
    // Top-right point of the element in space
    // 
    return {
      x: this._x + this._w,
      y: this._y
    };
  };
  
  Elem.prototype.southwest = function () {
    // Bottom-left point of the element in space
    // 
    return {
      x: this._x,
      y: this._y + this._h
    };
  };
  
  Elem.prototype.southeast = function () {
    // Bottom-right point of the element in space
    // 
    return {
      x: this._x + this._w,
      y: this._y + this._h
    };
  };
  
  Elem.prototype.box = function () {
    // Bounding box of the element in the space.
    // 
    // Return
    //   {x0, y0, x1, y1}
    // 
    return {
      x0: this._x,
      y0: this._y,
      x1: this._x + this._w,
      y1: this._y + this._h
    };
  };
  
  Elem.prototype.area = function () {
    // Area of the box of the element in the space.
    // 
    // Return
    //   Number
    //     SpaceUnit^2
    // 
    return this._w * this._h;
  };
  
  Elem.prototype.visibilityRatio = function () {
    // See Viewport.visibilityRatioOf
    return this._space.getViewport().visibilityRatioOf(this);
  };
  
  Elem.prototype.distanceRatio = function () {
    // See Viewport.distanceRatioOf
    return this._space.getViewport().distanceRatioOf(this);
  };
  
  Elem.prototype.focusRatio = function () {
    // See Viewport.focusRatioOf
    return this._space.getViewport().focusRatioOf(this);
  };
  
  Elem.prototype.isInside = function (box) {
    // Return
    //   true
    //     if obj inside given box
    //   false
    //     otherwise
    // 
    // Priority
    //   low
    throw 'Not implemented';
  };
  
  Elem.prototype.isOutside = function (rect) {
    // Return
    //   true
    //     if obj outside given rectangle
    //   false
    //     otherwise
    // 
    // Priority
    //   low
    throw 'Not implemented';
  };
  
  
  
  // Mutators
  
  Elem.prototype.pivot = function (x, y) {
    // Set or get the pivot point.
    // Move the point to moveTo, scale in and rotate around.
    // Does not move the view in relation to the space origo.
    // 
    // Parameter
    //   x
    //   y
    // 
    // Parameter (Alternative)
    //   xy
    //     Place for new pivot in space units.
    // 
    // Return
    //   xy of the current pivot
    //     if no new pivot specified.
    //   this
    //     if new pivot specified.
    // 
    if (typeof x === 'object') {
      y = x.y;
      x = x.x;
    } else {
      if (typeof x === 'undefined') {
        return {x: this._px, y: this._py};
      } // else
    }
    
    // Update the pivot
    this._px = x;
    this._py = y;
    
    return this;
  };
  
  Elem.prototype.size = function (width, height) {
    // Parameter
    //   width
    //     in space
    //   height
    //     in space
    // 
    // Parameter (Alternative)
    //   wh
    //     {width: <width_in_space>, height: <height_in_space>}
    // 
    // Parameter (Alternative)
    //   <nothing>
    //     Returns the current {width, height} of the element
    // 
    // Return
    //   {width, height} if no parameters
    //  OR
    //   this for chaining
    
    // Normalize parameters
    if (typeof width === 'object') {
      this._w = width.width;
      this._h = width.height;
    } else if (typeof width === 'undefined') {
      return {
        width: this._w,
        height: this._h
      };
    } else if (typeof height === 'undefined') {
      // Missing height
      this._w = width;
    } else {
      this._w = width;
      this._h = height;
    }
    
    this._scaleHtmlElement();
    
    return this;
  };
  
  Elem.prototype.scale = function (multiplier, options) {
    // Resize the element so that pivot does not move.
    // 
    // Parameter
    //   multiplier
    //     Scaling factor. 2 doubles, 0.5 halves.
    //   options
    //     See Animation Options
    // 
    // Option
    //   disableHtmlUpdate
    // 
    // Return
    //   this
    //     for chaining

    
    // Normalize params
    if (typeof options === 'undefined') {
      options = {};
    }
    
    // Pivot in relation to element before scaling
    var px0 = (this._px - this._x);
    var py0 = (this._py - this._y);
    
    // Scaling
    this._w *= multiplier;
    this._h *= multiplier;
    
    // Pivot in relation to element after scaling
    var px1 = px0 * multiplier;
    var py1 = py0 * multiplier;
    
    // Move element so that the pivot is at the same position in
    // scaled coordinates.
    var dx = px0 - px1;
    var dy = py0 - py1;
    this.moveBy(dx, dy, {
      disableHtmlUpdate: true
    });
    
    // Scale the element
    if (!(options.hasOwnProperty('disableHtmlUpdate') &&
          options.disableHtmlUpdate === true)) {
      // Scale and move the HTMLElement.
      this._scaleHtmlElement(options);
    }
    
    return this;
  };
  
  Elem.prototype.rotate = function (angle, options) {
    // Rotate the element around its pivot.
    // 
    // Parameter
    //   angle
    //     Degrees e.g. 30, -120.2
    //   options
    //     See Animation Options
    // 
    // Return
    //   this
    //     for chaining
    // 
    // Priority
    //   low
    throw 'Not implemented';
  };
  
  Elem.prototype.moveTo = function (x, y, options) {
    // Move the element so that the pivot of the element
    // will be at x y in space.
    // 
    // Parameter
    //   x
    //   y
    //     New place in space
    //   options (optional)
    // 
    // Parameter (Alternative)
    //   xy
    //     Point as new place in space.
    //   options (optional)
    // 
    // Options
    //   disableHtmlUpdate
    //   + Animation Options
    // 
    // Return
    //   this
    //     for chaining
    // 
    
    // Normalize params
    if (typeof x === 'object') {
      if (typeof y === 'object') {
        options = y;
      }
      y = x.y;
      x = x.x;
    }
    if (typeof options === 'undefined') {
      options = {};
    }
    
    // Take pivot into account
    var dx = x - this._px;
    var dy = y - this._py;
    
    return this.moveBy(dx, dy, options);
  };
  
  Elem.prototype.moveBy = function (dx, dy, options) {
    // Move the element by distance specified in space coordinates.
    // 
    // Parameter
    //   dx
    //   dy
    //     Distance in space
    //   options (optional)
    // 
    // Parameter (Alternative)
    //   dxdy
    //   options (optional)
    // 
    // Options
    //   disableHtmlUpdate
    //   + Animation Options
    // 
    // Return
    //   this
    //     for chaining
    
    // Normalize params
    if (typeof dx === 'object') {
      if (typeof dy === 'object') {
        options = dy;
      }
      dy = dx.y;
      dx = dx.x;
    }
    if (typeof options === 'undefined') {
      options = {};
    }
    
    this._x += dx;
    this._y += dy;
    
    this._px += dx;
    this._py += dy;
    
    var disableHtml = ('disableHtmlUpdate' in options &&
                       options.disableHtmlUpdate === true);
    if (!disableHtml) {
      this._moveHtmlElement(options);
    }
    
    return this;
  };
  
  Elem.prototype.draggable = function () {
    // DEPRECATED, alias to Elem.movable
    /* jshint multistr: true */
    console.warn('Element.draggable is deprecated. \
Use Element.movable instead.');
    return this.movable.apply(this, arguments);
  };
  
  Elem.prototype.movable = function (onoff, options) {
    // Make element movable by dragging with pointer or finger.
    // 
    // Parameter
    //   onoff (optional, default true)
    //
    // Parameter (Alternative)
    //   options (optional)
    //
    // Parameter (Alternative)
    //   onoff
    //   options
    //     Scaling limits
    // 
    // Return
    //   this
    //     for chaining
    
    // Normalize parameters
    if (typeof onoff === 'object') {
      options = onoff;
      onoff = true;
    } else if (typeof onoff !== 'boolean') { // e.g. undefined
      onoff = true;
    }
    if (typeof options !== 'object') {
      options = {};
    }
    
    if (!this._movable.hasOwnProperty('status')) {
      // Movability not yet initialized
      
      // Capture difference between events
      var prevdx = 0;
      var prevdy = 0;
      
      var that = this;
      
      var vp = this._space.getViewport();
      var delta = function () {
        // Make key moves relative to scale.
        return vp.translateDistanceToSpace(100);
      };
      
      this._movable = {
        status: false,
        ondragstart: function (ev) {
          // Reset difference
          prevdx = 0;
          prevdy = 0;
          // Prevent affecting the viewport. Viewport might be movable also.
          ev.stopPropagation();
        },
        defaultAnimOptions: {
          ease: 'in-out',
          duration: '0.3s'
        },
        animOptions: {}, // set when checking disableAnimation
        ondrag: function (ev) {
          ev.gesture.preventDefault();
          
          var dx = vp.translateDistanceToSpace(ev.gesture.deltaX);
          var dy = vp.translateDistanceToSpace(ev.gesture.deltaY);
          
          that.moveBy(dx - prevdx, dy - prevdy);
          prevdx = dx;
          prevdy = dy;
          
          // Prevent affecting the viewport. Viewport might be movable also.
          ev.stopPropagation();
        },
        onkeyup: function () {
          that.moveBy(0, -delta(), that._movable.animOptions);
        },
        onkeydown: function () {
          that.moveBy(0, delta(), that._movable.animOptions);
        },
        onkeyleft: function () {
          that.moveBy(-delta(), 0, that._movable.animOptions);
        },
        onkeyright: function () {
          that.moveBy(delta(), 0, that._movable.animOptions);
        }
      };
    }
    
    // Modify animation options before return.
    // If user specifies disableAnimation, then user wants to disable it
    // regardless of on or off.
    if (options.hasOwnProperty('disableAnimation') &&
        options.disableAnimation === true) {
      this._movable.animOptions = {};
    } else {
      // Revert back to default.
      this._movable.animOptions = this._movable.defaultAnimOptions;
    }
    
    if (onoff === false) {
      // Turn movability off
      this._movable.status = false;
      this.off('dragstart', this._movable.ondragstart);
      this.off('drag', this._movable.ondrag);
      this.off('key-up', this._movable.onkeyup);
      this.off('key-down', this._movable.onkeydown);
      this.off('key-left', this._movable.onkeyleft);
      this.off('key-right', this._movable.onkeyright);
      return this;
    } // else
    
    // Avoid double ons
    if (this._movable.status === true) {
      return this;
    } // else
    
    // Turn movability on
    this._movable.status = true;
    this.on('dragstart', this._movable.ondragstart);
    this.on('drag', this._movable.ondrag);
    this.on('key-up', this._movable.onkeyup);
    this.on('key-down', this._movable.onkeydown);
    this.on('key-left', this._movable.onkeyleft);
    this.on('key-right', this._movable.onkeyright);
    return this;
  };
  
  Elem.prototype.scalable = function (onoff, options) {
    // Make element scalable by pinch gesture.
    // 
    // Parameter
    //   onoff (optional, default true)
    //   options (optional)
    //     Scaling limits
    // 
    // Return
    //   this
    //     for chaining
    // 
    // Priority
    //   low
    throw 'Not implemented';
  };
  
  Elem.prototype.rotatable = function (onoff, options) {
    // Make element rotatable by pinch gesture
    // 
    // Priority
    //   low
    throw 'Not implemented';
  };
  
  
  Elem.prototype.remove = function () {
    // Remove the element from space.
    
    this._removeHtmlElement();
    this._space._removeSpaceElement(this);
  };
  
  
  
  // Include jQuery functions.
  // In future it might be possible that some jQuery functionality
  // must be prevented. This explains why user should not use
  // the _htmlElement directly in the first place.
  _.each(
    [
    // Data
    'data', 'removeData',
    // Manipulation
    'attr', 'css', 'prop', 'removeAttr', 'removeProp',
    'addClass', 'hasClass', 'removeClass',
    // Effects
    'hide', 'show', 'toggle',
    'fadeIn', 'fadeOut', 'fadeTo', 'fadeToggle',
    'finish', 'queue', 'stop'
    ],
    function include(key) {
      // Ensure there is no namespace collisions. They may happen
      // by accident.
      if (key in Elem.prototype) {
        throw {
          name: 'NamespaceCollisionError',
          message: 'Property already defined: ' + key
        };
      } // else
      Elem.prototype[key] = function caller() {
        // Call the jQuery function.
        return this._htmlElement[key].apply(this._htmlElement, arguments);
      };
    }
  );
  
  
  
  // Events
  
  Elem.prototype.on = function (eventType, callback) {
    // Attach an event to the element
    // 
    // Usage:
    //   myimage.on('tap', function () { ... });
    
    this._eventOnHtmlElement(eventType, callback);
  };
  
  Elem.prototype.off = function (eventType, callback) {
    // Detach an event from the element
    // 
    // Priority
    //   medium
    this._eventOffHtmlElement(eventType, callback);
  };
  
  Elem.prototype.emit = function (eventType) {
    // Fire an event.
    // FIXME just a quick'n'dirty
    
    var handlerList;
    if (eventType === 'scaled') {
      handlerList = this._onScaled;
    }
    
    var i, handler;
    for (i = 0; i < handlerList.length; i += 1) {
      handler = handlerList[i];
      handler.call(this);
    }
  };
  
  Elem.prototype.select = function () {
    this._selectHtmlElement();
    this._space._select(this);
  };
  
  Elem.prototype.deselect = function () {
    this._selectHtmlElement(false);
    this._space._deselect(this);
  };
  
  
  
  // Somewhat abstract pseudo-private mutators
  
  Elem.prototype._appendHtmlElement = function (options) {
    // Post-conditions
    //   this._hammertime is a Hammer object.
    //   this._htmlElement is a jQuery object.
    //   this._htmlElement is appended to this._space._container
    throw 'Abstract function. Must be implemented by the instance.';
  };
  
  Elem.prototype._removeHtmlElement = function () {
    // Remove the HTMLElement from DOM
    // 
    // Can be overridden in the child prototype.
    if (this._htmlElement !== null) {
      this._htmlElement.remove();
      this._htmlElement = null;
    } else {
      console.warn('SpaceElement removed already. ' +
                   'Does the code an unnecessary remove call?');
    }
  };
  
  Elem.prototype._animationEnder = function (options) {
    // Helper fn. Helps to handle options and run the 
    // animation with optional end handler.
    // Used by _moveHtmlElement and _scaleHtmlElement
    
    if (options.hasOwnProperty('duration')) {
      this._animation = this._animation.duration(options.duration);
    }
    
    if (options.hasOwnProperty('delay')) {
      this._animation = this._animation.delay(options.delay);
    }
    
    // Exec animation
    var that = this;
    this._animation.end(function () {
      that._animation = null;
      if (options.hasOwnProperty('end') &&
          typeof options.end === 'function') {
        options.end.call(that);
      }
    });
  };
  
  Elem.prototype._moveHtmlElement = function (options) {
    // Move the HTMLElement on viewport.
    // 
    // Can be reimplemented in the child prototype.
    // 
    // Element knows its position in space and uses viewports fromSpace
    // function to find out position on screen.
    
    // Normalize
    if (typeof options !== 'object') {
      options = {};
    }
    
    // New place in viewport
    var vp = this._space.getViewport();
    var xy = vp.translatePointFromSpace(this._x, this._y);
    
    
    if (options.hasOwnProperty('ease')) {
      // Use animation by Move.js
      
      this._animation = move(this._htmlElement.get(0))
        .set('left', xy.x)
        .set('top', xy.y);
      this._animationEnder(options);
      
    } else {
      
      // Cancel ongoing animation
      if (this._animation !== null) {
        move(this._htmlElement.get(0))
          .set('left', xy.x)
          .set('top', xy.y)
          .duration('0s')
          .end();
        this._animation = null;
      } else {
      
        // Feels quite raw after Move.js :)
        this._htmlElement.css({
          left: xy.x + 'px',
          top: xy.y + 'px'
        });
      }
    }
  };
  
  Elem.prototype._scaleHtmlElement = function (options) {
    // Can be overridden in the child prototype.
    // 
    // Emit
    //   scaled
    //     When the scale is finished.
    
    // Normalize
    if (typeof options !== 'object') {
      options = {};
    }
    
    // Place in new viewport
    var vp = this._space.getViewport();
    var nw = vp.translatePointFromSpace(this._x, this._y);
    var se = vp.translatePointFromSpace(this._x + this._w, this._y + this._h);
    var x = nw.x;
    var y = nw.y;
    var w = (se.x - nw.x);
    var h = (se.y - nw.y);
    
    // If ease is not a valid easing function name, do not animate.
    var animate = options.hasOwnProperty('ease') &&
                  options.ease !== 'none' &&
                  typeof options.ease === 'string';
    
    if (animate) {
      // Animate
      // with Move.js
      
      this._animation = move(this._htmlElement.get(0))
        .set('left', x)
        .set('top', y)
        .set('width', w)
        .set('height', h);
      this._animationEnder(options);
      
    } else {
      // Do not animate
      
      if (this._animation !== null) {
      
        // Cancel ongoing animation
        move(this._htmlElement.get(0))
          .set('left', x)
          .set('top', y)
          .set('width', w)
          .set('height', h)
          .duration('0s')
          .end();
        this._animation = null;
        
      } else {
      
        // Raw step.
        this._htmlElement.css({
          left: x + 'px',
          top: y + 'px',
          width: w + 'px',
          height: h + 'px'
        });
      }
      
    }
    
    this.emit('scaled');
  };
  
  
  Elem.prototype._rotateHtmlElement = function () {
    throw 'Abstract function. Must be implemented by the instance.';
  };
  
  Elem.prototype._eventOnHtmlElement = function (eventType, handler) {
  
    if (eventType === 'mousewheel') {
      // Mousewheel event
      this._htmlElement.on('mousewheel', handler);
    } else if (eventType.indexOf('key-') === 0) {
      // Keyboard event
      var jwertyCode = eventType.substring(4);
      this._space._onKey(jwertyCode, this, handler);
    } else if (eventType === 'scaled') {
      this._onScaled.push(handler); // FIXME, use minibus
    } else {
      // Mouse or touch event
      this._hammertime.on(eventType, handler);
    }
  };
  
  Elem.prototype._eventOffHtmlElement = function (eventType, handler) {
    if (eventType === 'mousewheel') {
      // Mousewheel event
      this._htmlElement.off('mousewheel', handler);
    } else if (eventType.indexOf('key-') === 0) {
      // Keyboard event
      var jwertyCode = eventType.substring(4);
      this._space._offKey(jwertyCode, this, handler);
    } else if (eventType === 'scaled') {
      this._onScaled = []; // FIXME, use minibus
    } else {
      // Mouse or touch event
      this._hammertime.off(eventType, handler);
    }
  };
  
  Elem.prototype._selectHtmlElement = function (onoff) {
    // Add selection class
    // 
    // Parameter
    //   onoff (optional, default true)
    
    // Normalize
    if (typeof onoff !== 'boolean') {
      onoff = true;
    }
    this._htmlElement.toggleClass('taaspace-selected', onoff);
  };
  
  
  
  ///////////////
  return exports;
}());
