var DataHandler = new Class({
	Implements: [Options],
	candidats: null,
	lastTimestamp: null,
	firstTimestamp: null,
	selectedTimestamp: null,
	selectedType: "tendance",
	selectedCandidat: undefined,
	pie: null,
	chart: null,
	selectType: null,
	piePosition: null,
	threeMap: null,
	tweets: [],
	tweetsTimer: null,
	options: {
		events: {
			"1319061600000": ["Accouchement de Carla Bruni."],
			"1318716000000": ["Second tour des primaires socialistes"],
			"1318370400000": ["Premier tour des primaires socialistes"],
			"1319666400000": ["Sommet europ�en"],
			"1320361200000": ["Ouverture du G20 � Cannes"],
			"1319320800000": ["convention d'investiture"],
			"1322002800000": ["Discours d'Evay Joly � Tokyo"]
		},
		themeDescrition: {"SECURITY": {title: "la S�curit�", text: "Repr�sente l'importance du th�me de la s�curit� pour les fran�ais."}, 
			"EUROPE": {title: "l'Europe", text: "Repr�sente l'importance du th�me de l'Europe pour les fran�ais."},
			"ECONOMIC": {title: "l'Economie",  text: "Repr�sente l'importance du th�me de l'�conomie pour les fran�ais."},
			"GREEN": {title: "l'Ecologie",  text: "Repr�sente l'importance du th�me de l'�cologie pour les fran�ais."},
			"IMIGRATION": {title: "l'Immigration",  text: "Repr�sente l'importance du th�me de l'immigration pour les fran�ais."},
			"SOCIAL": {title: "le Social", text: "Repr�sente l'importance du th�me du social pour les fran�ais."}
		},
		opinionDescription: { "tendance": {title: "la tendance", text: "Repr�sente le r�sultat pr�visionnel des �lections de 2012, avec les donn�es du web."}, 
			"buzz": {title: "le buzz", text: "Repr�sente de combien on parle de ce candidat."}, 
			"neg": {title: "les avis n�gatifs", text: "Repr�sente de combien on parle en mauvais termes de ce candidat."}, 
			"pos": {title: "les avis positifs", text: "Repr�sente de combien on parle en bon termes de ce candidat."}, 
			"none": {title: "les d�sinteress�s", text: "Repr�sente � quel point les fran�ais ne s'interessent pas � ce candidat."}
		}
	},
	initialize: function(profile, options){
		new Tips(".tooltips", {className: "tips"});
		this.setVisualizationType(this.options.opinionDescription["tendance"]);
		this.setOptions(options);
		var that = this ;
		this.threeMap = new ThreeMap("treeMap");
		this.threeMap.addEvent('click', function (theme) {
			that.setVisualizationType(that.options.themeDescrition[theme]);
			that.updateGraph("theme."+theme)
		});
		this.geoDataHandler = new GeoDataHandler();
		this.selectType = $('selectType')
		this.pie = new Pie("containerPie", {
			stickyTracking: false
		});
		this.piePosition = new Pie("containerPiePosition", {
			dataLabelsEnabled: false,
			innerSize: 130
		});
		//svg Z-index hack.
		this.pie.addEvents({
			'mouseOver': function() {
				$('containerPie').setStyle('z-index', 3);
			},
			'mouseOut': function() {
				$('containerPie').setStyle('z-index', 1);
			}
		});
		this.chart = new Chart("containerChart");
		this.chart.addEvent('clickOnChart', function (date, type) {
			that.updateVisualizationDate(date);
			that.updatePie(date, type);
		});
		this.chartDetails = new BarChart("containerChartDetails", 
				[{id: "tendance", title: "Tendance", text: "Le r�sultat de la pr�vision<br />des �lections de 2012"}, 
				 {id: "buzz", title: "Buzz", text: "De combien on parle<br />de ce candidat."}, 
				 {id: "neg", title: "Avis N�gatifs", text: "De combien on parle <br />en mauvais termes de <br />ce candidat."}, 
				 {id: "pos", title: "Avis positifs", text: "De combien on parle en<br />bon termes de ce candidat."}, 
				 {id: "none", title: "D�sinteress�", text: "De combien les fran�ais <br />ne s'interessent pas � <br />ce candidat."}]);
		this.chartDetails.addEvent('click', function (type) {
			that.setVisualizationType(that.options.opinionDescription[type]);
			that.updatePie(that.selectedTimestamp, type);
			that.updateGraph(type);
		});
	},
	/**
	 * Update the visualization date and its event.
	 */
	updateVisualizationDate: function (date) {
		console.log(date);
		var events = this.options.events[date] ;
		var txt = "";
		if(typeof(events) != "undefined") {
			for(var i=0,ii=events.length;i<ii;i++) {
				if(txt.length>0) {
					txt+=",";
				}
				txt+='<a href="http://www.google.fr/#q='+encodeURIComponent(events[i])+'" target="_blank">'+events[i]+'</a>';
			}
		} else {
			txt = "Aucun evenement particulier pour ce jour.";
		}
		$('visualizationEvent').set('html', txt);
		var day = new Date(date) ;
		$('visualizationDate').set('html', day.getDate()+"/"+(day.getMonth()+1)+"/"+day.getFullYear());
	},
	/**
	 * VisualizationType : value + tip
	 */
	setVisualizationType: function(obj) {
		$('visualizationType').set('html', obj.title);
		$('visualizationType').store('tip:title', obj.title);
		$('visualizationType').store('tip:text', obj.text);
	},
	/**
	 * Return the candidat with a displayedName (eg. Nicolas Sarkozy)
	 */
	getCandidat: function(displayName) {
		for(candidat in this.candidats){
			if(displayName == this.candidats[candidat].displayName) {
				return this.candidats[candidat] ;
			} ;
		}
	},
	getData: function () {
		var that = this;
		new Request.JSON({url: './candidats/', 
			headers:{'Content-type':'application/json'},
			urlEncoded: false,
			method: "get",
			onSuccess: function(data){
				that.candidats = {};
				for(var i =0,ii=data.candidats.length;i<ii;i++) {
					that.candidats[data.candidats[i].candidatName] = data.candidats[i] ;
				}
				that.reports = data.reports ;
				that.firstTimestamp = that.reports[0].timestamp ;
				that.lastTimestamp = that.reports[that.reports.length-1].timestamp ;
				that.selectedTimestamp = that.lastTimestamp ;
				that.geoDataHandler.displayGeoReport(that.selectedTimestamp);
				//Main pie serie
				var dataPie = [];
				var lastReport = that.reports[that.reports.length-1] ;
				for(candidat in that.candidats) {
					var candidatReport = lastReport.candidats[candidat];
					dataPie.push({parti: that.candidats[candidat].parti,
						partiFullName: that.candidats[candidat].partiFullName,
						name: that.candidats[candidat].displayName, 
						y:candidatReport.tendance,
						events:{
							//Click on a point on the main pie
			    			click:function () {
			    				var candidat = this.selected ? undefined : that.getCandidat(this.name) ;
			    				if(!candidat) {
			    					$('visualizationTarget').set('html', 'tous les candidats');
			    				} else {
			    					$('visualizationTarget').set('html', candidat.displayName);
			    				}
			    				that.updateGraphDetails(candidat);
			    				var candidatName = this.selected ? undefined : candidat.candidatName;
			    				that.geoDataHandler.displayGeoReport(that.selectedTimestamp, candidatName);
			    				that.updateThemes(that.selectedTimestamp, candidat);
			    				that.updateCandidatInfo(candidat);
				    		}
			    		}
					});
				}
			    var series= [{
					type: 'pie',
					data: dataPie
				}]
				that.pie.initChart(series);

			    //Position pie serie
			    var dataPiePositionObj = that.getPositionsForReport(lastReport);
			    var dataPiePosition = [];
			    for(var position in dataPiePositionObj) {
			    	dataPiePosition.push({name: position, 
			    		y: dataPiePositionObj[position]
			    	});
			    }
			    var series= [{
					type: 'pie',
					data: dataPiePosition
				}]
			    that.piePosition.initChart(series);
				that.chart.initChart(that.getSeriesForChart(), that.firstTimestamp);
				
				//details chart
				that.chartDetails.initChart(that.getSeriesForChartDetails(that.lastTimestamp));
				
				//Theme threemap
				that.updateThemes(that.lastTimestamp);
			}
		}).send();
	}, 
	/**
	 * Select and change a random tweet on the left picture.
	 */
	changeTweet: function () {
		var id = Math.round((this.tweets.length-1)*Math.random()) ;
		var tweet = this.tweets[id];
		var spans = $$('#candidatImage p a') ;
		var span = spans[Math.round((spans.length-1)*Math.random())];
		var fx = new Fx.Morph(span, {
		    duration: 500,
		    transition: Fx.Transitions.Quart.easeOut
		  });
		fx.start({
			opacity: 0
		}).chain(function (){
			var fonts = span.getElements('font');
			span.setProperty('href', "http://www.twitter.com/#!/"+tweet.userId)
			for(var i =0,ii=fonts.length;i++;i<ii) {
				if(tweet.value.length<i) {
					if(id == this.tweets.length) {
						tweet.value+= tweet.value[id-1];
					} else {
						tweet.value+= tweet.value[id+1];
					}
				}
				font.set('html', tweet.value[i]);
			}
			this.start({
				opacity: 1
			});
		})
		var that = this;
		this.tweetsTimer = setTimeout(function () {that.changeTweet()}, 1000+3000*Math.random());
	},
	/**
	 * Update the candidat infos, left part.
	 * 
	 */
	updateCandidatInfo: function (candidat) {
		var that = this ;
		if(typeof(candidat) != "undefined") {
			$('candidatName').set('html', candidat.displayName);
			$('partiImage').setProperty('src', './resources/images/parti/'+candidat.parti+".jpg");
			$('tendancy').set('html', candidat.tendancy);
			var birth = new Date(candidat.birthday) ;
			var birthday = birth.getDate()+"/"+(birth.getMonth()+1)+"/"+birth.getFullYear();
			$('birthday').set('html', birthday);
			$('parti').set('href', candidat.siteUrl);
			$('parti').set('html', candidat.partiFullName);
			var fx = new Fx.Morph('help', {
			    duration: 400,
			    transition: Fx.Transitions.Quart.easeOut
			});
			fx.start({
				opacity: 0
			}).chain(function (){
				$('help').setStyle('display', 'none');
				$('candidatInfo').setStyle('display', 'block');
				$('candidatInfo').fade(1);
			});
			new Request.HTML({
				url: 'image/'+candidat.candidatName,
				onSuccess: function(responseTree, responseElements, responseHTML) {
					$('candidatImage').set('html', responseHTML);
					new Request.JSON({url: 'image/tweets/'+candidat.candidatName, 
						headers:{'Content-type':'application/json'},
						urlEncoded: false,
						method: "get",
						onSuccess: function(tweets){
							that.tweets = tweets ;
							if(that.tweetsTimer != null)
							clearTimeout(that.tweetsTimer);
							that.tweetsTimer = setTimeout(function () {that.changeTweet()}, 2000+3000*Math.random());
						}
					}).send();
				}
			}).get();
		} else {
			var fx = new Fx.Morph('candidatInfo', {
			    duration: 400,
			    transition: Fx.Transitions.Quart.easeOut
			});
			fx.start({
				opacity: 0
			}).chain(function (){
				$('candidatInfo').setStyle('display', 'none');
				$('help').setStyle('display', 'block');
				$('help').fade(1);
			});
		}
	},
	/**
	 * Update the theme threechart.
	 */
	updateThemes: function(timestamp, candidat) {
		var themes ;
		var report = this.getReport(timestamp);
		if(typeof(candidat) == "undefined") {
			themes = {};
			for(candidatReport in report.candidats){
				for(theme in report.candidats[candidatReport].themes) {
					value = themes[theme] || 0 ;
					value += report.candidats[candidatReport].themes[theme] ;
					themes[theme] = value ;
				}
			}
		} else {
			themes = report.candidats[candidat.candidatName].themes;
		}
		var values = [];
		var total = 0;
		for(theme in themes) {
			total += themes[theme] ;
		}
		for(theme in themes) {
			var title = "Pr�occupation des fran�ais pour "+this.options.themeDescrition[theme].title;
			if(typeof(candidat) != "undefined") {
				title += " pour "+candidat.displayName;
			}
			var percent;
			total == 0 ? percent = 0 : percent=themes[theme]/total*100 ;
			var text = "Plus le carr� est important, plus la pr�occupation est grande.<br /> Valeur :"+Math.round(percent*10)/10+"%";
			values.push({id: theme, value: percent, title: title, text: text});
		}
		this.threeMap.draw(values);
	},
	/**
	 * Return the series given a specific type.
	 * Themes must start with theme.ID
	 */
	getSeriesForChart: function (type) {
		type = type || "tendance" ;
		var theme = type.indexOf("theme.")!=-1;
		if(theme) {
			type = type.substring("theme.".length, type.length);
		}
		var series = []
		for(var i =0, ii=this.reports.length;i<ii;i++) {
			var data = [];
			var report = this.reports[i];
			for (candidat in report.candidats) {
				var serie = null;
				for(var j=0,jj=series.length;j<jj;j++) {
					if(series[j].nameBrut == candidat) {
						serie = series[j] ;
						break;
					} 
				}
				if(serie == null) {
					serie = {nameBrut: candidat, name: this.candidats[candidat].displayName, lineWidth: 2, data: []};
					series.push(serie);
				}
				var value ;
				if(theme) {
					value = report.candidats[candidat].themes[type];
				} else {
					value = report.candidats[candidat][type] ;
				}
				var point = {
						x: report.timestamp, 
						y: Math.round(value*10)/10
				}
				if(typeof(this.options.events[report.timestamp]) != "undefined") {
					console.log("okay")
					point.marker = {
						symbol: 'url(resources/images/star.png)'
					}
				}
				serie.data.push(point);
			}
		}
		return series ;
	},
	/**
	 * Return the series given a specific type.
	 */
	getSeriesForChartDetails: function (date, type, candidat) {
		type = type || "tendance" ;
		var report = this.getReport(date);
		var series = [{name: "", data: [] }];
		var values = {"tendance": 0, "buzz": 0, "neg": 0, "pos": 0, "none": 0};

		//All candidats, we take the average.
		if(typeof(candidat) == "undefined") {
			var i = 0;
			for (var candidat in this.candidats) {
				i++;
				for(var value in values) {
					values[value] += report.candidats[candidat][value];
				}
			}
			for(var value in values) {
				values[value] = Math.round(values[value]/i*10)/10;
			}
		} //We just update for a specifc candidat 
		else {
			for(var value in values) {
				values[value] = Math.round(report.candidats[candidat.candidatName][value]*10)/10;
			}
		}
		var colors = ['#00FF00', '#FF00FF', '#FF0044', '#3749ed', '#8fed37'];
		var i =0;
		for(var value in values) {
			series[0].data.displayName = value ;
			series[0].data.push({y: values[value], color: colors[i]});
			i++
		}
		return series ;
	},
	/**
	 * Return the position for the given report.
	 */
	getPositionsForReport: function(report) {
		var dataPiePositionObj = {};
		for(candidat in this.candidats) {
			var candidatReport = report.candidats[candidat];
			if(typeof(dataPiePositionObj[this.candidats[candidat].position]) =="undefined") {
				dataPiePositionObj[this.candidats[candidat].position] = 0;
			}
			dataPiePositionObj[this.candidats[candidat].position] += candidatReport.tendance ;
		}
		return dataPiePositionObj;
	},
	/**
	 * Return the report of the date.
	 */
	getReport: function (date) {
		for (var i=0, ii=this.reports.length;i<ii;i++) {
			if(this.reports[i].timestamp == date){
				return this.reports[i] ;
			}
		}
	},
	/**
	 * Update the 2 pies
	 */
	updatePie: function(date, type) {
		type = type || "tendance" ;
		var data = this.pie.chart.series[0].data ;
		var positionData = this.piePosition.chart.series[0].data ;
		var report = this.getReport(date);
		for(i =0,ii=data.length;i<ii;i++) {
			var name = this.getCandidat(data[i].name).candidatName;
			data[i].update(report.candidats[name][type]);
		}
		var dataReport = this.getPositionsForReport(report);
		var i=0;
		for(var position in dataReport) {
			positionData[i].update(dataReport[position]);
	    	i++;
	    }
	},
	/**
	 * Update the graph with new datas.
	 */
	updateGraph: function (type) {
		var newSeries = this.getSeriesForChart(type);
		for(var i=0, ii=this.chart.chart.series.length;i<ii;i++){
			this.chart.chart.series[i].setData(newSeries[i].data) ;
		}
		this.chart.chart.redraw();
	},
	/**
	 * Update the graph details
	 */
	updateGraphDetails: function (candidat) {
		var newSeries = this.getSeriesForChartDetails(this.selectedTimestamp, this.selectedType, candidat);
		var data = this.chartDetails.chart.series[0].data ;
		for(var i=0,ii=data.length;i<ii;i++){
			data[i].update(newSeries[0].data[i]) ;
		}
	}
	
});