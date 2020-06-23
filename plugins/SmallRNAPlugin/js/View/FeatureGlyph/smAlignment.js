define("SmallRNAPlugin/View/FeatureGlyph/smAlignment", [
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'JBrowse/View/FeatureGlyph/Box',
  'JBrowse/View/FeatureGlyph/Alignment'
],
  function (
    declare,
    lang,
    array,
    BoxGlyph,
    Alignment
  ) {

    return declare([Alignment], {

      constructor: function () {
        this._drawMismatches = function () {};

      },

      _defaultConfig: function () {
        return this._mergeConfigs(
          lang.clone(this.inherited(arguments)), {
            style: {
              color: function (feature, path, glyph, track) {
                var strand = feature.get('strand');
                // var multimapping = (feature.get('supplementary_alignment') || (typeof feature.get('xm') != 'undefined' && feature.get('xm') > 1) || (typeof feature.get('nh') != 'undefined' && feature.get('nh') > 1))
                // MJA version of multimapping, for ShortStacka alignments, below
                var multimapping = (typeof feature.get('xx') != 'undefined' && feature.get('xx') > 1);

                // check if multimapping reads should be solid fill
                if (multimapping && !track.config.style.solidFill) {
                  return null;
                }
                var seqLen = feature.get('seq_length');
                if (Math.abs(strand) != 1 && strand != '+' && strand != '-')
                  return glyph.getStyle(feature, '_color_gray');
                else if (seqLen == 21)
                  return glyph.getStyle(feature, '_color_blue');
                else if (seqLen == 22)
                  return glyph.getStyle(feature, '_color_mediumseagreen');
                else if (seqLen == 23)
                  return glyph.getStyle(feature, '_color_orange');
                else if (seqLen == 24)
                  return glyph.getStyle(feature, '_color_tomato');
                else if (seqLen == 20)
                  return glyph.getStyle(feature, '_color_skyblue');
                else
                  return glyph.getStyle(feature, '_color_gray');
              },
              borderColor: function (feature, path, glyph, track) {
                var strand = feature.get('strand');
                var seqLen = feature.get('seq_length');
                if (Math.abs(strand) != 1 && strand != '+' && strand != '-')
                  return glyph.getStyle(feature, '_color_gray');
                else if (seqLen == 21)
                  return glyph.getStyle(feature, '_color_blue');
                else if (seqLen == 22)
                  return glyph.getStyle(feature, '_color_mediumseagreen');
                else if (seqLen == 23)
                  return glyph.getStyle(feature, '_color_orange');
                else if (seqLen == 24)
                  return glyph.getStyle(feature, '_color_tomato');
                else if (seqLen == 20)
                  return glyph.getStyle(feature, '_color_skyblue');
                else
                  return glyph.getStyle(feature, '_color_gray');
              },

              image: 'blue',
              /* choose colors based on length */
              /* Edits below by MJA  old code commented out*/		
              /*_color_orange: '#F37A22', */ // orange - 24
              /*_color_blue: '#3E98AF', */ // blue - 21
              /* _color_purple: '#A55EA4', */ // purple -23
              /* _color_red: '#A94544', */ // red - pi
              /* _color_green: '#8BC240', */ // green - 22
              /* _color_gray: '#646464', */ // gray - other

              /* New additions by MJA */
              _color_skyblue: '#87CEFA', // 20 mers
              _color_blue: '#0000FF',  // 21 mers
              _color_mediumseagreen: '#3CB371', // 22 mers
              _color_orange: '#FFA500', // 23 mers
              _color_tomato: '#FF6347', // 24 mers
              _color_gray: '#808080', // <20 or >24 or some kind of undefined situation

              strandArrow: false,
              height: 4,
              marginBottom: 0.5,
              showMismatches: false
            }
          }
        );
      },

      makeFeatureLabel: function (feature, fRect) {
        var text = this.getFeatureLabel(feature);
        if (!text)
          return null;
        else if (!isNaN(text))
          text = text + ' bp';
        var font = this.getStyle(feature, 'textFont');
        var l = fRect ? this.makeBottomOrTopLabel(text, font, fRect) : this.makePopupLabel(text, font);
        l.fill = this.getStyle(feature, 'textColor');
        return l;
      },

      layoutFeature: function (viewArgs, layout, feature) {
        var fRect = this._getFeatureRectangle(viewArgs, feature);

        var scale = viewArgs.scale;
        var leftBase = viewArgs.leftBase;
        var startbp = fRect.l / scale + leftBase;
        var endbp = (fRect.l + fRect.w) / scale + leftBase;
        // need to get the strand so we know about it but don't actually need to use it
        var featStrand = feature.get('strand');

        fRect.t = layout.addRect(
          feature.id(),
          startbp,
          endbp,
          fRect.h,
          feature
        );
        if (fRect.t === null || fRect.t === undefined)
          return fRect.t;

        fRect.f = feature;

        return fRect;
      },

      _getFeatureRectangle: function (viewArgs, feature) {
        var block = viewArgs.block;
        var fRect = {
          l: block.bpToX(feature.get('start')),
          h: this._getFeatureHeight(viewArgs, feature),
          viewInfo: viewArgs,
          f: feature,
          glyph: this
        };

        fRect.w = block.bpToX(feature.get('end')) - fRect.l;

        // save the original rect in `rect` as the dimensions
        // we'll use for the rectangle itself
        fRect.rect = {
          l: fRect.l,
          h: fRect.h,
          w: Math.max(fRect.w, 2),
          t: 0
        };
        fRect.w = fRect.rect.w; // in case it was increased
        // only add margin for collapased view
        if (viewArgs.displayMode === 'collapsed')
          fRect.h += this.getStyle(feature, 'marginBottom') || 0;

        //var strand = fRect.strandArrow = feature.get('strand')
        // if we are showing strand arrowheads, expand the frect a little
        if (this.getStyle(feature, 'strandArrow')) {
          var strand = fRect.strandArrow = feature.get('strand');
          var i;
          if (strand == -1) {
           i = this._embeddedImages.minusArrow;
            fRect.w += i.width;
            fRect.l -= i.width;
          } else {
            i = this._embeddedImages.plusArrow;
            fRect.w += i.width;
          }
        }

        // no labels or descriptions if displayMode is collapsed, so stop here
        if (viewArgs.displayMode == "collapsed")
          return fRect;

        this._expandRectangleWithLabels(viewArgs, feature, fRect);
        this._addMasksToRect(viewArgs, feature, fRect);

        return fRect;
      }

    });
  });
