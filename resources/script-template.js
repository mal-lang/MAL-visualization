var svg = d3.select('svg');

//Reset visibility on double click
svg.on("dblclick", function(){
	var menu = document.getElementById('clickMenu')
	if(menu != null) {
		menu.remove()
	}
	d3.selectAll(".attackPath").attr('opacity', 1.0)
	d3.selectAll(".attackStep").attr('opacity', 1.0)
	d3.selectAll(".asset").attr('opacity', 1.0)
	d3.selectAll(".association").attr('opacity', 1.0)
	d3.selectAll(".inheritance").attr('opacity', 1.0)
	d3.selectAll(".link").attr('opacity', 1.0)
	d3.selectAll(".link_path_association").attr('opacity', 1.0)
})
var g = svg.append("g")

var width = svg.attr("width")
var height = svg.attr("height");
var graph = {}

//Asset box numbers
var boxWidth = 340
var labelHeight = 40
var attackStepHeight = 30
var sideMargin = 30
var arrowMargin = 85

var maxNameLength = prompt("Select asset width (default: 19)", 19)
boxWidth = boxWidth - (9*(19-maxNameLength))

//Colors
var colors = [
//	[Dark shade, light shade]
	["#264D7D", "#447EC5"],
	["#D3367D", "#E072A4"],
	["#519F2D", "#B0E298"],
	["#553A49", "#9C6D87"],
	["#DD5E03", "#FEAC72"]
]

var root = {{JSON}}

//Set category indices
var categories = {}
var numCategories = 0
root.children.forEach(function(element) {
	if (categories[element.category] == undefined) {
		var category = {
			name: element.category,
			index: numCategories++
		}
		categories[element.category] = category
	}
})

//Initialize data. Functions are defined in initialize.js
initialize(root);
set_id(root);
setAssociationId(root);
var isa = makeIsa(root);
var relations = makeRelations(root);
var relations2 = setRelationAssociations(relations, root.associations);
var links = makeLinks(relations2)

//Create map for asset lookup
var assetMap = {}
if(root.children) {
	root.children.forEach(function(a) {
		assetMap[a.name] = a 
	})
}

//Create map for relation lookup
var relationMap = {}
if(relations) {
	relations.forEach(function(d) {
		relationMap[getPathId(d)] = d
	})
}

var simulation = d3.forceSimulation(root.children)
	.force('link', d3.forceLink().links(root.associations).strength(0.01))
	//.force('center', d3.forceCenter(width/2, height/2))
	.force('collide', d3.forceCollide(200))
	.force('x', d3.forceX(width/2).strength(0.0125))
    .force('y', d3.forceY(height/2).strength(0.0275))
	.on('tick', ticked)

//Zoom and pan
svg.call(d3.zoom()
	.extent([[0, 0], [width, height]])
	.scaleExtent([-8, 8])
	.on("zoom", zoomed))
    .on("dblclick.zoom", null)

function zoomed() {
    g.attr("transform", d3.event.transform);
}

//Side menu
d3.select('#menu')
	.selectAll('.label')
	.data([{text: "MAL-Visualizer"}])
	.enter()
	.append("h4")
	.text(function(d) {
		return d.text
	})
	.attr("class", "font")

//Hide assets button
var hide = true;
var hideAssets = d3.select('#menu')
	.selectAll('.hideButton')
	.data([{text: "Hide assets on trace"}])
	.enter()
	.append("label")
	.attr("class", "font")
	.text(function(d) {
		return d.text
	})
	.append("input")
    .attr("checked", true)
    .attr("type", "checkbox")
	.on("click", function(d) {
		hide = !hide
	})

//Hide category buttons
if(Object.keys(categories)[0] != "undefined") {
	var categoryButtons = d3.select('#assetMenu')
		.selectAll('.catButton')
		.data(Object.keys(categories).map(function(d) {
			return { name: d, hidden: false }
		}))
		.enter()
		.append("div")
		.attr("style", function(d) {
			return "position: relative; width: 100%; background-color: " + colors[categories[d.name].index % colors.length][1];
		})
		.append("label")
		.attr("class", "font")
		.text(function(d) {
			if(d.name.length > 17) {
				return d.name.substring(0, 16) + "..."
			}
			return d.name
		})
		.append("input")
		.attr("checked", true)
		.attr("type", "checkbox")
		.attr("style", "position: absolute; right:0px")
		.attr("id", function(d,i) { return 'a'+i; })
		.on("click", function(d) {
			d.hidden = !d.hidden
			if(root.children) {
				root.children.forEach(function(asset) {
					if(asset.category == d.name) {
						document.getElementById('asset_checkbox_' + asset.name).checked = !d.hidden
						asset.hidden = d.hidden
					}
				})
			}
			update()
		})
}

