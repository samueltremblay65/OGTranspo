class TextOptionPicker {
    // Custom text option picker class
    constructor(parent, options, selectedOption, optionChangeHandler) {
        this.options = options;
        this.optionChangeHandler = optionChangeHandler;
        this.parent = parent;
        this.items = [];

        // Add html picker element to parent node
        this.optionPicker = document.createElement("div");
        parent.appendChild(this.optionPicker);

        this.optionPicker.classList.add("text_option_picker");

        const list = document.createElement("ul");
        this.optionPicker.appendChild(list);

        this.options.forEach(option => {
            const node = document.createElement("li");
            node.innerHTML = option;
            list.appendChild(node);
            node.classList.add("text_option");

            if(option == selectedOption) {
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

    select(option_item) {
        // Deselect currently selected color
        this.selected.classList.remove("selected");

        // Select current color 
        this.selected = option_item;
        this.selected.classList.add("selected");

        // Call handler function to notify of color change
        this.optionChangeHandler(this.selected.innerHTML);
    }

    refresh(selectedOption) {
        // Deselect currently selected color
        this.selected.classList.remove("selected");

        // Select current line color
        this.items.forEach(item => {
            if(item.innerHTML == selectedOption) {
                item.classList.add("selected");
                this.selected = item;
            }
        });
    }

    destruct() {
        this.parent.removeChild(this.optionPicker);
    }
}