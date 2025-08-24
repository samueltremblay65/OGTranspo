class ColorPicker {
    // Custom color picker class
    constructor(parent, colors, selectedColor, colorChangeHandler) {
        this.colors = colors;
        this.colorChangeHandler = colorChangeHandler;
        this.parent = parent;
        this.items = [];

        // Add html picker element to parent node
        this.colorPicker = document.createElement("div");
        parent.appendChild(this.colorPicker);

        this.colorPicker.classList.add("color_picker");

        this.colors.forEach(color => {
            const node = document.createElement("div");
            this.colorPicker.appendChild(node);
            node.classList.add("color_item");
            node.style.background = color;

            if(color == selectedColor) {
                node.classList.add("selected");
                this.selected = node;
            }

            node.addEventListener("click", e => {
                e.stopImmediatePropagation();
                this.select(node);
            });

            this.items.push(node);
        });
    }

    select(color_item) {
        // Deselect currently selected color
        this.selected.classList.remove("selected");

        // Select current color 
        this.selected = color_item;
        this.selected.classList.add("selected");

        // Call handler function to notify of color change
        this.colorChangeHandler(this.selected.style.background);

    }

    refresh(selectedColor) {
        // Deselect currently selected color
        this.selected.classList.remove("selected");

        // Select current line color
        this.items.forEach(item => {
            if(item.style.background == selectedColor) {
                item.classList.add("selected");
                this.selected = item;
            }
        });
    }

    destruct() {
        this.parent.removeChild(this.colorPicker);
    }
}