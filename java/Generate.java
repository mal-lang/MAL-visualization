import java.io.File;

public class Generate {
    
    public static void main(String[] args) {
        try {
            String malFile = args[0];
            AST ast = Parser.parse(new File(malFile));
            Lang lang = LangConverter.convert(ast);
            Generator.generate(lang, null);
        } catch(Exception e) {
            e.printStackTrace();
            System.out.println("No file provided");
        }
    }

}