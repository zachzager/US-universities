//
// mapApp.js
//

// page title initialization
let title = d3.select(".title").html("Top Universities in the USA");
let subtitle = d3.select(".description").html("This tool is designed to help you choose a university to attend in the United States based on data from 2018. Select a state to view the top schools ranked by several categories. By default, the charts show the top 30 schools based on US News' annual rankings. Place your cursor over the bars on the graphs for more information about individual schools. It should be noted that this tool does not include America's many colleges that do not have university status. The data used in this tool is from Kaggle user Christopher Lambert's <a href='https://www.kaggle.com/theriley106/university-statistics'>\"University Statistics\"</a> dataset via US News & World Report.");
let credits = d3.select(".credits").html("<div>April 26, 2018 // <a href='https://zachzager.wixsite.com/portfolio'>Zach Zager</a>, <a href='https://www.linkedin.com/in/jingleizuo/'>Jinglei Zuo</a>, and <a href='https://www.linkedin.com/in/%E5%8F%AF-%E5%85%B0-a4247a142/'>Ke \"Coco\" Lan</a></div>");

/* Modal */
let modal = document.getElementById('myModal'); // Get the modal
let span = document.getElementsByClassName("close")[0]; // Get the <span> element that closes the modal

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// Close modal when the user clicks anywhere else on the page
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
/* */

// user selection tracker initialization
let selectedSchools = [];
let selectionTracker = d3.select(".school-list")
	.html("My Schools (<span id='schoolCount'>"+selectedSchools.length+"</span>)")
	.on('click',showModal);

// opens the modal and places all of the selected schools onto it
function showModal() {
	modal.style.display = "block";
	let modalBody = d3.select('.modal-body');
	modalBody.selectAll('*').remove();
	modalBody.append('div')
		.attr('class','text modal-title')
		.html("Selected Schools")
		.enter();

	let modalBodyContent = modalBody.append('div').attr('class','modal-body-content')

	for (item in selectedSchools) { // place all selected schools onto modal
		let d = selectedSchools[item];
		let link = "http://www.google.com/search?q="+d['displayName'].split(' ').join('+');

		let modalBodyContentData = "<div class='modal-school-title center'>"+"<a href="+link+">"+d['displayName']+"</a></div>\
			<div class='modal-school-subtitle center'>"+d['city']+', '+d['state']+"</div><div class='modal-school-body'>";

		// format overall rank
		if (d['overallRank'] != null && d['overallRank'] > 0) {
			modalBodyContentData += "<div>Overall Rank: "+d['overallRank']+"</div>";
		} else {
			modalBodyContentData += "<div>Overall Rank: Not Ranked</div>";
		}

		// format ACT score
		if (d['act-avg'] != null) {
			modalBodyContentData += "<div>Average ACT Score: "+d['act-avg']+"</div>";
		}

		// enrollment
		if (d['enrollment'] != null) {
			modalBodyContentData += "<div>Enrollment: "+d['enrollment']+"</div>";
		}

		// format tuition
		if (d['tuition'] != null) {
			modalBodyContentData += "<div>Tuition: $"+d['tuition'];
		}

		// format cost after aid
		if (d['cost-after-aid'] != null) {
			modalBodyContentData += " ($"+d['cost-after-aid']+" after aid)</div>";
		} else {
			modalBodyContentData += "</div>";
		}

		// format acceptance rate
		if (d['acceptance-rate'] != null) {
			modalBodyContentData += "<div>Acceptance Rate: "+d['acceptance-rate']+"%</div>";
		}

		// add image and click instruction
		modalBodyContentData += "<img onerror='this.src=\"img/collegeCap.png\"' class='thumbnail' src="+d['primaryPhotoThumb']+"></data>";
		
		modalBodyContent.append('div')
			.attr('class','text modal-school')
			.html(modalBodyContentData);
	}
}

function incrementSchoolCount() {	
	d3.select('#schoolCount').html(selectedSchools.length);
}

// add selected school to list after confirming that it is not a duplicate
function addSelectedSchoolToList(school) {
	for (items in selectedSchools) {
		if (school['displayName'] === selectedSchools[items]['displayName']) {
			return;
		}
	}
	selectedSchools.push(school);
}

let stateCountList = {};
// creates tallied list of how many schools are in each state
function tallyStates(schools) {
	for (let i = 0; i < schools.length; i++) {
		if (schools[i].state in stateCountList) {
			stateCountList[schools[i].state]++;
		} else {
			stateCountList[schools[i].state] = 1;
		}
	}

	// store values in rateByState, converting state names to state codes
	for (state in stateCountList) {
		rateByState.set(stateCodes[state],stateCountList[state]);
	}
}

