# MAL-visualization

This tool can be used to visualize MAL specifications in the form of graphs.

## Setup/Build

```sh
mvn package
cp target/MAL-visualization-1.0.0-jar-with-dependencies.jar mal-visualization.jar
```

## Usage

```sh
java -jar mal-visualization.jar /path/to/specification.mal
```

This will create a timestamped directory with a simple web page that can be
opened by any web browser.
For example:

```sh
firefox MAL_view_11_01_43/index.html
```


## Additional Notes

Usage (For in detail description check out [usage.pdf](usage.pdf)):


Before the visualization starts the user is prompted two questions:
1.  If attack steps tagged as "@hidden" should be excluded in the visualization. 
    If no such exists the answer does not matter.
2.  Asset width. The asset with will be set such that the attack step names can be the prompted number of characters.

Below is a quick usage guide. To get more information on how to use the
visualizer look at the file `usage.pdf` in this repository.

Zoom and Pan
    Zooming is possible with the mouse wheel/touch pad. Click on empty space on the screen and
    drag to move the whole visualization.

Move assets 
    Move assets by dragging them around with the mouse.

Trace
    Click on an Attack Step to display the trace menu. 
    When tracing the default setting is to hide all assets not involved in the trace,
    this can be changed by un-ticking the "Hide assets on trace" checkbutton in the left menu.
    Trace menu contains four options:
    - Trace Children: Highlight all direct children to the selected attack step.
    - Trace Parents: Highlight all direct parents to the selected attack step.
    - Trace All Children: Highlight all recursive children to the selected attack step.
    - Trace All Parents: Highlight all recursive parents to the selected attack step.

    Reset trace by either trace another attack step, or by double-clicking anywhere.

Hide/Show assets
    In the left menu the categories and assets are displayed by name and a checkbox.
    Un-tick a checkbox to hide the asset, this can be done by ticking individual assets
    or by ticking categories which will tick/un-tick all assets belonging to that category.

Export
    The export button will download a SVG file of the visualization that is displayed.
