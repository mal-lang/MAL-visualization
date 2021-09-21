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
	selectedSteps = []
})

var g = svg.append("g").attr('id', 'main_g')

var width = svg.attr("width")
var height = svg.attr("height");
var graph = {}

//Asset box numbers
var boxWidth = 340
var labelHeight = 40
var attackStepHeight = 30
var sideMargin = 30
var arrowMargin = 85

//Confirm hidden and prompt width
var hideHidden = confirm("Hide \"@hidden\" attack steps? (OK = yes)")
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

//Root json object
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
var internalRelations = relations.filter(function(r) {
	return r.source.entity.name == r.target.entity.name
})
var links = makeLinks(relations2);

//Remove @hidden attack steps if confirmed
if(hideHidden) {
	if(root.children) {
		root.children.forEach(function(a) {
			if(a.children) {
				a.children.forEach(function(as) {
					if(as.target_steps) {
						as.target_steps = as.target_steps.filter(function(target) {
							return !target.hiddenStep
						})
						as.source_steps = as.source_steps.filter(function(source) {
							return !source.hiddenStep
						})
					}
				})
			}
			a.children = a.children.filter(function(step) {
				return !step.hiddenStep
			})
		})
	}
	if(relations) {
		relations = relations.filter(function(r) {
			return !r.source.hiddenStep && !r.target.hiddenStep
		})
	}
	if(relations2) {
		relations2 = relations2.filter(function(r) {
			return !r.source.hiddenStep && !r.target.hiddenStep
		})
	}
	if(internalRelations) {
		internalRelations = internalRelations.filter(function(r) {
			return !r.source.hiddenStep && !r.target.hiddenStep
		})
	}
	links = makeLinks(relations2)
}

setAttackStepIndices(root)
setInternalRelationsControlPoints(internalRelations)

//Count pairs to calculate bend on asset relations to avoid overlap
if(root.associations) {
	var pairs = {}
	root.associations.forEach(function(a) {
		if(pairs[a.source.name + "_and_" + a.target.name]) {
			pairs[a.source.name + "_and_" + a.target.name]++
			a.bend = pairs[a.source.name + "_and_" + a.target.name]
		} else {
			pairs[a.source.name + "_and_" + a.target.name] = 1
			a.bend = 1
		}
	})
}

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

//Force simulation object
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
var hide = false;
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
    .attr("type", "checkbox")
	.on("click", function(d) {
		hide = !hide
	})

//Hide category buttons
var hiddenCategories = []
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
			if(d.hidden) {
				hiddenCategories.push(d.name)
			} else {
				hiddenCategories = hiddenCategories.filter(function(c) { return c != d.name })
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

//Bottom menu
var controlPointsHidden = true
var hideControlPoints = d3.select('#bottomMenu')
	.selectAll('.hideControlPointsButton')
	.data([{text: "Hide control points"}])
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
		controlPointsHidden = !controlPointsHidden
		update()
	})

var allAssociationsHidden = false
var hideAssociations = d3.select('#bottomMenu')
	.selectAll('.hideAssociationsButton')
	.data([{text: "Hide associations"}])
	.enter()
	.append("label")
	.attr("class", "font")
	.text(function(d) {
		return d.text
	})
	.append("input")
	.attr("type", "checkbox")
	.on("click", function(d) {
		allAssociationsHidden = !allAssociationsHidden
		update()
	})

var allAttackPathsHidden = false
var hideAttackPaths = d3.select('#bottomMenu')
	.selectAll('.hideAttackPathsButton')
	.data([{text: "Hide attack paths"}])
	.enter()
	.append("label")
	.attr("class", "font")
	.text(function(d) {
		return d.text
	})
	.append("input")
	.attr("type", "checkbox")
	.on("click", function(d) {
		allAttackPathsHidden = !allAttackPathsHidden
		update()
	})

var allIsaLinksHidden = false
var hideAttackPaths = d3.select('#bottomMenu')
	.selectAll('.hideIsaLinksButton')
	.data([{text: "Hide inheritance"}])
	.enter()
	.append("label")
	.attr("class", "font")
	.text(function(d) {
		return d.text
	})
	.append("input")
	.attr("type", "checkbox")
	.on("click", function(d) {
		allIsaLinksHidden = !allIsaLinksHidden
		update()
	})

