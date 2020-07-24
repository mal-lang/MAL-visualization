var svg = d3.select('svg');

var g = svg.append("g")

var width = svg.attr("width")
var height = svg.attr("height");
var graph = {}

var boxWidth = 300
var labelHeight = 40
var attackStepHeight = 30
var sideMargin = 75

var colors = [
//	[Dark shade, light shade]
	["#D3367D", "#E072A4"],
	["#264D7D", "#447EC5"],
	["#519F2D", "#B0E298"],
	["#553A49", "#9C6D87"]
]

var root = {"children":[{"name":"Network","children":[{"name":"access","type":"or","targets":[{"name":"connect","entity_name":"Host","size":4000}]}]},{"name":"Host","children":[{"name":"connect","type":"or","targets":[{"name":"access","entity_name":"Host","size":4000}]},{"name":"authenticate","type":"or","targets":[{"name":"access","entity_name":"Host","size":4000}]},{"name":"guessPassword","type":"or","targets":[{"name":"guessedPassword","entity_name":"Host","size":4000}]},{"name":"guessedPassword","type":"or","targets":[{"name":"authenticate","entity_name":"Host","size":4000}]},{"name":"access","type":"and","targets":[]}]},{"name":"User","children":[{"name":"attemptPhishing","type":"or","targets":[{"name":"phish","entity_name":"User","size":4000}]},{"name":"phish","type":"or","targets":[{"name":"obtain","entity_name":"Password","size":4000}]}]},{"name":"Password","children":[{"name":"obtain","type":"or","targets":[{"name":"authenticate","entity_name":"Host","size":4000}]}]}],"associations":[{"source":"Network","target":"Host"},{"source":"Host","target":"Password"},{"source":"User","target":"Password"}]}

initialize(root);
set_id(root);
var relations = makeRelations(root);
setAssociationId(root);

var simulation = d3.forceSimulation(root.children)
	.force('link', d3.forceLink().links(root.associations))
	.force('center', d3.forceCenter(width/2, height/2))
    .force('collide', d3.forceCollide(180))
	.on('tick', ticked)

svg.call(d3.zoom()
	.extent([[0, 0], [width, height]])
	.scaleExtent([-8, 8])
	.on("zoom", zoomed));

function zoomed() {
	g.attr("transform", d3.event.transform);
}

var buttons = d3.select('div')
	.selectAll('.button')
	.data(root.children)
	.enter()
	.append("div")
	.attr("style", "width: 100%")
	.append("label")
	.attr("font-family", "Arial")
	.text(function(d) {return d.name})
	.append("input")
    .attr("checked", true)
    .attr("type", "checkbox")
    .attr("id", function(d,i) { return 'a'+i; })
	.on("click", function(d) {
		d.hidden = !d.hidden
		update()
	})

graph.association = g.selectAll('.association')
graph.asset = g.selectAll('.asset')
graph.attackPath = g.selectAll('.attackpath')

update()

function update() {
	//Lines for associations
	graph.association = graph.association.data(root.associations)
	graph.association.exit().remove()
	graph.association = graph.association.enter()
		.append('line')
		.attr('stroke-width', 2)
		.style('stroke', 'grey')
		.attr('class', function(d) {
			return "association association_" + d.source.name + 
				" association_" + d.target.name
		})
		.merge(graph.association)
		.attr("visibility", function(d) {
			return d.source.hidden || d.target.hidden ? "hidden" : "visible"
		})

	graph.asset = graph.asset.data(root.children)
	graph.asset.exit().remove()
	graph.asset = graph.asset.enter()
		.append(createAssetBox).merge(graph.asset)
		.attr("visibility", function(d) { return d.hidden ? "hidden" : "visible" })
		/*
		.on("mouseover", function(d) {
			//Visibility and opacity to focus an Asset
			d3.selectAll('.asset_path').attr("visibility","hidden")
			d3.selectAll('.asset_path_' + d.name).attr("visibility","visible")
			d3.selectAll('.asset').attr("opacity", "0.2")
			d3.selectAll('.asset_' + d.name).attr("opacity","1.0")
			d3.selectAll('.association').attr("opacity", "0.0")
			d3.selectAll('.association_' + d.name).attr("opacity", "1.0")
		})
		.on("mouseout", function(d) {
			d3.selectAll('.asset_path').attr("visibility","visible")
			d3.selectAll('.asset').attr("opacity", "1.0")
			d3.selectAll('.association').attr("opacity", "1.0")
		})
		*/

	graph.attackPath = graph.attackPath.data(relations)
	graph.attackPath.exit().remove()
	graph.attackPath = graph.attackPath.enter()
		.append(function(d) {
			if(d.source.entity.name == d.target.entity.name) {
				return document.createElement('path')
			}
			var path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
			path.setAttributeNS(null, 'stroke-width', 1.1)
			path.setAttributeNS(null, 'stroke', 'black')
			path.setAttributeNS(null, 'fill', 'transparent')
			path.setAttributeNS(null, 'marker-end', 'url(#arrow)')
			path.setAttributeNS(null, 'class', 'asset_path' +
									' asset_path_' + d.source.entity.name + 
									" asset_path_" + d.target.entity.name)
			return path
		})
		.merge(graph.attackPath)
		.attr("visibility", function(d) {
			return d.source.entity.hidden || d.target.entity.hidden ? "hidden" : "visible"
		})


	var drag = d3.drag()
		.on("start", draggedStart)
		.on("drag", dragged)
		.on("end", draggedEnd)

	graph.asset.call(drag)
	
	simulation.nodes(root.children);
	simulation.force('link', d3.forceLink().links(root.associations).strength(0.01))
	simulation.restart();
}

