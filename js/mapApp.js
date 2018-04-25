//
// mapApp.js
//

let userChoice = 'USA Top 30';

function setGraphTitles() {
	let scores_title = d3.select("#scores-title").html("Average ACT Scores: "+userChoice);
	let tuition_title = d3.select("#tuition-title").text("Average Annual Tuition: "+userChoice);
	let acceptance_title = d3.select("#acceptance-title").text("Acceptance Rate: "+userChoice);
	let students_title = d3.select("#enrollment-title").text("Number of Students: "+userChoice);
}

let title = d3.select("h1.title").html("Top Universities in the USA");
let subtitle = d3.select(".description").html("This tool is designed to help you choose a university to attend in the United States based on data from 2018. Select a state to view the top schools ranked by several categories. By default, the charts show the top 30 schools based on US News' annual rankings. Place your cursor over the bars on the graphs for more information about individual schools. It should be noted that this tool does not include America's many colleges that do not have university status. The data used in this tool is from Kaggle user Christopher Lambert's <a href='https://www.kaggle.com/theriley106/university-statistics'>\"University Statistics\"</a> dataset via US News & World Report.");
let credits = d3.select(".credits").html("<div>April 24, 2018 // <a href='https://zachzager.wixsite.com/portfolio'>Zach Zager</a>, <a href='https://www.linkedin.com/in/jingleizuo/'>Jinglei Zuo</a>, and <a href='https://www.linkedin.com/in/%E5%8F%AF-%E5%85%B0-a4247a142/'>Ke \"Coco\" Lan</a></div>");
setGraphTitles();

let map = d3.select("svg.map"),
    map_width = +map.attr("width"),
    map_height = +map.attr("height");

let margin = {top: -20, right: 20, bottom: 30, left: 220};

let testScores_frame = d3.select("svg.testScores");
let testScores = testScores_frame.append('g')
	.attr("transform", "translate(" + margin.left + ",0)");

let graph_width = +testScores_frame.attr("width")-20,
	graph_height = +testScores_frame.attr("height")-40;

let tuition_frame = d3.select("svg.tuition");
let tuition = tuition_frame.append('g')
	.attr("transform", "translate(" + margin.left + ",0)");

let acceptance_frame = d3.select("svg.acceptance");
let acceptance = acceptance_frame.append('g')
	.attr("transform", "translate(" + margin.left + ",0)");

let enrollment_frame = d3.select("svg.enrollment");
let enrollment = enrollment_frame.append('g')
	.attr("transform", "translate(" + margin.left + ",0)");

var rateByState = d3.map(); // map data by FIPS

var projection = d3.geoAlbersUsa()
    .scale(800)
    .translate([map_width / 2, map_height / 2]);

var path = d3.geoPath().projection(projection);

d3.queue()
    .defer(d3.json, "js/us.json")
    .defer(d3.json, "js/schoolInfo.json")
    .await(ready);

let stateCountList = {};
// returns tallied list of how many schools are in each state
function tallyStates(d) {
	let stateList = {};
	let maxCount = 0;
	for (let i = 0; i < d.length; i++) {
		if (d[i].state in stateList) {
			stateList[d[i].state]++;

			// keep track of highest school count
			if (stateList[d[i].state] > maxCount){
				maxCount = stateList[d[i].state];
			}
		} else {
			stateList[d[i].state] = 1;
		}
	}
	stateCountList = stateList;

	// store values in rateByState, converting state names to state codes
	for (state in stateList) {
		rateByState.set(stateCodes[state],stateList[state]);
	}
	return maxCount;
}

// Tooltip
// initializes tooltip for all charts and maps
let tooltip = d3.select("body")
	.append("div")
	.style('background-color','#ffffff')
	.style('box-shadow', '0 2px 4px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12)')
	.style('border','solid 0.5px')
	.style('border-radius','5px')
	.style('padding','10px 10px 10px 10px')
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden")
	.style('font-size', '12px')
	.style('font-family', 'Open Sans');