//Visual representations
graph.association = g.selectAll('.association')
graph.isa = g.selectAll('.isa')
graph.asset = g.selectAll('.asset')
graph.attackPath = g.selectAll('.attackpath')
graph.aLink = g.selectAll('.aLink')
graph.iLink = g.selectAll('.iLink')
graph.internalPath = g.selectAll('.internalPath')
graph.sourceRoleName = g.selectAll('.srcRoleName')
graph.targetRoleName = g.selectAll('.tarRoleName')
graph.controlPoint = g.selectAll('.controlPoint')
graph.pathControlPoint = g.selectAll('.pathControlPoint')

//Set control points
setAssociationControlPoint(root.associations);
setPathControlPoint(relations2);
update()
setChildrenAndParents()
update()

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

function isHidden(d) {
	return d.hidden || hiddenCategories.includes(d.category)
}

//Reset visibility when assets are shown/hidden. Mostly D3 related functions.
function update() {
	//Bent line representing associations
    graph.association = graph.association.data(root.associations)
	graph.association.exit().remove()
	graph.association = graph.association.enter()
		.append('path')
		.attr('stroke-width', 4)
		.style('stroke', 'grey')
		.attr('fill', 'none')
		.attr('class', 'association')
		.attr('id', function(d) {
			return getAssociationId(d)
		})
		.merge(graph.association)
		.attr("visibility", function(d) {
			return isHidden(d.source) || 
				isHidden(d.target) || 
				allAssociationsHidden ? "hidden" : "visible"
		})

	//Title on mouseover association
	graph.association.append('svg:title').text(function(d) {
		return d.source.name + " [" + d.leftName + "] <-- " + d.name +
			" --> [" + d.rightName + "] " + d.target.name
	})

	//Thick arrow representing extends relation
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
			return isHidden(d.subAsset) || 
				isHidden(d.superAsset) || 
				allIsaLinksHidden ? "hidden" : "visible"
		})

	//Blue dashed line visualizing which attack step relations are related to which association
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
			return isHidden(d.path.source.entity) || 
				isHidden(d.path.target.entity) ||
				isHidden(d.association.source) ||
				isHidden(d.association.target) ||
				allAssociationsHidden ||
				allAttackPathsHidden ? "hidden" : "visible"
		})

	//Red dashed line visualizing which attack step relations are related to which extends relation
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
			return isHidden(d.path.source.entity) || 
				isHidden(d.path.target.entity) ||
				isHidden(assetMap[d.link.source]) ||
				isHidden(assetMap[d.link.target]) ||
				allAttackPathsHidden ||
				allIsaLinksHidden ? "hidden" : "visible"
		})

	//Asset representation
    graph.asset = graph.asset.data(root.children)
    graph.asset.exit().remove()
    graph.asset = graph.asset.enter()
        .append(createAssetBox)
        .merge(graph.asset)
        .attr("visibility", function(d) {
			return isHidden(d) ? "hidden" : "visible" 
		})

	//Movable assets
    var drag = d3.drag()
		.on("start", draggedStart)
		.on("drag", dragged)
		.on("end", draggedEnd)
    graph.asset.call(drag)
    
	//External attack step relations
    graph.attackPath = graph.attackPath.data(relations2)
	graph.attackPath.exit().remove()
    graph.attackPath = graph.attackPath.enter()
        .append('path')
        .attr('stroke-width', 1.1)
        .attr('stroke', 'black')
        .attr('fill', 'none')
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
			return isHidden(d.source.entity) || 
				isHidden(d.target.entity) ||
				allAttackPathsHidden ? "hidden" : "visible"
		})

	//Internal attack step relations
	graph.internalPath = graph.internalPath.data(internalRelations)
	graph.internalPath.exit().remove()
	graph.internalPath = graph.internalPath.enter()
		.append('path')
		.attr('stroke-width', 1.1)
		.attr('stroke', 'black')
		.attr('fill', 'none')
		.attr('marker-end', 'url(#arrow)')
		.attr('class', function(d) {
			return ' notClickable attackPath child_to_' + 
				d.source.entity.name + "_" + d.source.name + 
				' parent_to_' + d.target.entity.name + "_" + d.target.name
		})
		.attr('id', function(d) {
			return getPathId(d)
		})
		.merge(graph.internalPath)
		.attr("visibility", function(d) {
			return isHidden(d.source.entity) || 
				isHidden(d.target.entity) ||
				allAttackPathsHidden ? "hidden" : "visible"
		})

	//Move role name
	var dragLeftText = d3.drag()
		.on("drag", moveLeftText)
	//Role name
	graph.sourceRoleName = graph.sourceRoleName.data(root.associations.filter(function(d) {
		return d.source.name != d.target.name
	}))
	graph.sourceRoleName.exit().remove()
	graph.sourceRoleName = graph.sourceRoleName.enter()
		.append('text')
		.text(function(d) {
			return d.leftName
		})
		.merge(graph.sourceRoleName)
		.attr('class', function(d) {
			var elem = document.getElementById(getAssociationId(d))
			return elem.getAttributeNS(null, 'class')
		})
		.attr("visibility", function(d) {
			return isHidden(d.source) || 
			isHidden(d.target) ||
				allAssociationsHidden ? "hidden" : "visible"
		})

	graph.sourceRoleName.call(dragLeftText)

	//Move role name
	var dragRightText = d3.drag()
		.on("drag", moveRightText)
	//Role name
	graph.targetRoleName = graph.targetRoleName.data(root.associations.filter(function(d) {
		return d.source.name != d.target.name
	}))
	graph.targetRoleName.exit().remove()
	graph.targetRoleName = graph.targetRoleName.enter()
		.append('text')
		.text(function(d) {
			return d.rightName
		})
		.merge(graph.targetRoleName)
		.attr('class', function(d) {
			var elem = document.getElementById(getAssociationId(d))
			return elem.getAttributeNS(null, 'class')
		})
		.attr("visibility", function(d) {
			return isHidden(d.source) || 
				isHidden(d.target) ||
				allAssociationsHidden ? "hidden" : "visible"
		})

	graph.targetRoleName.call(dragRightText)

	//Control point controlling association bend
	graph.controlPoint = graph.controlPoint.data(root.associations)
	graph.controlPoint.exit().remove()
	graph.controlPoint = graph.controlPoint.enter()
		.append('circle')
		.attr('r', 5)
		.attr('fill', 'blue')
		.merge(graph.controlPoint)
		.attr('visibility', function(d) {
			return controlPointsHidden || 
				isHidden(d.source) || 
				isHidden(d.target) || 
				allAssociationsHidden? "hidden" : "visible"
		})

	var dragControlPoint = d3.drag().on("drag", moveControlPoint)
	graph.controlPoint.call(dragControlPoint)

	//Control point controlling attack step relation curve
	graph.pathControlPoint = graph.pathControlPoint.data(relations2)
	graph.pathControlPoint.exit().remove()
	graph.pathControlPoint = graph.pathControlPoint.enter()
		.append('circle')
		.attr('r', 5)
		.attr('fill', 'red')
		.merge(graph.pathControlPoint)
		.attr('visibility', function(d) {
			return controlPointsHidden ||
				isHidden(d.source.entity) || 
				isHidden(d.target.entity) ||
				allAttackPathsHidden ? "hidden" : "visible"
		})

	var dragPathControlPoint = d3.drag().on("drag", movePathControlPoint)
	graph.pathControlPoint.call(dragPathControlPoint)

}

