var GeoDataHandler = new Class({
	Implements: [Options, Events],
	reqToCall: null,
	geochart: null,
	options: {
	},
	initialize: function(options){
		this.setOptions(options);
		this.regions =$$('.region');
		this.tips = new Tips(this.regions, {className: "tips"});
	},

	/**
	 * Draw the map.
	 */
	drawMap: function (regions) {
		var regionsEl = this.regions;
		var max  = 0;
		var update = function () {
			for(var i=0,ii=regionsEl.length;i<ii;i++) {
				var id = regionsEl[i].id;
				var value = regions[id] || 0;
				var percent;
				max == 0 ? percent = 0 : percent = this.percent*value/max; 
				var color = UTILS.color.getColor(percent, "#1212e0", "#dbdbdb");
				regionsEl[i].setProperty('fill', color);
			}
		}
		for(var i=0,ii=regionsEl.length;i<ii;i++) {
			var id = regionsEl[i].id;
			var value = regions[id] || 0;
			max =Math.max(value, max);
			if(value == 0) {
				regionsEl[i].store('tip:text', 'Cette r�partition est inconnue pour cette r�gion.');
			} else {
				regionsEl[i].store('tip:text', 'R�partition : '+value+' % des personnes en parlent ici !');
			}
			regionsEl[i].initialColor = regionsEl[i].getProperty('fill');
		}
		var tween = new TWEEN.Tween({percent: 0}).to({percent: 100}, 1000).onUpdate(update).start();
	},
	/**
	 * Display the given report.
	 */
	displayGeoReport: function(timestamp, candidatName) {
		req = {timestamp: timestamp}
		if(typeof(candidatName) != "undefined") {
			req.candidatName = candidatName ;
		}
		var that = this;
		new Request.JSON({url: './geoReport/', 
			headers:{'Content-type':'application/json'},
			urlEncoded: false,
			method: "get",
			onSuccess: function(data){
				that.drawMap(data);
			}
		}).get(req);
	}
	
});