function ready(error, us, schools) {
  	if (error) throw error;

  	// draw various graphical elements
  	drawMap(us,schools);
  	drawCharts(schools);
}

// call chart drawing functions with optional single state parameter
function drawCharts(schools,state="") {
	setChoice(state);

	// choose data from selected state
	if (state !== "") {
		let tempList = [];
		for (items in schools) {
			if (schools[items]['state'] === state) {
				tempList.push(schools[items]);
			}
		}
		schools = tempList;
	} else {
		schools = getTop30(schools);
	}

	// call chart drawing functions
	addBarChart(schools,acceptance,'acceptance-rate','Acceptance Rate','','%',false); // draw acceptance
  	addBarChart(schools,testScores,'act-avg','Average ACT Score','','',true); // draw ACT scores
  	addBarChart(schools,tuition,'tuition',"Annual Tuition",'$','',true); // draw tuition
  	addBarChart(schools,enrollment,'enrollment',"Number of Enrolled Students",'','',true); // draw enrollment

}

function setChoice(state="") {
	if (state === "") {
		userChoice = 'USA Top 30';
	} else {
		userChoice = stateCodesToName[stateCodes[state]];
	}
	setGraphTitles();
}

// scaled color of prev state for viz
let selectedStateFill;

// draws map on page
function drawMap(us,schools){
  	let maxCount = tallyStates(schools);
  	let color = d3.scaleLinear().domain([1,maxCount])
    	.interpolate(d3.interpolateHcl)
    	.range([d3.rgb('#cfcfe8'), d3.rgb('#010182')]);

	// add states to map w/ data
	// mouse events handle county name+state tooltip
  	map.append("g")
	    .attr("class", "states")
	    .selectAll("path")
	    .data(topojson.feature(us, us.objects.states).features)
	    .enter().append("path")
	    	.attr('style', (d)=> { return 'fill: ' + color(rateByState.get(d.id)); })
	    	.attr('id',(d)=>{ return stateCodesRev[d.id]; })
	    	.attr("d", path)
	    .on("mouseover", (d)=>{ 
	    	tooltip.html("<div class='tooltip-title center'>"+stateCodesToName[d.id]+"</div><div class='center'>"
	    		+stateCountList[stateCodesRev[d.id]]+" "+getNumSchools(stateCountList[stateCodesRev[d.id]])+"</div>");
	    	tooltip.style("visibility", "visible");
	    })
	    .on("mousemove", (d)=>{ tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", (d)=>{ tooltip.style("visibility", "hidden"); })
		.on("click", selectState);
}

// handles user selecting (clicking) a state on the map
// if state has already been selected it will deselect
function selectState(d) {
	let clickedState = d3.select('#'+stateCodesRev[d.id])
	let prevState = d3.select('.selected');
	// checks if state has already been selected
	if (clickedState.attr('class') === 'selected') {
		prevState.classed('selected',false);
		prevState.style('fill',selectedStateFill);
		drawCharts(schools);
	} else {
		prevState.classed('selected',false);
		prevState.style('fill', selectedStateFill);
		clickedState.classed('selected',true);
		selectedStateFill = clickedState.style('fill');
		clickedState.style('fill','red');
		drawCharts(schools,stateCodesRev[d.id])
	}
}

// differentiates between 1 school or more than 1 school for grammatical reasons
function getNumSchools(numSchools) {
	if (numSchools === 1) {
		return 'school'
	} else if (numSchools > 1) {
		return 'schools'
	} else {
		return "";
	}
}

// returns list of top 30 schools by overall rank
function getTop30(schools) {
	let tempList = [];
	for (items in schools) {
		if (+schools[items]['overallRank'] < 31 && +schools[items]['overallRank'] > 0) {
			tempList.push(schools[items]);
		}
	}
	return tempList;
}

//
// Callback functions for generating graph tool tips
//
function graphMouseOver(d) {
	d3.select(this).style('fill','#45b1cb'); // highlight hovered over bar

	// format cost after aid
	let cost_after_aid = "";
	if (d['cost-after-aid'] == null) {
		cost_after_aid = "";
	} else {
		cost_after_aid = " ($"+d['cost-after-aid']+" after aid)";
	}

	// add and format tooltip content
	tooltip.html("<div class='tooltip-title center'>"+d['displayName']+"</div>\
		<div class='tooltip-subtitle center'>"+d['city']+', '+d['state']+'</div>\
		<div>Average ACT Score: '+d['act-avg']+'</div>\
		<div>Enrollment: '+d['enrollment']+"</div>\
		<div>Tuition: $"+d['tuition']+cost_after_aid+"</div>\
		<div>Acceptance Rate: "+d['acceptance-rate']+"%</div>\
		<img onerror='this.style.display=\"none\"' class='thumbnail' src="+d['primaryPhotoThumb']+" />\
		<div class='center'>Click to add to list</div>");
	tooltip.style("visibility", "visible");
}
function graphMouseMove(d) {
	tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
}
function graphMouseOut(d) { 
	d3.select(this).style('fill','#010182'); // revert bar to original color
	tooltip.style("visibility", "hidden");
}

// clears null values from a list
function clearNulls(schools,valueName) {
	let tempList = [];
	for (item in schools) {
		if (schools[item][valueName] != null) {
			tempList.push(schools[item]);
		}
	}
	return tempList;
}

// call functions to add bars and axis labels for bar charts after clearing null values and sorting schools
function addBarChart(schools, chart, valueName, xAxisLabel, prefix, suffix,sortLargeToSmall=true) {
	if (sortLargeToSmall) {
		schools = clearNulls(schools,valueName).sort( (a,b)=>{ return a[valueName]-b[valueName]; });
	} else {
		schools = clearNulls(schools,valueName).sort( (a,b)=>{ return b[valueName]-a[valueName]; });
	}

	chart.selectAll("*").remove(); // remove previous chart
	let x = scaleXRanges(schools, valueName);
	let y = scaleYRanges(schools);
	setYAxis(chart,y);
	setXAxis(chart,x,prefix,suffix);
    addBars(schools,chart,valueName,x,y); // add bars to chart
	addXAxisLabel(chart,xAxisLabel); // text label for the x axis
}

// set and scale the range of the data in the x domain
function scaleXRanges(schools, valueName) {
	let x = d3.scaleLinear().range([0, graph_width-margin.left]); // set the range
	x.domain([0, d3.max(schools, (d)=> { return d[valueName]; })]); // Scale the range of the data in the domains
	return x;
}

// set and scale the range of the data in the y domain
function scaleYRanges(schools) {
	let y = d3.scaleBand().range([graph_height, 0]); 
	y.domain(schools.map((d)=> { return d['displayName']; })).padding(0.1);
	return y;
}

// adds y-axis labels to bar charts
function setYAxis(chart, y) {
    chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .selectAll('.y-axis');
}

// adds x-axis labels to bar charts, defining measurement values
function setXAxis(chart, x, prefix="", suffix="") {
	chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + graph_height + ")")
      	.call(d3.axisBottom(x).ticks(5).tickFormat((d)=> { return prefix+d+suffix; }).tickSizeInner([-graph_height]));
}

// adds bar to bar charts
function addBars(schools, chart, valueName, x, y) {
	chart.selectAll(".bar")
        .data(schools)
   		.enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("y", (d)=> { return y(d['displayName']); })
        .attr("width", (d)=> { return x(d[valueName]); })
	    .on("mouseover", graphMouseOver)
	    .on("mousemove", graphMouseMove)
		.on("mouseout", graphMouseOut)
		.on('click', (d)=> { window.open('http://www.google.com/search?q='+d['displayName']); });
}

// adds x-axis label to bar charts, defining what's being measured
function addXAxisLabel(chart, text) {
	chart.append("text")             
		.attr("transform", "translate(" + ((graph_width-margin.left)/2) + " ," + (graph_height + margin.top + 50) + ")")
    	.style("text-anchor", "middle")
    	.attr('class','text')
    	.text(text);
}