export default class LocalStorageController{

    // Method which sets local storage for given item name
    setStorage(name, value){
        localStorage.setItem(name, JSON.stringify(value));
    }
    // Method which gets an item from storage for given name
    getFromStorage(name){
        return JSON.parse(localStorage.getItem(name));
    }

}