// return max and min counts of the stateCountList
function getMaxAndMinCounts() {
	let valList = Object.values(stateCountList);
	let counts = {
		'max': Math.max(...valList),
		'min': Math.min(...valList)
	}
	return counts;
}

// graph initialization
let userChoice = 'USA Top 30';
function setGraphTitles() {
	d3.select("#scores-title").html("Average ACT Scores: "+userChoice);
	d3.select("#tuition-title").text("Average Annual Tuition: "+userChoice);
	d3.select("#acceptance-title").text("Acceptance Rate: "+userChoice);
	d3.select("#enrollment-title").text("Number of Students: "+userChoice);
}
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
let hoveredStateFill;

// draws map on page
function drawMap(us,schools){
  	// let maxCount = tallyStates(schools);
  	tallyStates(schools);
  	let maxAndMinCounts = getMaxAndMinCounts();
  	console.log(maxAndMinCounts.max);
  	let color = d3.scaleLinear().domain([1,maxAndMinCounts.max])
    	.interpolate(d3.interpolateHcl)
    	.range([d3.rgb('#cfcfe8'), d3.rgb('#010182')]);

    d3.select('#maplegend-label')
    	.html("Number of Schools");

    d3.select('.maplegend-info')
    	.html("<div class='maplegend-label'>"+maxAndMinCounts.min+"</div><div id='maplegend-color'></div><div class='maplegend-label'>"+maxAndMinCounts.max+"</div>");

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
	    	// show tooltip
	    	tooltip.html("<div class='tooltip-title center'>"+stateCodesToName[d.id]+"</div><div class='center'>"
	    		+stateCountList[stateCodesRev[d.id]]+" "+getNumSchools(stateCountList[stateCodesRev[d.id]])+"</div>");
	    	tooltip.style("visibility", "visible");
	    })
	    .on("mousemove", (d)=>{ tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", (d)=>{ 
			tooltip.style("visibility", "hidden"); // hide tooltip
		})
		.on("click", selectState);

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
			clickedState.style('fill','#42e2f4');
			drawCharts(schools,stateCodesRev[d.id])
		}
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

	console.log(schools);

	// call chart drawing functions
	addBarChart(schools,acceptance,'acceptance-rate','Acceptance Rate','','%',false); // draw acceptance
  	addBarChart(schools,testScores,'act-avg','Average ACT Score','','',true); // draw ACT scores
  	addBarChart(schools,tuition,'tuition',"Annual Tuition",'$','',true); // draw tuition
  	addBarChart(schools,enrollment,'enrollment',"Number of Enrolled Students",'','',true); // draw enrollment
}

//
// Callback function for generating graph tool tips
//
function graphMouseOver(d) {
	d3.select(this).style('fill','#45b1cb'); // highlight hovered over bar

	let tooltipData = "<div class='tooltip-title center'>"+d['displayName']+"</div>\
		<div class='tooltip-subtitle center'>"+d['city']+', '+d['state']+"</div>";

	// format overall rank
	if (d['overallRank'] != null && d['overallRank'] > 0) {
		tooltipData += "<div>Overall Rank: "+d['overallRank']+"</div>";
	} else {
		tooltipData += "<div>Overall Rank: Not Ranked</div>";
	}

	// format ACT score
	if (d['act-avg'] != null) {
		tooltipData += "<div>Average ACT Score: "+d['act-avg']+"</div>";
	}

	// enrollment
	if (d['enrollment'] != null) {
		tooltipData += "<div>Enrollment: "+d['enrollment']+"</div>";
	}

	// format cost after aid
	if (d['cost-after-aid'] != null) {
		tooltipData += "<div>Tuition: $"+d['tuition']+" ($"+d['cost-after-aid']+" after aid)</div>";
	}

	// format acceptance rate
	if (d['acceptance-rate'] != null) {
		tooltipData += "<div>Acceptance Rate: "+d['acceptance-rate']+"%</div>";
	}

	// add image and click instruction
	tooltipData += "<img onerror='this.src=\"img/collegeCap.png\"' class='thumbnail' src="+d['primaryPhotoThumb']+">\
		<div class='text click-instruction'>Click to add to your school list</div>";

	tooltip.html(tooltipData);
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
		.on('click', (d)=> { 
			addSelectedSchoolToList(d);
			incrementSchoolCount();
			//window.open('http://www.google.com/search?q='+d['displayName']);
		});
}

// adds x-axis label to bar charts, defining what's being measured
function addXAxisLabel(chart, text) {
	chart.append("text")             
		.attr("transform", "translate(" + ((graph_width-margin.left)/2) + " ," + (graph_height + margin.top + 50) + ")")
    	.style("text-anchor", "middle")
    	.attr('class','text')
    	.text(text);
}