//Drag role name ("left" side)
function moveLeftText(d) {
	var elem = document.getElementById(getAssociationId(d))
	var point = elem.getPointAtLength(elem.getTotalLength() * 0.2)
	d.srx = d3.event.x - point.x
	d.sry = d3.event.y - point.y
	ticked()
}

//Drag role name ("right" side)
function moveRightText(d) {
	var elem = document.getElementById(getAssociationId(d))
	var point = elem.getPointAtLength(elem.getTotalLength() * 0.8)
	d.trx = d3.event.x - point.x
	d.try = d3.event.y - point.y
	ticked()
}

//Move association control point
function moveControlPoint(d) {
	var x1 = d.source.x
	var y1 = d.source.y + (attackStepHeight * d.source.children.length + labelHeight + sideMargin/2)/2
	var x2 = d.target.x
	var y2 = d.target.y + (attackStepHeight * d.target.children.length + labelHeight + sideMargin/2)/2

	var qx = x1+((x2-x1)*0.5)
	var qy = y1+((y2-y1)*0.5)

	d.control_x = d3.event.x - qx
	d.control_y = d3.event.y - qy
	ticked()
}

//Move attack step relation control point
function movePathControlPoint(d) {
	var y1 = d.source.entity.y + (d.source.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
	var y2 = d.target.entity.y + (d.target.index * attackStepHeight + labelHeight) + (attackStepHeight/2)

	var qx = getPathControlX(d) - d.control_x
	var qy = y1+((y2-y1)*0.5)

	d.control_x = d3.event.x - qx
	d.control_y = d3.event.y - qy
	ticked()
}

//Helper function to find box intersection
function lineintersection(a, b, c, d, segment) {
	var p = segment[0]
	var q = segment[1]
	var r = segment[2]
	var s = segment[3]
	var det, gamma, lambda;
	det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	} else {
		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		if((0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)) {
			var d1x = c - a
			var d1y = d - b
			return [a+lambda*d1x, b+lambda*d1y]
		}
		return false
	}
}

