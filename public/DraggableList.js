class DraggableList {
    constructor(data, list) {
        this.selectedIndex = null;
        this.list = list;
        this.data = data;
        this.items = Array.from(list.querySelectorAll(".draggable_item"));

        this.mouseUpBindHandler = this.deselectFunction.bind(this);
        this.mouseMoveBindHandler = this.mouseMoveFunction.bind(this);
        this.mouseDownBindHandler = this.mouseDownFunction.bind(this);

        this.itemPositions = [];
        this.items.forEach(item => { 
            this.itemPositions.push(item.getBoundingClientRect());
            item.style.transform = "none";
            item.addEventListener("mousedown", this.mouseDownBindHandler);
        });

        this.dragging = false;
        this.dragStart = null;

        this.addDraggingListeners();
    }

    addDraggingListeners() {
        this.list.addEventListener("mousemove", this.mouseMoveBindHandler);
        document.addEventListener("mouseup", this.mouseUpBindHandler);
        document.addEventListener("mouseleave", this.mouseUpBindHandler);
    }

    mouseMoveFunction(e) {
        e.preventDefault();

        if(!this.dragging) return;

        const item = this.items[this.selectedIndex];

        const listBoxPosition = this.list.getBoundingClientRect();
        const itemPosition = this.itemPositions[this.selectedIndex];

        const minTranslate = listBoxPosition.top - itemPosition.top;
        const maxTranslate = listBoxPosition.bottom - itemPosition.bottom;

        let translate = e.clientY - this.dragStart;

        translate = Math.max(minTranslate, translate);
        translate = Math.min(maxTranslate, translate);

        item.style.transform = `translateY(${translate}px)`;

        if(translate > 0 && this.selectedIndex < this.itemPositions.length - 1) {
            const offset = itemPosition.top - this.itemPositions[this.selectedIndex + 1].top;
            for(let i = this.selectedIndex + 1; i < this.itemPositions.length; i++) {
                const selectedCenter = (item.getBoundingClientRect().top + item.getBoundingClientRect().bottom) / 2;

                if(selectedCenter > this.itemPositions[i].top) {
                    this.items[i].style.transform = `translateY(${offset}px)`;
                }
                else {
                    this.items[i].style.transform = "none";
                }
            }
        }
        else if(translate < 0 && this.selectedIndex > 0) {
            const offset = itemPosition.top - this.itemPositions[this.selectedIndex - 1].top;
            for(let i = this.selectedIndex - 1; i >= 0; i--) {
                const selectedCenter = (item.getBoundingClientRect().top + item.getBoundingClientRect().bottom) / 2;
                if(selectedCenter < this.itemPositions[i].bottom) {
                    this.items[i].style.transform = `translateY(${offset}px)`;
                }
                else {
                    this.items[i].style.transform = "none";
                }
            }
        }
    }

    mouseDownFunction(e) {
        e.stopImmediatePropagation();

        this.refreshItems();

        this.dragging = true;
        this.selectedIndex = this.items.indexOf(e.target);
        this.dragStart = e.clientY;
    }

    deselectFunction(e) {
        e.stopImmediatePropagation();

        if(!this.dragging) return;

        // Move item to desired position in array, re-render the list
        let position = -1;
        let oldPosition = this.selectedIndex;

        const selectedItem = this.items[this.selectedIndex];
        const selectedCenter = (selectedItem.getBoundingClientRect().top + selectedItem.getBoundingClientRect().bottom) / 2;

        this.items.forEach(item => {
            if(selectedCenter > item.getBoundingClientRect().top) position++;
        });
        
        if(position != oldPosition) {

            if(position < oldPosition && position == 0) {
                selectedItem.remove();
                this.list.appendChild(selectedItem);
            } else {
                if(position < oldPosition) position--;
                this.items[position].after(selectedItem);

                let removed = this.data.splice(oldPosition, 1)[0];
                this.data.splice(position, 0, removed);
            }

            // Remove all transforms
            this.items.forEach(item => {
                item.style.transform = "";
            });
        }

        this.refreshItems();
    }

    removeAllEventListeners() {
        this.list.removeEventListener("mousemove", this.mouseMoveBindHandler);
        document.removeEventListener("mouseup", this.mouseUpBindHandler);
        document.removeEventListener("mouseleave", this.mouseUpBindHandler);
        
        this.removeItemEventListeners();
    }

    removeItemEventListeners() {
        this.items.forEach(item => {
            item.removeEventListener("mousedown", this.mouseDownBindHandler);
        })
    }

    refreshItems() {
        this.items = Array.from(this.list.querySelectorAll(".draggable_item"));

        this.itemPositions = [];
        this.items.forEach(item => { 
            item.style.transform = "none";
            this.itemPositions.push(item.getBoundingClientRect());
        });

        this.dragging = false;
        this.dragStart = null;
    }
}