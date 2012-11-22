/*!
 * g.Raphael 0.51 - Charting library, based on Raphaël
 *
 * Copyright (c) 2009-2012 Dmitry Baranovskiy (http://g.raphaeljs.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

 /*
 * coxcomb chart method on paper
 */
/*\
 * Paper.coxCombChart
 [ method ]
 **
 * Creates a coxcomb chart
 **
 > Parameters
 **
 - cx (number) x coordinate of the chart
 - cy (number) y coordinate of the chart
 - r (integer) radius of the chart
 - opts (object) options for the chart
 o {
 o }
 **
 = (object) path element of the popup
 > Usage
 | r.coxCombChart(cx, cy, r, opts)
 \*/
(function () {

	var currentColor = 0;
	var rad = Math.PI / 180;

	function positionLabel(paper, cx, cy, r, startAngle, endAngle, params) {
			//need to add text at the middle point between the two lower ones
			var labelAngle = startAngle + (endAngle - startAngle) / 2,
			    xLabel = cx + r * Math.cos(-labelAngle * rad),
			    yLabel = cy + r * Math.sin(-labelAngle * rad),
			    label = paper.text(xLabel, yLabel, params.text).attr({fill: params.fontColor, "font-size": params.fontSize});
			//the label never should be bottom up in order for the
			//text to be read without turning your head or your screen
			if (labelAngle >= 90 && labelAngle < 270) {
				labelAngle += 180;
			}
			label.transform("r" + -labelAngle);
			return label;
	}
	
	function categorySlice(paper, cx, cy, r, startAngle, endAngle, params) {
			var x1 = cx + r * Math.cos(-startAngle * rad),
					x2 = cx + r * Math.cos(-endAngle * rad),
					y1 = cy + r * Math.sin(-startAngle * rad),
					y2 = cy + r * Math.sin(-endAngle * rad);
			var slice = paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
      //position the category label in the middle of the slice
			positionLabel(paper, cx, cy, r/2, startAngle, endAngle, params);
			return slice;
	}

  /*
	 * Creates a data bar inside a category
	 * r1 radius of the category
	 * r2 radius of the data bar
	 */
	function coxCombBar(paper, cx, cy, r1, r2, startAngle, endAngle, params) {
			var x1 = cx + r1 * Math.cos(-startAngle * rad),
					y1 = cy + r1 * Math.sin(-startAngle * rad),
					x2 = cx + r2 * Math.cos(-startAngle * rad),
					y2 = cy + r2 * Math.sin(-startAngle * rad),
					x3 = cx + r2 * Math.cos(-endAngle * rad),
					y3 = cy + r2 * Math.sin(-endAngle * rad),
					x4 = cx + r1 * Math.cos(-endAngle * rad),
					y4 = cy + r1 * Math.sin(-endAngle * rad);
			
			var polygon = paper.path(["M", x1, y1, 
												 "L", x2, y2, 
												 "A", r2, r2, 0, +(endAngle - startAngle > 180), 0, x3, y3, 
												 "L", x4, y4, 
												 "A", r1, r1, 0, +(endAngle - startAngle > 180), 0, x1, y1, 
												 "z"]).attr(params);
      //TODO: label color info should be found here
      polygon.mouseover(function () {
				polygon.attr({ "fill-opacity" : 0.2 });
      }).mouseout(function () {
				 polygon.attr({ "fill-opacity": params["fill-opacity"] || 1 });
			}).click(function() {
				if (params.onClick) {
					params.onClick(polygon, params.text);
				}
			});
      positionLabel(paper, cx, cy, (r1 + r2) / 2, startAngle, endAngle, params); 
			return polygon;
	}

	function getSeriesColor(category, serie, dataset) {
     if (dataset.colors) {
			if (dataset.colors.byCategory && dataset.colors.byCategory[category]) {
				return dataset.colors.byCategory[category];
			}
			if (dataset.colors.bySeries && dataset.colors.bySeries[serie]) {
				return dataset.colors.bySeries[serie];
			}
		 }
     currentColor+=1;
		 return {
		 		color : Raphael.hsb(currentColor, 1, 1)
		 };
	}

	/*
	 * {
	 *	data: {
	 *		jan : {
	 *			disease : 80,
	 *			battle : 20				
	 *		},
	 *		feb : {
	 *			disease : 70,
	 *			battle : 10
	 *		}
	 *	},
	 *	properties: {
	 *		categoryFontSize: 15,
	 *		seriesFontSize: 15,
	 *		onClick: fn,
	 *		categorySize : 0.30
	 *	},
	 *	colors : {
	 *		category : #fff,
	 *		opacity : 0.2,
	 *		byCategory : {
	 *			jan : {
	 *				color : #fff,
	 *				hover : #fff,
	 *				opacity : 0.5
	 *			},
	 *			feb : {
	 *				color: #fff
	 *			}
	 *		},
	 *		bySeries : {
	 *			disease : {
	 *				color : #fff,
	 *				hover : #fff
	 *			},
	 *			battle : {
	 *				color : #fff
	 *				hover : #fff
	 *			}
	 *		}
	 *	}
	 * }
	 */
	function CoxCombChart(paper, cx, cy, r, dataset, opts) {
		var chart = paper.set();

		//categories and series should be counted in order
		//to set the angles properly
		var totalCategories = 0;
		var totalSeries = {};
		var maxValue;
		var cat, serie;
		for (cat in dataset.data) {
			if (dataset.data.hasOwnProperty(cat)) {
				totalCategories+=1;
				if (typeof(dataset.data[cat]) === "object") {
					totalSeries[cat] = 0;
					for (serie in dataset.data[cat]) {
						if (dataset.data[cat].hasOwnProperty(serie)) {
							totalSeries[cat]+=1;
							if (!maxValue || maxValue < dataset.data[cat][serie]) {
								maxValue = dataset.data[cat][serie];
							}
						}
					}
				}
			}
		}
		var catSize = (opts && opts.categorySize) || 0.30;
		var currentAngle = 0;
		var catRadius = r * catSize;
		var catAngle = 360 * (1 / totalCategories);
		for (cat in dataset.data) {
			if (typeof(dataset.data[cat]) === "object") {
				categorySlice(paper, cx, cy, catRadius, currentAngle, currentAngle + catAngle, 
						          {fill: dataset.colors.category, 
											"fill-opacity": dataset.colors.opacity, 
					            text: cat,
											fontSize: opts.categoryFontSize,
											fontColor: dataset.colors.fontColor,
					            stroke: opts.stroke, 
					            "stroke-width": 3 });
				for (serie in dataset.data[cat]) {
					var serieRadius = catRadius + (r * (1 - catSize) * (dataset.data[cat][serie] / 10));
					var serieAngle = catAngle / totalSeries[cat];
					var color = getSeriesColor(cat, serie, dataset);
					coxCombBar(paper, cx, cy, catRadius, serieRadius, currentAngle, currentAngle + serieAngle, 
										{fill: color.color,	
										 stroke: opts.stroke,
					           hoverColor : color.hover,	
										 fontSize: opts.seriesFontSize,
										 fontColor: color.fontColor,
										 text: serie,
						         "fill-opacity": color.opacity, 
						         "stroke-width": 3,
										 onClick: opts.onClick});
					//when the last serie is finished for this category
					//the angle is at the beginning of the next one
					currentAngle += serieAngle;
				}
			}
		}
	}

	//public
	Raphael.fn.coxCombChart = function(cx, cy, r, dataset, opts) {
			return new CoxCombChart(this, cx, cy, r, dataset, opts);
	};
    
}());