//Coordinates width and height for asset boxes
//Returns intersection points
function boxintersection(x1, y1, x2, y2, w1, h1, w2, h2) {
	//intersection a
	var segments = [
		[x1-(w1/2), y1+(h1/2) ,x1+(w1/2), y1+(h1/2)],
		[x1-(w1/2), y1-(h1/2) ,x1+(w1/2), y1-(h1/2)],
		[x1-(w1/2), y1+(h1/2) ,x1-(w1/2), y1-(h1/2)],
		[x1+(w1/2), y1+(h1/2) ,x1+(w1/2), y1-(h1/2)]
	]
	var ip_a
	for(var i = 0; i < 4; i++) {
		ip_a = lineintersection(x1, y1, x2, y2, segments[i])
		if(ip_a != false) {
			break
		}
	}
	segments = [
		[x2-(w2/2), y2+(h2/2) ,x2+(w2/2), y2+(h2/2)],
		[x2-(w2/2), y2-(h2/2) ,x2+(w2/2), y2-(h2/2)],
		[x2-(w2/2), y2+(h2/2) ,x2-(w2/2), y2-(h2/2)],
		[x2+(w2/2), y2+(h2/2) ,x2+(w2/2), y2-(h2/2)]
	]
	var ip_b
	for(var i = 0; i < 4; i++) {
		ip_b = lineintersection(x1, y1, x2, y2, segments[i])
		if(ip_b != false) {
			break
		}
	}
	return [ip_a, ip_b]
}

//Returns x-coordinate for the attack step relation control points
function getPathControlX(d) {
	var controllBend = 125
	if(Math.abs(d.source.entity.x - 
		d.target.entity.x) < boxWidth/2) {
		var x1c = d.source.entity.x
		var x2c = d.target.entity.x

		if(d.source.entity.x < width/2) {
			return x1c+((x2c-x1c)*0.5) + d.control_x - boxWidth/2 + sideMargin - controllBend
			
		} else {
			return x1c+((x2c-x1c)*0.5) + d.control_x + boxWidth/2 - sideMargin + controllBend
		}
	} else {
		var x1c = d.source.entity.x
		var x2c = d.target.entity.x
		
		return x1c+((x2c-x1c)*0.5) + d.control_x
	}
}

