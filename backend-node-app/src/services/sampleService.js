class SampleService {
    constructor() {
        this.data = [];
    }

    getAllItems() {
        return this.data;
    }

    getItemById(id) {
        return this.data.find(item => item.id === id);
    }

    createItem(item) {
        this.data.push(item);
        return item;
    }

    updateItem(id, updatedItem) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updatedItem };
            return this.data[index];
        }
        return null;
    }

    deleteItem(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            return this.data.splice(index, 1);
        }
        return null;
    }
}

module.exports = new SampleService();