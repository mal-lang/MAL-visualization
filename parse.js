//Early version parser, only parses simplified text representation of language

var lang = `Network access
Host connect,authenticate,guessPassword,guessedPassword,access
Password obtain
User attemptPhishing,phish[section]
Network-Host NetworkAccess
Host-Password Credentials
Password-User Credentials[section]
Network.access-Host.connect
Host.connect-Host.access
Host.authenticate-Host.access
Host.guessPassword-Host.guessedPassword
Host.guessedPassword-Host.authenticate
Password.obtain-Host.authenticate
User.attemptPhishing-User.phish
User.phish-Password.obtain`

splitted = lang.split("[section]\n")
assetText = splitted[0]
associationText = splitted[1]
attackPathText = splitted[2]

var assets = []
var attackSteps = []
var attackPaths = []
var associations = []

var aMap = {}
var asMap = {}

//Create Assets and Attack Steps
var lines = assetText.split("\n")
var attackStepCount = 0
for(line in lines) {
    asset = {}
    var text = lines[line]
    var t = text.split(" ")
    asset.name = t[0]
    asset.color = parseInt(line)
    aMap[t[0]] = parseInt(line)
    atsteps = t[1].split(",")
    children = []
    for(i in atsteps) {
        attackStep = {}
        var atstep = atsteps[i]
        attackStep.name = atstep
        attackStep.parent = aMap[asset.name]
        asMap[t[0] + "." + atstep] = attackStepCount
        attackStep.index = parseInt(i)
        attackStep.children = []
        children.push(attackStepCount++)
        attackSteps.push(attackStep)
    }
    asset.attackSteps = children
    assets.push(asset)
}

//Create Associations
var lines = associationText.split("\n")
for(line in lines) {
    association = {}
    var text = lines[line]
    var t = text.split(" ")
    association.name = t[1]
    var relation = t[0].split("-")
    association.source = aMap[relation[0]]
    association.target = aMap[relation[1]]
    associations.push(association)
}

//Set Attack paths
var lines = attackPathText.split("\n")
for(line in lines) {
    var text = lines[line]
    var t = text.split("-")
    attackPath = {}
    attackPath.source = asMap[t[0]]
    attackPath.target = asMap[t[1]]
    attackPaths.push(attackPath)
    attackSteps[attackPath.source].children.push(parseInt(line))
}
data = {
    assets: assets,
    attackSteps: attackSteps,
    attackPaths: attackPaths,
    associations: associations
}