function ticked() {
	//Update Association link position
	graph.association.attr('x1', function(d) {
			return d.source.x
		})
		.attr('y1', function(d) {
			return d.source.y + (30 * d.source.children.length + 40)/2
		})
		.attr('x2', function(d) {
			return d.target.x
		})
		.attr('y2', function(d) {
			return d.target.y + (30 * d.target.children.length + 40)/2
		})
		
	//Update Asset position
	graph.asset.attr('transform', function(d) {
		return 'translate(' + (d.x - boxWidth/2) + ',' + d.y + ')';
	})
	
    //Update Attack path position
	graph.attackPath.attr('d', function(d) {
		if(d.source.entity.name == d.target.entity.name) {
			return
		}
        var controllBend = 125
		//Decide if connect to Attack Steps on left or right side
		if(Math.abs(d.source.entity.x - 
					d.target.entity.x) < boxWidth/2) {
			if(d.source.entity.x < width/2) {
				var x1 = d.source.entity.x - boxWidth/2
				var x2 = d.target.entity.x - boxWidth/2 - 5
				var c1 = x1 - controllBend
				var c2 = x2 - controllBend
			} else {
				var x1 = d.source.entity.x + boxWidth/2
				var x2 = d.target.entity.x + boxWidth/2 + 5
				var c1 = x1 + controllBend
				var c2 = x2 + controllBend
			}
		}
		else if(d.source.entity.x - d.target.entity.x > 0) {
			var x1 = d.source.entity.x - boxWidth/2
			var x2 = d.target.entity.x + boxWidth/2 + 5
			var c1 = x1 - controllBend
			var c2 = x2 + controllBend
		} else {
			var x1 = d.source.entity.x + boxWidth/2
			var x2 = d.target.entity.x - boxWidth/2 - 5
			var c1 = x1 + controllBend
			var c2 = x2 - controllBend
        }
		var y1 = d.source.entity.y + 
				(d.source.index * attackStepHeight) + 12 + labelHeight
		var y2 = d.target.entity.y + 
				(d.target.index * attackStepHeight) + 12 + labelHeight

		return "M " + x1 + " " + y1 + 
			" C " + c1 + " " + y1 + " " + 
			c2 + " " + y2 + " " + x2 + " " + y2
	})
}

