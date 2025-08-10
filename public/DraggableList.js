class DraggableList {
    constructor(data, list) {
        this.selectedIndex = null;
        this.list = list;
        this.data = data;
        this.items = Array.from(list.querySelectorAll(".draggable_item"));

        this.itemPositions = [];
        this.items.forEach(item => { 
            this.itemPositions.push(item.getBoundingClientRect());
            item.style.transform = "none";
        });

        this.dragging = false;
        this.dragStart = null;

        this.items.forEach(item => {
            item.addEventListener("mousedown", this.mouseDownFunction.bind(this, item));
        });

        this.addDraggingListeners();
    }

    addDraggingListeners() {
        this.list.addEventListener("mousemove", this.mouseMoveFunction.bind(this));
        document.addEventListener("mouseup", this.deselectFunction.bind(this));
        document.addEventListener("mouseleave", this.deselectFunction.bind(this));
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
            for(let i = this.selectedIndex - 1; i > 0; i--) {
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

    mouseDownFunction(item, e) {
        e.stopImmediatePropagation();
        
        this.dragging = true;
        this.selectedIndex = this.items.indexOf(item);
        this.dragStart = e.clientY;
    }

    deselectFunction(e) {
        e.stopImmediatePropagation();
        // Move item to desired position in array, re-render the list

        // Remove all transforms
        this.items.forEach(item => {
            item.style.transform = "";
        });

        this.dragging = false;
        this.selectedIndex = null;
    }

    removeAllEventListeners() {
        document.removeEventListener("mouseup", this.deselectFunction);
        document.removeEventListener("mouseleave", this.deselectFunction);
        document.removeEventListener("mousemove", this.mouseMoveFunction);
        
        this.items.forEach(item => {
            item.removeEventListener("mousedown", this.mouseDownFunction);
        })

    }
}