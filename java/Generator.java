//Generates JSON for the MAL-Visualization program

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

public class Generator {
  public static void generate(Lang lang, Map<String, String> args)
      throws CompilerException, FileNotFoundException {
    new Generator(lang, args);
  }

  private Generator(Lang lang, Map<String, String> args)
      throws CompilerException, FileNotFoundException {
    Locale.setDefault(Locale.ROOT);

    var json = new JSONObject();
    var assets = new JSONArray();
    for (var asset : lang.getAssets().values()) {
      var jsonAsset = new JSONObject();
      jsonAsset.put("name", asset.getName());
      jsonAsset.put("category", asset.getCategory().getName());
      if (asset.hasSuperAsset()) {
        jsonAsset.put("superAsset", asset.getSuperAsset().getName());
      }
      if (!asset.getAttackSteps().isEmpty()) {
        var attackSteps = new JSONArray();
        for (var attackStep : asset.getAttackSteps().values()) {
          var jsonAttackStep = new JSONObject();
          jsonAttackStep.put("name", attackStep.getName());
          switch (attackStep.getType()) {
            case ANY:
              jsonAttackStep.put("type", "or");
              break;
            case ALL:
              jsonAttackStep.put("type", "and");
              break;
            case DEFENSE:
            case EXIST:
            case NOTEXIST:
              jsonAttackStep.put("type", "defense");
              break;
            default:
              throw new RuntimeException("Invalid attack step type " + attackStep.getType());
          }

          var targets = new JSONArray();

          for (var expr : attackStep.getReaches()) {
            var fields = new ArrayList<Lang.Field>();
            var asf = getAttackStep(expr, fields);
            var as = asf.attackStep;
            var jsonStep = new JSONObject();
            jsonStep.put("name", as.attackStep.getName());
            var links = new JSONArray();
            for(Lang.Field f : asf.fields) {
              Lang.Link link = f.getLink();
              String associationLink = link.getLeftField().getName() + "_" +
                link.getName() + "_" +
                link.getRightField().getName();
              links.add(associationLink);
            }
            jsonStep.put("associations", links);
            jsonStep.put("entity_name", as.attackStep.getAsset().getName());
            jsonStep.put("size", 4000);
            targets.add(jsonStep);
          }
          jsonAttackStep.put("targets", targets);
          attackSteps.add(jsonAttackStep);
        }
        jsonAsset.put("children", attackSteps);
      }
      assets.add(jsonAsset);
    }
    var associations = new JSONArray();
    for (var link : lang.getLinks()) {
      var jsonAssociation = new JSONObject();
      jsonAssociation.put("source", link.getLeftField().getAsset().getName());
      jsonAssociation.put("target", link.getRightField().getAsset().getName());
      jsonAssociation.put("name", link.getName());
      jsonAssociation.put("leftName", link.getLeftField().getName());
      jsonAssociation.put("rightName", link.getRightField().getName());
      associations.add(jsonAssociation);
    }
    json.put("children", assets);
    json.put("associations", associations);
    String jsonString = json.toString();

    var output = new File("../script.js");
    var is = new FileInputStream(new File("../resources/script-template.js"));
    var reader = new BufferedReader(new InputStreamReader(is));
    String content = reader.lines().collect(Collectors.joining(System.lineSeparator()));
    content = content.replace("{{JSON}}", jsonString);

    try (var pw = new PrintWriter(output)) {
      pw.write(content);
    }
  }

  private AttackStepField getAttackStep(Lang.StepExpr expr, ArrayList<Lang.Field> fields) {
    addFields(expr, fields);
    if (expr instanceof Lang.StepAttackStep) {
      return new AttackStepField((Lang.StepAttackStep) expr, fields);
    } else if (expr instanceof Lang.StepBinOp) {
      return getAttackStep(((Lang.StepBinOp) expr).rhs, fields);
    } else {
      throw new RuntimeException("Unexpected expression " + expr);
    }
  }

  //Recursive trace all fields connected to 
  private void addFields(Lang.StepExpr expr, ArrayList<Lang.Field> fields) {
    if (expr instanceof Lang.StepField) {
      fields.add(((Lang.StepField) expr).field);
    } else if (expr instanceof Lang.StepBinOp) {
      addFields(((Lang.StepBinOp) expr).lhs, fields);
      addFields(((Lang.StepBinOp) expr).rhs, fields);
    }
  }

  public static class AttackStepField {
    public final Lang.StepAttackStep attackStep;
    public final ArrayList<Lang.Field> fields;

    public AttackStepField(Lang.StepAttackStep attackStep, ArrayList<Lang.Field> fields) {
      this.attackStep = attackStep;
      this.fields = fields;
    }
  }
}