//Function taking an asset object and returning a SVG element
function createAssetBox(d) {
    if(!d.children) {
        d.children = []
    }
	var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

	//Boundning rectangle
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
	rect.setAttributeNS(null, 'fill', colors[d.id%colors.length][0])
    rect.setAttributeNS(null, 'width', boxWidth)
	rect.setAttributeNS(
		null, 
		'height', 
		attackStepHeight * d.children.length + labelHeight)
	rect.setAttributeNS(null, 'rx', 5)
	rect.setAttributeNS(null, 'ry', 5)
	group.appendChild(rect)

	//Asset name
	var label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
	label.textContent = d.name;
	label.setAttributeNS(null, 'font-size', '1.25em')
	label.setAttributeNS(null, 'x', boxWidth/2)
	label.setAttributeNS(null, 'y', 25)
	label.setAttributeNS(null, 'text-anchor', 'middle')
	label.setAttributeNS(null, 'font-family', 'Arial')
	label.setAttributeNS(null, 'fill', 'white')
	group.appendChild(label)
	for(step in d.children) {
		var attackStep = d.children[step]
        attackStep.index = parseInt(step)
		//Rectangle for each Attack Step
		var asbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		asbox.setAttributeNS(null, 'fill', colors[d.id%colors.length][1])
		asbox.setAttributeNS(null, 'x', 0)
		asbox.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight)
		asbox.setAttributeNS(null, 'width', boxWidth)
		asbox.setAttributeNS(null, 'height', attackStepHeight - 5)
		asbox.setAttributeNS(null, 'class', 'asset_' + d.name)
		group.append(asbox)
		//Name of each Attack Step
		var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
		if(attackStep.type == "or") {
			text.textContent = "| " + attackStep.name;
		} else if(attackStep.type == "and") {
			text.textContent = "& " + attackStep.name;
		} else {
			text.textContent = attackStep.name;
		}
		if(text.textContent.length > 19) {
			text.textContent = text.textContent.substring(0, 16) + "..."
		}
		text.setAttributeNS(null, 'x', boxWidth/2)
		text.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight + 17)
		text.setAttributeNS(null, 'text-anchor', 'middle')
		text.setAttributeNS(null, 'font-family', 'Arial')
		text.setAttributeNS(null, 'fill', 'black')
		group.appendChild(text)
    }
    
	//Draw internal Attack paths
	for(step in d.children) {
        var attackStep = d.children[step]
		for(child in attackStep.targets) {
            relation = attackStep.target_steps[child]
			if(attackStep.entity.name == relation.entity.name) {
				var line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
				var ys = (attackStep.index * attackStepHeight + labelHeight + 12)
				var yt = (relation.index * attackStepHeight + labelHeight + 12)
                var bend = 8
				if(attackStep.index < relation.index) {
					var start = "M " + (boxWidth-sideMargin) + " " + ys + " "
					var c1 = "" + ((boxWidth-sideMargin) + 20 + 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + ys
					var c2 = "" + ((boxWidth-sideMargin) + 20 + 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + yt
					var end = (boxWidth - sideMargin + 5) + " " + yt
				} else {
					var start = "M " + sideMargin + " " + ys + " "
					var c1 = "" + ((sideMargin) - 20 - 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + ys
					var c2 = "" + ((sideMargin) - 20 - 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + yt
                    var end = (sideMargin - 5) + " " + yt
				}
				line.setAttributeNS(null, 'd', start + " C " + c1 + " " + c2 + " " + end)
				line.setAttributeNS(null, 'stroke-width', 1.1)
				line.setAttributeNS(null, 'stroke', 'black')
				line.setAttributeNS(null, 'fill', 'transparent')
				line.setAttributeNS(null, 'marker-end', 'url(#arrow)')
				group.appendChild(line)
			}
		}
    }

	return group
}

function draggedStart(d) {
	simulation.alphaTarget(1.0).restart()
	d.fixed = true
	d.fx = d.x
	d.fy = d.y
}

function dragged(d) {
	d.fx = d3.event.x
	d.fy = d3.event.y
}

function draggedEnd(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fixed = false
}

// Returns a list of all nodes under the root.
function set_id(root) {
    i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        node.show = false
        node.selected = false
    }

    recurse(root);
}

function setAssociationId(root) {
	idMap = {}
	if (root.children) {
        root.children.forEach(function(entity, i) {
			idMap[entity.name] = i
		})
	}
	if (root.associations) {
        root.associations.forEach(function(association) {
			association.source = idMap[association.source]
			association.target = idMap[association.target]
		})
	}
}

function makeRelations(root) {
    relations = []
    if (root.children) {
        root.children.forEach(function(entity) {
            if (entity.children) {
                entity.children.forEach(function(attackStep) {
                    if (attackStep.target_steps) {
                        attackStep.target_steps.forEach(function(target) {
                            relation = {source: attackStep, target: target}
                            relations.push(relation)
                        })
                    }
                })
            }
        })
    }
    return relations
}

function initialize(root) {

    nodes = []
    nodes.push(root);
    root.opacity = 0.0
    if (root.children) {
        root.children.forEach(function(entity) {
            entity.hidden = false;
            nodes.push(entity);
            if (entity.children) {
                entity.children.forEach(function(attack_step) {
                    attack_step.target_steps = []
                    attack_step.source_steps = []
                    attack_step.entity = entity
                    attack_step.hidden = false;
                    nodes.push(attack_step);
                })
            }
        })
    }

    if (root.children) {
        root.children.forEach(function(entity) {
            if (entity.children) {
                entity.children.forEach(function(attack_step) {
                    //attack_step.color = color(entity.name)
                    attack_step.opacity = 1
                    if (attack_step.targets) {
                        attack_step.targets.forEach(function(target_ref) {
                            var target = nodes.filter(function(attack_step) {
								return attack_step.name == target_ref.name && 
									attack_step.entity.name == target_ref.entity_name;
                            })[0]
                            if (target) {
                                attack_step.target_steps.push(target)
                                target.source_steps.push(attack_step)
                            }
                        })
                    }
                    //entity.color = color(entity.name)
                    entity.opacity = 0.75
                })
            }
        })
    }
}