//Margin
d3.select('#assetMenu').append("div").attr("style", "width: 100%; height: 5px")

//Hide asset buttons
var buttons = d3.select('#assetMenu')
	.selectAll('.button')
	.data(root.children)
	.enter()
	.append("div")
	.attr("style", function(d) {
		return "position: relative; width: 100%; background-color: " + colors[categories[d.category].index % colors.length][1];
	})
	.append("label")
	.attr("class", "font")
	.attr('title', function(d) {
		return d.name
	})
	.text(function(d) {
		if(d.name.length > 17) {
			return d.name.substring(0, 16) + "..."
		}
		return d.name
	})
	.append("input")
    .attr("checked", true)
	.attr("type", "checkbox")
	.attr("style", "position: absolute; right:0px")
    .attr("id", function(d) {
		return 'asset_checkbox_' + d.name;
	})
	.on("click", function(d) {
		d.hidden = !d.hidden
		update()
	})

//Export button
var exportButton = d3.select('#exportMenu')
	.selectAll('.exportButton')
	.data([{text: "Export"}])
	.enter()
	.append("button")
	.attr("style", "width: 170px; height: 30px")
	.text(function(d) {
		return d.text
	})
	.attr("onclick", "export_svg()")

//Visual representations
graph.association = g.selectAll('.association')
graph.isa = g.selectAll('.isa')
graph.asset = g.selectAll('.asset')
graph.attackPath = g.selectAll('.attackpath')
graph.aLink = g.selectAll('.aLink')
graph.iLink = g.selectAll('.iLink')

update()
setChildrenAndParents()

//Helper function to append class to svg/html element
function appendClass(element, newClass) {
	var oldClass = element.getAttributeNS(null, 'class')
	if(oldClass) {
		if(!oldClass.split(" ").includes(newClass)) {
			element.setAttributeNS(
				null, 
				'class', 
				oldClass + " " + newClass
			)
		}
	}
}

