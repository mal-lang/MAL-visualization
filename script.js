var svg = d3.select('svg');

var width = svg.attr("width")
var height = svg.attr("height");
var graph = {}

var colors = [
//	[Dark shade, light shade]
	["#D3367D", "#E072A4"],
	["#264D7D", "#447EC5"],
	["#519F2D", "#B0E298"],
	["#553A49", "#9C6D87"]
]

var assets = [
	{
		name: "Network",
		attackSteps: [
			{name: "| access"}
		],
		color: 0
	},
	{
		name: "Host",
		attackSteps: [
			{name: "| connect"},
			{name: "| authenticate"},
			{name: "| guessPassword"},
			{name: "| guessedPassword"},
			{name: "& access"}
		],
		color: 1
	},
	{
		name: "Password",
		attackSteps: [
			{name: "| obtain"}
		],
		color: 2
	},
	{
		name: "User",
		attackSteps: [
			{name: "| attemptPhishing"},
			{name: "| phish"}
		],
		color: 3
	}
]

var associations = [
	{source: 0, target: 1, sdata: assets[0], tdata: assets[1]},
	{source: 1, target: 2, sdata: assets[1], tdata: assets[2]},
	{source: 1, target: 3, sdata: assets[1], tdata: assets[3]},
]

var simulation = d3.forceSimulation(assets)
	.force('link', d3.forceLink().links(associations).distance(300))
	.force('center', d3.forceCenter(width/2, height/2))
	.force('charge', d3.forceManyBody().strength(-1000))
	.on('tick', ticked)

//Lines for associations
graph.association = d3.select('svg')
	.selectAll('line')
	.data(associations)
	.enter()
graph.associationLink = graph.association.append('line')

//SVG groups (g) for the assets
graph.asset = d3.select('svg')
	.selectAll('g')
	.data(assets)
	.enter()
	.append('g')
graph.assetBox = graph.asset.append(createAssetBox)

function ticked() {
	//Update Association link position
	graph.associationLink.attr('stroke-width', 2)
		.style('stroke', 'black')
		.attr('x1', function(d) {
		return d.source.x + 100
		})
		.attr('y1', function(d) {
		return d.source.y + (30 * d.sdata.attackSteps.length + 40)/2
		})
		.attr('x2', function(d) {
		return d.target.x + 100
		})
		.attr('y2', function(d) {
		return d.target.y + (30 * d.tdata.attackSteps.length + 40)/2
		})

	//Update Asset position
	graph.asset.attr('transform', function(d) {
		return 'translate(' + d.x + ',' + d.y + ')';
	});
}

//Function taking an asset object and returning a SVG element
function createAssetBox(d) {
	var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

	//Boundning rectangle
	var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
	rect.setAttributeNS(null, 'fill', colors[d.color][0])
	rect.setAttributeNS(null, 'width', 200)
	rect.setAttributeNS(null, 'height', 30 * d.attackSteps.length + 40)
	rect.setAttributeNS(null, 'rx', 5)
	rect.setAttributeNS(null, 'ry', 5)
	group.appendChild(rect)

	//Asset name
	var label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
	label.textContent = d.name;
	label.setAttributeNS(null, 'font-size', '1.25em')
	label.setAttributeNS(null, 'x', 100)
	label.setAttributeNS(null, 'y', 25)
	label.setAttributeNS(null, 'text-anchor', 'middle')
	label.setAttributeNS(null, 'font-family', 'Arial')
	label.setAttributeNS(null, 'fill', 'white')
	group.appendChild(label)

	for(step in d.attackSteps) {
		attackStep = d.attackSteps[step]
		//Rectangle for each Attack Step
		var asbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		asbox.setAttributeNS(null, 'fill', colors[d.color][1])
		asbox.setAttributeNS(null, 'x', 5)
		asbox.setAttributeNS(null, 'y', step * 30 + 40)
		asbox.setAttributeNS(null, 'width', 190)
		asbox.setAttributeNS(null, 'height', 25)
		group.append(asbox)
		//Name of each Attack Step
		var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
		text.textContent = attackStep.name;
		text.setAttributeNS(null, 'x', 100)
		text.setAttributeNS(null, 'y', step * 30 + 57)
		text.setAttributeNS(null, 'text-anchor', 'middle')
		text.setAttributeNS(null, 'font-family', 'Arial')
		text.setAttributeNS(null, 'fill', 'black')
		group.appendChild(text)
	}
	return group
}