//Update positions on simulation and drag
function ticked() {
	//Draw association
    graph.association.attr('d', function(d) {
		//Center coordinates of involved assets
		var x1 = d.source.x
		var y1 = d.source.y + (attackStepHeight * d.source.children.length + labelHeight + sideMargin/2)/2
		var x2 = d.target.x
		var y2 = d.target.y + (attackStepHeight * d.target.children.length + labelHeight + sideMargin/2)/2

		//Intersections
		intersections = boxintersection(
			x1, y1, x2, y2,
			boxWidth,
			attackStepHeight * d.source.children.length + labelHeight + sideMargin/2,
			boxWidth,
			attackStepHeight * d.target.children.length + labelHeight + sideMargin/2,
		)

		x1n = intersections[0][0]
		y1n = intersections[0][1]
		x2n = intersections[1][0]
		y2n = intersections[1][1]

		if(x1n == null || y1n == null || x2n == null || y2n == null) {
			return
		}

		//Control point coordinates relative to mid point
		var qx = x1+((x2-x1)*0.5) + d.control_x
		var qy = y1+((y2-y1)*0.5) + d.control_y

		//Coordinates controlling out and inbound angle
		var c1x = qx - (x2-x1)*0.2
		var c1y = qy - (y2-y1)*0.2

		var c2x = qx + (x2-x1)*0.2
		var c2y = qy + (y2-y1)*0.2

		return "M " + x1n + " " + y1n + " Q " + c1x + " " + c1y + ", " + qx + " " + qy +
			" M " + qx + " " + qy + " Q " + c2x + " " + c2y + ", " + x2n + " " + y2n
	})
	
	//Draw extends relation
	graph.isa.attr('points', function(d){
		//Involved assets center coordinates
		var x1 = d.subAsset.x
		var y1 = d.subAsset.y + (attackStepHeight * d.subAsset.children.length + labelHeight + sideMargin/2)/2
		var x2 = d.superAsset.x
		var y2 = d.superAsset.y + (attackStepHeight * d.superAsset.children.length + labelHeight + sideMargin/2)/2

		//Intersections
		intersections = boxintersection(
			x1, y1, x2, y2,
			boxWidth,
			attackStepHeight * d.subAsset.children.length + labelHeight + sideMargin/2,
			boxWidth,
			attackStepHeight * d.superAsset.children.length + labelHeight + sideMargin/2
		)

		x1 = intersections[0][0]
		y1 = intersections[0][1]
		x2 = intersections[1][0]
		y2 = intersections[1][1]
		
		if(x1 == null || y1 == null || x2 == null || y2 == null) {
			return
		}

		//Coordinates to draw arrow at mid point
		var xm = (x2-x1)/2 + x1
		var ym = (y2-y1)/2 + y1
		return "" + x1 + "," + y1 + " " + 
			xm + "," + ym + " " +
			x2 + "," + y2
	})

    graph.asset.attr('transform', function(d) {
        return 'translate(' + (d.x - boxWidth/2) + ',' + d.y + ')';
    })

	//Draw external attack step relations
    graph.attackPath.attr('d', function(d) {
		if(d.source.entity.name == d.target.entity.name) {
			return
		}
        var controllBend = 125
		var y1 = d.source.entity.y + (d.source.index * attackStepHeight) + 12 + labelHeight
		var y2 = d.target.entity.y + (d.target.index * attackStepHeight) + 12 + labelHeight
		//Decide if connect to Attack Steps on left or right side
		if(Math.abs(d.source.entity.x - 
					d.target.entity.x) < boxWidth/2) {
			var y1c = d.source.entity.y + (d.source.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
			var y2c = d.target.entity.y + (d.target.index * attackStepHeight + labelHeight) + (attackStepHeight/2)			

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

			var qx = getPathControlX(d)
			var qy = y1c+((y2c-y1c)*0.5) + d.control_y

			return "M " + x1 + " " + (y1+5) + " C " + c1 + " " + (y1+5) + ", " + qx + " " + (y1+5)  + ", " + qx + " " + qy +
				" M " + qx + " " + qy + " C " + qx + " " + (y2-5) + ", " + c2 + " " + (y2-5) + ", " + x2 + " " + (y2-5)
		} else {
			if(d.source.entity.x - d.target.entity.x > 0) {
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
			var x1c = d.source.entity.x
			var y1c = d.source.entity.y + (d.source.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
			var x2c = d.target.entity.x
			var y2c = d.target.entity.y + (d.target.index * attackStepHeight + labelHeight) + (attackStepHeight/2)

			var qx = getPathControlX(d)
			var qy = y1c+((y2c-y1c)*0.5) + d.control_y
			
			return "M " + x1 + " " + (y1+5) + " C " + c1 + " " + (y1+5) + ", " + qx + " " + (y1+5)  + ", " + qx + " " + qy +
				" M " + qx + " " + qy + " C " + qx + " " + (y2-5) + ", " + c2 + " " + (y2-5) + ", " + x2 + " " + (y2-5)

		}
	})
	
	//Draw dottend blue line connecting attack step relation and association
    graph.aLink.each(function(d) {
		var link = d3.select(this)

		//Attack step relation control point coordinates
		var y1c = d.path.source.entity.y + (d.path.source.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
		var y2c = d.path.target.entity.y + (d.path.target.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
		var qx = getPathControlX(d.path)
		var qy = y1c+((y2c-y1c)*0.5) + d.path.control_y
        link.attr('x1', qx)
		link.attr('y1', qy)

		//Association control point coordinates
		var x1 = d.association.source.x
		var y1 = d.association.source.y + (attackStepHeight * d.association.source.children.length + labelHeight + sideMargin/2)/2
		var x2 = d.association.target.x
		var y2 = d.association.target.y + (attackStepHeight * d.association.target.children.length + labelHeight + sideMargin/2)/2
		link.attr('x2', x1+((x2-x1)*0.5) + d.association.control_x)
		link.attr('y2', y1+((y2-y1)*0.5) + d.association.control_y)
    })

	//Draw dotted red line connecting attack step relation and extends relation
    graph.iLink.each(function(d) {
		var link = d3.select(this)
		
		//Attack step relation coordinates
		var y1c = d.path.source.entity.y + (d.path.source.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
		var y2c = d.path.target.entity.y + (d.path.target.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
		var x1 = getPathControlX(d.path)
		var y1 = y1c+((y2c-y1c)*0.5) + d.path.control_y

		//Extends relation coordinates at 40% (0.4)
        var inheritance_id = "inheritance_" + d.link.source + "_" + d.link.target
		var inheritance = document.getElementById(inheritance_id)
		if(inheritance.getAttributeNS(null, "points") == null) {
			return
		}
        mid = inheritance.getTotalLength() * 0.4
        midPoint = inheritance.getPointAtLength(mid)
        link.attr('x1', x1)
        link.attr('y1', y1)
        link.attr('x2', midPoint.x)
		link.attr('y2', midPoint.y)
	})
	
	//Draw internal attack step relations
	graph.internalPath.attr('d', function(d) {
		var ys = (d.source.index * attackStepHeight + labelHeight + 12) + d.source.entity.y
		var yt = (d.target.index * attackStepHeight + labelHeight + 12) + d.source.entity.y
		//Decide on drawing to left or right
		if(d.source.index < d.target.index) {
			var start = "M " + (d.source.entity.x + boxWidth/2 - arrowMargin) + " " + (ys+5) + " "
			var c1 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (ys+5)
			var q1 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (ys+15)
			var q2 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (yt-15)
			var c2 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (yt-5)
			var end = (d.source.entity.x + boxWidth/2 - arrowMargin + 5) + " " + (yt-5)
			return start + "Q " + c1 + " " + q1 + " M " + q1 + " L " + q2 + " M " + q2 + " Q " + c2 + " " + end
		} else {
			var start = "M " + (d.source.entity.x - boxWidth/2 + arrowMargin) + " " + (ys-5) + " "
			var c1 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (ys-5)
			var q1 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (ys-15)
			var q2 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (yt+15)
			var c2 = "" + (d.source.entity.x + d.control_x*0.82) + " " + (yt+5)
			var end = (d.source.entity.x - boxWidth/2 + arrowMargin - 5) + " " + (yt+5)
			return start + "Q " + c1 + " " + q1 + " M " + q1 + " L " + q2 + " M " + q2 + " Q " + c2 + " " + end
		}
	})

	//Draw source role name
	graph.sourceRoleName.each(function(d) {
		var text = d3.select(this)
		var elem = document.getElementById(getAssociationId(d))
		if(elem.getAttributeNS(null, "d") == null) {
			return
		}
		var point = elem.getPointAtLength(elem.getTotalLength() * 0.2)
		text.attr('x', point.x + d.srx)
		text.attr('y', point.y + d.sry)
	})

	//Draw target role name
	graph.targetRoleName.each(function(d) {
		var text = d3.select(this)
		var elem = document.getElementById(getAssociationId(d))
		if(elem.getAttributeNS(null, "d") == null) {
			return
		}
		var point = elem.getPointAtLength(elem.getTotalLength() * 0.8)
		text.attr('x', point.x + d.trx)
		text.attr('y', point.y + d.try)
	})

	//Position association control point
	graph.controlPoint.each(function(d) {
		var point = d3.select(this)

		var x1 = d.source.x
		var y1 = d.source.y + (attackStepHeight * d.source.children.length + labelHeight + sideMargin/2)/2
		var x2 = d.target.x
		var y2 = d.target.y + (attackStepHeight * d.target.children.length + labelHeight + sideMargin/2)/2

		var qx = x1+((x2-x1)*0.5) + d.control_x
		var qy = y1+((y2-y1)*0.5) + d.control_y

		point.attr('cx', qx)
		point.attr('cy', qy)
	})
	
	//Position attack step relation control point
	graph.pathControlPoint.each(function(d) {
		var point = d3.select(this)
		
		var y1 = d.source.entity.y + (d.source.index * attackStepHeight + labelHeight) + (attackStepHeight/2)
		var y2 = d.target.entity.y + (d.target.index * attackStepHeight + labelHeight) + (attackStepHeight/2)

		var qx = getPathControlX(d)
		var qy = y1+((y2-y1)*0.5) + d.control_y

		point.attr('cx', qx)
		point.attr('cy', qy)
	})

}

//Functions for asset drag
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

//Attack steps currently traced and kind of trace
var selectedSteps = []

//Do selected traces on selected attack steps
function selection(attackStep, action) {
	if(attackStep && action) {
		selectedSteps.push({
			step: attackStep, action: action
		})
	}
	removeMenuAndHide()
	if(selectedSteps) {
		selectedSteps.forEach(function(d) {
			if(d.action == "traceChildren") {
				traceChildren(d.step)
			} else if(d.action == "traceParents") {
				traceParents(d.step)
			} else if(d.action == "traceAllChildren") {
				traceAllChildren(d.step)
			} else if(d.action == "traceAllParents") {
				traceAllParents(d.step)
			}
		})
	}
}

//Remove traces from selected attack step
function removeSelection(attackStep) {
	if(selectedSteps) {
		selectedSteps = selectedSteps.filter(function(step) {return step.step != attackStep})
	}
	selection(null, null)
}

//Update visibility for the different trace options
function traceChildren(attackStep) {
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.child_to_' + attackStep).attr("opacity","1.0")
}
function traceParents(attackStep) {
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.parent_to_' + attackStep).attr("opacity","1.0")
}
function traceAllChildren(attackStep) {
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.rec_child_to_' + attackStep).attr("opacity","1.0")
}
function traceAllParents(attackStep) {
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
	p1.setAttribute('onclick', 'selection("' + name + '", "traceChildren")')
	clickMenu.appendChild(p1)
	var p2 = document.createElement('p')
	p2.innerHTML = "Trace Parents"
	p2.setAttribute('onclick', 'selection("' + name + '", "traceParents")')
	clickMenu.appendChild(p2)
	var p3 = document.createElement('p')
	p3.innerHTML = "Trace All Children"
	p3.setAttribute('onclick', 'selection("' + name + '", "traceAllChildren")')
	clickMenu.appendChild(p3)
	var p4 = document.createElement('p')
	p4.innerHTML = "Trace All Parents"
	p4.setAttribute('onclick', 'selection("' + name + '", "traceAllParents")')
	clickMenu.appendChild(p4)
	var selected = false
	if(selectedSteps) {
		selectedSteps.forEach(function(step) {
			if(step.step == name) {
				selected = true
			}
		})
	}
	if(selected) {
		var p5 = document.createElement('p')
		p5.innerHTML = "Remove traces from this attack step"
		p5.setAttribute('onclick', 'removeSelection("' + name + '")')
		clickMenu.appendChild(p5)
	}

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