//Set class attributes to keep track of parents and children
function setChildrenAndParents() {
	if(relations) {
		relations.forEach(function(r) {
			var target = document.getElementById(r.target.entity.name + "_" + r.target.name)
			appendClass(target, "child_to_" + r.source.entity.name + "_" + r.source.name)

			var source = document.getElementById(r.source.entity.name + "_" + r.source.name)
			appendClass(source, "parent_to_" + r.target.entity.name + "_" + r.target.name)

			var targetAsset = document.getElementById('asset_' + r.target.entity.name)
			appendClass(targetAsset, "child_to_" + r.source.entity.name + "_" + r.source.name)
			appendClass(targetAsset, "parent_to_" + r.target.entity.name + "_" + r.target.name)
			
			var sourceAsset = document.getElementById('asset_' + r.source.entity.name)
			appendClass(sourceAsset, "child_to_" + r.source.entity.name + "_" + r.source.name)
			appendClass(sourceAsset, "parent_to_" + r.target.entity.name + "_" + r.target.name)
		})
	}
	if(relations2) {
		relations2.forEach(function(r) {
			if(r.associations) {
				r.associations.forEach(function(a, i) {
					associationElem = document.getElementById(getAssociationId(a))
					appendClass(associationElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(associationElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)
					linkElem = document.getElementById(
						"link_" + getAssociationId(a) + 
						"_" + getPathId({source: r.source, target: r.target})
					)
					appendClass(linkElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(linkElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)
					
					var a1 = document.getElementById('asset_' + a.source.name)
					appendClass(a1, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(a1, "parent_to_" + r.target.entity.name + "_" + r.target.name)

					var a2 = document.getElementById('asset_' + a.target.name)
					appendClass(a2, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(a2, "parent_to_" + r.target.entity.name + "_" + r.target.name)
				})
			} else if(r.link) {
				r.link.forEach(function(l, i) {
                    if(i+1 < r.link.length) {
						isaElem = document.getElementById("inheritance_" + 
							r.link[i] + "_" +
							r.link[i+1]
						)
						appendClass(isaElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
						appendClass(isaElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)

						linkElem = document.getElementById(
							"link_" + getInheritanceId({subAsset: {name: r.link[i]}, superAsset: {name: r.link[i+1]}}) + 
							"_" + getPathId({source: r.source, target: r.target})
						)
						appendClass(linkElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
						appendClass(linkElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)
					}
					var a1 = document.getElementById('asset_' + l)
					appendClass(a1, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(a1, "parent_to_" + r.target.entity.name + "_" + r.target.name)
				})
			}
		})
	}

	if(root.children) {
		root.children.forEach(function(asset) {
			if(asset.children) {
				asset.children.forEach(function(attackStep) {
					var traversed = {}
					traversed[attackStep.entity.name + "_" + attackStep.name] = true
					childrenRecurse(attackStep, attackStep, traversed)
	
					traversed = {}
					traversed[attackStep.entity.name + "_" + attackStep.name] = true
					parentRecurse(attackStep, attackStep, traversed)
				})
			}
		})
	}
}

//Recursively set child class attributes
function childrenRecurse(base, attackStep, traversed) {
	var assetElem = document.getElementById('asset_' + attackStep.entity.name)
	appendClass(assetElem, "rec_child_to_" + base.entity.name + "_" + base.name)
	if(attackStep.target_steps) {
		attackStep.target_steps.forEach(function(child) {
			var childElem = document.getElementById(child.entity.name + "_" + child.name)
			appendClass(childElem, "rec_child_to_" + base.entity.name + "_" + base.name)
			
			var path_id = 'path_' + attackStep.entity.name + "_" + attackStep.name +
				"_" + child.entity.name + "_" + child.name
			var pathElem = document.getElementById(path_id)
			appendClass(pathElem, "rec_child_to_" + base.entity.name + "_" + base.name)
			if(relationMap[path_id]) {
				association = relationMap[path_id].associations
				link = relationMap[path_id].link
				if(association) {
					association.forEach(function(a, i) {
						if(attackStep.entity.name != child.entity.name) {
							var associationElem = document.getElementById(getAssociationId(a))
							appendClass(associationElem, "rec_child_to_" + base.entity.name + "_" + base.name)
							linkElem = document.getElementById(
								"link_" + getAssociationId(a) + 
								"_" + getPathId({source: attackStep, target: child})
							)
							appendClass(linkElem, "rec_child_to_" + base.entity.name + "_" + base.name)

							var a1 = document.getElementById('asset_' + a.source.name)
							appendClass(a1, "rec_child_to_" + base.entity.name + "_" + base.name)

							var a2 = document.getElementById('asset_' + a.target.name)
							appendClass(a2, "rec_child_to_" + base.entity.name + "_" + base.name)
						}
					})
				} else if(link) {
					link.forEach(function(l, i) {
						if(i+1 < link.length) {
							isaElem = document.getElementById("inheritance_" + 
								link[i] + "_" +
								link[i+1]
							)
							appendClass(isaElem, "rec_child_to_" + base.entity.name + "_" + base.name)

							linkObj = {
								subAsset: {name: link[i]},
								superAsset: {name: link[i+1]}
							}
							linkElem = document.getElementById(
								"link_" + getInheritanceId(linkObj) + 
								"_" + getPathId({source: attackStep, target: child})
							)
							appendClass(linkElem, "rec_child_to_" + base.entity.name + "_" + base.name)
						}
						var a1 = document.getElementById('asset_' + l)
						appendClass(a1, "rec_child_to_" + base.entity.name + "_" + base.name)
					})
				}
			}
			if(!traversed[child.entity.name + "_" + child.name]) {
				traversed[child.entity.name + "_" + child.name] = true
				childrenRecurse(base, child, traversed)
			}
		})
	}
}

//Recursively set parent class attributes
function parentRecurse(base, attackStep, traversed) {
	var assetElem = document.getElementById('asset_' + attackStep.entity.name)
	appendClass(assetElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
	if(attackStep.source_steps) {
		attackStep.source_steps.forEach(function(parent) {
			var parentElem = document.getElementById(parent.entity.name + "_" + parent.name)
			appendClass(parentElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
			
			var path_id = 'path_' + parent.entity.name + "_" + parent.name + "_" + attackStep.entity.name + "_" + attackStep.name
			var pathElem = document.getElementById(path_id)
			appendClass(pathElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

			if(relationMap[path_id]) {
				association = relationMap[path_id].associations
				link = relationMap[path_id].link
				if(association) {
					association.forEach(function(a, i) {
						if(parent.entity.name != attackStep.entity.name) {
							var associationElem = document.getElementById(getAssociationId(a))
							appendClass(associationElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
							linkElem = document.getElementById(
								"link_" + getAssociationId(a) + 
								"_" + getPathId({source: parent, target: attackStep})
							)
							appendClass(linkElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

							var a1 = document.getElementById('asset_' + a.source.name)
							appendClass(a1, "rec_parent_to_" + base.entity.name + "_" + base.name)

							var a2 = document.getElementById('asset_' + a.target.name)
							appendClass(a2, "rec_parent_to_" + base.entity.name + "_" + base.name)
						}
					})
				} else if(link) {
					link.forEach(function(l, i) {
						if(i+1 < link.length) {
							isaElem = document.getElementById("inheritance_" + 
								link[i] + "_" +
								link[i+1]
							)
							appendClass(isaElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

							linkObj = {
								subAsset: {name: link[i]},
								superAsset: {name: link[i+1]}
							}
							linkElem = document.getElementById(
								"link_" + getInheritanceId(linkObj) + 
								"_" + getPathId({source: parent, target: attackStep})
							)
							appendClass(linkElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
						}
						var a1 = document.getElementById('asset_' + l)
						appendClass(a1, "rec_parent_to_" + base.entity.name + "_" + base.name)
					})
				}
			}
			if(!traversed[parent.entity.name + "_" + parent.name]) {
				traversed[parent.entity.name + "_" + parent.name] = true
				parentRecurse(base, parent, traversed)
			}
		})
	}
}

function getAssociationId(d) {
    return "association_" + d.leftName + "_" + d.name + "_" + d.rightName
}

function getInheritanceId(d) {
    return "inheritance_" + d.subAsset.name + "_" + d.superAsset.name
}

function getPathId(d) {
	return "path_" + d.source.entity.name + "_" + d.source.name +
        "_" + d.target.entity.name + "_" + d.target.name
}

//Reset visibility when assets are shown/hidden
function update() {
    graph.association = graph.association.data(root.associations)
	graph.association.exit().remove()
	graph.association = graph.association.enter()
		.append('line')
		.attr('stroke-width', 3)
		.style('stroke', 'grey')
		.attr('class', 'association')
		.attr('id', function(d) {
			return getAssociationId(d)
		})
		.merge(graph.association)
		.attr("visibility", function(d) {
			return d.source.hidden || d.target.hidden ? "hidden" : "visible"
        })
	
    graph.isa = graph.isa.data(isa)
    graph.isa.exit().remove()
    graph.isa = graph.isa.enter()
        .append('polyline')
        .attr('stroke-width', 3)
		.style('stroke', 'grey')
		.style('fill', 'none')
		.attr('marker-mid', 'url(#arrow2)')
		.attr('class', 'inheritance')
        .attr('id', function(d) {
            return getInheritanceId(d)
        })
        .merge(graph.isa)
        .attr("visibility", function(d) {
            return d.subAsset.hidden || d.superAsset.hidden ? "hidden" : "visible"
		})

	graph.aLink = graph.aLink.data(links.aLinks)
	graph.aLink.exit().remove()
	graph.aLink = graph.aLink.enter()
		.append("line")
		.attr('stroke-width', 1.4)
		.style('stroke', 'blue')
		.style('stroke-dasharray', '5,5')
		.attr('class', 'link')
		.attr('id', function(d) {
			return "link_" + getAssociationId(d.association) + "_" + getPathId(d.path)
		})
		.merge(graph.aLink)
		.attr("visibility", function(d) {
			return d.path.source.entity.hidden || 
				d.path.target.entity.hidden ||
				d.association.source.hidden ||
				d.association.target.hidden ? "hidden" : "visible"
		})

	graph.iLink = graph.iLink.data(links.iLinks)
	graph.iLink.exit().remove()
	graph.iLink = graph.iLink.enter()
		.append("line")
		.attr('stroke-width', 1.4)
		.style('stroke', 'red')
		.style('stroke-dasharray', '5,5')
		.attr('class', 'link')
		.attr('id', function(d) {
			var link = {
				subAsset: {name: d.link.source},
				superAsset: {name: d.link.target},
			}
			return "link_" + getInheritanceId(link) + "_" + getPathId(d.path)
		})
		.merge(graph.iLink)
		.attr("visibility", function(d) {
			return d.path.source.entity.hidden || 
				d.path.target.entity.hidden ||
				assetMap[d.link.source].hidden ||
				assetMap[d.link.target].hidden ? "hidden" : "visible"
		})

    graph.asset = graph.asset.data(root.children)
    graph.asset.exit().remove()
    graph.asset = graph.asset.enter()
        .append(createAssetBox)
        .merge(graph.asset)
        .attr("visibility", function(d) { return d.hidden ? "hidden" : "visible" })

    var drag = d3.drag()
		.on("start", draggedStart)
		.on("drag", dragged)
		.on("end", draggedEnd)

    graph.asset.call(drag)
    
    graph.attackPath = graph.attackPath.data(relations2)
	graph.attackPath.exit().remove()
    graph.attackPath = graph.attackPath.enter()
        .append('path')
        .attr('stroke-width', 1.1)
        .attr('stroke', 'black')
        .attr('fill', 'transparent')
        .attr('marker-end', 'url(#arrow)')
        .attr('class', function(d) {
            return ' notClickable attackPath child_to_' + 
                d.source.entity.name + "_" + d.source.name + 
                ' parent_to_' + d.target.entity.name + "_" + d.target.name
        })
        .attr('id', function(d) {
            return getPathId(d)
        })
        .merge(graph.attackPath)
		.attr("visibility", function(d) {
			return d.source.entity.hidden || d.target.entity.hidden ? "hidden" : "visible"
		})
}

//Update positions on simulation and drag
function ticked() {
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
	
	graph.isa.attr('points', function(d){
		var x1 = d.subAsset.x
		var y1 = d.subAsset.y + (30 * d.subAsset.children.length + 40)/2
		var x2 = d.superAsset.x
		var y2 = d.superAsset.y + (30 * d.superAsset.children.length + 40)/2
		var xm = (x2-x1)/2 + x1
		var ym = (y2-y1)/2 + y1
		return "" + x1 + "," + y1 + " " + 
			xm + "," + ym + " " +
			x2 + "," + y2
	})
    
    graph.asset.attr('transform', function(d) {
        return 'translate(' + (d.x - boxWidth/2) + ',' + d.y + ')';
    })

    graph.attackPath.attr('d', function(d) {
		if(d.source.entity.name == d.target.entity.name) {
			return
		}
        var controllBend = 125
		//Decide if connect to Attack Steps on left or right side
		if(Math.abs(d.source.entity.x - 
					d.target.entity.x) < boxWidth/2) {
			if(d.source.entity.x < width/2) {
				var x1 = d.source.entity.x - boxWidth/2 + sideMargin
				var x2 = d.target.entity.x - boxWidth/2 + sideMargin - 5
				var c1 = x1 - controllBend
				var c2 = x2 - controllBend
			} else {
				var x1 = d.source.entity.x + boxWidth/2 - sideMargin
				var x2 = d.target.entity.x + boxWidth/2 - sideMargin + 5
				var c1 = x1 + controllBend
				var c2 = x2 + controllBend
			}
		}
		else if(d.source.entity.x - d.target.entity.x > 0) {
			var x1 = d.source.entity.x - boxWidth/2 + sideMargin
			var x2 = d.target.entity.x + boxWidth/2 - sideMargin + 5
			var c1 = x1 - controllBend
			var c2 = x2 + controllBend
		} else {
			var x1 = d.source.entity.x + boxWidth/2 - sideMargin
			var x2 = d.target.entity.x - boxWidth/2 + sideMargin - 5
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

    graph.aLink.each(function(d) {
        var link = d3.select(this)
        var path = document.getElementById("path_" + 
            d.path.source.entity.name + "_" + 
            d.path.source.name + "_" +
            d.path.target.entity.name + "_" + 
            d.path.target.name
        )
        var mid = path.getTotalLength() * 0.6
        var midPoint = path.getPointAtLength(mid)
        var x1 = midPoint.x
        var y1 = midPoint.y
        var association_id = getAssociationId(d.association)
        var association = document.getElementById(association_id)
        mid = association.getTotalLength() * 0.4
        midPoint = association.getPointAtLength(mid)
        link.attr('x1', x1)
        link.attr('y1', y1)
        link.attr('x2', midPoint.x)
        link.attr('y2', midPoint.y)
    })

    graph.iLink.each(function(d) {
        var link = d3.select(this)
        var path = document.getElementById("path_" + 
            d.path.source.entity.name + "_" + 
            d.path.source.name + "_" +
            d.path.target.entity.name + "_" + 
            d.path.target.name
        )
        var mid = path.getTotalLength() * 0.6
        var midPoint = path.getPointAtLength(mid)
        var x1 = midPoint.x
        var y1 = midPoint.y
        var inheritance_id = "inheritance_" + d.link.source + "_" + d.link.target
        var inheritance = document.getElementById(inheritance_id)
        mid = inheritance.getTotalLength() * 0.4
        midPoint = inheritance.getPointAtLength(mid)
        link.attr('x1', x1)
        link.attr('y1', y1)
        link.attr('x2', midPoint.x)
        link.attr('y2', midPoint.y)
    })
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

//Helper function making elements transparent
function removeMenuAndHide() {
	document.getElementById('clickMenu').remove()
	d3.selectAll('.asset').attr("opacity", "1.0")
	d3.selectAll('.attackStep').attr("opacity","0.1")
	d3.selectAll('.attackPath').attr("opacity","0.0")
	if(hide) {
		d3.selectAll('.asset').attr("opacity", "0.0")
	}
	d3.selectAll('.association').attr("opacity", "0.0")
	d3.selectAll('.inheritance').attr("opacity", "0.0")
	d3.selectAll(".link").attr('opacity', 0.0)
	d3.selectAll('.link_path_association').attr("opacity", "0.0")
}

function traceChildren(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.child_to_' + attackStep).attr("opacity","1.0")
}

function traceParents(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.parent_to_' + attackStep).attr("opacity","1.0")
}

function traceAllChildren(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.rec_child_to_' + attackStep).attr("opacity","1.0")
}

function traceAllParents(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.rec_parent_to_' + attackStep).attr("opacity","1.0")
}

//Action function attackstep onclick
function asclick(name) {
	var old = document.getElementById('clickMenu')
	if(old != null) {
		old.remove()
	}
	var x = event.clientX
	var y = event.clientY
	var clickMenu = document.createElement('div')
	clickMenu.setAttribute('id', 'clickMenu')
	clickMenu.setAttribute('style', 'position:absolute;' +
		'left:'+x+'px;top:'+y+'px;' + 
		'background-color:gray;'
	)
	var p1 = document.createElement('p')
	p1.innerHTML = "Trace Children"
	p1.setAttribute('onclick', 'traceChildren("' + name + '")')
	clickMenu.appendChild(p1)
	var p2 = document.createElement('p')
	p2.innerHTML = "Trace Parents"
	p2.setAttribute('onclick', 'traceParents("' + name + '")')
	clickMenu.appendChild(p2)
	var p3 = document.createElement('p')
	p3.innerHTML = "Trace All Children"
	p3.setAttribute('onclick', 'traceAllChildren("' + name + '")')
	clickMenu.appendChild(p3)
	var p4 = document.createElement('p')
	p4.innerHTML = "Trace All Parents"
	p4.setAttribute('onclick', 'traceAllParents("' + name + '")')
	clickMenu.appendChild(p4)
	document.body.appendChild(clickMenu)
}

//Returning asset box svg element
function createAssetBox(d) {
    if(!d.children) {
        d.children = []
    }
	var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
	var classString = "asset"

	//Boundning rectangle
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
	rect.setAttributeNS(null, 'fill', colors[categories[d.category].index % colors.length][0])
    rect.setAttributeNS(null, 'width', boxWidth)
	rect.setAttributeNS(
		null, 
		'height', 
		attackStepHeight * d.children.length + labelHeight + sideMargin/2)
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
		classString += " " + d.name + "_" + attackStep.name
		//Rectangle for each Attack Step
		var asbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		asbox.setAttributeNS(null, 'fill', colors[categories[d.category].index % colors.length][1])
		asbox.setAttributeNS(null, 'x', sideMargin)
		asbox.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight)
		asbox.setAttributeNS(null, 'width', boxWidth-2*sideMargin)
		asbox.setAttributeNS(null, 'height', attackStepHeight - 5)
		asbox.setAttributeNS(null, 
			'onclick', 'asclick("' + d.name + "_" + attackStep.name + '")'
		)
		asbox.setAttributeNS(null, 'id', d.name+ "_" +attackStep.name)
		asbox.setAttributeNS(null, 'class', "attackStep ")
		
		//Name of each Attack Step
		var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
		if(attackStep.type == "or") {
			text.textContent = "| " + attackStep.name;
		} else if(attackStep.type == "and") {
			text.textContent = "& " + attackStep.name;
		} else if(attackStep.type == "defense") {
			asbox.setAttributeNS(null, 'fill', 'red')
			text.textContent = "# " + attackStep.name;
		} else {
			text.textContent = attackStep.name;
		}
		if(text.textContent.length > maxNameLength) {
			text.textContent = text.textContent.substring(0, maxNameLength-3) + "..."
		}
		text.setAttributeNS(null, 'x', boxWidth/2)
		text.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight + 17)
		text.setAttributeNS(null, 'text-anchor', 'middle')
		text.setAttributeNS(null, 'font-family', 'Arial')
		text.setAttributeNS(null, 'fill', 'black')
		text.setAttributeNS(null, 
			'onclick', 'asclick("' + d.name + "_" + attackStep.name + '")'
		)

		var title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
		title.innerHTML = attackStep.name
		text.append(title)

		group.append(asbox)
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
                var bend = 4
				if(attackStep.index < relation.index) {
					var start = "M " + (boxWidth-arrowMargin) + " " + ys + " "
					var c1 = "" + ((boxWidth-arrowMargin) + 20 + 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + ys
					var c2 = "" + ((boxWidth-arrowMargin) + 20 + 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + yt
					var end = (boxWidth - arrowMargin + 5) + " " + yt
				} else {
					var start = "M " + arrowMargin + " " + ys + " "
					var c1 = "" + ((arrowMargin) - 20 - 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + ys
					var c2 = "" + ((arrowMargin) - 20 - 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + yt
                    var end = (arrowMargin - 5) + " " + yt
				}
				line.setAttributeNS(null, 'd', start + " C " + c1 + " " + c2 + " " + end)
				line.setAttributeNS(null, 'stroke-width', 1.1)
				line.setAttributeNS(null, 'stroke', 'black')
				line.setAttributeNS(null, 'fill', 'transparent')
				line.setAttributeNS(null, 'marker-end', 'url(#arrow)')
				line.setAttributeNS(null, 'id', 
					'path_' + attackStep.entity.name + "_" + attackStep.name + "_" +
					relation.entity.name + "_" + relation.name	
				)
				line.setAttributeNS(null, 'class', 'notClickable attackPath' +
					' child_to_' + attackStep.entity.name + "_" + attackStep.name +
					' parent_to_' + relation.entity.name + "_" + relation.name
				)
				group.appendChild(line)
			}
		}
	}
	group.setAttributeNS(null, 'class', classString)
	group.setAttributeNS(null, 'id', 'asset_' + d.name)
	return group
}

//Export svg
function export_svg() {
	var svg = document.getElementById("svg_content")

	//Copy svg node and remove classes before export
	var svgCopy = svg.cloneNode(true)
	svgCopy.childNodes[3].childNodes.forEach(function(e) {
		e.setAttributeNS(null, 'class', '')
	})

    //get svg source.
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgCopy);

    //add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

	//convert svg source to URI data scheme.
	var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
	var link = document.createElement("a");
	link.download = "MAL.svg"
	link.href = url
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;
}